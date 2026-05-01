import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveDisputeByAdminDto {
  @ApiProperty({
    description: 'Admin decision summary for the dispute',
    example: 'Evidence supports the client claim.',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  adminDecision: string;

  @ApiProperty({
    description: 'Final resolution text shown on the dispute',
    example: 'Refund approved and dispute closed.',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  resolution: string;
}

export class RejectDisputeByAdminDto {
  @ApiProperty({
    description: 'Admin decision summary for rejecting the dispute',
    example: 'Submitted evidence does not support the claim.',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  adminDecision: string;

  @ApiPropertyOptional({
    description: 'Optional rejection resolution shown on the dispute',
    example: 'Dispute rejected and original deliverable stands.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolution?: string;
}
