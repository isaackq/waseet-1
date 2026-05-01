import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileRequestDto {
  @ApiPropertyOptional({ example: 'isaac', type: String })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'kamel', type: String })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({ example: 'eqdaih', type: String })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'isaac-kamel',
    description: 'Unique identification for the user',
    type: String,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim().toLowerCase())
  @Matches(/^\S+$/, { message: 'identificationName must not contain spaces' })
  @MaxLength(20)
  @MinLength(3)
  identificationName?: string;

  @ApiPropertyOptional({ example: 'isaac@gmail.com', type: String })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '+972597641331',
    type: String,
  })
  @IsOptional()
  @Matches(/^(?:\+?970|\+?972|00970|00972)(59|56)\d{7}$/, {
    message:
      'Phone number must be a valid Palestinian number (e.g. +97059xxxxxxx or 0097256xxxxxxx)',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '1999-12-13', type: Date })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  birthday?: Date;

  @ApiPropertyOptional({ example: 'Gaza', type: String })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Country code in ISO 3166-1 alpha-2 format',
    example: 'US',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  countryCode?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Optional profile avatar',
  })
  @IsOptional()
  avatar?: any;
}
