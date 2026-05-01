import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsDateString,
  MaxLength,
  MinLength,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OperationType } from '../enums/operation-type.enum';
import { CurrencyEnum } from 'src/wallet/enums/currency.enum';
import type { Decimal128 } from 'mongoose';
import { DeliverableType } from 'src/deliverable/enums/deliverable-type.enum';

export class SessionRequestDto {
  @ApiProperty({
    description: 'Email or identification name of the client',
    example: 'client@example.com',
  })
  @IsNotEmpty()
  @IsString()
  user2EmailOrIdentificationName: string;

  // @ApiProperty({
  //   description: 'Type of operation',
  //   enum: OperationType,
  //   example: OperationType.FREELANCER_PREPAY,
  // })
  // @IsNotEmpty()
  // @IsEnum(OperationType)
  // operationType: OperationType;

  @ApiProperty({
    description: 'Project amount (in major units, e.g., dollars)',
    example: 100.5,
    minimum: 10,
    maximum: 10000,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10, { message: 'Minimum amount is 10' })
  @Max(10000, { message: 'Maximum amount is 10,000' })
  amount: Decimal128;

  @ApiProperty({
    description: 'Currency code',
    enum: CurrencyEnum,
    example: CurrencyEnum.USD,
  })
  @IsNotEmpty()
  @IsEnum(CurrencyEnum)
  currency: CurrencyEnum;

  @ApiProperty({
    description: 'Project title',
    example: 'Build a mobile app for food delivery with React Native',
    minLength: 50,
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10, { message: 'title must be at least 50 characters' })
  @MaxLength(500, { message: 'title cannot exceed 2000 characters' })
  title: string;

  @ApiProperty({
    description: 'Project description/summary',
    example: 'Build a mobile app for food delivery with React Native',
    minLength: 50,
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10, { message: 'description must be at least 50 characters' })
  @MaxLength(2000, { message: 'description cannot exceed 2000 characters' })
  description: string;

  @ApiProperty({
    description: 'Project deadline (ISO 8601 format)',
    example: '2025-12-31T23:59:59',
  })
  @IsNotEmpty()
  @IsDateString()
  deadline: string;

  @ApiProperty({
    description: 'Agreed deliverable type for this session',
    enum: DeliverableType,
    example: DeliverableType.DOCUMENT,
  })
  @IsNotEmpty()
  @IsEnum(DeliverableType)
  deliverableType: DeliverableType;

  @ApiProperty({
    description: 'Duration in minutes (optional)',
    example: 2880,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;
}
