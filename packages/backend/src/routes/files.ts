import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';
import * as vapi from '../services/vapi';

const router = Router();
router.use(authenticate);

// GET /api/files — list all files for org
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // Fetch from Vapi since files are stored there
    const vapiFiles = await vapi.listFiles();
    res.json({ success: true, data: vapiFiles });
  } catch (err: any) {
    console.error('List files error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/files/upload — upload a file for knowledge base
router.post('/upload', async (req: AuthRequest, res: Response) => {
  try {
    // For file uploads, we'd typically use multer middleware
    // But for now, we'll accept base64 content or expect the frontend to handle it
    const { name, content, contentType } = req.body;

    if (!name || !content) {
      return res.status(400).json({ success: false, error: 'name and content are required' });
    }

    // Convert base64 to buffer if needed
    let fileContent: Buffer;
    if (typeof content === 'string' && content.startsWith('data:')) {
      // Handle data URL format: data:application/pdf;base64,...
      const base64Data = content.split(',')[1];
      fileContent = Buffer.from(base64Data, 'base64');
    } else if (typeof content === 'string') {
      fileContent = Buffer.from(content, 'base64');
    } else {
      fileContent = content;
    }

    // Upload to Vapi
    const vapiFile = await vapi.uploadFile({
      name,
      content: fileContent,
      contentType: contentType || 'application/octet-stream',
    });

    res.status(201).json({ success: true, data: vapiFile });
  } catch (err: any) {
    console.error('Upload file error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// GET /api/files/:id — get file details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const file = await vapi.getFile(req.params.id);
    res.json({ success: true, data: file });
  } catch (err: any) {
    console.error('Get file error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// DELETE /api/files/:id — delete a file
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await vapi.deleteFile(req.params.id);
    res.json({ success: true, message: 'File deleted' });
  } catch (err: any) {
    console.error('Delete file error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

export default router;
