import { ApiProperty } from '@nestjs/swagger';
import { CurrencySymbolEnum } from 'src/wallet/enums/currency-symbol.enum';
import { CurrencyEnum } from 'src/wallet/enums/currency.enum';
import { CurrencyDocument } from 'src/wallet/schemas/currency.schema';

export class CurrencyResponseDto {
  @ApiProperty({
    description: 'Add currency name',
    example: 'USD',
    enum: CurrencyEnum,
  })
  currencyName: CurrencyEnum;

  @ApiProperty({
    description: 'Add currency symbol',
    example: '$',
    enum: CurrencySymbolEnum,
  })
  symbol: CurrencySymbolEnum;

  @ApiProperty({
    description:
      'Number of decimal places used for this currency (e.g., 2 for USD, 8 for crypto)',
    example: 2,
    minimum: 0,
    maximum: 8,
    required: true,
  })
  decimalPlaces: number;

  @ApiProperty({
    description: 'Is currency active',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  static createFromDocument(currencyDocument: CurrencyDocument): CurrencyResponseDto {
    const currencyResponseDto = new CurrencyResponseDto();
    currencyResponseDto.currencyName = currencyDocument.currencyName;
    currencyResponseDto.symbol = currencyDocument.symbol;
    currencyResponseDto.decimalPlaces = currencyDocument.decimalPlaces;
    currencyResponseDto.isActive = currencyDocument.isActive;
    return currencyResponseDto;
  }
}
