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
import { User } from 'src/user/user.schema';
import { RolesEnum } from 'src/user/enums/role.enum';

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
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
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

  async getAdminOverview() {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const monthStarts = this.buildLast12MonthStarts(now);
    const firstMonthStart = monthStarts[0];

    const [totalUsers, newUsersLast7Days, usersCreatedBeforeWindow, monthlyNewUsers, usersBySegment] =
      await Promise.all([
        this.userModel.countDocuments({}),
        this.userModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        this.userModel.countDocuments({ createdAt: { $lt: firstMonthStart } }),
        this.userModel.aggregate([
          { $match: { createdAt: { $gte: firstMonthStart } } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
        ]),
        this.userModel.aggregate([
          { $unwind: '$role' },
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    const monthlyMap = new Map<string, number>();
    for (const item of monthlyNewUsers) {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      monthlyMap.set(key, item.count);
    }

    let runningTotal = usersCreatedBeforeWindow;
    const growth = monthStarts.map((monthStart) => {
      const key = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
      const newUsers = monthlyMap.get(key) ?? 0;
      runningTotal += newUsers;

      return {
        month: monthStart.toLocaleString('en-US', { month: 'short' }),
        year: monthStart.getFullYear(),
        newUsers,
        cumulativeUsers: runningTotal,
      };
    });

    const segmentCounts = {
      [RolesEnum.USER]: 0,
      [RolesEnum.FREELANCER]: 0,
      [RolesEnum.CLIENT]: 0,
      [RolesEnum.ADMIN]: 0,
    };

    for (const item of usersBySegment) {
      if (item._id in segmentCounts) {
        segmentCounts[item._id] = item.count;
      }
    }

    return {
      stats: {
        totalUsers,
        newUsersLast7Days,
      },
      growth,
      segments: [
        {
          role: RolesEnum.USER,
          count: segmentCounts[RolesEnum.USER],
        },
        {
          role: RolesEnum.FREELANCER,
          count: segmentCounts[RolesEnum.FREELANCER],
        },
        {
          role: RolesEnum.CLIENT,
          count: segmentCounts[RolesEnum.CLIENT],
        },
        {
          role: RolesEnum.ADMIN,
          count: segmentCounts[RolesEnum.ADMIN],
        },
      ],
    };
  }

  private buildLast12MonthStarts(now: Date): Date[] {
    const monthStarts: Date[] = [];
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    for (let i = 11; i >= 0; i -= 1) {
      monthStarts.push(
        new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - i, 1),
      );
    }

    return monthStarts;
  }
}
