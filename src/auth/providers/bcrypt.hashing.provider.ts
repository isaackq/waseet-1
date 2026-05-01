import { Injectable } from '@nestjs/common';
import { HashingProviderInterface } from '../interfaces/hashing.provider.interface';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BcryptHashingProvider implements HashingProviderInterface {
  async hash(data: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(data, salt);
    return hash;
  }

  async compare(data: string, encrypted: string): Promise<boolean> {
    return await bcrypt.compare(data, encrypted);
  }
}
