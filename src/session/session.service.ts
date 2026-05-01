import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { Session, SessionDocument } from './session.schema';
import { UserService } from 'src/user/user.service';
import { UserDocument } from 'src/user/user.schema';
import { RolesEnum } from 'src/user/enums/role.enum';
import { SessionStatus } from './enums/session-status.enum';
import { OperationType } from './enums/operation-type.enum';
import { SessionRequestDto } from './Dto/session.request.dto';
import {
  GetMySessionsQueryDto,
  MySessionsFilterEnum,
} from './Dto/get-my-sessions.query.dto';
import { WalletService } from 'src/wallet/services/wallet.service';
import { UserCurrencyService } from 'src/wallet/services/user-currency.service';
import { CurrencyService } from 'src/wallet/services/currency.service';
import { Hold, HoldDocument } from 'src/wallet/schemas/hold.schema';
import {
  Transaction,
  TransactionDocument,
} from 'src/wallet/schemas/transaction.schema';
import { Fee, FeeDocument } from 'src/wallet/schemas/fee.schema';
import { HoldStatusEnum } from 'src/wallet/enums/hold-status.enum';
import { TransactionTypeEnum } from 'src/wallet/enums/transaction-type.enum';
import { FeeStatusEnum } from 'src/wallet/enums/fee-status.enum';
import { roundTo, toD128, toNumber } from 'src/utils/number.helpers';
import type { Request } from 'express';
import { paginated } from 'src/common/pagination/interfaces/paginated.interface';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { FilterQuery } from 'mongoose';
import {
  Deliverable,
  DeliverableDocument,
} from 'src/deliverable/deliverable.schema';
import { DeliverableStatus } from 'src/deliverable/enums/deliverable-status.enum';
import { MailService } from 'src/mail1/providers/mail.service';
import {
  SessionIdempotencyAction,
  SessionIdempotencyRecord,
  SessionIdempotencyDocument,
  SessionIdempotencyStatus,
} from './session-idempotency.schema';
import { Wallet, WalletDocument } from 'src/wallet/schemas/wallet.schema';
import {
  UserCurrency,
  UserCurrencyDocument,
} from 'src/wallet/schemas/user-currency.schema';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    private readonly userService: UserService,
    private readonly walletService: WalletService,
    private readonly userCurrencyService: UserCurrencyService,
    private readonly currencyService: CurrencyService,
    @InjectModel(Hold.name)
    private readonly holdModel: Model<HoldDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Fee.name)
    private readonly feeModel: Model<FeeDocument>,
    @InjectModel(Deliverable.name)
    private readonly deliverableModel: Model<DeliverableDocument>,
    @InjectModel(SessionIdempotencyRecord.name)
    private readonly sessionIdempotencyModel: Model<SessionIdempotencyDocument>,
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(UserCurrency.name)
    private readonly userCurrencyModel: Model<UserCurrencyDocument>,
    private readonly paginationProvider: PaginationProvider,
    private readonly mailService: MailService,
  ) {}

  /**
   * Create a session as freelancer (only freelancers can create sessions)
   * @param currentUser - The freelancer creating the session
   * @param user2EmailOrIdentificationName - Email or identification name of the client
   * @param operationType - Type of operation
   * @param amount - Project amount
   * @param currency - Currency code
   * @param summary - Project description
   * @param deadline - Project deadline
   * @param duration - Duration in minutes
   */
  async createFreelancerSession(
    currentUser: UserDocument,
    sessionRequestDto: SessionRequestDto,
  ): Promise<SessionDocument> {
    const {
      user2EmailOrIdentificationName,
      amount,
      currency,
      title,
      description,
      deadline,
      deliverableType,
      duration,
    } = sessionRequestDto;

    const parsedDeadline = new Date(deadline);
    if (parsedDeadline <= new Date()) {
      throw new BadRequestException('Deadline must be in the future');
    }

    // 1. Add FREELANCER role to current user if not exists
    await this.userService.updateByUniqe(
      { id: currentUser.id },
      { role: RolesEnum.FREELANCER },
    );

    // 2. Find user2 (client) by email or identificationName
    let user2;

    // Try to find by email first
    user2 = await this.userService.findOneByEmail(
      user2EmailOrIdentificationName,
    );

    // If not found by email, try identification name
    if (!user2) {
      user2 = await this.userService.findByIdentificationName(
        user2EmailOrIdentificationName,
      );
    }

    // If still not found, throw error
    if (!user2) {
      throw new NotFoundException(
        `User not found with email or identification name: ${user2EmailOrIdentificationName}`,
      );
    }

    // 3. Validate: user2 cannot be the same as current user
    if (user2.id === currentUser.id) {
      throw new BadRequestException(
        'You cannot create a session with yourself',
      );
    }

    if (user2.role.includes(RolesEnum.ADMIN)) {
      throw new BadRequestException('User is Admin');
    }

    const currencyDocument = await this.currencyService.findByName(currency);

    const freelancerUserCurrency =
      await this.userCurrencyService.findByUserIdAndCurrencyId(
        currentUser.id.toString(),
        currencyDocument.id,
      );
    if (!freelancerUserCurrency) {
      throw new BadRequestException('Freelancer wallet currency not found');
    }

    const payeeWallet = await this.walletService.findDocumentByUserCurrencyId(
      freelancerUserCurrency.id,
    );
    if (!payeeWallet || !payeeWallet.isActive) {
      throw new BadRequestException('Freelancer wallet not available');
    }

    // // 4. Add CLIENT role to user2
    // await this.userService.updateByUniqe(
    //   { id: user2.id },
    //   { role: RolesEnum.CLIENT },
    // );

    // 5. Generate unique join code (6 digits)
    const joinCode = await this.generateUniqueJoinCode();

    // 6. Generate join URL
    const joinUrl = `${process.env.APP_URL || 'http://localhost:3000'}/sessions/join/${joinCode}`;

    // 7. Calculate expiry time (1 hour from now)
    const joinExpiresAt = new Date();
    joinExpiresAt.setHours(joinExpiresAt.getHours() + 1);

    // 8. Create session document
    const sessionDocument = await this.sessionModel.create({
      user1: currentUser.id,
      user2: user2.id,
      operationType: OperationType.FREELANCER_PREPAY,
      starterRole: RolesEnum.FREELANCER,
      amount: amount,
      currency: currency,
      title: title,
      description: description,
      deliverableType,
      deadline: parsedDeadline,
      duration: duration || 0,
      joinCode: joinCode,
      joinUrl: joinUrl,
      status: SessionStatus.PENDING_CONFIRMATION,
      joinExpiresAt: joinExpiresAt, // Add this field to schema
    });

    setImmediate(() => {
      void this.mailService
        .sendSessionInvitation({
          clientEmail: user2.email,
          clientName: this.buildUserDisplayName(user2),
          freelancerName: this.buildUserDisplayName(currentUser),
          freelancerEmail: currentUser.email,
          freelancerPhone: currentUser.phoneNumber,
          joinCode,
          joinUrl,
          projectTitle: title,
          projectDescription: description,
          deadline: parsedDeadline.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unknown email error';
          this.logger.error(
            `Failed to send session invitation email for session ${sessionDocument.id}: ${message}`,
          );
        });
    });

    return sessionDocument;
  }

  /**
   * Join a session using join code or URL
   * @param currentUser - The user joining (should be user2)
   * @param joinCode - 6-digit join code
   */
  async joinSession(
    currentUser: UserDocument,
    joinCode: string,
  ): Promise<SessionDocument> {
    // 1. Find session by join code
    const session = await this.sessionModel
      .findOne({ joinCode: joinCode })
      // .populate('user1 user2')
      .exec();

    if (!session) {
      throw new NotFoundException('Invalid join code');
    }

    if (session.user1 === currentUser.id) {
      throw new BadRequestException('You cant join a session you created');
    }

    // 4. Validate: current user must be user2
    if (session.user2 !== currentUser.id) {
      throw new BadRequestException(
        'This session was created for a different user',
      );
    }

    // 2. Check if session is in a joinable status
    if (
      ![SessionStatus.CREATED, SessionStatus.PENDING_CONFIRMATION].includes(
        session.status,
      )
    ) {
      throw new BadRequestException(
        `Cannot join session with status: ${session.status}`,
      );
    }

    // 3. Check if join code has expired (1 hour)
    if (session.joinExpiresAt && new Date() > session.joinExpiresAt) {
      // Update session status to EXPIRED
      session.status = SessionStatus.EXPIRED;
      await session.save();
      throw new BadRequestException(
        'Join code has expired. Please ask the freelancer to create a new session.',
      );
    }

    // 5. Validate: user cannot join their own session
    if (session.user1.toString() === currentUser.id) {
      throw new BadRequestException('You cannot join your own session');
    }

    session.operationType == OperationType.FREELANCER_PREPAY
      ? await this.userService.updateByUniqe(
          { id: session.user2.toString() },
          { role: RolesEnum.CLIENT },
        )
      : null;

    //check user 2 exists brfore create session
    // 6. Update session status to JOINED
    session.status = SessionStatus.JOINED;
    session.joinedAt = new Date(); // Add this field to schema

    await session.save();

    return session;
  }

  /**
   * Generate a unique 6-digit join code
   */
  private async generateUniqueJoinCode(): Promise<string> {
    let joinCode: string;
    let existingSession: SessionDocument | null;

    // Keep generating until we find a unique code
    do {
      joinCode = Math.floor(100000 + Math.random() * 900000).toString();
      existingSession = await this.sessionModel
        .findOne({ joinCode: joinCode })
        .exec();
    } while (existingSession);

    return joinCode;
  }

  private buildUserDisplayName(user: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    identificationName?: string;
    email?: string;
  }): string {
    const fullName = [user.firstName, user.middleName, user.lastName]
      .filter((part) => typeof part === 'string' && part.trim().length > 0)
      .join(' ')
      .trim();

    return fullName || user.identificationName || user.email || 'Waseet User';
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<SessionDocument | null> {
    return (await this.sessionModel.findById(sessionId).exec()) ?? null;
  }

  /**
   * Get session by join code
   */
  async getSessionByJoinCode(
    joinCode: string,
  ): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({ joinCode: joinCode }).exec() ?? null;
  }

  async getJoinableSessionByCodeForUser(
    joinCode: string,
    currentUser: UserDocument,
  ): Promise<SessionDocument> {
    const session = await this.getSessionByJoinCode(joinCode);

    if (!session) {
      throw new NotFoundException('Invalid join code');
    }

    if (session.user1.toString() === currentUser.id) {
      throw new BadRequestException('You cannot preview a session you created');
    }

    if (session.user2.toString() !== currentUser.id) {
      throw new BadRequestException(
        'This session was created for a different user',
      );
    }

    if (
      ![
        SessionStatus.CREATED,
        SessionStatus.PENDING_CONFIRMATION,
        SessionStatus.JOINED,
      ].includes(session.status)
    ) {
      throw new BadRequestException(
        `Cannot access session with status: ${session.status}`,
      );
    }

    if (
      session.joinExpiresAt &&
      new Date() > session.joinExpiresAt &&
      [SessionStatus.CREATED, SessionStatus.PENDING_CONFIRMATION].includes(
        session.status,
      )
    ) {
      session.status = SessionStatus.EXPIRED;
      await session.save();
      throw new BadRequestException(
        'Join code has expired. Please ask the freelancer to create a new session.',
      );
    }

    return session;
  }

  async getSessionParticipantEmails(session: SessionDocument): Promise<{
    user1Email: string | null;
    user2Email: string | null;
  }> {
    const [user1, user2] = await Promise.all([
      this.userService.findOne(session.user1.toString()),
      this.userService.findOne(session.user2.toString()),
    ]);

    return {
      user1Email: user1?.email ?? null,
      user2Email: user2?.email ?? null,
    };
  }

  /**
   * Get all sessions for a user (as user1 or user2)
   */
  async getUserSessions(
    userId: string,
    query: GetMySessionsQueryDto,
    request: Request,
  ): Promise<paginated<SessionDocument>> {
    const filter: FilterQuery<SessionDocument> = {
      $or: [{ user1: userId }, { user2: userId }],
    };

    if (query.filter === MySessionsFilterEnum.ACTIVE) {
      filter.status = {
        $in: [
          SessionStatus.HELD,
          SessionStatus.REVISION_REQUESTED,
          SessionStatus.JOINED,
          SessionStatus.AWAITING_CLIENT_APPROVAL,
          SessionStatus.DISPUTED,
        ],
      };
    }

    if (query.filter === MySessionsFilterEnum.COMPLETED) {
      filter.status = SessionStatus.COMPLETED;
    }

    if (query.filter === MySessionsFilterEnum.PENDING) {
      filter.status = {
        $in: [SessionStatus.CREATED, SessionStatus.PENDING_CONFIRMATION],
      };
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      filter.$and = [
        {
          $or: [{ user1: userId }, { user2: userId }],
        },
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { joinCode: { $regex: search, $options: 'i' } },
          ],
        },
      ];
      delete filter.$or;
    }

    return await this.paginationProvider.paginateMongooseQuery(
      {
        limit: query.limit,
        page: query.page,
      },
      this.sessionModel,
      filter,
      { createdAt: -1 },
      request,
    );
  }

  /**
   * Update session
   */
  async updateSession(
    sessionId: string,
    updateData: Partial<Session>,
  ): Promise<SessionDocument | null> {
    return this.sessionModel
      .findByIdAndUpdate(sessionId, updateData, { new: true })
      .exec();
  }

  /**
   * Delete/Cancel session
   */
  // async deleteSession(sessionId: string): Promise<SessionDocument> {
  //   const session = await this.sessionModel.findById(sessionId).exec();

  //   if (!session) {
  //     throw new NotFoundException('Session not found');
  //   }

  //   // Soft delete: just update status to CANCELLED
  //   session.status = SessionStatus.CANCELLED;
  //   await session.save();

  //   return session;
  // }

  /**
   * Regenerate join code for an expired session
   * Allows freelancer to create a new join code if client didn't join in time
   */
  async regenerateJoinCode(
    sessionId: string,
    currentUserId: string,
  ): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(sessionId).exec();

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Only user1 (freelancer) can regenerate
    if (session.user1.toString() !== currentUserId) {
      throw new BadRequestException(
        'Only the session creator can regenerate the join code',
      );
    }

    // Can only regenerate if status is EXPIRED or CREATED
    if (session.status !== SessionStatus.EXPIRED) {
      throw new BadRequestException(
        `Cannot regenerate join code for session with status: ${session.status}`,
      );
    }

    // Generate new code
    const newJoinCode = await this.generateUniqueJoinCode();
    const newJoinUrl = `${process.env.APP_URL || 'http://localhost:3000'}/sessions/join/${newJoinCode}`;

    // Set new expiry (1 hour from now)
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 1);

    // Update session
    session.joinCode = newJoinCode;
    session.joinUrl = newJoinUrl;
    session.joinExpiresAt = newExpiresAt;
    session.status = SessionStatus.CREATED;

    await session.save();

    return session;
  }

  /**
   * Validate if user can access a session
   */
  async validateUserAccess(
    sessionId: string,
    userId: string,
  ): Promise<boolean> {
    const session = await this.sessionModel
      .findById(sessionId)
      .populate('user1 user2')
      .exec();

    if (!session) {
      return false;
    }

    // User can access if they are user1 or user2
    return (
      ((session.user1 as any).id as string) === userId ||
      ((session.user2 as any).id as string) === userId
    );
  }
  private async returnWallet(
    userId: string,
    currencyId: string,
    dbSession?: ClientSession,
  ) {
    const userCurrency = await this.userCurrencyModel
      .findOne({
        userId: userId,
        currencyId: currencyId,
      })
      .session(dbSession ?? null);
    if (!userCurrency) {
      throw new BadRequestException(
        `wallet currency not found for user ${userId}`,
      );
    }

    const userWallet = await this.walletModel
      .findOne({ userCurrencyId: userCurrency.id })
      .session(dbSession ?? null);
    if (!userWallet || !userWallet.isActive) {
      throw new BadRequestException(`wallet not available for user ${userId}`);
    }
    return userWallet;
  }

  /**
   * Confirm payment (client user2) and move funds to escrow hold
   */
  async confirmSessionPayment(
    sessionId: string,
    currentUser: UserDocument,
    idempotencyKey?: string,
  ): Promise<{
    message: string;
    session: {
      id: string;
      status: SessionStatus;
      confirmedAt?: Date;
    };
  }> {
    return this.executeIdempotentSessionAction(
      SessionIdempotencyAction.CONFIRM_PAYMENT,
      sessionId,
      currentUser.id,
      idempotencyKey,
      async () => {
        const session = await this.confirmSessionPaymentInternal(
          sessionId,
          currentUser,
        );

        return {
          message: 'Payment confirmed and held in escrow',
          session: {
            id: session.id,
            status: session.status,
            confirmedAt: session.confirmedAt,
          },
        };
      },
    );
  }

  private async confirmSessionPaymentInternal(
    sessionId: string,
    currentUser: UserDocument,
  ): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(sessionId).exec();

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.user2.toString() !== currentUser.id) {
      throw new BadRequestException(
        'Only the invited client can confirm the payment',
      );
    }

    if (session.status === SessionStatus.HELD) {
      // throw new BadRequestException('Payment already confirmed');
      return session;
    }

    if (
      ![SessionStatus.JOINED, SessionStatus.PENDING_CONFIRMATION].includes(
        session.status,
      )
    ) {
      throw new BadRequestException(
        `Cannot confirm payment for session with status: ${session.status}`,
      );
    }

    const currency = await this.currencyService.findByName(session.currency);
    const amount = toNumber(session.amount);
    const feeRate = 0.04;
    const feeAmount = roundTo(amount * feeRate, currency.decimalPlaces ?? 2);
    const totalToHold = roundTo(
      amount + feeAmount,
      currency.decimalPlaces ?? 2,
    );

    const payerWallet = await this.returnWallet(
      session.user2.toString(),
      currency.id,
    );

    const payeeWallet = await this.returnWallet(
      session.user1.toString(),
      currency.id,
    );
    const systemUserId = process.env.SYSTEM_WALLET_USER_ID; //moved when final confirmation
    let systemWallet: any | null = null;
    if (systemUserId) {
      const systemUserCurrency =
        await this.userCurrencyService.findByUserIdAndCurrencyId(
          systemUserId,
          currency.id,
        );
      if (!systemUserCurrency) {
        throw new BadRequestException('Somthing went wrong');
      }

      systemWallet = await this.walletService.findDocumentByUserCurrencyId(
        systemUserCurrency.id,
      );
      if (!systemWallet || !systemWallet.isActive) {
        throw new BadRequestException('Somthing went wrong');
      }
    }
    if (!systemWallet) {
      throw new BadRequestException('Somthing went wrong');
    }

    const available = toNumber(payerWallet.available);
    const held = toNumber(payerWallet.held);
    // const totalBalance = toNumber(payerWallet.totalBalance);

    if (available < totalToHold) {
      throw new BadRequestException(
        'Insufficient wallet balance. Please go to payment and pay now.',
      );
    }

    const newAvailable = roundTo(
      available - totalToHold,
      currency.decimalPlaces ?? 2,
    );
    const newHeld = roundTo(held + totalToHold, currency.decimalPlaces ?? 2);
    const newTotalBalance = roundTo(
      newAvailable + newHeld,
      currency.decimalPlaces ?? 2,
    );

    payerWallet.available = toD128(newAvailable) as any;
    payerWallet.held = toD128(newHeld) as any;
    payerWallet.totalBalance = toD128(newTotalBalance) as any;
    await payerWallet.save();

    if (systemWallet) {
      const systemAvailable = toNumber(systemWallet.available);
      const systemTotalBalance = toNumber(systemWallet.totalBalance);
      const systemNewAvailable = roundTo(
        systemAvailable + feeAmount,
        currency.decimalPlaces ?? 2,
      );
      const systemNewTotalBalance = roundTo(
        systemTotalBalance + feeAmount,
        currency.decimalPlaces ?? 2,
      );
      systemWallet.available = toD128(systemNewAvailable) as any;
      systemWallet.totalBalance = toD128(systemNewTotalBalance) as any;
      await systemWallet.save();
    }

    await this.holdModel.create({
      payerWalletId: payerWallet.id,
      payeeWalletId: payeeWallet.id,
      amount: amount,
      currencyId: currency.id,
      status: HoldStatusEnum.HELD,
      sessionId: session.id,
    });

    const transactions: any[] = [
      {
        walletId: payerWallet.id,
        type: TransactionTypeEnum.HOLD_CREATE,
        amount: amount,
        currencyId: currency.id,
        sessionId: session.id,
        counterpartyWalletId: payeeWallet.id,
        balanceAfterAvailable: newAvailable,
        balanceAfterHeld: newHeld,
      },
      {
        walletId: payerWallet.id,
        type: TransactionTypeEnum.FEE,
        amount: feeAmount,
        currencyId: currency.id,
        sessionId: session.id,
        balanceAfterAvailable: newAvailable,
        balanceAfterHeld: newHeld,
      },
    ];

    if (systemWallet) {
      const systemAvailable = toNumber(systemWallet.available);
      const systemHeld = toNumber(systemWallet.held);
      transactions.push({
        walletId: systemWallet.id,
        type: TransactionTypeEnum.IN_FEE,
        amount: feeAmount,
        currencyId: currency.id,
        sessionId: session.id,
        counterpartyWalletId: payerWallet.id,
        balanceAfterAvailable: systemAvailable,
        balanceAfterHeld: systemHeld,
      });
    }

    await this.transactionModel.create(transactions);

    await this.feeModel.create([
      {
        sessionId: session.id,
        userWalletId: payerWallet.id,
        currencyId: currency.id,
        percentage: feeRate,
        amount: feeAmount,
        status: FeeStatusEnum.SETTLED,
      },
      {
        sessionId: session.id,
        userWalletId: payeeWallet.id,
        currencyId: currency.id,
        percentage: feeRate,
        amount: feeAmount,
        status: FeeStatusEnum.PENDING,
      },
    ]);

    session.status = SessionStatus.HELD;
    session.confirmedAt = new Date();
    await session.save();

    return session;
  }

  async completeSession(
    sessionId: string,
    currentUser: UserDocument,
    idempotencyKey?: string,
  ): Promise<{
    message: string;
    session: {
      id: string;
      status: SessionStatus;
      releasedAt?: Date;
    };
  }> {
    return this.executeIdempotentSessionAction(
      SessionIdempotencyAction.COMPLETE_SESSION,
      sessionId,
      currentUser.id,
      idempotencyKey,
      async () => {
        const session = await this.completeSessionInternal(
          sessionId,
          currentUser,
        );

        return {
          message: 'Session completed successfully',
          session: {
            id: session.id,
            status: session.status,
            releasedAt: session.releasedAt,
          },
        };
      },
    );
  }

  private async completeSessionInternal(
    sessionId: string,
    currentUser: UserDocument,
  ): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(sessionId).exec();

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.user2.toString() !== currentUser.id) {
      throw new BadRequestException(
        'Only the invited client can complete the session',
      );
    }

    if (session.status === SessionStatus.COMPLETED) {
      return session;
    }

    if (session.status !== SessionStatus.AWAITING_CLIENT_APPROVAL) {
      throw new BadRequestException(
        `Cannot complete session with status: ${session.status}`,
      );
    }

    const deliverables = await this.deliverableModel
      .find({ sessionId: session.id })
      .exec();

    if (deliverables.length === 0) {
      throw new BadRequestException(
        'Cannot complete session without deliverables',
      );
    }

    const hasUnapprovedDeliverables = deliverables.some(
      (deliverable) => deliverable.status !== DeliverableStatus.APPROVED,
    );

    if (hasUnapprovedDeliverables) {
      throw new BadRequestException(
        'All deliverables must be approved before completing the session',
      );
    }

    const currency = await this.currencyService.findByName(session.currency);
    const amount = toNumber(session.amount);
    const feeRate = 0.04;
    const freelancerFeeAmount = roundTo(
      amount * feeRate,
      currency.decimalPlaces ?? 2,
    );
    const clientFeeAmount = roundTo(
      amount * feeRate,
      currency.decimalPlaces ?? 2,
    );
    const payerHeldRelease = roundTo(
      amount + clientFeeAmount,
      currency.decimalPlaces ?? 2,
    );

    const payerWallet = await this.returnWallet(
      session.user2.toString(),
      currency.id,
    );
    const payeeWallet = await this.returnWallet(
      session.user1.toString(),
      currency.id,
    );

    const hold = await this.holdModel.findOne({
      sessionId: session.id,
      status: HoldStatusEnum.HELD,
    });

    if (!hold) {
      throw new BadRequestException(
        'No active escrow hold found for this session',
      );
    }

    const systemUserId = process.env.SYSTEM_WALLET_USER_ID;
    if (!systemUserId) {
      throw new BadRequestException('Somthing went wrong');
    }

    const systemUserCurrency =
      await this.userCurrencyService.findByUserIdAndCurrencyId(
        systemUserId,
        currency.id,
      );

    if (!systemUserCurrency) {
      throw new BadRequestException('Somthing went wrong');
    }

    const systemWallet = await this.walletService.findDocumentByUserCurrencyId(
      systemUserCurrency.id,
    );

    if (!systemWallet || !systemWallet.isActive) {
      throw new BadRequestException('Somthing went wrong');
    }

    const payerAvailable = toNumber(payerWallet.available);
    const payerHeld = toNumber(payerWallet.held);
    const payerNewHeld = roundTo(
      payerHeld - payerHeldRelease,
      currency.decimalPlaces ?? 2,
    );

    if (payerNewHeld < 0) {
      throw new BadRequestException('Invalid payer held balance for release');
    }

    payerWallet.held = toD128(payerNewHeld) as any;
    payerWallet.totalBalance = toD128(
      roundTo(payerAvailable + payerNewHeld, currency.decimalPlaces ?? 2),
    ) as any;
    await payerWallet.save();

    const payeeAvailable = toNumber(payeeWallet.available);
    const payeeHeld = toNumber(payeeWallet.held);
    const payeeAfterRelease = roundTo(
      payeeAvailable + amount,
      currency.decimalPlaces ?? 2,
    );
    const payeeFinalAvailable = roundTo(
      payeeAfterRelease - freelancerFeeAmount,
      currency.decimalPlaces ?? 2,
    );

    payeeWallet.available = toD128(payeeFinalAvailable) as any;
    payeeWallet.totalBalance = toD128(
      roundTo(payeeFinalAvailable + payeeHeld, currency.decimalPlaces ?? 2),
    ) as any;
    await payeeWallet.save();

    const systemAvailable = toNumber(systemWallet.available);
    const systemHeld = toNumber(systemWallet.held);
    const systemFinalAvailable = roundTo(
      systemAvailable + freelancerFeeAmount,
      currency.decimalPlaces ?? 2,
    );
    systemWallet.available = toD128(systemFinalAvailable) as any;
    systemWallet.totalBalance = toD128(
      roundTo(systemFinalAvailable + systemHeld, currency.decimalPlaces ?? 2),
    ) as any;
    await systemWallet.save();

    hold.status = HoldStatusEnum.RELEASED;
    await hold.save();

    await this.feeModel.updateMany(
      {
        sessionId: session.id,
        userWalletId: payeeWallet.id,
        status: FeeStatusEnum.PENDING,
      },
      {
        $set: {
          amount: freelancerFeeAmount,
          percentage: feeRate,
          status: FeeStatusEnum.SETTLED,
        },
      },
    );

    await this.transactionModel.create([
      {
        walletId: payerWallet.id,
        type: TransactionTypeEnum.HOLD_RELEASE,
        amount: payerHeldRelease,
        currencyId: currency.id,
        sessionId: session.id,
        counterpartyWalletId: payeeWallet.id,
        balanceAfterAvailable: payerAvailable,
        balanceAfterHeld: payerNewHeld,
      },
      {
        walletId: payeeWallet.id,
        type: TransactionTypeEnum.TRANSFER_IN,
        amount: amount,
        currencyId: currency.id,
        sessionId: session.id,
        counterpartyWalletId: payerWallet.id,
        balanceAfterAvailable: payeeAfterRelease,
        balanceAfterHeld: payeeHeld,
      },
      {
        walletId: payeeWallet.id,
        type: TransactionTypeEnum.FEE,
        amount: freelancerFeeAmount,
        currencyId: currency.id,
        sessionId: session.id,
        counterpartyWalletId: systemWallet.id,
        balanceAfterAvailable: payeeFinalAvailable,
        balanceAfterHeld: payeeHeld,
      },
      {
        walletId: systemWallet.id,
        type: TransactionTypeEnum.IN_FEE,
        amount: freelancerFeeAmount,
        currencyId: currency.id,
        sessionId: session.id,
        counterpartyWalletId: payeeWallet.id,
        balanceAfterAvailable: systemFinalAvailable,
        balanceAfterHeld: systemHeld,
      },
    ]);

    session.status = SessionStatus.COMPLETED;
    session.releasedAt = new Date();
    await session.save();

    return session;
  }

  private async executeIdempotentSessionAction<
    T extends Record<string, unknown>,
  >(
    action: SessionIdempotencyAction,
    sessionId: string,
    userId: string,
    idempotencyKey: string | undefined,
    handler: () => Promise<T>,
  ): Promise<T> {
    const normalizedKey = idempotencyKey?.trim();
    if (!normalizedKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const scopedKey = `${action}:${userId}:${sessionId}:${normalizedKey}`;

    let record = await this.sessionIdempotencyModel.findOne({ key: scopedKey });
    if (record?.status === SessionIdempotencyStatus.COMPLETED) {
      return record.responseBody as T;
    }
    if (record?.status === SessionIdempotencyStatus.PROCESSING) {
      throw new ConflictException('This request is already being processed');
    }

    if (!record) {
      try {
        record = await this.sessionIdempotencyModel.create({
          key: scopedKey,
          action,
          userId,
          sessionId,
          status: SessionIdempotencyStatus.PROCESSING,
        });
      } catch {
        record = await this.sessionIdempotencyModel.findOne({ key: scopedKey });
        if (record?.status === SessionIdempotencyStatus.COMPLETED) {
          return record.responseBody as T;
        }
        throw new ConflictException('Duplicate idempotency request');
      }
    } else {
      record.status = SessionIdempotencyStatus.PROCESSING;
      record.statusCode = undefined;
      record.responseBody = undefined;
      record.errorMessage = undefined;
      await record.save();
    }

    try {
      const response = await handler();
      record.status = SessionIdempotencyStatus.COMPLETED;
      record.statusCode = 200;
      record.responseBody = response;
      record.errorMessage = undefined;
      await record.save();
      return response;
    } catch (error) {
      record.status = SessionIdempotencyStatus.FAILED;
      record.statusCode = undefined;
      record.responseBody = undefined;
      record.errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await record.save();
      throw error;
    }
  }
}
