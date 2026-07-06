import { Resolver, Query } from '@nestjs/graphql';
import { I18nService } from 'nestjs-i18n';
import { Public } from '../decorators/public.decorator';

@Resolver()
export class LocaleResolver {
  constructor(private readonly i18n: I18nService) {}

  @Public()
  @Query(() => [String], {
    name: 'getSupportedLocales',
    description: 'Returns the list of locales the backend supports',
  })
  getSupportedLocales(): string[] {
    return this.i18n.getSupportedLanguages();
  }
}
