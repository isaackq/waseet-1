import { PartialType } from '@nestjs/swagger';
import { CreateFeeRequestDto } from './create-fee.request.dto';

export class UpdateFeeRequestDto extends PartialType(CreateFeeRequestDto) {}

