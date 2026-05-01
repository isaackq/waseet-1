import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import type { Request } from 'express';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { DeliverableDocument } from 'src/deliverable/deliverable.schema';
import { SessionDocument } from 'src/session/session.schema';
import { SessionService } from 'src/session/session.service';
import { SessionStatus } from 'src/session/enums/session-status.enum';
import { UploadsService } from 'src/uploads/providers/uploads.service';
import { UserDocument } from 'src/user/user.schema';
import {
  CreateDisputeEvidenceDto,
} from './dto/create-dispute-evidence.dto';
import {
  GetMyDisputesQueryDto,
  MyDisputesFilterEnum,
} from './dto/get-my-disputes.query.dto';
import { DisputeStatus } from './enums/dispute-status.enum';
import {
  Dispute,
  DisputeDocument,
} from './schemas/dispute.schema';
import {
  DisputeEvidence,
  DisputeEvidenceDocument,
} from './schemas/dispute-evidence.schema';
import {
  DisputeResponse,
  DisputeResponseDocument,
} from './schemas/dispute-response.schema';
import { RolesEnum } from 'src/user/enums/role.enum';

@Injectable()
export class DisputeService {
  constructor(
    @InjectModel(Dispute.name)
    private readonly disputeModel: Model<DisputeDocument>,
    @InjectModel(DisputeEvidence.name)
    private readonly disputeEvidenceModel: Model<DisputeEvidenceDocument>,
    @InjectModel(DisputeResponse.name)
    private readonly disputeResponseModel: Model<DisputeResponseDocument>,
    private readonly sessionService: SessionService,
    private readonly uploadsService: UploadsService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  async openDisputeFromDeliverable(
    deliverable: DeliverableDocument,
    session: SessionDocument,
    currentUser: UserDocument,
    reason: string,
  ): Promise<DisputeDocument> {
    if (session.user2.toString() !== currentUser.id) {
      throw new ForbiddenException('Only the client can open a dispute');
    }

    const existingDispute = await this.disputeModel
      .findOne({
        sessionId: session.id,
        status: { $in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
      })
      .exec();

    if (existingDispute) {
      throw new BadRequestException('An active dispute already exists for this session');
    }

    const dispute = await this.disputeModel.create({
      sessionId: session.id,
      deliverableId: deliverable.id,
      openedByUserId: currentUser.id,
      reason,
      status: DisputeStatus.OPEN,
    });

    session.status = SessionStatus.DISPUTED;
    await session.save();

    return await dispute.populate('sessionId deliverableId openedByUserId');
  }

  async getDisputeById(
    disputeId: string,
    currentUser: UserDocument,
  ): Promise<DisputeDocument> {
    const dispute = await this.disputeModel
      .findById(disputeId)
      .populate('sessionId deliverableId openedByUserId')
      .exec();

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    await this.assertSessionAccess(
      (dispute.sessionId as unknown as SessionDocument).id,
      currentUser.id,
    );

    return dispute;
  }

  async getDisputeBySessionId(
    sessionId: string,
    currentUser: UserDocument,
  ): Promise<{
    dispute: DisputeDocument | null;
    evidence: DisputeEvidenceDocument[];
    responses: DisputeResponseDocument[];
  }> {
    await this.assertSessionAccess(sessionId, currentUser.id);

    const dispute = await this.disputeModel
      .findOne({ sessionId })
      .sort({ createdAt: -1 })
      .populate('sessionId deliverableId openedByUserId')
      .exec();

    if (!dispute) {
      return { dispute: null, evidence: [], responses: [] };
    }

    const [evidence, responses] = await Promise.all([
      this.disputeEvidenceModel
        .find({ disputeId: dispute.id })
        .sort({ createdAt: -1 })
        .populate('uploadId submittedByUserId')
        .exec(),
      this.disputeResponseModel
        .find({ disputeId: dispute.id })
        .sort({ createdAt: 1 })
        .populate('userId')
        .exec(),
    ]);

    return { dispute, evidence, responses };
  }

  async getDisputeDetailsById(
    disputeId: string,
    currentUser: UserDocument,
  ): Promise<{
    dispute: DisputeDocument;
    evidence: DisputeEvidenceDocument[];
    responses: DisputeResponseDocument[];
  }> {
    const dispute = await this.getDisputeById(disputeId, currentUser);

    const [evidence, responses] = await Promise.all([
      this.disputeEvidenceModel
        .find({ disputeId: dispute.id })
        .sort({ createdAt: -1 })
        .populate('uploadId submittedByUserId')
        .exec(),
      this.disputeResponseModel
        .find({ disputeId: dispute.id })
        .sort({ createdAt: 1 })
        .populate('userId')
        .exec(),
    ]);

    return { dispute, evidence, responses };
  }

  async submitEvidence(
    disputeId: string,
    dto: CreateDisputeEvidenceDto,
    file: Express.Multer.File | undefined,
    currentUser: UserDocument,
  ): Promise<DisputeEvidenceDocument> {
    const dispute = await this.getDisputeById(disputeId, currentUser);

    if (
      ![DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW].includes(dispute.status)
    ) {
      throw new BadRequestException(
        `Cannot submit evidence for dispute with status: ${dispute.status}`,
      );
    }

    let uploadId: string | undefined;
    if (file) {
      const upload = await this.uploadsService.uploadFileGeneral(file);
      uploadId = upload.id;
    }

    const evidence = await this.disputeEvidenceModel.create({
      disputeId: dispute.id,
      submittedByUserId: currentUser.id,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      uploadId,
    });

    return await evidence.populate('uploadId submittedByUserId');
  }

  async getEvidenceById(
    evidenceId: string,
    currentUser: UserDocument,
  ): Promise<DisputeEvidenceDocument> {
    const evidence = await this.disputeEvidenceModel
      .findById(evidenceId)
      .populate('uploadId submittedByUserId')
      .exec();

    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    await this.getDisputeById(evidence.disputeId.toString(), currentUser);

    return evidence;
  }

  async deleteEvidence(
    evidenceId: string,
    currentUser: UserDocument,
  ): Promise<void> {
    const evidence = await this.disputeEvidenceModel.findById(evidenceId).exec();

    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    const dispute = await this.getDisputeById(
      evidence.disputeId.toString(),
      currentUser,
    );

    if (evidence.submittedByUserId.toString() !== currentUser.id) {
      throw new ForbiddenException('You can only delete your own evidence');
    }

    if ([DisputeStatus.RESOLVED, DisputeStatus.REJECTED].includes(dispute.status)) {
      throw new BadRequestException(
        `Cannot delete evidence for dispute with status: ${dispute.status}`,
      );
    }

    if (evidence.uploadId) {
      await this.uploadsService.deleteFile(evidence.uploadId.toString());
    }

    await this.disputeEvidenceModel.findByIdAndDelete(evidenceId).exec();
  }

  async requestAdminReview(
    disputeId: string,
    currentUser: UserDocument,
  ): Promise<DisputeDocument> {
    const dispute = await this.getDisputeById(disputeId, currentUser);

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException(
        `Cannot request admin review for dispute with status: ${dispute.status}`,
      );
    }

    dispute.status = DisputeStatus.UNDER_REVIEW;
    dispute.requestedAdminReviewAt = new Date();
    await dispute.save();

    return dispute;
  }

  async createResponse(
    disputeId: string,
    message: string,
    currentUser: UserDocument,
  ): Promise<DisputeResponseDocument> {
    const dispute = await this.getDisputeById(disputeId, currentUser);

    if (
      ![DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW].includes(dispute.status)
    ) {
      throw new BadRequestException(
        `Cannot respond to dispute with status: ${dispute.status}`,
      );
    }

    const response = await this.disputeResponseModel.create({
      disputeId: dispute.id,
      userId: currentUser.id,
      roleSnapshot: this.resolveRoleSnapshot(currentUser),
      message,
    });

    return await response.populate('userId');
  }

  async deleteResponse(
    responseId: string,
    currentUser: UserDocument,
  ): Promise<void> {
    const response = await this.disputeResponseModel.findById(responseId).exec();

    if (!response) {
      throw new NotFoundException('Dispute response not found');
    }

    const dispute = await this.getDisputeById(
      response.disputeId.toString(),
      currentUser,
    );

    if (response.userId.toString() !== currentUser.id) {
      throw new ForbiddenException('You can only delete your own responses');
    }

    if ([DisputeStatus.RESOLVED, DisputeStatus.REJECTED].includes(dispute.status)) {
      throw new BadRequestException(
        `Cannot delete response for dispute with status: ${dispute.status}`,
      );
    }

    await this.disputeResponseModel.findByIdAndDelete(responseId).exec();
  }

  async getMyDisputes(
    currentUser: UserDocument,
    query: GetMyDisputesQueryDto,
    request: Request,
  ) {
    const filter: FilterQuery<DisputeDocument> = {
      $or: [{ openedByUserId: currentUser.id }],
    };

    if (query.filter === MyDisputesFilterEnum.PENDING) {
      filter.status = { $in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] };
    }

    if (query.filter === MyDisputesFilterEnum.RESOLVED) {
      filter.status = DisputeStatus.RESOLVED;
    }

    if (query.filter === MyDisputesFilterEnum.REJECTED) {
      filter.status = DisputeStatus.REJECTED;
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      filter.$and = [
        { $or: [{ openedByUserId: currentUser.id }] },
        {
          $or: [
            { reason: { $regex: search, $options: 'i' } },
            { adminDecision: { $regex: search, $options: 'i' } },
            { resolution: { $regex: search, $options: 'i' } },
          ],
        },
      ];
      delete filter.$or;
    }

    const disputes = await this.paginationProvider.paginateMongooseQuery(
      { limit: query.limit, page: query.page },
      this.disputeModel as any,
      filter,
      { createdAt: -1 },
      request,
    );

    const populatedData = await this.disputeModel.populate(disputes.data, [
      { path: 'sessionId' },
      { path: 'deliverableId' },
      { path: 'openedByUserId' },
    ]);

    const baseFilter = { openedByUserId: currentUser.id };
    const [total, pending, resolved, rejected] = await Promise.all([
      this.disputeModel.countDocuments(baseFilter),
      this.disputeModel.countDocuments({
        ...baseFilter,
        status: { $in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
      }),
      this.disputeModel.countDocuments({
        ...baseFilter,
        status: DisputeStatus.RESOLVED,
      }),
      this.disputeModel.countDocuments({
        ...baseFilter,
        status: DisputeStatus.REJECTED,
      }),
    ]);

    return {
      summary: {
        total,
        pending,
        resolved,
        rejected,
      },
      ...disputes,
      data: populatedData,
    };
  }

  private async assertSessionAccess(
    sessionId: string,
    userId: string,
  ): Promise<void> {
    const hasAccess = await this.sessionService.validateUserAccess(sessionId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this dispute');
    }
  }

  private resolveRoleSnapshot(currentUser: UserDocument): RolesEnum {
    if (currentUser.role?.includes(RolesEnum.ADMIN)) {
      return RolesEnum.ADMIN;
    }
    if (currentUser.role?.includes(RolesEnum.FREELANCER)) {
      return RolesEnum.FREELANCER;
    }
    if (currentUser.role?.includes(RolesEnum.CLIENT)) {
      return RolesEnum.CLIENT;
    }
    return RolesEnum.USER;
  }
}
