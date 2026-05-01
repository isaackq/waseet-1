import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from 'src/user/enums/role.enum';
import type { UserDocument } from 'src/user/user.schema';
import { GenerateWalletPaymentLinkRequestDto } from '../dto/payment/request/generate-wallet-payment-link.request.dto';
import { WalletPaymentService } from '../services/wallet-payment.service';

@ApiTags('Wallet Payments')
@Controller('wallet/payments')
export class WalletPaymentController {
  constructor(private readonly walletPaymentService: WalletPaymentService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate Stripe payment link for wallet top up',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment link generated successfully',
  })
  @Roles([RolesEnum.USER, RolesEnum.FREELANCER, RolesEnum.CLIENT, RolesEnum.ADMIN])
  @Post('generate-link')
  async generatePaymentLink(
    @CurrentUser() currentUser: UserDocument,
    @Body(new ValidationPipe({ transform: true }))
    dto: GenerateWalletPaymentLinkRequestDto,
  ) {
    return this.walletPaymentService.generatePaymentLink(currentUser, dto);
  }

  @ApiOperation({
    summary: 'Stripe webhook to confirm wallet payment',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed',
  })
  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  async handleWebhook(@Req() req: Request) {
    return this.walletPaymentService.handleStripeWebhook(req);
  }
}
