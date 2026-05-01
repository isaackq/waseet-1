import {
  Controller,
  Get,
  Query,
  ValidationPipe,
} from '@nestjs/common';
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
import { WalletOverviewQueryDto } from '../dto/wallet/request/wallet-overview.query.dto';
import { WalletService } from '../services/wallet.service';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @ApiOperation({
    summary: 'Get wallet overview for current user',
    description:
      'Returns total volume, hold amount, and available amount for a selected currency.',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet overview returned successfully',
  })
  @Roles([
    RolesEnum.USER,
    RolesEnum.FREELANCER,
    RolesEnum.CLIENT,
    RolesEnum.ADMIN,
  ])
  @Get('overview')
  async getOverview(
    @CurrentUser() currentUser: UserDocument,
    @Query(new ValidationPipe({ transform: true }))
    query: WalletOverviewQueryDto,
  ) {
    const overview = await this.walletService.getWalletOverview(
      currentUser.id,
      query.currency,
    );

    return {
      message: 'Wallet overview fetched successfully',
      data: overview,
    };
  }
}
