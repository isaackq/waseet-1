import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import type { Request } from 'express';
import { PaginationProvider } from 'src/common/pagination/providers/pagination.provider';
import { GetTransactionsQueryDto } from '../dto/transaction/request/get-transactions.query.dto';
import {
  Transaction,
  TransactionDocument,
} from '../schemas/transaction.schema';
import { TransactionStatusEnum } from '../enums/transaction-status.enum';
import { WalletService } from './wallet.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly walletService: WalletService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  async getMyTransactions(
    userId: string,
    query: GetTransactionsQueryDto,
    request: Request,
  ) {
    const { wallet, currencyDocument } =
      await this.walletService.resolveWalletByUserAndCurrency(
        userId,
        query.currency,
      );

    const filter: FilterQuery<TransactionDocument> = {
      walletId: wallet.id,
    };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.sessionId) {
      filter.sessionId = query.sessionId;
    }

    const paginatedTransactions =
      await this.paginationProvider.paginateMongooseQuery(
        {
          page: query.page,
          limit: query.limit,
        },
        this.transactionModel,
        filter,
        { createdAt: -1 },
        request,
      );
    console.log(userId);
    console.log('userId', userId);
    console.log('paginatedTransactions', paginatedTransactions);

    return {
      currency: currencyDocument.currencyName,
      ...paginatedTransactions,
      data: paginatedTransactions.data.map((transaction: any) => ({
        id: transaction._id,
        reference: `TX-${transaction._id.toString().slice(-8).toUpperCase()}`,
        amount: transaction.amount,
        currency: currencyDocument.currencyName,
        type: transaction.type.toUpperCase(),
        status: transaction.status ?? TransactionStatusEnum.COMPLETED,
        sessionId: transaction.sessionId ?? null,
        createdAt: transaction.createdAt,
        balanceAfter: {
          available: transaction.balanceAfterAvailable ?? null,
          held: transaction.balanceAfterHeld ?? null,
        },
      })),
    };
  }

  async getMyTransactionById(userId: string, transactionId: string) {
    const { wallet, currencyDocument } =
      await this.walletService.resolveWalletByUserAndCurrency(userId);

    const transaction = await this.transactionModel.findOne({
      _id: transactionId,
      // walletId: wallet.id,//need check that user pass it own transaction id
    });

    console.log('transaction', transaction);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      id: transaction._id,
      reference: `TX-${transaction.id.toString().slice(-8).toUpperCase()}`,
      amount: transaction.amount,
      currency: currencyDocument.currencyName,
      type: transaction.type.toUpperCase(),
      status: transaction.status ?? TransactionStatusEnum.COMPLETED,
      sessionId: transaction.sessionId ?? null,
      counterpartyWalletId: transaction.counterpartyWalletId ?? null,
      balanceAfter: {
        available: transaction.balanceAfterAvailable ?? null,
        held: transaction.balanceAfterHeld ?? null,
      },
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  async getMyTransactionReceipt(userId: string, transactionId: string) {
    const transaction = await this.getMyTransactionById(userId, transactionId);
    return {
      receiptNumber: `RCPT-${transaction.reference}`,
      transactionId: transaction.id,
      transactionReference: transaction.reference,
      issuedAt: new Date(),
      details: transaction,
    };
  }
}
