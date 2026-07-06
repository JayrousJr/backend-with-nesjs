import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma';
import { PermissionsService } from './permissions.service';
import { PermissionsResolver } from './permissions.resolver';

@Module({
  imports: [PrismaModule],
  providers: [PermissionsService, PermissionsResolver],
  exports: [PermissionsService],
})
export class PermissionsModule {}
