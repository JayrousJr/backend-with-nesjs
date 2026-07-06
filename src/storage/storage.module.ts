import { Module } from '@nestjs/common';
import { AppConfigModule, AppConfigService } from '@config';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { StorageResolver } from './storage.resolver';
import { StorageRepository } from './storage.repository';
import { STORAGE_DRIVER } from './storage.constants';
import { StorageDriver } from './drivers/storage-driver.interface';
import { LocalStorageDriver } from './drivers/local.driver';
import { S3StorageDriver } from './drivers/s3.driver';

@Module({
  imports: [AppConfigModule],
  controllers: [StorageController],
  providers: [
    StorageService,
    StorageResolver,
    StorageRepository,
    {
      provide: STORAGE_DRIVER,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): StorageDriver => {
        if (config.storage.driver === 's3') {
          return new S3StorageDriver(config);
        }
        return new LocalStorageDriver();
      },
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
