import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

export const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (typeof (value as any).toString === 'function') {
    return Number((value as any).toString());
  }
  return Number(value);
};

export const toD128 = (value: number): Types.Decimal128 => {
  if (!Number.isFinite(value)) {
    throw new BadRequestException('Amount must be a finite number');
  }
  return Types.Decimal128.fromString(String(value));
};

export const roundTo = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals); //تحديد لاقرب 2 او اقرب 3 يعني 100 او 1000
  return Math.round(value * factor) / factor;
};
