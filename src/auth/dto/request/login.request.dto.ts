import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class LogInDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'isaac@gmail.com',
    type: String,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'password!1Q',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'Whether to remember the current login session',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
