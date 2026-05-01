import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserRequestDto {
  @ApiProperty({
    example: 'isaac',
    description: 'first name of the user',
    required: true,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'kamel',
    description: 'middle name of the user',
    required: true,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  middleName: string;

  @ApiProperty({
    example: 'eqdaih',
    description: 'last name of the user',
    required: true,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'isaac-kamel',
    description: 'uniqe identification for the user',
    required: true,
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase()) // 👈 remove spaces before/after
  @Matches(/^\S+$/, { message: 'identificationName must not contain spaces' })
  @MaxLength(20)
  @MinLength(3)
  identificationName: string;

  @ApiProperty({
    example: 'isaac@gmail.com',
    description: 'email of the user',
    required: true,
    type: String,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+972597641331',
    description: 'email of the user',
    required: true,
    type: String,
  })
  @Matches(/^(?:\+?970|\+?972|00970|00972)(59|56)\d{7}$/, {
    message:
      'Phone number must be a valid Palestinian number (e.g. +97059xxxxxxx or 0097256xxxxxxx)',
  })
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    example: 'password!1Q',
    description: 'The password of the User',
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    example: '1999-12-13',
    description: 'The birthday of the User',
    required: true,
    type: Date,
  })
  @IsDate()
  @Type(() => Date)
  birthday: Date;

  @ApiProperty({
    example: 'Gaza',
    description: 'The country address of the user',
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    type: String,
    description: 'Country code in ISO 3166-1 alpha-2 format',
    example: 'US',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  countryCode: string;
}
