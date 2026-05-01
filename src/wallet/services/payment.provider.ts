import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import Stripe from 'stripe';

type CreateWalletTopUpCheckoutInput = {
  amount: number;
  currency: string;
  walletId: string;
  userId: string;
  userEmail: string;
  successUrl?: string;
  cancelUrl?: string;
};

@Injectable()
export class PaymentProvider {
  constructor(
    @Inject('STRIPE_CLIENT')
    private readonly stripeClient: Stripe,
    private readonly configService: ConfigService,
  ) {}

  async createWalletTopUpCheckout(
    input: CreateWalletTopUpCheckoutInput,
  ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    const session = await this.stripeClient.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: Math.round(input.amount * 100),
            product_data: {
              name: 'Wallet Top Up',
              description: `Wallet ${input.walletId} top up`,
            },
          },
          quantity: 1,
        },
      ],
      success_url:
        input.successUrl ??
        `${process.env.APP_URL || 'http://localhost:3000'}/payment/success`,
      cancel_url:
        input.cancelUrl ??
        `${process.env.APP_URL || 'http://localhost:3000'}/payment/cancel`,
      client_reference_id: input.userId,
      customer_email: input.userEmail,
      metadata: {
        type: 'WALLET_TOP_UP',
        walletId: input.walletId,
        userId: input.userId,
        amount: String(input.amount),
        currency: input.currency.toUpperCase(),
      },
    });

    return session;
  }

  async confirmPaymentWebhook(req: Request) {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;
    try {
      const webhookSecret =
        this.configService.get<string>('payment.stripeWebhookSecret') ??
        process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        throw new BadRequestException(
          'Stripe webhook secret is not configured',
        );
      }

      const payload = (req as any).body;

      event = await this.stripeClient.webhooks.constructEvent(
        payload,
        sig,
        webhookSecret,
      );
    } catch (err: any) {
      throw new BadRequestException(`Invalid Stripe signature: ${err.message}`);
    }
    const session = event.data.object as Stripe.Checkout.Session;

    return {
      eventType: event.type,
      session,
    };
  }

  listCustomers() {
    return this.stripeClient.customers.list();
  }
}
