import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@db';
import { AppConfigService } from '@config';
import {
  applyBaseModelExtension,
  ExtendedPrismaClient,
} from './extensions/base-model.extension';

const SLOW_QUERY_MS = 200;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;
  private readonly base: InstanceType<typeof PrismaClient>;

  // default client — soft delete filtered, auto-user injection
  readonly db: ExtendedPrismaClient;

  // bypass all extensions — for restores, admin queries, migrations
  readonly dbRaw: InstanceType<typeof PrismaClient>;

  constructor(config: AppConfigService) {
    this.pool = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
    });
    this.pool.on('connect', (client) => {
      void client.query("SET timezone = 'UTC'");
    });
    const client = new PrismaClient({
      adapter: new PrismaPg(this.pool),
      log: [{ emit: 'event', level: 'query' }],
    });
    client.$on('query', (e) => {
      if (e.duration >= SLOW_QUERY_MS) {
        this.logger.warn(
          `Slow query ${e.duration}ms: ${e.query.slice(0, 300)}`,
        );
      }
    });
    this.base = client;
    this.db = applyBaseModelExtension(this.base);
    this.dbRaw = this.base;
  }

  async onModuleInit() {
    await this.base.$connect();
  }

  async onModuleDestroy() {
    await this.base.$disconnect();
    await this.pool.end();
  }

  async healthCheck(): Promise<boolean> {
    await this.base.$queryRaw`SELECT 1`;
    return true;
  }
}
