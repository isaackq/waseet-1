import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { fileTypesEnum } from '../enums/file-type.enum';

export class UploadFileTypeDto {
  @ApiProperty({
    description: 'Document type',
    enum: fileTypesEnum,
  })
  @IsEnum(fileTypesEnum)
  @IsOptional()
  type?: fileTypesEnum;
}
