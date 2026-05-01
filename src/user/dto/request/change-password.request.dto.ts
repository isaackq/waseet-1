import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ChangePasswordRequestDto {
  @ApiProperty({
    description: 'The current password of the user',
    example: 'password!1Q',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'The new password of the user',
    example: 'newPassword!1Q',
    type: String,
  })
  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;
}
