import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNumber, IsOptional } from 'class-validator';
import { FeeStatusEnum } from 'src/wallet/enums/fee-status.enum';

export class CreateFeeRequestDto {
  @ApiProperty()
  @IsMongoId()
  sessionId: string;

  @ApiProperty()
  @IsMongoId()
  userWalletId: string;

  @ApiProperty()
  @IsMongoId()
  currencyId: string;

  @ApiProperty()
  @IsNumber()
  percentage: number;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ enum: FeeStatusEnum })
  @IsOptional()
  @IsEnum(FeeStatusEnum)
  status?: FeeStatusEnum;
}

