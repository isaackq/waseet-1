import { registerAs } from '@nestjs/config';

export default registerAs('payment', () => ({
  stripeApiKey: process.env.STRIPE_API_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
}));
