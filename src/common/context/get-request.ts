import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request, Response } from 'express';

interface GqlContext {
  req: Request & { res: Response };
}

/**
 * Both REST controllers and GraphQL resolvers go through the same guards and
 * interceptors, but the underlying request lives in different places
 * depending on `context.getType()`. This normalizes access to it.
 */
export function getRequest(context: ExecutionContext): Request {
  if (context.getType() === 'http') {
    return context.switchToHttp().getRequest<Request>();
  }
  return GqlExecutionContext.create(context).getContext<GqlContext>().req;
}

export function getRequestResponse(context: ExecutionContext): {
  req: Record<string, any>;
  res: Record<string, any>;
} {
  if (context.getType() === 'http') {
    const http = context.switchToHttp();
    return {
      req: http.getRequest<Request>(),
      res: http.getResponse<Response>(),
    };
  }

  const { req } = GqlExecutionContext.create(context).getContext<GqlContext>();
  return { req, res: req.res };
}
