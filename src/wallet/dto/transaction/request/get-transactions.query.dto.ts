import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from 'src/common/pagination/dtos/pagination-query.dto';
import { CurrencyEnum } from 'src/wallet/enums/currency.enum';
import { TransactionStatusEnum } from 'src/wallet/enums/transaction-status.enum';
import { TransactionTypeEnum } from 'src/wallet/enums/transaction-type.enum';

export class GetTransactionsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: CurrencyEnum,
    default: CurrencyEnum.USD,
  })
  @IsOptional()
  @IsEnum(CurrencyEnum)
  currency?: CurrencyEnum = CurrencyEnum.USD;

  @ApiPropertyOptional({
    enum: TransactionTypeEnum,
  })
  @IsOptional()
  @IsEnum(TransactionTypeEnum)
  type?: TransactionTypeEnum;

  @ApiPropertyOptional({
    enum: TransactionStatusEnum,
  })
  @IsOptional()
  @IsEnum(TransactionStatusEnum)
  status?: TransactionStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;
}
