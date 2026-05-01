import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { Deliverable, DeliverableSchema } from 'src/deliverable/deliverable.schema';
import { SessionModule } from 'src/session/session.module';
import { Session, SessionSchema } from 'src/session/session.schema';
import { UploadsModule } from 'src/uploads/uploads.module';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';
import { DisputeEvidence, DisputeEvidenceSchema } from './schemas/dispute-evidence.schema';
import { DisputeResponse, DisputeResponseSchema } from './schemas/dispute-response.schema';
import { Dispute, DisputeSchema } from './schemas/dispute.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Dispute.name, schema: DisputeSchema },
      { name: DisputeEvidence.name, schema: DisputeEvidenceSchema },
      { name: DisputeResponse.name, schema: DisputeResponseSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Deliverable.name, schema: DeliverableSchema },
    ]),
    SessionModule,
    UploadsModule,
    PaginationModule,
  ],
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}
