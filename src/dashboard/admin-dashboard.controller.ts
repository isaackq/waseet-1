import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from 'src/user/enums/role.enum';
import { DashboardService } from './dashboard.service';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
@Roles([RolesEnum.ADMIN])
export class AdminDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({
    summary: 'Get admin overview dashboard',
    description:
      'Returns user totals, new users in the last 7 days, 12-month growth, and users by segment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin dashboard overview returned successfully',
  })
  @Get('overview')
  async getAdminOverview() {
    const data = await this.dashboardService.getAdminOverview();

    return {
      message: 'Admin dashboard overview fetched successfully',
      data,
    };
  }
}
