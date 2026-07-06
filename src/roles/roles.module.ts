import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesResolver } from './roles.resolver';
import { RolesRepository } from './role.repository';

@Module({
  providers: [RolesService, RolesResolver, RolesRepository],
})
export class RolesModule {}
