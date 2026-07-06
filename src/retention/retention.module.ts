import { Module } from '@nestjs/common';
import { AppConfigModule } from '@config';
import { StorageModule } from '../storage/storage.module';
import { RetentionService } from './retention.service';

@Module({
  imports: [AppConfigModule, StorageModule],
  providers: [RetentionService],
})
export class RetentionModule {}
