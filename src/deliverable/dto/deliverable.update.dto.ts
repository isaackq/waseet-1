import { PartialType, PickType } from '@nestjs/swagger';

import { DeliverableRequestDto } from './deliverable.request.dto copy';

export class UpdateDeliverableDto extends PartialType(
  PickType(DeliverableRequestDto, ['name', 'description', 'linkUrl'] as const),
) {}
