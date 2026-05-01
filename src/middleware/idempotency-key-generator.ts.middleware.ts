import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IdempotencyKeyGeneratorTsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (!req.headers['idempotency-key']) {
      const newKey = uuidv4();
      req.headers['idempotency-key'] = newKey;
      console.log('🟢 Generated new Idempotency-Key:', newKey);
    }
    next();
  }
}
