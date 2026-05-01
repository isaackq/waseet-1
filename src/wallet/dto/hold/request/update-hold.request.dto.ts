import { PartialType } from '@nestjs/swagger';
import { CreateHoldRequestDto } from './create-hold.request.dto';

export class UpdateHoldRequestDto extends PartialType(CreateHoldRequestDto) {}

