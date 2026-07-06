import { BaseEntity } from '@common';
import {
  ObjectType,
  Field,
  HideField,
  registerEnumType,
} from '@nestjs/graphql';
import { CampaignRecipientStatus } from '@db';

registerEnumType(CampaignRecipientStatus, { name: 'CampaignRecipientStatus' });

@ObjectType()
export class CampaignRecipientEntity extends BaseEntity {
  @Field(() => CampaignRecipientStatus)
  status: CampaignRecipientStatus;

  @Field(() => Date, { nullable: true })
  sentAt?: Date | null;

  @Field(() => String, { nullable: true })
  error?: string | null;

  @HideField()
  subscriberId: number;

  @Field(() => String, { description: 'Recipient email (via subscriber)' })
  subscriberEmail?: string;

  @Field(() => String, { description: 'Recipient first name' })
  subscriberFirstName?: string;

  @Field(() => String, { description: 'Recipient last name' })
  subscriberLastName?: string;
}
