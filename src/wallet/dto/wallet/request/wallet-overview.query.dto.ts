import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CurrencyEnum } from 'src/wallet/enums/currency.enum';

export class WalletOverviewQueryDto {
  @ApiPropertyOptional({
    enum: CurrencyEnum,
    default: CurrencyEnum.USD,
  })
  @IsOptional()
  @IsEnum(CurrencyEnum)
  currency?: CurrencyEnum = CurrencyEnum.USD;
}
