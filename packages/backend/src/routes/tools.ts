import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';
import * as vapi from '../services/vapi';

const router = Router();
router.use(authenticate);

// GET /api/tools — list all tools for org
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const tools = await prisma.tool.findMany({
      where: { organizationId: req.organizationId },
      include: {
        agents: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: tools });
  } catch (err) {
    console.error('List tools error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/tools/types — get available tool types
router.get('/types', async (_req: AuthRequest, res: Response) => {
  const types = [
    { id: 'function', name: 'API Request', description: 'Call an external API endpoint' },
    { id: 'transfer', name: 'Transfer Call', description: 'Transfer the call to another number' },
    { id: 'endCall', name: 'End Call', description: 'End the call programmatically' },
  ];
  res.json({ success: true, data: types });
});

// POST /api/tools — create a new tool
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      type,
      parameters,
      // API Request tool fields
      apiEndpoint,
      apiMethod,
      apiHeaders,
      apiBodyTemplate,
      // Transfer tool fields
      transferNumber,
      transferMessage,
      // Options
      async,
    } = req.body;

    if (!name || !description || !type) {
      return res.status(400).json({ success: false, error: 'name, description, and type are required' });
    }

    // Map frontend type to internal/Vapi type
    // Frontend sends: 'api', 'transfer', 'endCall'
    // Vapi expects: 'function', 'transfer', 'endCall'
    const mappedType = type === 'api' ? 'function' : type;

    // Validate based on mapped type
    if (mappedType === 'function' && !apiEndpoint) {
      return res.status(400).json({ success: false, error: 'apiEndpoint is required for API Request tools' });
    }
    if (mappedType === 'transfer' && !transferNumber) {
      return res.status(400).json({ success: false, error: 'transferNumber is required for Transfer tools' });
    }

    // Create in Vapi first
    let vapiTool: any = null;
    try {
      if (mappedType === 'function') {
        vapiTool = await vapi.createTool({
          type: 'function',
          name,
          description,
          parameters: parameters || {},
          async: async ?? false,
          server: {
            url: apiEndpoint,
            method: apiMethod || 'POST',
            headers: apiHeaders || {},
          },
        });
      } else if (mappedType === 'transfer') {
        vapiTool = await vapi.createTool({
          type: 'transfer',
          name,
          description,
          transferConfig: {
            mode: 'number',
            destination: transferNumber,
            message: transferMessage,
          },
        });
      } else if (mappedType === 'endCall') {
        vapiTool = await vapi.createTool({
          type: 'endCall',
          name,
          description,
        });
      }
    } catch (err: any) {
      console.error('Vapi tool creation failed:', err);
      return res.status(502).json({ success: false, error: `Failed to create tool in Vapi: ${err.message}` });
    }

    // Create in database
    const tool = await prisma.tool.create({
      data: {
        organizationId: req.organizationId!,
        name,
        description,
        type,
        parameters: parameters || {},
        apiEndpoint,
        apiMethod: apiMethod || 'POST',
        apiHeaders: apiHeaders || {},
        apiBodyTemplate,
        transferNumber,
        transferMessage,
        vapiToolId: vapiTool?.id,
      },
    });

    res.status(201).json({ success: true, data: { ...tool, vapiTool } });
  } catch (err) {
    console.error('Create tool error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/tools/:id — get single tool
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tool = await prisma.tool.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
      include: {
        agents: { select: { id: true, name: true } },
      },
    });

    if (!tool) return res.status(404).json({ success: false, error: 'Tool not found' });

    // Fetch from Vapi if we have the ID
    let vapiData = null;
    if (tool.vapiToolId) {
      try {
        vapiData = await vapi.getTool(tool.vapiToolId);
      } catch (err) {
        console.warn('Failed to fetch Vapi tool:', err);
      }
    }

    res.json({ success: true, data: { ...tool, vapiTool: vapiData } });
  } catch (err) {
    console.error('Get tool error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/tools/:id — update tool
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tool = await prisma.tool.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!tool) return res.status(404).json({ success: false, error: 'Tool not found' });

    const {
      name,
      description,
      parameters,
      apiEndpoint,
      apiMethod,
      apiHeaders,
      apiBodyTemplate,
      transferNumber,
      transferMessage,
      async,
    } = req.body;

    // Update in Vapi if exists
    if (tool.vapiToolId) {
      try {
        const vapiUpdate: any = {};
        if (name) vapiUpdate.name = name;
        if (description) vapiUpdate.description = description;
        if (parameters) vapiUpdate.parameters = parameters;
        if (apiEndpoint || apiMethod || apiHeaders) {
          vapiUpdate.server = {
            url: apiEndpoint || tool.apiEndpoint,
            method: apiMethod || tool.apiMethod || 'POST',
            headers: apiHeaders || tool.apiHeaders || {},
          };
        }
        if (transferNumber || transferMessage) {
          vapiUpdate.transfer = {
            mode: 'number',
            destination: transferNumber || tool.transferNumber,
            message: transferMessage || tool.transferMessage,
          };
        }
        await vapi.updateTool(tool.vapiToolId, vapiUpdate);
      } catch (err) {
        console.warn('Vapi tool update failed (continuing):', err);
      }
    }

    // Update in database
    const updated = await prisma.tool.update({
      where: { id: tool.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(parameters !== undefined && { parameters }),
        ...(apiEndpoint !== undefined && { apiEndpoint }),
        ...(apiMethod !== undefined && { apiMethod }),
        ...(apiHeaders !== undefined && { apiHeaders }),
        ...(apiBodyTemplate !== undefined && { apiBodyTemplate }),
        ...(transferNumber !== undefined && { transferNumber }),
        ...(transferMessage !== undefined && { transferMessage }),
      },
      include: {
        agents: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update tool error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/tools/:id — delete tool
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tool = await prisma.tool.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId },
    });
    if (!tool) return res.status(404).json({ success: false, error: 'Tool not found' });

    // Delete from Vapi first
    if (tool.vapiToolId) {
      try {
        await vapi.deleteTool(tool.vapiToolId);
      } catch (err) {
        console.warn('Vapi tool delete failed (continuing):', err);
      }
    }

    // Remove tool from all agents first
    await prisma.agent.updateMany({
      where: {
        tools: { some: { id: tool.id } },
      },
      data: {},
    });

    // Delete from database
    await prisma.tool.delete({ where: { id: tool.id } });

    res.json({ success: true, message: 'Tool deleted' });
  } catch (err) {
    console.error('Delete tool error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
