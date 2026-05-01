import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Request } from 'express';
import { Model } from 'mongoose';
import { toD128, toNumber } from 'src/utils/number.helpers';
import type { UserDocument } from 'src/user/user.schema';
import { GenerateWalletPaymentLinkRequestDto } from '../dto/payment/request/generate-wallet-payment-link.request.dto';
import { TransactionStatusEnum } from '../enums/transaction-status.enum';
import { TransactionTypeEnum } from '../enums/transaction-type.enum';
import {
  Transaction,
  TransactionDocument,
} from '../schemas/transaction.schema';
import {
  UserCurrency,
  UserCurrencyDocument,
} from '../schemas/user-currency.schema';
import { Wallet, WalletDocument } from '../schemas/wallet.schema';
import { CurrencyService } from './currency.service';
import { PaymentProvider } from './payment.provider';

@Injectable()
export class WalletPaymentService {
  constructor(
    private readonly paymentProvider: PaymentProvider,
    private readonly currencyService: CurrencyService,
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(UserCurrency.name)
    private readonly userCurrencyModel: Model<UserCurrencyDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async generatePaymentLink(
    currentUser: UserDocument,
    dto: GenerateWalletPaymentLinkRequestDto,
  ) {
    const wallet = await this.walletModel.findById(dto.walletId);
    if (!wallet || !wallet.isActive) {
      throw new NotFoundException('Wallet not found or inactive');
    }

    const userCurrency = await this.userCurrencyModel.findById(
      wallet.userCurrencyId,
    );
    if (!userCurrency) {
      throw new NotFoundException('User currency not found');
    }

    if (userCurrency.userId.toString() !== currentUser.id) {
      throw new ForbiddenException(
        'You can generate payment link only for your wallet',
      );
    }

    const currency = await this.currencyService.findOne(
      userCurrency.currencyId.toString(),
    );

    const session = await this.paymentProvider.createWalletTopUpCheckout({
      amount: dto.amount,
      currency: currency.currencyName,
      walletId: wallet.id,
      userId: currentUser.id,
      userEmail: currentUser.email,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });

    return {
      message: 'Payment link generated successfully',
      data: {
        walletId: wallet.id,
        amount: dto.amount,
        currency: currency.currencyName,
        checkoutSessionId: session.id,
        paymentLink: session.url,
      },
    };
  }

  async handleStripeWebhook(req: Request) {
    const { eventType, session } =
      await this.paymentProvider.confirmPaymentWebhook(req);

    const failedEvents = new Set([
      'checkout.session.async_payment_failed',
      'checkout.session.expired',
    ]);
    const successEvents = new Set([
      'checkout.session.completed',
      'checkout.session.async_payment_succeeded',
    ]);

    const isSuccessEvent = successEvents.has(eventType);
    const isFailedEvent = failedEvents.has(eventType);

    if (!isSuccessEvent && !isFailedEvent) {
      return {
        received: true,
        ignored: true,
        eventType,
      };
    }

    const metadata = session.metadata ?? {};
    if (metadata.type !== 'WALLET_TOP_UP') {
      return {
        received: true,
        ignored: true,
        reason: 'Unsupported metadata type',
      };
    }

    const walletId = metadata.walletId;
    const userId = metadata.userId;
    if (!walletId || !userId) {
      throw new BadRequestException('Invalid payment metadata');
    }

    const existingSuccess = await this.transactionModel.findOne({
      idempotencyKey: session.id,
      type: TransactionTypeEnum.DEPOSIT,
      status: TransactionStatusEnum.COMPLETED,
    });
    if (existingSuccess) {
      return {
        received: true,
        processed: true,
        duplicate: true,
        transactionId: existingSuccess.id,
      };
    }

    const failedIdempotencyKey = `${session.id}:FAILED`;
    const existingFailed = await this.transactionModel.findOne({
      idempotencyKey: failedIdempotencyKey,
      type: TransactionTypeEnum.DEPOSIT,
      status: TransactionStatusEnum.FAILED,
    });
    if (existingFailed) {
      return {
        received: true,
        processed: true,
        duplicate: true,
        transactionId: existingFailed.id,
      };
    }

    const wallet = await this.walletModel.findById(walletId);
    if (!wallet || !wallet.isActive) {
      throw new NotFoundException('Wallet not found or inactive');
    }

    const userCurrency = await this.userCurrencyModel.findById(
      wallet.userCurrencyId,
    );
    if (!userCurrency) {
      throw new NotFoundException('User currency not found');
    }

    if (userCurrency.userId.toString() !== userId) {
      throw new ForbiddenException('Payment metadata user does not own wallet');
    }

    const currency = await this.currencyService.findOne(
      userCurrency.currencyId.toString(),
    );
    const factor = Math.pow(10, currency.decimalPlaces ?? 2);
    const amountFromStripe =
      typeof session.amount_total === 'number'
        ? session.amount_total / factor
        : 0;
    const amountFromMetadata = Number(metadata.amount ?? 0);
    const amount = amountFromStripe > 0 ? amountFromStripe : amountFromMetadata;

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    const isPaid = session.payment_status === 'paid';
    const shouldMarkFailed =
      isFailedEvent || (eventType === 'checkout.session.completed' && !isPaid);

    if (shouldMarkFailed) {
      const failedTransaction = await this.transactionModel.create({
        walletId: wallet.id,
        type: TransactionTypeEnum.DEPOSIT,
        amount: amount,
        currencyId: currency.id,
        sessionId: session.id,
        balanceAfterAvailable: toNumber(wallet.available),
        balanceAfterHeld: toNumber(wallet.held),
        status: TransactionStatusEnum.FAILED,
        idempotencyKey: failedIdempotencyKey,
      });

      return {
        received: true,
        processed: true,
        failed: true,
        eventType,
        transactionId: failedTransaction.id,
        walletId: wallet.id,
        amount,
        currency: currency.currencyName,
      };
    }

    const availableBefore = toNumber(wallet.available);
    const heldBefore = toNumber(wallet.held);
    const totalBefore = toNumber(wallet.totalBalance);

    const availableAfter = availableBefore + amount;
    const totalAfter = totalBefore + amount;

    wallet.available = toD128(availableAfter) as any;
    wallet.totalBalance = toD128(totalAfter) as any;
    await wallet.save();

    const transaction = await this.transactionModel.create({
      walletId: wallet.id,
      type: TransactionTypeEnum.DEPOSIT,
      amount: amount,
      currencyId: currency.id,
      sessionId: session.id,
      balanceAfterAvailable: availableAfter,
      balanceAfterHeld: heldBefore,
      status: TransactionStatusEnum.COMPLETED,
      idempotencyKey: session.id,
    });

    return {
      received: true,
      processed: true,
      transactionId: transaction.id,
      walletId: wallet.id,
      amount,
      currency: currency.currencyName,
    };
  }
}
