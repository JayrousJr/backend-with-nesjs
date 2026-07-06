import { BaseEntity } from '@common';
import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { CampaignStatus } from '@db';

registerEnumType(CampaignStatus, { name: 'CampaignStatus' });

@ObjectType()
export class CampaignEntity extends BaseEntity {
  @Field(() => String)
  subject: string;

  @Field(() => String)
  bodyHtml: string;

  @Field(() => String)
  bodyText: string;

  @Field(() => CampaignStatus)
  status: CampaignStatus;

  @Field(() => Date, { nullable: true })
  scheduledAt?: Date | null;

  @Field(() => Date, { nullable: true })
  sentAt?: Date | null;

  @Field(() => Int)
  recipientCount: number;
}
