import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class DeliverableRevisionRequestDto {
  @ApiProperty({
    description: 'Feedback/notes for revision',
    example: 'Please change the header color to blue and adjust the font size',
    minLength: 10,
    maxLength: 1000,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10, { message: 'Revision notes must be at least 10 characters' })
  @MaxLength(1000, {
    message: 'Revision notes must be at most 1000 characters',
  })
  revisionNotes: string;
}
