import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from 'src/user/enums/role.enum';
import type { UserDocument } from 'src/user/user.schema';
import { DashboardOverviewQueryDto } from './dto/dashboard-overview.query.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({
    summary: 'Get dashboard overview',
    description:
      'Returns dashboard cards, recent sessions, and recent payments (deposit transactions only).',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview returned successfully',
  })
  @Roles([
    RolesEnum.USER,
    RolesEnum.FREELANCER,
    RolesEnum.CLIENT,
    RolesEnum.ADMIN,
  ])
  @Get('user-overview')
  async getOverview(
    @CurrentUser() currentUser: UserDocument,
    @Query(new ValidationPipe({ transform: true }))
    query: DashboardOverviewQueryDto,
  ) {
    const data = await this.dashboardService.getOverview(
      currentUser,
      query.recentLimit,
    );

    return {
      message: 'Dashboard overview fetched successfully',
      data,
    };
  }
}
