import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser as CurrentUserData } from '../context/request-context';
import { getRequest } from '../context/get-request';

export const AuthUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserData => {
    return getRequest(context).user as CurrentUserData;
  },
);
