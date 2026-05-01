import { Controller, Get, HttpStatus, Query, ValidationPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from 'src/user/enums/role.enum';
import { AdminFeeTotalQueryDto } from '../dto/fee/request/admin-fee-total.query.dto';
import { FeeService } from '../services/fee.service';

@ApiTags('Admin Fees')
@ApiBearerAuth()
@Controller('admin/fees')
@Roles([RolesEnum.ADMIN])
export class AdminFeeController {
  constructor(private readonly feeService: FeeService) {}

  @ApiOperation({
    summary: 'Get total fees for a given month and year',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fee total returned successfully',
  })
  @Get('total')
  async getMonthlyTotal(
    @Query(new ValidationPipe({ transform: true }))
    query: AdminFeeTotalQueryDto,
  ) {
    const data = await this.feeService.getAdminMonthlyTotal(query.month, query.year);

    return {
      message: 'Fee total fetched successfully',
      data,
    };
  }
}
