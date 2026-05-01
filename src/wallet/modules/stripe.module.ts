import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Module({})
export class StripeModule {
  static forRoot(apiKey: string, config: Stripe.StripeConfig): DynamicModule {
    const stripe = new Stripe(apiKey, config);

    const stripeProvider: Provider = {
      provide: 'STRIPE_CLIENT',
      useValue: stripe,
    };

    return {
      module: StripeModule,
      providers: [stripeProvider],
      exports: [stripeProvider],
      global: true,
    };
  }

  static forRootAsync(): DynamicModule {
    const stripeProvider: Provider = {
      provide: 'STRIPE_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Stripe(
          configService.get<string>('STRIPE_API_KEY') as string,
          {
            apiVersion: '2026-02-25.clover',
          },
        );
      },
    };

    return {
      module: StripeModule,
      imports: [ConfigModule],
      providers: [stripeProvider],
      exports: [stripeProvider],
      global: true,
    };
  }
}
