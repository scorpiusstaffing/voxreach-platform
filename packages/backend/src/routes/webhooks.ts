import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// POST /api/webhooks/vapi — handle Vapi call events
router.post('/vapi', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    const { message } = event;

    // Vapi sends different payload shapes depending on the event
    if (!message) {
      console.log('Webhook: no message in payload, keys:', Object.keys(event));
      return res.status(200).json({ ok: true });
    }

    const callId = message.call?.id;
    if (!callId) {
      console.log('Webhook: no call ID, message type:', message.type);
      return res.status(200).json({ ok: true });
    }

    console.log(`Webhook: ${message.type} for call ${callId}`);

    // Find the call in our DB
    let call = await prisma.call.findFirst({
      where: { vapiCallId: callId },
    });

    // If call not found, try to create it from webhook data (inbound calls)
    if (!call && message.type === 'status-update' && message.call) {
      call = await handleNewInboundCall(message.call);
    }

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
        const durationSeconds = message.durationSeconds || message.duration || (call.startedAt
          ? Math.round((endedAt.getTime() - new Date(call.startedAt).getTime()) / 1000)
          : 0);

        // Extract structured data from analysis if available
        const analysis = message.analysis || {};
        const structuredData = analysis.structuredData || null;
        
        // Merge with existing metadata
        const existingMetadata = (call.metadata as Record<string, any>) || {};
        const updatedMetadata = {
          ...existingMetadata,
          analysis: {
            summary: analysis.summary,
            successEvaluation: analysis.successEvaluation,
            structuredData,
          },
          endedReason: message.endedReason,
        };

        await prisma.call.update({
          where: { id: call.id },
          data: {
            status: 'completed',
            endedAt,
            durationSeconds,
            transcript: message.transcript || message.artifact?.transcript || null,
            recordingUrl: message.recordingUrl || message.artifact?.recordingUrl || null,
            summary: analysis.summary || message.summary || null,
            costCents: message.cost ? Math.round(message.cost * 100) : null,
            outcome: analysis.successEvaluation || message.endedReason || null,
            metadata: updatedMetadata,
          },
        });

        // Update campaign stats if applicable
        if (call.campaignId) {
          const isSuccess = message.endedReason !== 'customer-did-not-answer' &&
                           message.endedReason !== 'voicemail' &&
                           durationSeconds > 10;

          await prisma.campaign.update({
            where: { id: call.campaignId },
            data: isSuccess
              ? { successfulCalls: { increment: 1 } }
              : { failedCalls: { increment: 1 } },
          });
        }

        // Update lead status
        if (call.leadId) {
          const durationOk = durationSeconds > 10;
          await prisma.lead.update({
            where: { id: call.leadId },
            data: { status: durationOk ? 'succeeded' : 'failed' },
          });
        }
        break;
      }

      case 'hang': {
        const reason = message.reason || 'unknown';
        const noAnswer = ['customer-did-not-answer', 'no-answer', 'busy'].includes(reason);
        const isVoicemail = reason === 'voicemail';

        await prisma.call.update({
          where: { id: call.id },
          data: {
            status: noAnswer ? 'no_answer' : isVoicemail ? 'completed' : 'completed',
            endedAt: new Date(),
            outcome: reason,
          },
        });

        if (call.campaignId && (noAnswer || isVoicemail)) {
          await prisma.campaign.update({
            where: { id: call.campaignId },
            data: { failedCalls: { increment: 1 } },
          });
        }
        break;
      }

      case 'speech-update':
      case 'transcript':
      case 'conversation-update':
        // Real-time events — could be used for live monitoring
        // For now, just acknowledge
        break;

      case 'tool-calls':
        // Agent is calling a tool (e.g., booking, CRM lookup)
        // Handle custom tool calls here
        console.log('Webhook: tool call:', JSON.stringify(message.toolCalls || message.toolCallList, null, 2));
        break;

      case 'transfer-destination-request':
        // Agent wants to transfer — respond with destination
        console.log('Webhook: transfer request for call', callId);
        // Default: return the agent's transfer number
        if (call.agentId) {
          const agent = await prisma.agent.findUnique({ where: { id: call.agentId } });
          if (agent?.transferNumber) {
            return res.status(200).json({
              destination: {
                type: 'number',
                number: agent.transferNumber,
                message: 'Transferring you now.',
              },
            });
          }
        }
        break;

      default:
        console.log(`Webhook: unhandled event type: ${type}`);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    // Always return 200 to prevent Vapi retries on our errors
    res.status(200).json({ ok: true });
  }
});

// Handle inbound calls that we haven't seen before
async function handleNewInboundCall(vapiCall: any) {
  try {
    // Find the phone number this call came in on
    const phoneNumberId = vapiCall.phoneNumberId;
    if (!phoneNumberId) return null;

    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: { vapiPhoneNumberId: phoneNumberId },
      include: { assignedAgent: true },
    });

    if (!phoneNumber) return null;

    // Create the call record
    const call = await prisma.call.create({
      data: {
        organizationId: phoneNumber.organizationId,
        agentId: phoneNumber.assignedAgentId,
        phoneNumberId: phoneNumber.id,
        vapiCallId: vapiCall.id,
        direction: 'inbound',
        status: 'ringing',
        fromNumber: vapiCall.customer?.number || 'unknown',
        toNumber: phoneNumber.number,
      },
    });

    console.log(`Webhook: created inbound call record ${call.id} for vapiCall ${vapiCall.id}`);
    return call;
  } catch (err) {
    console.error('Failed to create inbound call record:', err);
    return null;
  }
}

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
