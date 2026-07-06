import { Module } from '@nestjs/common';
import { PermissionsModule } from '@permissions';
import { StorageModule } from '../storage/storage.module';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { UsersRepository } from './user.repository';

@Module({
  imports: [PermissionsModule, StorageModule],
  providers: [UsersResolver, UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
