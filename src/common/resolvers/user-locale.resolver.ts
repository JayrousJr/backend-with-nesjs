import { ExecutionContext, Injectable } from '@nestjs/common';
import { I18nResolver } from 'nestjs-i18n';
import { RequestContext } from '../context/request-context';

@Injectable()
export class UserLocaleResolver implements I18nResolver {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resolve(_context: ExecutionContext): string | undefined {
    return RequestContext.getUser()?.preferredLocale;
  }
}
