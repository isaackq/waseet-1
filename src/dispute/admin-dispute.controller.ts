import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from 'src/user/enums/role.enum';
import { DisputeService } from './dispute.service';
import { GetAdminDisputesQueryDto } from './dto/get-admin-disputes.query.dto';
import {
  RejectDisputeByAdminDto,
  ResolveDisputeByAdminDto,
} from './dto/admin-dispute-decision.dto';

@ApiTags('Admin Disputes')
@ApiBearerAuth()
@Controller('admin/disputes')
@Roles([RolesEnum.ADMIN])
export class AdminDisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @ApiOperation({
    summary: 'Get paginated disputes for admin review',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Disputes returned successfully',
  })
  @Get()
  async getAdminDisputes(
    @Query(new ValidationPipe({ transform: true }))
    query: GetAdminDisputesQueryDto,
    @Req() request: Request,
  ) {
    return await this.disputeService.getAdminDisputes(query, request);
  }

  @ApiOperation({
    summary: 'Get dispute details for admin review',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Dispute details returned successfully with both sides evidence and responses',
  })
  @Get(':id')
  async getAdminDisputeById(@Param('id') id: string) {
    return await this.disputeService.getAdminDisputeDetailsById(id);
  }

  @ApiOperation({
    summary: 'Resolve a dispute as admin',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiBody({ type: ResolveDisputeByAdminDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispute resolved successfully',
  })
  @Patch(':id/resolve')
  async resolveDispute(
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: ResolveDisputeByAdminDto,
  ) {
    const dispute = await this.disputeService.resolveDisputeByAdmin(id, dto);

    return {
      message: 'Dispute resolved successfully',
      dispute,
    };
  }

  @ApiOperation({
    summary: 'Reject a dispute as admin',
  })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiBody({ type: RejectDisputeByAdminDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dispute rejected successfully',
  })
  @Patch(':id/reject')
  async rejectDispute(
    @Param('id') id: string,
    @Body(new ValidationPipe()) dto: RejectDisputeByAdminDto,
  ) {
    const dispute = await this.disputeService.rejectDisputeByAdmin(id, dto);

    return {
      message: 'Dispute rejected successfully',
      dispute,
    };
  }
}
