import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ResetPasswordRequestDto {
  @ApiProperty({
    description: 'Password reset token from the email link',
    example: '1b8f6f8ed2f44d13a0d3f5a1f18ddf3a',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password',
    example: 'newPassword!1Q',
    type: String,
  })
  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;
}
