import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// POST /api/webhooks/vapi — handle Vapi call events
router.post('/vapi', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    const { message } = event;

    if (!message) {
      return res.status(200).json({ ok: true });
    }

    const callId = message.call?.id;
    if (!callId) {
      return res.status(200).json({ ok: true });
    }

    // Find the call in our DB
    const call = await prisma.call.findFirst({
      where: { vapiCallId: callId },
    });

    if (!call) {
      console.warn(`Webhook: call not found for vapiCallId ${callId}`);
      return res.status(200).json({ ok: true });
    }

    const type = message.type;

    switch (type) {
      case 'status-update': {
        const status = mapVapiStatus(message.status);
        await prisma.call.update({
          where: { id: call.id },
          data: {
            status,
            ...(status === 'in_progress' && !call.startedAt ? { startedAt: new Date() } : {}),
          },
        });
        break;
      }

      case 'end-of-call-report': {
        const endedAt = new Date();
        const durationSeconds = message.durationSeconds || (call.startedAt
          ? Math.round((endedAt.getTime() - new Date(call.startedAt).getTime()) / 1000)
          : 0);

        await prisma.call.update({
          where: { id: call.id },
          data: {
            status: 'completed',
            endedAt,
            durationSeconds,
            transcript: message.transcript || null,
            recordingUrl: message.recordingUrl || null,
            summary: message.summary || null,
            costCents: message.cost ? Math.round(message.cost * 100) : null,
          },
        });

        // Update campaign stats if applicable
        if (call.campaignId) {
          await prisma.campaign.update({
            where: { id: call.campaignId },
            data: { successfulCalls: { increment: 1 } },
          });
        }

        // Update lead status
        if (call.leadId) {
          await prisma.lead.update({
            where: { id: call.leadId },
            data: { status: 'succeeded' },
          });
        }
        break;
      }

      case 'hang': {
        await prisma.call.update({
          where: { id: call.id },
          data: {
            status: message.reason === 'customer-did-not-answer' ? 'no_answer' : 'completed',
            endedAt: new Date(),
          },
        });

        if (call.campaignId && message.reason === 'customer-did-not-answer') {
          await prisma.campaign.update({
            where: { id: call.campaignId },
            data: { failedCalls: { increment: 1 } },
          });
        }
        break;
      }

      default:
        // Log unknown events but don't fail
        console.log(`Webhook: unhandled event type: ${type}`);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    // Always return 200 to prevent Vapi retries on our errors
    res.status(200).json({ ok: true });
  }
});

function mapVapiStatus(vapiStatus: string): string {
  const map: Record<string, string> = {
    'queued': 'queued',
    'ringing': 'ringing',
    'in-progress': 'in_progress',
    'forwarding': 'in_progress',
    'ended': 'completed',
  };
  return map[vapiStatus] || 'in_progress';
}

export default router;
