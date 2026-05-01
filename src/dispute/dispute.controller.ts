import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
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
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from 'src/user/enums/role.enum';
import type { UserDocument } from 'src/user/user.schema';
import { CreateDisputeEvidenceDto } from './dto/create-dispute-evidence.dto';
import { CreateDisputeResponseDto } from './dto/create-dispute-response.dto';
import { GetMyDisputesQueryDto } from './dto/get-my-disputes.query.dto';
import { DisputeService } from './dispute.service';
import { DeliverableType } from 'src/deliverable/enums/deliverable-type.enum';

@ApiTags('Disputes')
@ApiBearerAuth()
@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @ApiOperation({
    summary: 'Get latest dispute by session id',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispute details retrieved successfully',
  })
  @Roles([RolesEnum.USER, RolesEnum.CLIENT, RolesEnum.FREELANCER])
  @Get('session/:sessionId')
  async getBySessionId(
    @Param('sessionId') sessionId: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return await this.disputeService.getDisputeBySessionId(
      sessionId,
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Get current user disputes',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Disputes returned successfully',
  })
  @Roles([RolesEnum.USER, RolesEnum.CLIENT, RolesEnum.FREELANCER])
  @Get('my')
  async getMyDisputes(
    @CurrentUser() currentUser: UserDocument,
    @Query(new ValidationPipe({ transform: true }))
    query: GetMyDisputesQueryDto,
    @Req() request: Request,
  ) {
    return await this.disputeService.getMyDisputes(currentUser, query, request);
  }

  @ApiOperation({
    summary: 'Get dispute by ID with all related details',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispute details returned successfully',
  })
  @Roles([RolesEnum.USER, RolesEnum.CLIENT, RolesEnum.FREELANCER])
  @Get(':id')
  async getDisputeById(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return await this.disputeService.getDisputeDetailsById(id, currentUser);
  }

  @ApiOperation({
    summary: 'Submit dispute evidence',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: Object.values(DeliverableType) },
        title: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['type', 'title', 'description'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Evidence submitted successfully',
  })
  @Roles([RolesEnum.USER, RolesEnum.CLIENT, RolesEnum.FREELANCER])
  @Post(':id/evidence')
  @UseInterceptors(FileInterceptor('file'))
  async submitEvidence(
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: CreateDisputeEvidenceDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const evidence = await this.disputeService.submitEvidence(
      id,
      dto,
      file,
      currentUser,
    );

    return {
      message: 'Evidence submitted successfully',
      evidence,
    };
  }

  @ApiOperation({
    summary: 'Get dispute evidence by ID',
  })
  @ApiParam({ name: 'id', description: 'Dispute evidence ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evidence retrieved successfully',
  })
  @Roles([RolesEnum.USER, RolesEnum.CLIENT, RolesEnum.FREELANCER])
  @Get('evidence/:id')
  async getEvidenceById(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const evidence = await this.disputeService.getEvidenceById(id, currentUser);

    return {
      evidence,
    };
  }

  @ApiOperation({
    summary: 'Delete dispute evidence',
  })
  @ApiParam({ name: 'id', description: 'Dispute evidence ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Evidence deleted successfully',
  })
  @Roles([RolesEnum.USER, RolesEnum.CLIENT, RolesEnum.FREELANCER])
  @Delete('evidence/:id')
  async deleteEvidence(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    await this.disputeService.deleteEvidence(id, currentUser);

    return {
      message: 'Evidence deleted successfully',
    };
  }

  @ApiOperation({
    summary: 'Request admin review for a dispute',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin review requested successfully',
  })
  @Roles([RolesEnum.USER, RolesEnum.CLIENT, RolesEnum.FREELANCER])
  @Post(':id/request-admin-review')
  async requestAdminReview(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const dispute = await this.disputeService.requestAdminReview(
      id,
      currentUser,
    );

    return {
      message: 'Admin review requested successfully',
      dispute,
    };
  }

  @ApiOperation({
    summary: 'Add a text response to a dispute',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiBody({ type: CreateDisputeResponseDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Dispute response created successfully',
  })
  @Roles([RolesEnum.USER, RolesEnum.CLIENT, RolesEnum.FREELANCER])
  @Post(':id/responses')
  async createResponse(
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: CreateDisputeResponseDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    const response = await this.disputeService.createResponse(
      id,
      dto.message,
      currentUser,
    );

    return {
      message: 'Dispute response created successfully',
      response,
    };
  }

  @ApiOperation({
    summary: 'Delete a dispute response',
  })
  @ApiParam({ name: 'id', description: 'Dispute response ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispute response deleted successfully',
  })
  @Roles([RolesEnum.USER, RolesEnum.CLIENT, RolesEnum.FREELANCER])
  @Delete('responses/:id')
  async deleteResponse(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserDocument,
  ) {
    await this.disputeService.deleteResponse(id, currentUser);

    return {
      message: 'Dispute response deleted successfully',
    };
  }
}
