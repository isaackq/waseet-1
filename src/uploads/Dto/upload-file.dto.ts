import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { fileTypesEnum } from '../enums/file-type.enum';

export class UploadFileDto {
  @ApiProperty({
    description: 'Document type',
    enum: fileTypesEnum,
  })
  @IsEnum(fileTypesEnum)
  @IsNotEmpty()
  type: fileTypesEnum;
}
