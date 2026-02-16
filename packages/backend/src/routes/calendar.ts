import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';
import * as calcom from '../services/calcom';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

// GET /api/calendar/credentials — get Cal.com credentials
router.get('/credentials', async (req: AuthRequest, res: Response) => {
  try {
    const credential = await prisma.credential.findFirst({
      where: {
        organizationId: req.organizationId,
        type: 'calcom',
        isActive: true,
      },
    });

    if (!credential) {
      return res.json({ success: true, data: null });
    }

    // Don't expose full API key in response
    const { config, ...safeCredential } = credential;
    const safeConfig = config as any;
    
    res.json({
      success: true,
      data: {
        ...safeCredential,
        config: {
          ...safeConfig,
          apiKey: safeConfig?.apiKey ? '••••••••' + safeConfig.apiKey.slice(-4) : undefined,
        },
      },
    });
  } catch (err) {
    console.error('Get calendar credentials error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/calendar/credentials — save Cal.com credentials
router.post('/credentials', async (req: AuthRequest, res: Response) => {
  try {
    const { apiKey, username, eventTypeId, timeZone } = req.body;

    if (!apiKey || !username) {
      return res.status(400).json({ success: false, error: 'apiKey and username are required' });
    }

    // Test the credentials by fetching event types
    try {
      await calcom.getCalcomEventTypes(apiKey, username);
    } catch (err: any) {
      return res.status(400).json({ success: false, error: `Invalid Cal.com credentials: ${err.message}` });
    }

    // Upsert credentials
    const existing = await prisma.credential.findFirst({
      where: {
        organizationId: req.organizationId,
        type: 'calcom',
      },
    });

    const credential = await prisma.credential.upsert({
      where: {
        id: existing?.id || '',
      },
      create: {
        organizationId: req.organizationId!,
        type: 'calcom',
        name: 'Cal.com Calendar',
        config: {
          apiKey,
          username,
          eventTypeId,
          timeZone: timeZone || 'UTC',
        },
        isActive: true,
      },
      update: {
        config: {
          apiKey,
          username,
          eventTypeId,
          timeZone: timeZone || 'UTC',
        },
        isActive: true,
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, data: credential });
  } catch (err) {
    console.error('Save calendar credentials error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/calendar/credentials — disconnect Cal.com
router.delete('/credentials', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.credential.updateMany({
      where: {
        organizationId: req.organizationId,
        type: 'calcom',
      },
      data: {
        isActive: false,
      },
    });

    res.json({ success: true, message: 'Calendar disconnected' });
  } catch (err) {
    console.error('Delete calendar credentials error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/calendar/availability — get available slots
router.get('/availability', async (req: AuthRequest, res: Response) => {
  try {
    const daysAhead = parseInt(req.query.daysAhead as string) || 7;
    
    const slots = await calcom.getAvailableSlotsForOrganization(
      req.organizationId!,
      daysAhead
    );

    res.json({ success: true, data: slots });
  } catch (err: any) {
    if (err.message.includes('No Cal.com credentials')) {
      return res.status(404).json({ success: false, error: 'No calendar connected' });
    }
    console.error('Get availability error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/calendar/meetings — get scheduled meetings
router.get('/meetings', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '50', offset = '0', status } = req.query;
    
    const meetings = await prisma.meeting.findMany({
      where: {
        organizationId: req.organizationId,
        ...(status && { status: status as string }),
      },
      orderBy: { startTime: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({ success: true, data: meetings });
  } catch (err) {
    console.error('Get meetings error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/calendar/schedule — schedule a meeting (for AI agents)
router.post('/schedule', async (req: AuthRequest, res: Response) => {
  try {
    // This endpoint can be called by AI agents with organization ID in headers
    const organizationId = req.headers['x-organization-id'] as string || req.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'Organization ID required' });
    }

    const input = calcom.scheduleMeetingSchema.parse(req.body);
    
    const result = await calcom.scheduleMeeting(organizationId, {
      ...input,
      callId: req.headers['x-call-id'] as string,
    });

    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: err.errors });
    }
    console.error('Schedule meeting error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/calendar/meetings — schedule a meeting (for UI)
router.post('/meetings', async (req: AuthRequest, res: Response) => {
  try {
    const { preferredDate, purpose, attendeeName, attendeeEmail, attendeePhone } = req.body;

    if (!preferredDate || !purpose || !attendeeName || !attendeeEmail) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = await calcom.scheduleMeeting(req.organizationId!, {
      preferredDate,
      purpose,
      attendeeName,
      attendeeEmail,
      attendeePhone,
    });

    if (result.success) {
      res.status(201).json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error('Schedule meeting error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/calendar/meetings/:id — cancel a meeting
router.delete('/meetings/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await calcom.cancelMeeting(req.organizationId!, req.params.id);
    
    if (result.success) {
      res.json({ success: true, message: 'Meeting cancelled' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error('Cancel meeting error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/calendar/event-types — get available event types
router.get('/event-types', async (req: AuthRequest, res: Response) => {
  try {
    const credential = await prisma.credential.findFirst({
      where: {
        organizationId: req.organizationId,
        type: 'calcom',
        isActive: true,
      },
    });

    if (!credential) {
      return res.status(404).json({ success: false, error: 'No calendar connected' });
    }

    const config = credential.config as { apiKey: string; username: string };
    const eventTypes = await calcom.getCalcomEventTypes(config.apiKey, config.username);

    res.json({ success: true, data: eventTypes });
  } catch (err) {
    console.error('Get event types error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/calendar/oauth/callback — OAuth callback (placeholder for future OAuth implementation)
router.post('/oauth/callback', async (req: AuthRequest, res: Response) => {
  try {
    // This is a placeholder for future OAuth implementation
    // For now, we use API key authentication
    res.status(501).json({ success: false, error: 'OAuth not yet implemented' });
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;