import { RequestContext } from '@common/context/request-context';
import { Prisma, PrismaClient } from '@db';
import {
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';

export abstract class BaseRepository {
  protected abstract get delegate(): {
    update(args: Record<string, unknown>): Promise<unknown>;
  };

  protected handleError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          throw new NotFoundException('Record not found');

        case 'P2002':
          throw new ConflictException('Record already exists');

        case 'P2003':
          throw new ConflictException('Related record not found');

        default:
          throw new InternalServerErrorException(
            `Database error: ${error.code}`,
          );
      }
    }
    throw error;
  }

  protected async execute<T>(operation: Promise<T>): Promise<T> {
    try {
      return await operation;
    } catch (error) {
      this.handleError(error);
    }
  }

  protected async transaction<T>(
    prisma: PrismaClient,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await prisma.$transaction(fn);
    } catch (error) {
      this.handleError(error);
    }
  }

  protected paginate(params?: { page?: number; limit?: number }) {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(100, params?.limit ?? 10);

    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }

  async softDelete(uniqueId: string): Promise<void> {
    const deletedById = RequestContext.getUserId();
    await this.execute(
      this.delegate.update({
        where: { uniqueId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          ...(deletedById ? { deletedById } : {}),
        },
      }),
    );
  }

  async restore(uniqueId: string): Promise<void> {
    await this.execute(
      this.delegate.update({
        where: { uniqueId },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedById: null,
        },
      }),
    );
  }

  async activate(uniqueId: string): Promise<void> {
    await this.execute(
      this.delegate.update({
        where: { uniqueId },
        data: { isActive: true },
      }),
    );
  }

  async deactivate(uniqueId: string): Promise<void> {
    await this.execute(
      this.delegate.update({
        where: { uniqueId },
        data: { isActive: false },
      }),
    );
  }
}
