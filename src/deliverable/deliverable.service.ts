import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deliverable, DeliverableDocument } from './deliverable.schema';
import { Session, SessionDocument } from 'src/session/session.schema';
import { UserDocument } from 'src/user/user.schema';
import { DeliverableRequestDto } from './dto/deliverable.request.dto copy';
import { SessionStatus } from 'src/session/enums/session-status.enum';
import { DeliverableStatus } from './enums/deliverable-status.enum';
import { UpdateDeliverableDto } from './dto/deliverable.update.dto';
import { DeliverableRevisionRequestDto } from './dto/deliverable-revision-request.dto';
import { GetMyDeliverablesQueryDto } from './dto/get-my-deliverables.query.dto';
import { GetMyDeliverableCountsQueryDto } from './dto/get-my-deliverable-counts.query.dto';
import { SessionService } from 'src/session/session.service';
import { UploadsService } from 'src/uploads/providers/uploads.service';
import { fileTypesEnum } from 'src/uploads/enums/file-type.enum';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { DeliverableType } from './enums/deliverable-type.enum';
import { DisputeService } from 'src/dispute/dispute.service';

@Injectable()
export class DeliverableService {
  constructor(
    @InjectModel(Deliverable.name)
    private readonly deliverableModel: Model<DeliverableDocument>,
    private readonly sessionService: SessionService,
    private readonly uploadsService: UploadsService,
    private readonly paginationProvider: PaginationProvider,
    private readonly disputeService: DisputeService,
  ) {}

  private readonly clientReviewableStatuses = [
    DeliverableStatus.PENDING,
    DeliverableStatus.RESUBMITTED,
  ];

  /**
   * Create a new deliverable (Freelancer uploads work)
   */
  async createDeliverable(
    createDeliverableDto: DeliverableRequestDto,
    file: Express.Multer.File,
    currentUser: UserDocument,
  ): Promise<DeliverableDocument> {
    // 1. Find session
    const session = await this.sessionService.getSessionById(
      createDeliverableDto.sessionId,
    );

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // 2. Validate: Only freelancer (user1) can upload deliverables
    if (session.user1.toString() !== currentUser.id) {
      throw new ForbiddenException(
        'Only the freelancer can upload deliverables',
      );
    }

    // 3. Validate: Session must be in HELD status
    if (session.status !== SessionStatus.HELD) {
      //handle case where clint want to create more than 1 delervable for 1 session??
      throw new BadRequestException(
        `Cannot upload deliverables for session with status: ${session.status}`,
      );
    }

    // 4. Validate: Deadline must not be passed
    if (new Date() > new Date(session.deadline)) {
      throw new BadRequestException(
        'Cannot upload deliverables after deadline',
      );
    }

    if (session.deliverableType !== createDeliverableDto.type) {
      throw new BadRequestException(
        `This session only accepts deliverables of type: ${session.deliverableType}`,
      );
    }

    if (createDeliverableDto.type === DeliverableType.LINK) {
      if (!createDeliverableDto.linkUrl) {
        throw new BadRequestException(
          'Link URL is required for LINK type deliverables',
        );
      }
      const deliverable = await this.deliverableModel.create({
        sessionId: session.id,
        uploadedBy: currentUser.id,
        name: createDeliverableDto.name,
        description: createDeliverableDto.description,
        type: createDeliverableDto.type,
        linkUrl: createDeliverableDto.linkUrl,
        status: DeliverableStatus.PENDING,
      });
      session.status = SessionStatus.AWAITING_CLIENT_APPROVAL;
      await session.save();

      return await deliverable.populate('uploadId sessionId');
    }

    if (!file) {
      throw new BadRequestException(
        'A file is required for non-link deliverables',
      );
    }

    const upload = await this.uploadToAws(file, createDeliverableDto.type);
    // 5. Create deliverable
    const deliverable = await this.deliverableModel.create({
      sessionId: session.id,
      uploadedBy: currentUser.id,
      name: createDeliverableDto.name,
      description: createDeliverableDto.description,
      type: createDeliverableDto.type,
      uploadId: upload.id,
      status: DeliverableStatus.PENDING,
    });

    // 6. Update session status to AWAITING_CLIENT_APPROVAL
    session.status = SessionStatus.AWAITING_CLIENT_APPROVAL;
    await session.save();

    return await deliverable.populate('uploadId sessionId');
  }

