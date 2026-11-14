import type { GroupKind, Tag, User } from '#lib/api.js';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      token: string | null;
    }
    interface PageData {
      tags?: Tag[];
      groupKinds?: GroupKind[];
      user?: User | null;
    }
  }
}

export {};
