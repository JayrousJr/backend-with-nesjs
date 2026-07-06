import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Request } from 'express';
import { RequestContext, CurrentUser } from '../context/request-context'; // 👈 Adjust path as needed

@Injectable()
export class I18nSuccessInterceptor implements NestInterceptor {
  constructor(private readonly i18nService: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data) => {
        if (!data || typeof data.message !== 'string') {
          return data;
        }

        const isTranslationKey = data.message.startsWith('success.');

        if (isTranslationKey) {
          const lang =
            RequestContext.getUser()?.preferredLocale ??
            (req?.user as CurrentUser | undefined)?.preferredLocale ??
            I18nContext.current(context)?.lang ??
            'en';

          data.message = this.i18nService.translate(data.message, {
            lang,
            args: data.args || {},
          });

          if (data.args) delete data.args;
        }

        return data;
      }),
    );
  }
}