  private async uploadToAws(file: Express.Multer.File, type: DeliverableType) {
    if (type === DeliverableType.OTHER) {
      return await this.uploadsService.uploadFileGeneral(file);
    }

    return await this.uploadsService.uploadFileWithType(
      file,
      this.mapDeliverableTypeToUploadType(type),
    );
  }

  private mapDeliverableTypeToUploadType(type: DeliverableType): fileTypesEnum {
    switch (type) {
      case DeliverableType.IMAGE:
        return fileTypesEnum.IMAGE;
      case DeliverableType.VIDEO:
        return fileTypesEnum.VIDEO;
      case DeliverableType.AUDIO:
        return fileTypesEnum.AUDIO;
      case DeliverableType.PDF:
        return fileTypesEnum.PDF;
      case DeliverableType.DOCUMENT:
        return fileTypesEnum.DOCUMENT;
      case DeliverableType.ZIP_FILE:
        return fileTypesEnum.ZIP;
      case DeliverableType.LINK:
        return fileTypesEnum.LINK;
      default:
        throw new BadRequestException(
          `Unsupported upload deliverable type: ${type}`,
        );
    }
  }

  /**
   * Get all deliverables for a session
   */
  async getSessionDeliverables(
    sessionId: string,
    currentUser: UserDocument,
  ): Promise<DeliverableDocument[]> {
    // 1. Validate session exists and user has access
    const session = await this.sessionService.getSessionById(sessionId);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check if user is part of this session
    const isUser1 = session.user1.toString() === currentUser.id;
    const isUser2 = session.user2?.toString() === currentUser.id;

    if (!isUser1 && !isUser2) {
      throw new ForbiddenException('You do not have access to this session');
    }

    // 2. Get deliverables
    return this.deliverableModel
      .find({ sessionId: sessionId })
      .sort({ createdAt: -1 })
      .populate('uploadId')
      .exec();
  }

  async getMyDeliverables(
    currentUser: UserDocument,
    query: GetMyDeliverablesQueryDto,
    request: Request,
  ) {
    const filter: Record<string, any> = {
      uploadedBy: currentUser.id,
    };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const paginatedDeliverables =
      await this.paginationProvider.paginateMongooseQuery(
        {
          page: query.page,
          limit: query.limit,
        },
        this.deliverableModel,
        filter,
        { createdAt: -1 },
        request,
      );

    const populatedData = await this.deliverableModel.populate(
      paginatedDeliverables.data,
      [{ path: 'uploadId' }, { path: 'sessionId' }],
    );

    return {
      ...paginatedDeliverables,
      data: populatedData,
    };
  }

  async getMyDeliverableCounts(
    currentUser: UserDocument,
    query: GetMyDeliverableCountsQueryDto,
  ) {
    const types = query.types?.length
      ? query.types
      : (Object.values(DeliverableType) as DeliverableType[]);

    const [totalProducts, rows] = await Promise.all([
      this.deliverableModel.countDocuments({ uploadedBy: currentUser.id }),
      this.deliverableModel
        .find({
          uploadedBy: currentUser.id,
          type: { $in: types },
        })
        .select('type')
        .lean(),
    ]);

    const countsByType = types.reduce(
      (acc, type) => {
        acc[type] = 0;
        return acc;
      },
      {} as Record<DeliverableType, number>,
    );

    for (const row of rows as Array<{ type?: DeliverableType }>) {
      if (row.type && row.type in countsByType) {
        countsByType[row.type] += 1;
      }
    }

    return {
      totalProducts,
      countsByType,
    };
  }

