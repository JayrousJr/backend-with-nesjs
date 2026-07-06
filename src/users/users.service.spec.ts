import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@prisma';
import { PermissionsService } from '@permissions';
import { UsersService } from './users.service';
import { UsersRepository } from './user.repository';
import { StorageService } from '../storage/storage.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: PermissionsService, useValue: {} },
        { provide: StorageService, useValue: {} },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
