import { AsyncLocalStorage } from 'async_hooks';

export interface CurrentUser {
  id: number;
  uniqueId: string;
  email: string;
  role: string;
  preferredLocale: string;
  tenantId?: string;
}

interface Context {
  user?: CurrentUser;
  requestId?: string;
}

const storage = new AsyncLocalStorage<Context>();

export const RequestContext = {
  run: (ctx: Context, fn: () => void) => storage.run(ctx, fn),
  get: (): Context | undefined => storage.getStore(),
  getUser: (): CurrentUser | undefined => storage.getStore()?.user,
  // Internal numeric id — matches the createdById/updatedById/deletedById columns.
  getUserId: (): number | undefined => storage.getStore()?.user?.id,
  getUserUniqueId: (): string | undefined => storage.getStore()?.user?.uniqueId,
  getRequestId: (): string | undefined => storage.getStore()?.requestId,
};