  /**
   * Get a single deliverable by ID
   */
  async getDeliverableById(
    deliverableId: string,
    currentUser: UserDocument,
  ): Promise<DeliverableDocument> {
    const deliverable = await this.deliverableModel
      .findById(deliverableId)
      .populate('sessionId  uploadId')
      .exec();

    if (!deliverable) {
      throw new NotFoundException('Deliverable not found');
    }

    // Validate access
    const session = deliverable.sessionId as any;
    const isUser1 = session.user1.toString() === currentUser.id;
    const isUser2 = session.user2?.toString() === currentUser.id;

    if (!isUser1 && !isUser2) {
      throw new ForbiddenException(
        'You do not have access to this deliverable',
      );
    }

    return deliverable;
  }

  /**
   * Update deliverable (Freelancer can edit before approval)
   */
  async updateDeliverable(
    deliverableId: string,
    updateDeliverableDto: UpdateDeliverableDto,
    file: Express.Multer.File,
    currentUser: UserDocument,
  ): Promise<DeliverableDocument> {
    const deliverable = await this.deliverableModel
      .findById(deliverableId)
      .populate('sessionId')
      .exec();

    if (!deliverable) {
      throw new NotFoundException('Deliverable not found');
    }

    // Only freelancer who uploaded can update
    if (deliverable.uploadedBy.toString() !== currentUser.id) {
      throw new ForbiddenException('You can only update your own deliverables');
    }

    // Can only update if status is PENDING or REVISION_REQUESTED
    if (
      deliverable.status !== DeliverableStatus.PENDING &&
      deliverable.status !== DeliverableStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException(
        `Cannot update deliverable with status: ${deliverable.status}`,
      );
    }

    const session = deliverable.sessionId as unknown as SessionDocument;

    // Update fields
    if (updateDeliverableDto.name) {
      deliverable.name = updateDeliverableDto.name;
    }
    if (updateDeliverableDto.description !== undefined) {
      deliverable.description = updateDeliverableDto.description;
    }
    if (deliverable.type === DeliverableType.LINK) {
      if (updateDeliverableDto.linkUrl !== undefined) {
        deliverable.linkUrl = updateDeliverableDto.linkUrl;
      }

      if (!deliverable.linkUrl) {
        throw new BadRequestException(
          'Link URL is required for LINK type deliverables',
        );
      }
    } else if (file) {
      const upload = await this.uploadToAws(file, deliverable.type);

      if (deliverable.uploadId) {
        await this.uploadsService.deleteFile(deliverable.uploadId.toString());
      }

      deliverable.uploadId = upload.id as any;
    }

    if (deliverable.status === DeliverableStatus.REVISION_REQUESTED) {
      deliverable.status = DeliverableStatus.RESUBMITTED;
      session.status = SessionStatus.AWAITING_CLIENT_APPROVAL;
      await session.save();
    }

    const updatedDeliverable = await deliverable.save();
    return await updatedDeliverable.populate('uploadId sessionId');
  }

  /**
   * Delete deliverable (Freelancer only, before approval)
   */
  async deleteDeliverable(
    deliverableId: string,
    currentUser: UserDocument,
  ): Promise<void> {
    const deliverable = await this.deliverableModel
      .findById(deliverableId)
      .exec();

    if (!deliverable) {
      throw new NotFoundException('Deliverable not found');
    }

    // Only freelancer who uploaded can delete
    if (deliverable.uploadedBy.toString() !== currentUser.id) {
      throw new ForbiddenException('You can only delete your own deliverables');
    }

    const session = await this.sessionService.getSessionById(
      deliverable.sessionId.toString(),
    );

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Can only delete if PENDING or REVISION_REQUESTED
    if (
      deliverable.status !== DeliverableStatus.PENDING &&
      deliverable.status !== DeliverableStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException(
        `Cannot delete deliverable with status: ${deliverable.status}`,
      );
    }

    if (deliverable.uploadId) {
      await this.uploadsService.deleteFile(deliverable.uploadId.toString());
    }

    await this.deliverableModel.findByIdAndDelete(deliverableId).exec();

    session.status = SessionStatus.HELD;
    await session.save();
  }

