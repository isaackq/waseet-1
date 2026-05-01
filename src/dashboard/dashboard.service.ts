import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toNumber } from 'src/utils/number.helpers';
import { SessionStatus } from 'src/session/enums/session-status.enum';
import { Session, SessionDocument } from 'src/session/session.schema';
import { TransactionTypeEnum } from 'src/wallet/enums/transaction-type.enum';
import {
  Transaction,
  TransactionDocument,
} from 'src/wallet/schemas/transaction.schema';
import {
  UserCurrency,
  UserCurrencyDocument,
} from 'src/wallet/schemas/user-currency.schema';
import { Wallet, WalletDocument } from 'src/wallet/schemas/wallet.schema';
import type { UserDocument } from 'src/user/user.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(UserCurrency.name)
    private readonly userCurrencyModel: Model<UserCurrencyDocument>,
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async getOverview(currentUser: UserDocument, recentLimit = 5) {
    const userId = currentUser.id;
    const sessionParticipantFilter = {
      $or: [{ user1: userId }, { user2: userId }],
    };

    const activeStatuses = [
      SessionStatus.CREATED,
      SessionStatus.JOINED,
      SessionStatus.PENDING_CONFIRMATION,
      SessionStatus.HELD,
      SessionStatus.REVISION_REQUESTED,
      SessionStatus.AWAITING_CLIENT_APPROVAL,
      SessionStatus.DISPUTED,
    ];

    const [activeSessions, completedSessions, pendingDisputes, recentSessions] =
      await Promise.all([
        this.sessionModel.countDocuments({
          ...sessionParticipantFilter,
          status: { $in: activeStatuses },
        }),
        this.sessionModel.countDocuments({
          ...sessionParticipantFilter,
          status: SessionStatus.COMPLETED,
        }),
        this.sessionModel.countDocuments({
          ...sessionParticipantFilter,
          status: SessionStatus.AWAITING_CLIENT_APPROVAL,
        }),
        this.sessionModel
          .find(sessionParticipantFilter)
          .sort({ createdAt: -1 })
          .limit(recentLimit)
          .lean<any[]>(),
      ]);

    const userCurrencies = await this.userCurrencyModel
      .find({ userId: userId })
      .select('_id')
      .lean<any[]>();
    const userCurrencyIds = userCurrencies.map((item) => item._id.toString());

    const wallets = await this.walletModel
      .find({ userCurrencyId: { $in: userCurrencyIds }, isActive: true })
      .lean<any[]>();

    const walletIds = wallets.map((wallet) => wallet._id.toString());
    const totalEscrow = wallets.reduce(
      (sum, wallet) => sum + toNumber(wallet.held),
      0,
    );
    console.log(walletIds);

    const recentPayments = await this.transactionModel
      .find({
        walletId: { $in: walletIds },
        type: TransactionTypeEnum.DEPOSIT,
      })
      .sort({ createdAt: -1 })
      .limit(recentLimit)
      .populate('currencyId')
      .lean<any[]>();

    return {
      stats: {
        activeSessions,
        completedSessions,
        totalEscrow,
        pendingDisputes,
      },
      recentSessions: recentSessions.map((session) => ({
        id: session._id,
        title: session.title,
        amount: toNumber(session.amount),
        currency: session.currency,
        status: session.status,
        createdAt: session.createdAt,
      })),
      recentPayments: recentPayments.map((payment) => ({
        id: payment._id,
        reference: `#${payment._id.toString().slice(-8)}`,
        amount: payment.amount,
        currency: payment.currencyId?.currencyName ?? null,
        status: payment.status,
        method: 'CREDIT_CARD',
        createdAt: payment.createdAt,
      })),
    };
  }
}
