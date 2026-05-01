import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeliverableService } from './deliverable.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { UserDocument } from 'src/user/user.schema';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from 'src/user/enums/role.enum';
import { DeliverableType } from './enums/deliverable-type.enum';
import { DeliverableRequestDto } from './dto/deliverable.request.dto copy';
import { UpdateDeliverableDto } from './dto/deliverable.update.dto';
import { DeliverableRevisionRequestDto } from './dto/deliverable-revision-request.dto';
import { GetMyDeliverablesQueryDto } from './dto/get-my-deliverables.query.dto';
import { GetMyDeliverableCountsQueryDto } from './dto/get-my-deliverable-counts.query.dto';
import type { Request } from 'express';
import { DeliverableStatus } from './enums/deliverable-status.enum';

@ApiTags('Deliverables')
@Controller('deliverables')
@Roles([RolesEnum.FREELANCER, RolesEnum.CLIENT])
export class DeliverableController {
  constructor(private readonly deliverableService: DeliverableService) {}

  @ApiOperation({
    summary: 'Upload a new deliverable (Freelancer)',
    description: 'Freelancer uploads work for client review',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string', enum: Object.values(DeliverableType) },
        linkUrl: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Deliverable uploaded successfully',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.FREELANCER])
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createDeliverable(
    @Body(new ValidationPipe()) createDeliverableDto: DeliverableRequestDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const deliverable = await this.deliverableService.createDeliverable(
      createDeliverableDto,
      file,
      currentUser,
    );
    return {
      message: 'Deliverable uploaded successfully',
      deliverable,
    };
  }

  @ApiOperation({
    summary: 'Get all deliverables for a session',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Session ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deliverables retrieved successfully',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.USER])
  @Get('session/:sessionId')
  async getSessionDeliverables(
    @Param('sessionId') sessionId: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const deliverables = await this.deliverableService.getSessionDeliverables(
      sessionId,
      currentUser,
    );

    return {
      count: deliverables.length,
      deliverables,
    };
  }

  @ApiOperation({
    summary: 'Get current user deliverables',
    description:
      'Returns only deliverables uploaded by current user with pagination and optional filters.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deliverables returned successfully',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.USER, RolesEnum.FREELANCER])
  @Get('my')
  async getMyDeliverables(
    @CurrentUser() currentUser: UserDocument,
    @Query(new ValidationPipe({ transform: true }))
    query: GetMyDeliverablesQueryDto,
    @Req() request: Request,
  ) {
    return await this.deliverableService.getMyDeliverables(
      currentUser,
      query,
      request,
    );
  }

  @ApiOperation({
    summary: 'Get current user deliverable counts by type',
    description:
      'Returns lightweight counts for selected deliverable types, intended for product summary cards.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deliverable counts returned successfully',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.USER, RolesEnum.FREELANCER])
  @Get('my/type-counts')
  async getMyDeliverableCounts(
    @CurrentUser() currentUser: UserDocument,
    @Query(new ValidationPipe({ transform: true }))
    query: GetMyDeliverableCountsQueryDto,
  ) {
    return await this.deliverableService.getMyDeliverableCounts(
      currentUser,
      query,
    );
  }

  @ApiOperation({
    summary: 'Get deliverable by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Deliverable ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deliverable found',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.USER])
  @Get(':id')
  async getDeliverableById(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const deliverable = await this.deliverableService.getDeliverableById(
      id,
      currentUser,
    );

    return { deliverable };
  }

  @ApiOperation({
    summary: 'Update or resubmit deliverable (Freelancer)',
  })
  @ApiParam({
    name: 'id',
    description: 'Deliverable ID',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        linkUrl: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deliverable updated or resubmitted successfully',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.FREELANCER])
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async updateDeliverable(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateDeliverableDto: UpdateDeliverableDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const deliverable = await this.deliverableService.updateDeliverable(
      id,
      updateDeliverableDto,
      file,
      currentUser,
    );

    return {
      message:
        deliverable.status === DeliverableStatus.RESUBMITTED
          ? 'Deliverable resubmitted successfully'
          : 'Deliverable updated successfully',
      deliverable,
    };
  }

  @ApiOperation({
    summary: 'Delete deliverable (Freelancer)',
  })
  @ApiParam({
    name: 'id',
    description: 'Deliverable ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deliverable deleted successfully',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.FREELANCER])
  @Delete(':id')
  async deleteDeliverable(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    await this.deliverableService.deleteDeliverable(id, currentUser);

    return {
      message: 'Deliverable deleted successfully',
    };
  }

  @ApiOperation({
    summary: 'Approve deliverable (Client)',
    description: 'Client approves the freelancer work',
  })
  @ApiParam({
    name: 'id',
    description: 'Deliverable ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deliverable approved successfully',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.CLIENT])
  @Post(':id/approve')
  async approveDeliverable(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const deliverable = await this.deliverableService.approveDeliverable(
      id,
      currentUser,
    );

    return {
      message: 'Deliverable approved successfully',
      deliverable,
    };
  }

  @ApiOperation({
    summary: 'Request revision (Client)',
    description: 'Client requests changes to the deliverable',
  })
  @ApiParam({
    name: 'id',
    description: 'Deliverable ID',
  })
  @ApiBody({ type: DeliverableRevisionRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revision requested successfully',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.CLIENT])
  @Post(':id/request-revision')
  async requestRevision(
    @Param('id') id: string,
    @Body(new ValidationPipe())
    revisionRequestDto: DeliverableRevisionRequestDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const deliverable = await this.deliverableService.requestRevision(
      id,
      revisionRequestDto,
      currentUser,
    );

    return {
      message: 'Revision requested successfully',
      deliverable,
    };
  }

  @ApiOperation({
    summary: 'Dispute deliverable (Client)',
    description: 'Client disputes/rejects the deliverable',
  })
  @ApiParam({
    name: 'id',
    description: 'Deliverable ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          minLength: 10,
          maxLength: 1000,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Deliverable disputed successfully',
  })
  @ApiBearerAuth()
  @Roles([RolesEnum.CLIENT])
  @Post(':id/dispute')
  async disputeDeliverable(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const result = await this.deliverableService.disputeDeliverable(
      id,
      reason,
      currentUser,
    );

    return {
      message: 'Deliverable disputed. Admin will review.',
      ...result,
    };
  }
}
