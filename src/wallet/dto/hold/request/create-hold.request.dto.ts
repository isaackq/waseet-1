import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { HoldStatusEnum } from 'src/wallet/enums/hold-status.enum';

export class CreateHoldRequestDto {
  @ApiProperty()
  @IsMongoId()
  payerWalletId: string;

  @ApiProperty()
  @IsMongoId()
  payeeWalletId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty()
  @IsMongoId()
  currencyId: string;

  @ApiProperty()
  @IsMongoId()
  sessionId: string;

  @ApiPropertyOptional({ enum: HoldStatusEnum })
  @IsOptional()
  @IsEnum(HoldStatusEnum)
  status?: HoldStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

