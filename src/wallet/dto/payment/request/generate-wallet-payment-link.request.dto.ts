import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class GenerateWalletPaymentLinkRequestDto {
  @ApiProperty({
    description: 'Target wallet id to top up',
  })
  @IsMongoId()
  walletId: string;

  @ApiProperty({
    description: 'Amount in major unit (e.g. USD)',
    example: 120.5,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @ApiPropertyOptional({
    description: 'Override success redirect URL',
  })
  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'Override cancel redirect URL',
  })
  @IsOptional()
  @IsUrl()
  cancelUrl?: string;
}
