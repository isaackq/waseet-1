import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_: unknown, contex: ExecutionContext) => {
    const request = contex.switchToHttp().getRequest();
    return request.user;
  },
);
