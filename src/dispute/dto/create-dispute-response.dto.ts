import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDisputeResponseDto {
  @ApiProperty({
    description: 'Reply message in the dispute thread',
    example: 'The delivered file matches the approved scope. Please review page 3.',
    maxLength: 2000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  message: string;
}
