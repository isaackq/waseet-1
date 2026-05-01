import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './session.schema';
import { SessionStatus } from './enums/session-status.enum';

@Injectable()
export class SessionCronService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredSessions(): Promise<void> {
    const now = new Date();

    const expiredSessions = await this.sessionModel
      .find({
        status: SessionStatus.CREATED,
        joinExpiresAt: { $lte: now },
      })
      .exec();

    for (const session of expiredSessions) {
      session.status = SessionStatus.EXPIRED;
      await session.save();
    }

    if (expiredSessions.length > 0) {
      console.log(
        `[CRON] Marked ${expiredSessions.length} sessions as EXPIRED`,
      );
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handlePendingConfirmationSessions(): Promise<void> {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);

    const result = await this.sessionModel.updateMany(
      {
        status: SessionStatus.JOINED,
        joinedAt: { $lte: cutoff },
      },
      {
        $set: { status: SessionStatus.PENDING_CONFIRMATION },
      },
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[CRON] Marked ${result.modifiedCount} sessions as PENDING_CONFIRMATION`,
      );
    }
  }
}
