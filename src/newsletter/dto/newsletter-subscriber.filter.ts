import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Prisma } from '@db';
import { i18nValidationMessage } from 'nestjs-i18n';

@InputType()
export class NewsletterSubscriberFilterInput {
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  @Field(() => Boolean, { nullable: true })
  isActive?: boolean;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Field(() => String, { nullable: true })
  email?: string;
}

export function buildNewsletterSubscriberWhere(
  filter?: NewsletterSubscriberFilterInput,
): Prisma.NewsletterSubscriberWhereInput {
  return {
    ...(filter?.isActive !== undefined && { isActive: filter.isActive }),
    ...(filter?.email && {
      user: {
        email: { contains: filter.email, mode: 'insensitive' as const },
      },
    }),
  };
}
