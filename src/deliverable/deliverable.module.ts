import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliverableController } from './deliverable.controller';
import { DeliverableService } from './deliverable.service';
import { Deliverable, DeliverableSchema } from './deliverable.schema';
import { Session, SessionSchema } from 'src/session/session.schema';
import { SessionModule } from 'src/session/session.module';
import { UploadsModule } from 'src/uploads/uploads.module';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { DisputeModule } from 'src/dispute/dispute.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deliverable.name, schema: DeliverableSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    SessionModule,
    UploadsModule,
    PaginationModule,
    DisputeModule,
  ],
  controllers: [DeliverableController],
  providers: [DeliverableService],
  exports: [DeliverableService],
})
export class DeliverableModule {}
