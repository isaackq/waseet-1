import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { CurrencySymbolEnum } from 'src/wallet/enums/currency-symbol.enum';
import { CurrencyEnum } from 'src/wallet/enums/currency.enum';

export class CurrencyRequestDto {
  @ApiProperty({
    description: 'Add currency name',
    example: 'USD',
    enum: CurrencyEnum,
    required: true,
  })
  @IsEnum(CurrencyEnum)
  currencyName: CurrencyEnum;

  @ApiProperty({
    description: 'Add currency symbol',
    example: '$',
    enum: CurrencySymbolEnum,
    required: true,
  })
  @IsEnum(CurrencySymbolEnum)
  symbol: CurrencySymbolEnum;

  @ApiProperty({
    description:
      'Number of decimal places used for this currency (e.g., 2 for USD, 8 for crypto)',
    example: 2,
    minimum: 0,
    maximum: 8,
    required: true,
  })
  @IsInt()
  @Min(0)
  @Max(8)
  decimalPlaces: number;
}
