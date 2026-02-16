import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../db';
import { config } from '../config';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2023-10-16',
});

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

// POST /api/webhooks/stripe — handle Stripe payment events
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  
  if (!sig) {
    console.error('Stripe webhook: No signature header');
    return res.status(400).json({ error: 'No signature header' });
  }

  let event: Stripe.Event;

  try {
    event = (stripe.webhooks.constructEvent as any)(
      req.body,
      sig,
      config.stripeWebhookSecret
    );
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  console.log(`Stripe webhook: ${event.type}`, event.id);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionEvent(subscription, event.type);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle subscription events
async function handleSubscriptionEvent(subscription: Stripe.Subscription, eventType: string) {
  const stripeCustomerId = subscription.customer as string;
  const stripeSubscriptionId = subscription.id;
  
  // Find organization by Stripe customer ID
  const orgSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId },
    include: { organization: true },
  });

  if (!orgSubscription) {
    console.warn(`No subscription found for Stripe customer: ${stripeCustomerId}`);
    return;
  }

  const plan = mapStripePriceToPlan(subscription.items.data[0]?.price.id);
  const status = subscription.status;
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  await prisma.subscription.update({
    where: { id: orgSubscription.id },
    data: {
      plan,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      trialEndsAt,
      cancelAtPeriodEnd,
      stripeSubscriptionId,
    },
  });

  console.log(`Subscription ${eventType}: ${stripeSubscriptionId} for org ${orgSubscription.organizationId}, plan: ${plan}, status: ${status}`);
}

// Handle paid invoice
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const stripeInvoiceId = invoice.id;
  const stripeSubscriptionId = invoice.subscription as string;
  const amount = invoice.amount_paid;
  const currency = invoice.currency;
  const pdfUrl = invoice.invoice_pdf;
  const hostedInvoiceUrl = invoice.hosted_invoice_url;
  const invoicePdf = invoice.invoice_pdf;
  const periodStart = invoice.period_start ? new Date(invoice.period_start * 1000) : null;
  const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000) : null;
  const paidAt = new Date();

  // Find subscription
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!subscription) {
    console.warn(`No subscription found for Stripe subscription: ${stripeSubscriptionId}`);
    return;
  }

  // Create or update invoice
  await prisma.invoice.upsert({
    where: { stripeInvoiceId },
    update: {
      amount,
      status: 'paid',
      pdfUrl,
      hostedInvoiceUrl,
      invoicePdf,
      paidAt,
    },
    create: {
      subscriptionId: subscription.id,
      stripeInvoiceId,
      amount,
      currency,
      status: 'paid',
      pdfUrl,
      hostedInvoiceUrl,
      invoicePdf,
      periodStart,
      periodEnd,
      paidAt,
    },
  });

  console.log(`Invoice paid: ${stripeInvoiceId} for subscription ${stripeSubscriptionId}, amount: ${amount} ${currency}`);
}

// Handle failed payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeInvoiceId = invoice.id;
  const stripeSubscriptionId = invoice.subscription as string;

  // Find subscription
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!subscription) {
    console.warn(`No subscription found for Stripe subscription: ${stripeSubscriptionId}`);
    return;
  }

  // Update invoice status
  await prisma.invoice.update({
    where: { stripeInvoiceId },
    data: { status: 'open' }, // Failed payment, invoice is still open
  });

  // Update subscription status to past_due
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'past_due' },
  });

  console.log(`Invoice payment failed: ${stripeInvoiceId} for subscription ${stripeSubscriptionId}`);
}

// Handle completed checkout session
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const stripeCustomerId = session.customer as string;
  const stripeSubscriptionId = session.subscription as string;
  
  if (!stripeCustomerId || !stripeSubscriptionId) {
    console.warn('Checkout session missing customer or subscription ID:', session.id);
    return;
  }

  // Get subscription details from Stripe
  const stripeSubscription = await (stripe.subscriptions.retrieve as any)(stripeSubscriptionId);
  const plan = mapStripePriceToPlan(stripeSubscription.items.data[0]?.price.id);
  const status = stripeSubscription.status;
  const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
  const trialEndsAt = stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null;

  // Find organization by metadata (we'll pass organizationId in checkout metadata)
  const organizationId = session.metadata?.organizationId;
  
  if (!organizationId) {
    console.warn('Checkout session missing organizationId in metadata:', session.id);
    return;
  }

  // Create or update subscription
  await prisma.subscription.upsert({
    where: { organizationId },
    update: {
      stripeCustomerId,
      stripeSubscriptionId,
      plan,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      trialEndsAt,
      cancelAtPeriodEnd: false,
    },
    create: {
      organizationId,
      stripeCustomerId,
      stripeSubscriptionId,
      plan,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      trialEndsAt,
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`Checkout completed: ${session.id} for org ${organizationId}, plan: ${plan}`);
}

// Map Stripe price ID to our plan
function mapStripePriceToPlan(priceId?: string): string {
  if (!priceId) return 'free';
  
  // We'll configure these price IDs in Stripe dashboard
  // For now, return based on price ID pattern
  if (priceId.includes('starter')) return 'starter';
  if (priceId.includes('professional')) return 'professional';
  if (priceId.includes('enterprise')) return 'enterprise';
  
  return 'free';
}

export default router;