  /**
   * Approve deliverable (Client approves)
   */
  async approveDeliverable(
    deliverableId: string,
    currentUser: UserDocument,
  ): Promise<DeliverableDocument> {
    const deliverable = await this.deliverableModel
      .findById(deliverableId)
      .populate('sessionId')
      .exec();

    if (!deliverable) {
      throw new NotFoundException('Deliverable not found');
    }

    const session = deliverable.sessionId as any;

    // Only client (user2) can approve
    if (session.user2.toString() !== currentUser.id) {
      throw new ForbiddenException('Only the client can approve deliverables');
    }

    // Can only approve if the deliverable is waiting for client review
    if (!this.clientReviewableStatuses.includes(deliverable.status)) {
      throw new BadRequestException(
        `Cannot approve deliverable with status: ${deliverable.status}`,
      );
    }

    // Update deliverable status
    deliverable.status = DeliverableStatus.APPROVED;
    deliverable.approvedAt = new Date();
    await deliverable.save();

    // Check if all deliverables are approved
    const allDeliverables = await this.deliverableModel
      .find({ sessionId: session._id })
      .exec();

    const allApproved = allDeliverables.every(
      (d) => d.status === DeliverableStatus.APPROVED,
    );

    // Keep session in review state until the client explicitly completes it.
    if (allApproved) {
      session.status = SessionStatus.AWAITING_CLIENT_APPROVAL;
      await session.save();
    }

    return deliverable;
  }

  /**
   * Request revision (Client requests changes)
   */
  async requestRevision(
    deliverableId: string,
    revisionRequestDto: DeliverableRevisionRequestDto,
    currentUser: UserDocument,
  ): Promise<DeliverableDocument> {
    const deliverable = await this.deliverableModel
      .findById(deliverableId)
      .populate('sessionId')
      .exec();

    if (!deliverable) {
      throw new NotFoundException('Deliverable not found');
    }

    const session = deliverable.sessionId as any;

    // Only client can request revision
    if (session.user2.toString() !== currentUser.id) {
      throw new ForbiddenException('Only the client can request revisions');
    }

    // Can only request revision if the deliverable is currently under review
    if (!this.clientReviewableStatuses.includes(deliverable.status)) {
      throw new BadRequestException(
        `Cannot request revision for deliverable with status: ${deliverable.status}`,
      );
    }

    // Update deliverable
    deliverable.status = DeliverableStatus.REVISION_REQUESTED;
    deliverable.revisionNotes = revisionRequestDto.revisionNotes;
    deliverable.revisionRequestedAt = new Date();
    session.status = SessionStatus.REVISION_REQUESTED;
    await session.save();

    return await deliverable.save();
  }

  /**
   * Dispute deliverable (Client disputes/rejects)
   */
  async disputeDeliverable(
    deliverableId: string,
    disputeReason: string,
    currentUser: UserDocument,
  ) {
    const deliverable = await this.deliverableModel
      .findById(deliverableId)
      .populate('sessionId')
      .exec();

    if (!deliverable) {
      throw new NotFoundException('Deliverable not found');
    }

    const session = deliverable.sessionId as any;

    // Only client can dispute
    if (session.user2.toString() !== currentUser.id) {
      throw new ForbiddenException('Only the client can dispute deliverables');
    }

    if (!this.clientReviewableStatuses.includes(deliverable.status)) {
      throw new BadRequestException(
        `Cannot dispute deliverable with status: ${deliverable.status}`,
      );
    }

    // Update deliverable
    deliverable.status = DeliverableStatus.DISPUTED;
    deliverable.revisionNotes = disputeReason;
    deliverable.disputedAt = new Date();
    await deliverable.save();

    const dispute = await this.disputeService.openDisputeFromDeliverable(
      deliverable,
      session,
      currentUser,
      disputeReason,
    );

    return {
      deliverable: await deliverable.populate('sessionId uploadId'),
      dispute,
    };
  }
}
