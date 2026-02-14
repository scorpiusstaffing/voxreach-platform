import Stripe from 'stripe';
import { config } from '../config';

export const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

// --- Plans ---

const PLANS = {
  free: { name: 'Free', price: 0, minutesIncluded: 30, agentsIncluded: 1 },
  starter: { name: 'Starter', price: 4900, minutesIncluded: 500, agentsIncluded: 5 },
  professional: { name: 'Professional', price: 14900, minutesIncluded: 2000, agentsIncluded: 20 },
  enterprise: { name: 'Enterprise', price: 49900, minutesIncluded: 10000, agentsIncluded: 100 },
} as const;

export function getPlan(planId: string) {
  return PLANS[planId as keyof typeof PLANS] || PLANS.free;
}

// --- Customers ---

export async function createCustomer(params: { email: string; name: string; organizationId: string }) {
  return stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: { organizationId: params.organizationId },
  });
}

export async function createSubscription(customerId: string, priceId: string) {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}

export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

// --- Usage Reporting ---

export async function reportUsage(subscriptionItemId: string, quantity: number) {
  return stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp: Math.floor(Date.now() / 1000),
    action: 'increment',
  });
}
