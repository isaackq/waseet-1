import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesEnum } from 'src/user/enums/role.enum';
import type { UserDocument } from 'src/user/user.schema';
import type { Request } from 'express';
import { GetTransactionsQueryDto } from '../dto/transaction/request/get-transactions.query.dto';
import { TransactionService } from '../services/transaction.service';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @ApiOperation({
    summary: 'Get current user transactions',
    description:
      'Returns paginated transactions with optional filters by currency, type, status, and session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions returned successfully',
  })
  @Roles([
    RolesEnum.USER,
    RolesEnum.FREELANCER,
    RolesEnum.CLIENT,
    RolesEnum.ADMIN,
  ])
  @Get('my')
  async getMyTransactions(
    @CurrentUser() currentUser: UserDocument,
    @Query(new ValidationPipe({ transform: true }))
    query: GetTransactionsQueryDto,
    @Req() request: Request,
  ) {
    return this.transactionService.getMyTransactions(
      currentUser.id,
      query,
      request,
    );
  }

  @ApiOperation({ summary: 'Get transaction details for current user' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction details returned successfully',
  })
  @Roles([
    RolesEnum.USER,
    RolesEnum.FREELANCER,
    RolesEnum.CLIENT,
    RolesEnum.ADMIN,
  ])
  @Get(':id')
  async getMyTransactionById(
    @CurrentUser() currentUser: UserDocument,
    @Param('id') id: string,
  ) {
    const transaction = await this.transactionService.getMyTransactionById(
      currentUser.id,
      id,
    );

    return {
      message: 'Transaction fetched successfully',
      data: transaction,
    };
  }

  @ApiOperation({
    summary: 'Get a lightweight transaction receipt for current user',
  })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction receipt returned successfully',
  })
  @Roles([
    RolesEnum.USER,
    RolesEnum.FREELANCER,
    RolesEnum.CLIENT,
    RolesEnum.ADMIN,
  ])
  @Get(':id/receipt')
  async getMyTransactionReceipt(
    @CurrentUser() currentUser: UserDocument,
    @Param('id') id: string,
  ) {
    const receipt = await this.transactionService.getMyTransactionReceipt(
      currentUser.id,
      id,
    );

    return {
      message: 'Receipt fetched successfully',
      data: receipt,
    };
  }
}
