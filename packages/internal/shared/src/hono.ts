// @ts-nocheck
import { HttpBindings } from "@hono/node-server";
import "@hono/zod-openapi";
import * as zod110 from "zod";
import { z as z$1 } from "zod";
import * as better_auth771 from "better-auth";
import { BetterAuthOptions } from "better-auth";
import * as better_auth_plugins857 from "better-auth/plugins";
import * as better_call87 from "better-call";
import Stripe from "stripe";
import * as drizzle_orm_pg_core100 from "drizzle-orm/pg-core";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import * as drizzle_orm142 from "drizzle-orm";
import { InferInsertModel, InferSelectModel, SQL } from "drizzle-orm";
import * as zod_v490 from "zod/v4";
import * as ai43 from "ai";
import * as hono_utils_http_status0 from "hono/utils/http-status";
import * as hono_types2 from "hono/types";
import * as hono_hono_base42 from "hono/hono-base";
import * as zod_v4_core91 from "zod/v4/core";

//#region src/types/env.d.ts
type Env = {
  Bindings: HttpBindings;
};
//#endregion
//#region src/schema/achievements.d.ts
declare const achievements: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "achievements";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "achievements";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "achievements";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    type: drizzle_orm_pg_core100.PgColumn<{
      name: "type";
      tableName: "achievements";
      dataType: "string";
      columnType: "PgText";
      data: "checking" | "completed" | "incomplete" | "audit" | "received";
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: ["checking", "completed", "incomplete", "audit", "received"];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    actionId: drizzle_orm_pg_core100.PgColumn<{
      name: "action_id";
      tableName: "achievements";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    progress: drizzle_orm_pg_core100.PgColumn<{
      name: "progress";
      tableName: "achievements";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    progressMax: drizzle_orm_pg_core100.PgColumn<{
      name: "progress_max";
      tableName: "achievements";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    done: drizzle_orm_pg_core100.PgColumn<{
      name: "done";
      tableName: "achievements";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    doneAt: drizzle_orm_pg_core100.PgColumn<{
      name: "done_at";
      tableName: "achievements";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    tx: drizzle_orm_pg_core100.PgColumn<{
      name: "tx";
      tableName: "achievements";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const achievementsOpenAPISchema: zod110.ZodObject<{
  id: zod110.ZodString;
  userId: zod110.ZodString;
  type: zod110.ZodEnum<["checking", "completed", "incomplete", "audit", "received"]>;
  actionId: zod110.ZodNumber;
  progress: zod110.ZodNumber;
  progressMax: zod110.ZodNumber;
  done: zod110.ZodBoolean;
  doneAt: zod110.ZodNullable<zod110.ZodString>;
  tx: zod110.ZodNullable<zod110.ZodString>;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  id: string;
  userId: string;
  type: "checking" | "completed" | "incomplete" | "audit" | "received";
  actionId: number;
  progress: number;
  progressMax: number;
  done: boolean;
  doneAt: string | null;
  tx: string | null;
}, {
  id: string;
  userId: string;
  type: "checking" | "completed" | "incomplete" | "audit" | "received";
  actionId: number;
  progress: number;
  progressMax: number;
  done: boolean;
  doneAt: string | null;
  tx: string | null;
}>;
//#endregion
//#region src/schema/actions.d.ts
declare const languageSchema: z$1.ZodEnum<["en", "ja", "zh-CN", "zh-TW"]>;
declare const conditionItemSchema: z$1.ZodObject<{
  field: z$1.ZodEnum<["view", "title", "site_url", "feed_url", "category", "entry_title", "entry_content", "entry_url", "entry_author", "entry_media_length", "entry_attachments_duration", "status"]>;
  operator: z$1.ZodEnum<["contains", "not_contains", "eq", "not_eq", "gt", "lt", "regex"]>;
  value: z$1.ZodString;
}, "strip", z$1.ZodTypeAny, {
  value: string;
  field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
  operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
}, {
  value: string;
  field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
  operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
}>;
type ConditionItem = z$1.infer<typeof conditionItemSchema>;
declare const actions: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "actions";
  schema: undefined;
  columns: {
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "actions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "created_at";
      tableName: "actions";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    updatedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "updated_at";
      tableName: "actions";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    rules: drizzle_orm_pg_core100.PgColumn<{
      name: "rules";
      tableName: "actions";
      dataType: "json";
      columnType: "PgJsonb";
      data: {
        name: string;
        condition: {
          value: string;
          field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
          operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
        }[] | {
          value: string;
          field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
          operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
        }[][];
        result: {
          disabled?: boolean | undefined;
          translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
          summary?: boolean | undefined;
          readability?: boolean | undefined;
          sourceContent?: boolean | undefined;
          silence?: boolean | undefined;
          block?: boolean | undefined;
          star?: boolean | undefined;
          newEntryNotification?: boolean | undefined;
          rewriteRules?: {
            from: string;
            to: string;
          }[] | undefined;
          blockRules?: {
            value: string | number;
            field: "title" | "content" | "all" | "author" | "url" | "order";
            operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
          }[] | undefined;
          webhooks?: string[] | undefined;
        };
      }[];
      driverParam: unknown;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      $type: {
        name: string;
        condition: {
          value: string;
          field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
          operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
        }[] | {
          value: string;
          field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
          operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
        }[][];
        result: {
          disabled?: boolean | undefined;
          translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
          summary?: boolean | undefined;
          readability?: boolean | undefined;
          sourceContent?: boolean | undefined;
          silence?: boolean | undefined;
          block?: boolean | undefined;
          star?: boolean | undefined;
          newEntryNotification?: boolean | undefined;
          rewriteRules?: {
            from: string;
            to: string;
          }[] | undefined;
          blockRules?: {
            value: string | number;
            field: "title" | "content" | "all" | "author" | "url" | "order";
            operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
          }[] | undefined;
          webhooks?: string[] | undefined;
        };
      }[];
    }>;
  };
  dialect: "pg";
}>;
declare const actionsItemOpenAPISchema: z$1.ZodObject<{
  name: z$1.ZodString;
  condition: z$1.ZodUnion<[z$1.ZodArray<z$1.ZodObject<{
    field: z$1.ZodEnum<["view", "title", "site_url", "feed_url", "category", "entry_title", "entry_content", "entry_url", "entry_author", "entry_media_length", "entry_attachments_duration", "status"]>;
    operator: z$1.ZodEnum<["contains", "not_contains", "eq", "not_eq", "gt", "lt", "regex"]>;
    value: z$1.ZodString;
  }, "strip", z$1.ZodTypeAny, {
    value: string;
    field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
    operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
  }, {
    value: string;
    field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
    operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
  }>, "many">, z$1.ZodArray<z$1.ZodArray<z$1.ZodObject<{
    field: z$1.ZodEnum<["view", "title", "site_url", "feed_url", "category", "entry_title", "entry_content", "entry_url", "entry_author", "entry_media_length", "entry_attachments_duration", "status"]>;
    operator: z$1.ZodEnum<["contains", "not_contains", "eq", "not_eq", "gt", "lt", "regex"]>;
    value: z$1.ZodString;
  }, "strip", z$1.ZodTypeAny, {
    value: string;
    field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
    operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
  }, {
    value: string;
    field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
    operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
  }>, "many">, "many">]>;
  result: z$1.ZodObject<{
    disabled: z$1.ZodOptional<z$1.ZodBoolean>;
    translation: z$1.ZodOptional<z$1.ZodUnion<[z$1.ZodEnum<["en", "ja", "zh-CN", "zh-TW"]>, z$1.ZodBoolean]>>;
    summary: z$1.ZodOptional<z$1.ZodBoolean>;
    readability: z$1.ZodOptional<z$1.ZodBoolean>;
    sourceContent: z$1.ZodOptional<z$1.ZodBoolean>;
    silence: z$1.ZodOptional<z$1.ZodBoolean>;
    block: z$1.ZodOptional<z$1.ZodBoolean>;
    star: z$1.ZodOptional<z$1.ZodBoolean>;
    newEntryNotification: z$1.ZodOptional<z$1.ZodBoolean>;
    rewriteRules: z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
      from: z$1.ZodString;
      to: z$1.ZodString;
    }, "strip", z$1.ZodTypeAny, {
      from: string;
      to: string;
    }, {
      from: string;
      to: string;
    }>, "many">>;
    blockRules: z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
      field: z$1.ZodEnum<["all", "title", "content", "author", "url", "order"]>;
      operator: z$1.ZodEnum<["contains", "not_contains", "eq", "not_eq", "gt", "lt", "regex"]>;
      value: z$1.ZodUnion<[z$1.ZodString, z$1.ZodNumber]>;
    }, "strip", z$1.ZodTypeAny, {
      value: string | number;
      field: "title" | "content" | "all" | "author" | "url" | "order";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }, {
      value: string | number;
      field: "title" | "content" | "all" | "author" | "url" | "order";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }>, "many">>;
    webhooks: z$1.ZodOptional<z$1.ZodArray<z$1.ZodString, "many">>;
  }, "strip", z$1.ZodTypeAny, {
    disabled?: boolean | undefined;
    translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
    summary?: boolean | undefined;
    readability?: boolean | undefined;
    sourceContent?: boolean | undefined;
    silence?: boolean | undefined;
    block?: boolean | undefined;
    star?: boolean | undefined;
    newEntryNotification?: boolean | undefined;
    rewriteRules?: {
      from: string;
      to: string;
    }[] | undefined;
    blockRules?: {
      value: string | number;
      field: "title" | "content" | "all" | "author" | "url" | "order";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }[] | undefined;
    webhooks?: string[] | undefined;
  }, {
    disabled?: boolean | undefined;
    translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
    summary?: boolean | undefined;
    readability?: boolean | undefined;
    sourceContent?: boolean | undefined;
    silence?: boolean | undefined;
    block?: boolean | undefined;
    star?: boolean | undefined;
    newEntryNotification?: boolean | undefined;
    rewriteRules?: {
      from: string;
      to: string;
    }[] | undefined;
    blockRules?: {
      value: string | number;
      field: "title" | "content" | "all" | "author" | "url" | "order";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }[] | undefined;
    webhooks?: string[] | undefined;
  }>;
}, "strip", z$1.ZodTypeAny, {
  name: string;
  condition: {
    value: string;
    field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
    operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
  }[] | {
    value: string;
    field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
    operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
  }[][];
  result: {
    disabled?: boolean | undefined;
    translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
    summary?: boolean | undefined;
    readability?: boolean | undefined;
    sourceContent?: boolean | undefined;
    silence?: boolean | undefined;
    block?: boolean | undefined;
    star?: boolean | undefined;
    newEntryNotification?: boolean | undefined;
    rewriteRules?: {
      from: string;
      to: string;
    }[] | undefined;
    blockRules?: {
      value: string | number;
      field: "title" | "content" | "all" | "author" | "url" | "order";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }[] | undefined;
    webhooks?: string[] | undefined;
  };
}, {
  name: string;
  condition: {
    value: string;
    field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
    operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
  }[] | {
    value: string;
    field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
    operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
  }[][];
  result: {
    disabled?: boolean | undefined;
    translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
    summary?: boolean | undefined;
    readability?: boolean | undefined;
    sourceContent?: boolean | undefined;
    silence?: boolean | undefined;
    block?: boolean | undefined;
    star?: boolean | undefined;
    newEntryNotification?: boolean | undefined;
    rewriteRules?: {
      from: string;
      to: string;
    }[] | undefined;
    blockRules?: {
      value: string | number;
      field: "title" | "content" | "all" | "author" | "url" | "order";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }[] | undefined;
    webhooks?: string[] | undefined;
  };
}>;
type ActionItem = z$1.infer<typeof actionsItemOpenAPISchema>;
declare const actionsOpenAPISchema: z$1.ZodObject<Omit<{
  userId: z$1.ZodString;
  createdAt: z$1.ZodNullable<z$1.ZodString>;
  updatedAt: z$1.ZodNullable<z$1.ZodString>;
  rules: z$1.ZodNullable<z$1.ZodType<string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null, z$1.ZodTypeDef, string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null>>;
}, "rules"> & {
  rules: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
    name: z$1.ZodString;
    condition: z$1.ZodUnion<[z$1.ZodArray<z$1.ZodObject<{
      field: z$1.ZodEnum<["view", "title", "site_url", "feed_url", "category", "entry_title", "entry_content", "entry_url", "entry_author", "entry_media_length", "entry_attachments_duration", "status"]>;
      operator: z$1.ZodEnum<["contains", "not_contains", "eq", "not_eq", "gt", "lt", "regex"]>;
      value: z$1.ZodString;
    }, "strip", z$1.ZodTypeAny, {
      value: string;
      field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }, {
      value: string;
      field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }>, "many">, z$1.ZodArray<z$1.ZodArray<z$1.ZodObject<{
      field: z$1.ZodEnum<["view", "title", "site_url", "feed_url", "category", "entry_title", "entry_content", "entry_url", "entry_author", "entry_media_length", "entry_attachments_duration", "status"]>;
      operator: z$1.ZodEnum<["contains", "not_contains", "eq", "not_eq", "gt", "lt", "regex"]>;
      value: z$1.ZodString;
    }, "strip", z$1.ZodTypeAny, {
      value: string;
      field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }, {
      value: string;
      field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }>, "many">, "many">]>;
    result: z$1.ZodObject<{
      disabled: z$1.ZodOptional<z$1.ZodBoolean>;
      translation: z$1.ZodOptional<z$1.ZodUnion<[z$1.ZodEnum<["en", "ja", "zh-CN", "zh-TW"]>, z$1.ZodBoolean]>>;
      summary: z$1.ZodOptional<z$1.ZodBoolean>;
      readability: z$1.ZodOptional<z$1.ZodBoolean>;
      sourceContent: z$1.ZodOptional<z$1.ZodBoolean>;
      silence: z$1.ZodOptional<z$1.ZodBoolean>;
      block: z$1.ZodOptional<z$1.ZodBoolean>;
      star: z$1.ZodOptional<z$1.ZodBoolean>;
      newEntryNotification: z$1.ZodOptional<z$1.ZodBoolean>;
      rewriteRules: z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
        from: z$1.ZodString;
        to: z$1.ZodString;
      }, "strip", z$1.ZodTypeAny, {
        from: string;
        to: string;
      }, {
        from: string;
        to: string;
      }>, "many">>;
      blockRules: z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
        field: z$1.ZodEnum<["all", "title", "content", "author", "url", "order"]>;
        operator: z$1.ZodEnum<["contains", "not_contains", "eq", "not_eq", "gt", "lt", "regex"]>;
        value: z$1.ZodUnion<[z$1.ZodString, z$1.ZodNumber]>;
      }, "strip", z$1.ZodTypeAny, {
        value: string | number;
        field: "title" | "content" | "all" | "author" | "url" | "order";
        operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
      }, {
        value: string | number;
        field: "title" | "content" | "all" | "author" | "url" | "order";
        operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
      }>, "many">>;
      webhooks: z$1.ZodOptional<z$1.ZodArray<z$1.ZodString, "many">>;
    }, "strip", z$1.ZodTypeAny, {
      disabled?: boolean | undefined;
      translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
      summary?: boolean | undefined;
      readability?: boolean | undefined;
      sourceContent?: boolean | undefined;
      silence?: boolean | undefined;
      block?: boolean | undefined;
      star?: boolean | undefined;
      newEntryNotification?: boolean | undefined;
      rewriteRules?: {
        from: string;
        to: string;
      }[] | undefined;
      blockRules?: {
        value: string | number;
        field: "title" | "content" | "all" | "author" | "url" | "order";
        operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
      }[] | undefined;
      webhooks?: string[] | undefined;
    }, {
      disabled?: boolean | undefined;
      translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
      summary?: boolean | undefined;
      readability?: boolean | undefined;
      sourceContent?: boolean | undefined;
      silence?: boolean | undefined;
      block?: boolean | undefined;
      star?: boolean | undefined;
      newEntryNotification?: boolean | undefined;
      rewriteRules?: {
        from: string;
        to: string;
      }[] | undefined;
      blockRules?: {
        value: string | number;
        field: "title" | "content" | "all" | "author" | "url" | "order";
        operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
      }[] | undefined;
      webhooks?: string[] | undefined;
    }>;
  }, "strip", z$1.ZodTypeAny, {
    name: string;
    condition: {
      value: string;
      field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }[] | {
      value: string;
      field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }[][];
    result: {
      disabled?: boolean | undefined;
      translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
      summary?: boolean | undefined;
      readability?: boolean | undefined;
      sourceContent?: boolean | undefined;
      silence?: boolean | undefined;
      block?: boolean | undefined;
      star?: boolean | undefined;
      newEntryNotification?: boolean | undefined;
      rewriteRules?: {
        from: string;
        to: string;
      }[] | undefined;
      blockRules?: {
        value: string | number;
        field: "title" | "content" | "all" | "author" | "url" | "order";
        operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
      }[] | undefined;
      webhooks?: string[] | undefined;
    };
  }, {
    name: string;
    condition: {
      value: string;
      field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }[] | {
      value: string;
      field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }[][];
    result: {
      disabled?: boolean | undefined;
      translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
      summary?: boolean | undefined;
      readability?: boolean | undefined;
      sourceContent?: boolean | undefined;
      silence?: boolean | undefined;
      block?: boolean | undefined;
      star?: boolean | undefined;
      newEntryNotification?: boolean | undefined;
      rewriteRules?: {
        from: string;
        to: string;
      }[] | undefined;
      blockRules?: {
        value: string | number;
        field: "title" | "content" | "all" | "author" | "url" | "order";
        operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
      }[] | undefined;
      webhooks?: string[] | undefined;
    };
  }>, "many">>>;
}, "strip", z$1.ZodTypeAny, {
  createdAt: string | null;
  updatedAt: string | null;
  userId: string;
  rules?: {
    name: string;
    condition: {
      value: string;
      field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }[] | {
      value: string;
      field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }[][];
    result: {
      disabled?: boolean | undefined;
      translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
      summary?: boolean | undefined;
      readability?: boolean | undefined;
      sourceContent?: boolean | undefined;
      silence?: boolean | undefined;
      block?: boolean | undefined;
      star?: boolean | undefined;
      newEntryNotification?: boolean | undefined;
      rewriteRules?: {
        from: string;
        to: string;
      }[] | undefined;
      blockRules?: {
        value: string | number;
        field: "title" | "content" | "all" | "author" | "url" | "order";
        operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
      }[] | undefined;
      webhooks?: string[] | undefined;
    };
  }[] | null | undefined;
}, {
  createdAt: string | null;
  updatedAt: string | null;
  userId: string;
  rules?: {
    name: string;
    condition: {
      value: string;
      field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }[] | {
      value: string;
      field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
      operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
    }[][];
    result: {
      disabled?: boolean | undefined;
      translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
      summary?: boolean | undefined;
      readability?: boolean | undefined;
      sourceContent?: boolean | undefined;
      silence?: boolean | undefined;
      block?: boolean | undefined;
      star?: boolean | undefined;
      newEntryNotification?: boolean | undefined;
      rewriteRules?: {
        from: string;
        to: string;
      }[] | undefined;
      blockRules?: {
        value: string | number;
        field: "title" | "content" | "all" | "author" | "url" | "order";
        operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
      }[] | undefined;
      webhooks?: string[] | undefined;
    };
  }[] | null | undefined;
}>;
declare const actionsRelations: drizzle_orm142.Relations<"actions", {
  users: drizzle_orm142.One<"user", true>;
}>;
type ActionsModel = z$1.infer<typeof actionsOpenAPISchema>;
type SettingsModel = Exclude<z$1.infer<typeof actionsItemOpenAPISchema>["result"], undefined>;
//#endregion
//#region src/schema/activities.d.ts
declare const activities: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "activities";
  schema: undefined;
  columns: {
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "activities";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    activeAt: drizzle_orm_pg_core100.PgColumn<{
      name: "active_at";
      tableName: "activities";
      dataType: "date";
      columnType: "PgDate";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    platform: drizzle_orm_pg_core100.PgColumn<{
      name: "platform";
      tableName: "activities";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    version: drizzle_orm_pg_core100.PgColumn<{
      name: "version";
      tableName: "activities";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const activitiesOpenAPISchema: zod110.ZodObject<{
  userId: zod110.ZodString;
  activeAt: zod110.ZodString;
  platform: zod110.ZodString;
  version: zod110.ZodNullable<zod110.ZodString>;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  userId: string;
  activeAt: string;
  platform: string;
  version: string | null;
}, {
  userId: string;
  activeAt: string;
  platform: string;
  version: string | null;
}>;
//#endregion
//#region src/schema/airdrops.d.ts
declare const detailModelSchema: z$1.ZodNullable<z$1.ZodObject<{
  "Invitations count": z$1.ZodNumber;
  "Purchase lists cost": z$1.ZodNumber;
  "Total tip amount": z$1.ZodNumber;
  "Feeds subscriptions count": z$1.ZodNumber;
  "Lists subscriptions count": z$1.ZodNumber;
  "Inbox subscriptions count": z$1.ZodNumber;
  "Recent read count in the last month": z$1.ZodNumber;
  "Mint count": z$1.ZodNumber;
  "Claimed feeds count": z$1.ZodNumber;
  "Claimed feeds subscriptions count": z$1.ZodNumber;
  "Lists with more than 1 feed count": z$1.ZodNumber;
  "Created lists subscriptions count": z$1.ZodNumber;
  "Created lists income amount": z$1.ZodNumber;
  "GitHub Community Contributions": z$1.ZodNumber;
  "Invitations count Rank": z$1.ZodNumber;
  "Purchase lists cost Rank": z$1.ZodNumber;
  "Total tip amount Rank": z$1.ZodNumber;
  "Feeds subscriptions count Rank": z$1.ZodNumber;
  "Lists subscriptions count Rank": z$1.ZodNumber;
  "Inbox subscriptions count Rank": z$1.ZodNumber;
  "Recent read count in the last month Rank": z$1.ZodNumber;
  "Mint count Rank": z$1.ZodNumber;
  "Claimed feeds count Rank": z$1.ZodNumber;
  "Claimed feeds subscriptions count Rank": z$1.ZodNumber;
  "Lists with more than 1 feed count Rank": z$1.ZodNumber;
  "Created lists subscriptions count Rank": z$1.ZodNumber;
  "Created lists income amount Rank": z$1.ZodNumber;
  "GitHub Community Contributions Rank": z$1.ZodNumber;
}, "strip", z$1.ZodTypeAny, {
  "Invitations count": number;
  "Purchase lists cost": number;
  "Total tip amount": number;
  "Feeds subscriptions count": number;
  "Lists subscriptions count": number;
  "Inbox subscriptions count": number;
  "Recent read count in the last month": number;
  "Mint count": number;
  "Claimed feeds count": number;
  "Claimed feeds subscriptions count": number;
  "Lists with more than 1 feed count": number;
  "Created lists subscriptions count": number;
  "Created lists income amount": number;
  "GitHub Community Contributions": number;
  "Invitations count Rank": number;
  "Purchase lists cost Rank": number;
  "Total tip amount Rank": number;
  "Feeds subscriptions count Rank": number;
  "Lists subscriptions count Rank": number;
  "Inbox subscriptions count Rank": number;
  "Recent read count in the last month Rank": number;
  "Mint count Rank": number;
  "Claimed feeds count Rank": number;
  "Claimed feeds subscriptions count Rank": number;
  "Lists with more than 1 feed count Rank": number;
  "Created lists subscriptions count Rank": number;
  "Created lists income amount Rank": number;
  "GitHub Community Contributions Rank": number;
}, {
  "Invitations count": number;
  "Purchase lists cost": number;
  "Total tip amount": number;
  "Feeds subscriptions count": number;
  "Lists subscriptions count": number;
  "Inbox subscriptions count": number;
  "Recent read count in the last month": number;
  "Mint count": number;
  "Claimed feeds count": number;
  "Claimed feeds subscriptions count": number;
  "Lists with more than 1 feed count": number;
  "Created lists subscriptions count": number;
  "Created lists income amount": number;
  "GitHub Community Contributions": number;
  "Invitations count Rank": number;
  "Purchase lists cost Rank": number;
  "Total tip amount Rank": number;
  "Feeds subscriptions count Rank": number;
  "Lists subscriptions count Rank": number;
  "Inbox subscriptions count Rank": number;
  "Recent read count in the last month Rank": number;
  "Mint count Rank": number;
  "Claimed feeds count Rank": number;
  "Claimed feeds subscriptions count Rank": number;
  "Lists with more than 1 feed count Rank": number;
  "Created lists subscriptions count Rank": number;
  "Created lists income amount Rank": number;
  "GitHub Community Contributions Rank": number;
}>>;
type DetailModel = z$1.infer<typeof detailModelSchema>;
declare const activityEnum: readonly ["public_beta"];
type AirdropActivity = typeof activityEnum[number];
declare const airdrops: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "airdrops";
  schema: undefined;
  columns: {
    activity: drizzle_orm_pg_core100.PgColumn<{
      name: "activity";
      tableName: "airdrops";
      dataType: "string";
      columnType: "PgText";
      data: "public_beta";
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: ["public_beta"];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "airdrops";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    amount: drizzle_orm_pg_core100.PgColumn<{
      name: "amount";
      tableName: "airdrops";
      dataType: "string";
      columnType: "PgNumeric";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    rank: drizzle_orm_pg_core100.PgColumn<{
      name: "rank";
      tableName: "airdrops";
      dataType: "string";
      columnType: "PgNumeric";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    detail: drizzle_orm_pg_core100.PgColumn<{
      name: "detail";
      tableName: "airdrops";
      dataType: "json";
      columnType: "PgJsonb";
      data: {
        "Invitations count": number;
        "Purchase lists cost": number;
        "Total tip amount": number;
        "Feeds subscriptions count": number;
        "Lists subscriptions count": number;
        "Inbox subscriptions count": number;
        "Recent read count in the last month": number;
        "Mint count": number;
        "Claimed feeds count": number;
        "Claimed feeds subscriptions count": number;
        "Lists with more than 1 feed count": number;
        "Created lists subscriptions count": number;
        "Created lists income amount": number;
        "GitHub Community Contributions": number;
        "Invitations count Rank": number;
        "Purchase lists cost Rank": number;
        "Total tip amount Rank": number;
        "Feeds subscriptions count Rank": number;
        "Lists subscriptions count Rank": number;
        "Inbox subscriptions count Rank": number;
        "Recent read count in the last month Rank": number;
        "Mint count Rank": number;
        "Claimed feeds count Rank": number;
        "Claimed feeds subscriptions count Rank": number;
        "Lists with more than 1 feed count Rank": number;
        "Created lists subscriptions count Rank": number;
        "Created lists income amount Rank": number;
        "GitHub Community Contributions Rank": number;
      } | null;
      driverParam: unknown;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      $type: {
        "Invitations count": number;
        "Purchase lists cost": number;
        "Total tip amount": number;
        "Feeds subscriptions count": number;
        "Lists subscriptions count": number;
        "Inbox subscriptions count": number;
        "Recent read count in the last month": number;
        "Mint count": number;
        "Claimed feeds count": number;
        "Claimed feeds subscriptions count": number;
        "Lists with more than 1 feed count": number;
        "Created lists subscriptions count": number;
        "Created lists income amount": number;
        "GitHub Community Contributions": number;
        "Invitations count Rank": number;
        "Purchase lists cost Rank": number;
        "Total tip amount Rank": number;
        "Feeds subscriptions count Rank": number;
        "Lists subscriptions count Rank": number;
        "Inbox subscriptions count Rank": number;
        "Recent read count in the last month Rank": number;
        "Mint count Rank": number;
        "Claimed feeds count Rank": number;
        "Claimed feeds subscriptions count Rank": number;
        "Lists with more than 1 feed count Rank": number;
        "Created lists subscriptions count Rank": number;
        "Created lists income amount Rank": number;
        "GitHub Community Contributions Rank": number;
      } | null;
    }>;
    verify: drizzle_orm_pg_core100.PgColumn<{
      name: "verify";
      tableName: "airdrops";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    tx: drizzle_orm_pg_core100.PgColumn<{
      name: "tx";
      tableName: "airdrops";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const airdropsOpenAPISchema: z$1.ZodObject<Omit<{
  activity: z$1.ZodEnum<["public_beta"]>;
  userId: z$1.ZodString;
  amount: z$1.ZodString;
  rank: z$1.ZodNullable<z$1.ZodString>;
  detail: z$1.ZodNullable<z$1.ZodType<string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null, z$1.ZodTypeDef, string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null>>;
  verify: z$1.ZodNullable<z$1.ZodString>;
  tx: z$1.ZodNullable<z$1.ZodString>;
}, "detail"> & {
  detail: z$1.ZodNullable<z$1.ZodObject<{
    "Invitations count": z$1.ZodNumber;
    "Purchase lists cost": z$1.ZodNumber;
    "Total tip amount": z$1.ZodNumber;
    "Feeds subscriptions count": z$1.ZodNumber;
    "Lists subscriptions count": z$1.ZodNumber;
    "Inbox subscriptions count": z$1.ZodNumber;
    "Recent read count in the last month": z$1.ZodNumber;
    "Mint count": z$1.ZodNumber;
    "Claimed feeds count": z$1.ZodNumber;
    "Claimed feeds subscriptions count": z$1.ZodNumber;
    "Lists with more than 1 feed count": z$1.ZodNumber;
    "Created lists subscriptions count": z$1.ZodNumber;
    "Created lists income amount": z$1.ZodNumber;
    "GitHub Community Contributions": z$1.ZodNumber;
    "Invitations count Rank": z$1.ZodNumber;
    "Purchase lists cost Rank": z$1.ZodNumber;
    "Total tip amount Rank": z$1.ZodNumber;
    "Feeds subscriptions count Rank": z$1.ZodNumber;
    "Lists subscriptions count Rank": z$1.ZodNumber;
    "Inbox subscriptions count Rank": z$1.ZodNumber;
    "Recent read count in the last month Rank": z$1.ZodNumber;
    "Mint count Rank": z$1.ZodNumber;
    "Claimed feeds count Rank": z$1.ZodNumber;
    "Claimed feeds subscriptions count Rank": z$1.ZodNumber;
    "Lists with more than 1 feed count Rank": z$1.ZodNumber;
    "Created lists subscriptions count Rank": z$1.ZodNumber;
    "Created lists income amount Rank": z$1.ZodNumber;
    "GitHub Community Contributions Rank": z$1.ZodNumber;
  }, "strip", z$1.ZodTypeAny, {
    "Invitations count": number;
    "Purchase lists cost": number;
    "Total tip amount": number;
    "Feeds subscriptions count": number;
    "Lists subscriptions count": number;
    "Inbox subscriptions count": number;
    "Recent read count in the last month": number;
    "Mint count": number;
    "Claimed feeds count": number;
    "Claimed feeds subscriptions count": number;
    "Lists with more than 1 feed count": number;
    "Created lists subscriptions count": number;
    "Created lists income amount": number;
    "GitHub Community Contributions": number;
    "Invitations count Rank": number;
    "Purchase lists cost Rank": number;
    "Total tip amount Rank": number;
    "Feeds subscriptions count Rank": number;
    "Lists subscriptions count Rank": number;
    "Inbox subscriptions count Rank": number;
    "Recent read count in the last month Rank": number;
    "Mint count Rank": number;
    "Claimed feeds count Rank": number;
    "Claimed feeds subscriptions count Rank": number;
    "Lists with more than 1 feed count Rank": number;
    "Created lists subscriptions count Rank": number;
    "Created lists income amount Rank": number;
    "GitHub Community Contributions Rank": number;
  }, {
    "Invitations count": number;
    "Purchase lists cost": number;
    "Total tip amount": number;
    "Feeds subscriptions count": number;
    "Lists subscriptions count": number;
    "Inbox subscriptions count": number;
    "Recent read count in the last month": number;
    "Mint count": number;
    "Claimed feeds count": number;
    "Claimed feeds subscriptions count": number;
    "Lists with more than 1 feed count": number;
    "Created lists subscriptions count": number;
    "Created lists income amount": number;
    "GitHub Community Contributions": number;
    "Invitations count Rank": number;
    "Purchase lists cost Rank": number;
    "Total tip amount Rank": number;
    "Feeds subscriptions count Rank": number;
    "Lists subscriptions count Rank": number;
    "Inbox subscriptions count Rank": number;
    "Recent read count in the last month Rank": number;
    "Mint count Rank": number;
    "Claimed feeds count Rank": number;
    "Claimed feeds subscriptions count Rank": number;
    "Lists with more than 1 feed count Rank": number;
    "Created lists subscriptions count Rank": number;
    "Created lists income amount Rank": number;
    "GitHub Community Contributions Rank": number;
  }>>;
}, "strip", z$1.ZodTypeAny, {
  userId: string;
  tx: string | null;
  activity: "public_beta";
  amount: string;
  rank: string | null;
  detail: {
    "Invitations count": number;
    "Purchase lists cost": number;
    "Total tip amount": number;
    "Feeds subscriptions count": number;
    "Lists subscriptions count": number;
    "Inbox subscriptions count": number;
    "Recent read count in the last month": number;
    "Mint count": number;
    "Claimed feeds count": number;
    "Claimed feeds subscriptions count": number;
    "Lists with more than 1 feed count": number;
    "Created lists subscriptions count": number;
    "Created lists income amount": number;
    "GitHub Community Contributions": number;
    "Invitations count Rank": number;
    "Purchase lists cost Rank": number;
    "Total tip amount Rank": number;
    "Feeds subscriptions count Rank": number;
    "Lists subscriptions count Rank": number;
    "Inbox subscriptions count Rank": number;
    "Recent read count in the last month Rank": number;
    "Mint count Rank": number;
    "Claimed feeds count Rank": number;
    "Claimed feeds subscriptions count Rank": number;
    "Lists with more than 1 feed count Rank": number;
    "Created lists subscriptions count Rank": number;
    "Created lists income amount Rank": number;
    "GitHub Community Contributions Rank": number;
  } | null;
  verify: string | null;
}, {
  userId: string;
  tx: string | null;
  activity: "public_beta";
  amount: string;
  rank: string | null;
  detail: {
    "Invitations count": number;
    "Purchase lists cost": number;
    "Total tip amount": number;
    "Feeds subscriptions count": number;
    "Lists subscriptions count": number;
    "Inbox subscriptions count": number;
    "Recent read count in the last month": number;
    "Mint count": number;
    "Claimed feeds count": number;
    "Claimed feeds subscriptions count": number;
    "Lists with more than 1 feed count": number;
    "Created lists subscriptions count": number;
    "Created lists income amount": number;
    "GitHub Community Contributions": number;
    "Invitations count Rank": number;
    "Purchase lists cost Rank": number;
    "Total tip amount Rank": number;
    "Feeds subscriptions count Rank": number;
    "Lists subscriptions count Rank": number;
    "Inbox subscriptions count Rank": number;
    "Recent read count in the last month Rank": number;
    "Mint count Rank": number;
    "Claimed feeds count Rank": number;
    "Claimed feeds subscriptions count Rank": number;
    "Lists with more than 1 feed count Rank": number;
    "Created lists subscriptions count Rank": number;
    "Created lists income amount Rank": number;
    "GitHub Community Contributions Rank": number;
  } | null;
  verify: string | null;
}>;
//#endregion
//#region src/schema/captcha.d.ts
declare const captcha: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "captcha";
  schema: undefined;
  columns: {
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "captcha";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    failedCount: drizzle_orm_pg_core100.PgColumn<{
      name: "failed_count";
      tableName: "captcha";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    passedCount: drizzle_orm_pg_core100.PgColumn<{
      name: "passed_count";
      tableName: "captcha";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
//#endregion
//#region src/schema/collections.d.ts
declare const collections: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "collections";
  schema: undefined;
  columns: {
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "collections";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    feedId: drizzle_orm_pg_core100.PgColumn<{
      name: "feed_id";
      tableName: "collections";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    entryId: drizzle_orm_pg_core100.PgColumn<{
      name: "entry_id";
      tableName: "collections";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "created_at";
      tableName: "collections";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    view: drizzle_orm_pg_core100.PgColumn<{
      name: "view";
      tableName: "collections";
      dataType: "number";
      columnType: "PgSmallInt";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const collectionsOpenAPISchema: zod110.ZodObject<{
  userId: zod110.ZodString;
  feedId: zod110.ZodString;
  entryId: zod110.ZodString;
  createdAt: zod110.ZodString;
  view: zod110.ZodNumber;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  createdAt: string;
  userId: string;
  view: number;
  feedId: string;
  entryId: string;
}, {
  createdAt: string;
  userId: string;
  view: number;
  feedId: string;
  entryId: string;
}>;
declare const collectionsRelations: drizzle_orm142.Relations<"collections", {
  users: drizzle_orm142.One<"user", true>;
  entries: drizzle_orm142.One<"entries", true>;
  feeds: drizzle_orm142.One<"feeds", true>;
}>;
//#endregion
//#region src/schema/entries.d.ts
type MediaModel = {
  url: string;
  type: "photo" | "video";
  preview_image_url?: string;
  width?: number;
  height?: number;
  blurhash?: string;
};
type AttachmentsModel = {
  url: string;
  duration_in_seconds?: number | string;
  mime_type?: string;
  size_in_bytes?: number;
  title?: string;
};
type ExtraModel = {
  links?: {
    url: string;
    type: string;
    content_html?: string;
  }[];
};
declare const CommonEntryFields: {
  id: drizzle_orm142.HasRuntimeDefault<drizzle_orm142.HasDefault<drizzle_orm142.IsPrimaryKey<drizzle_orm142.NotNull<drizzle_orm_pg_core100.PgTextBuilderInitial<"id", [string, ...string[]]>>>>>;
  title: drizzle_orm_pg_core100.PgTextBuilderInitial<"title", [string, ...string[]]>;
  url: drizzle_orm_pg_core100.PgTextBuilderInitial<"url", [string, ...string[]]>;
  content: drizzle_orm_pg_core100.PgTextBuilderInitial<"content", [string, ...string[]]>;
  description: drizzle_orm_pg_core100.PgTextBuilderInitial<"description", [string, ...string[]]>;
  guid: drizzle_orm142.NotNull<drizzle_orm_pg_core100.PgTextBuilderInitial<"guid", [string, ...string[]]>>;
  author: drizzle_orm_pg_core100.PgTextBuilderInitial<"author", [string, ...string[]]>;
  authorUrl: drizzle_orm_pg_core100.PgTextBuilderInitial<"author_url", [string, ...string[]]>;
  authorAvatar: drizzle_orm_pg_core100.PgTextBuilderInitial<"author_avatar", [string, ...string[]]>;
  insertedAt: drizzle_orm142.NotNull<drizzle_orm_pg_core100.PgTimestampBuilderInitial<"inserted_at">>;
  publishedAt: drizzle_orm142.NotNull<drizzle_orm_pg_core100.PgTimestampBuilderInitial<"published_at">>;
  media: drizzle_orm142.$Type<drizzle_orm_pg_core100.PgJsonbBuilderInitial<"media">, MediaModel[]>;
  categories: drizzle_orm_pg_core100.PgArrayBuilder<{
    name: "categories";
    dataType: "array";
    columnType: "PgArray";
    data: string[];
    driverParam: string | string[];
    enumValues: [string, ...string[]];
    size: undefined;
    baseBuilder: {
      name: "categories";
      dataType: "string";
      columnType: "PgText";
      data: string;
      enumValues: [string, ...string[]];
      driverParam: string;
    };
  }, {
    name: "categories";
    dataType: "string";
    columnType: "PgText";
    data: string;
    enumValues: [string, ...string[]];
    driverParam: string;
  }>;
  attachments: drizzle_orm142.$Type<drizzle_orm_pg_core100.PgJsonbBuilderInitial<"attachments">, AttachmentsModel[]>;
  extra: drizzle_orm142.$Type<drizzle_orm_pg_core100.PgJsonbBuilderInitial<"extra">, ExtraModel>;
  language: drizzle_orm_pg_core100.PgTextBuilderInitial<"language", [string, ...string[]]>;
};
declare const entries: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "entries";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    title: drizzle_orm_pg_core100.PgColumn<{
      name: "title";
      tableName: "entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    url: drizzle_orm_pg_core100.PgColumn<{
      name: "url";
      tableName: "entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    content: drizzle_orm_pg_core100.PgColumn<{
      name: "content";
      tableName: "entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    description: drizzle_orm_pg_core100.PgColumn<{
      name: "description";
      tableName: "entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    guid: drizzle_orm_pg_core100.PgColumn<{
      name: "guid";
      tableName: "entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    author: drizzle_orm_pg_core100.PgColumn<{
      name: "author";
      tableName: "entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    authorUrl: drizzle_orm_pg_core100.PgColumn<{
      name: "author_url";
      tableName: "entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    authorAvatar: drizzle_orm_pg_core100.PgColumn<{
      name: "author_avatar";
      tableName: "entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    insertedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "inserted_at";
      tableName: "entries";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    publishedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "published_at";
      tableName: "entries";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    media: drizzle_orm_pg_core100.PgColumn<{
      name: "media";
      tableName: "entries";
      dataType: "json";
      columnType: "PgJsonb";
      data: MediaModel[];
      driverParam: unknown;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      $type: MediaModel[];
    }>;
    categories: drizzle_orm_pg_core100.PgColumn<{
      name: "categories";
      tableName: "entries";
      dataType: "array";
      columnType: "PgArray";
      data: string[];
      driverParam: string | string[];
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: drizzle_orm142.Column<{
        name: "categories";
        tableName: "entries";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      }, {}, {}>;
      identity: undefined;
      generated: undefined;
    }, {}, {
      baseBuilder: drizzle_orm_pg_core100.PgColumnBuilder<{
        name: "categories";
        dataType: "string";
        columnType: "PgText";
        data: string;
        enumValues: [string, ...string[]];
        driverParam: string;
      }, {}, {}, drizzle_orm142.ColumnBuilderExtraConfig>;
      size: undefined;
    }>;
    attachments: drizzle_orm_pg_core100.PgColumn<{
      name: "attachments";
      tableName: "entries";
      dataType: "json";
      columnType: "PgJsonb";
      data: AttachmentsModel[];
      driverParam: unknown;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      $type: AttachmentsModel[];
    }>;
    extra: drizzle_orm_pg_core100.PgColumn<{
      name: "extra";
      tableName: "entries";
      dataType: "json";
      columnType: "PgJsonb";
      data: ExtraModel;
      driverParam: unknown;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      $type: ExtraModel;
    }>;
    language: drizzle_orm_pg_core100.PgColumn<{
      name: "language";
      tableName: "entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    feedId: drizzle_orm_pg_core100.PgColumn<{
      name: "feed_id";
      tableName: "entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const attachmentsZodSchema: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
  url: z$1.ZodString;
  duration_in_seconds: z$1.ZodOptional<z$1.ZodUnion<[z$1.ZodNumber, z$1.ZodString]>>;
  mime_type: z$1.ZodOptional<z$1.ZodString>;
  size_in_bytes: z$1.ZodOptional<z$1.ZodNumber>;
  title: z$1.ZodOptional<z$1.ZodString>;
}, "strip", z$1.ZodTypeAny, {
  url: string;
  title?: string | undefined;
  duration_in_seconds?: string | number | undefined;
  mime_type?: string | undefined;
  size_in_bytes?: number | undefined;
}, {
  url: string;
  title?: string | undefined;
  duration_in_seconds?: string | number | undefined;
  mime_type?: string | undefined;
  size_in_bytes?: number | undefined;
}>, "many">>>;
declare const mediaZodSchema: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
  url: z$1.ZodString;
  type: z$1.ZodEnum<["photo", "video"]>;
  width: z$1.ZodOptional<z$1.ZodNumber>;
  height: z$1.ZodOptional<z$1.ZodNumber>;
  preview_image_url: z$1.ZodOptional<z$1.ZodString>;
  blurhash: z$1.ZodOptional<z$1.ZodString>;
}, "strip", z$1.ZodTypeAny, {
  type: "photo" | "video";
  url: string;
  width?: number | undefined;
  height?: number | undefined;
  preview_image_url?: string | undefined;
  blurhash?: string | undefined;
}, {
  type: "photo" | "video";
  url: string;
  width?: number | undefined;
  height?: number | undefined;
  preview_image_url?: string | undefined;
  blurhash?: string | undefined;
}>, "many">>>;
declare const extraZodSchema: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodObject<{
  links: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
    url: z$1.ZodString;
    type: z$1.ZodString;
    content_html: z$1.ZodOptional<z$1.ZodString>;
  }, "strip", z$1.ZodTypeAny, {
    type: string;
    url: string;
    content_html?: string | undefined;
  }, {
    type: string;
    url: string;
    content_html?: string | undefined;
  }>, "many">>>;
}, "strip", z$1.ZodTypeAny, {
  links?: {
    type: string;
    url: string;
    content_html?: string | undefined;
  }[] | null | undefined;
}, {
  links?: {
    type: string;
    url: string;
    content_html?: string | undefined;
  }[] | null | undefined;
}>>>;
declare const entriesOpenAPISchema: z$1.ZodObject<Omit<{
  id: z$1.ZodString;
  title: z$1.ZodNullable<z$1.ZodString>;
  url: z$1.ZodNullable<z$1.ZodString>;
  content: z$1.ZodNullable<z$1.ZodString>;
  description: z$1.ZodNullable<z$1.ZodString>;
  guid: z$1.ZodString;
  author: z$1.ZodNullable<z$1.ZodString>;
  authorUrl: z$1.ZodNullable<z$1.ZodString>;
  authorAvatar: z$1.ZodNullable<z$1.ZodString>;
  insertedAt: z$1.ZodString;
  publishedAt: z$1.ZodString;
  media: z$1.ZodNullable<z$1.ZodType<string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null, z$1.ZodTypeDef, string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null>>;
  categories: z$1.ZodNullable<z$1.ZodArray<z$1.ZodString, "many">>;
  attachments: z$1.ZodNullable<z$1.ZodType<string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null, z$1.ZodTypeDef, string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null>>;
  extra: z$1.ZodNullable<z$1.ZodType<string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null, z$1.ZodTypeDef, string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null>>;
  language: z$1.ZodNullable<z$1.ZodString>;
  feedId: z$1.ZodString;
}, "media" | "attachments" | "extra"> & {
  attachments: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
    url: z$1.ZodString;
    duration_in_seconds: z$1.ZodOptional<z$1.ZodUnion<[z$1.ZodNumber, z$1.ZodString]>>;
    mime_type: z$1.ZodOptional<z$1.ZodString>;
    size_in_bytes: z$1.ZodOptional<z$1.ZodNumber>;
    title: z$1.ZodOptional<z$1.ZodString>;
  }, "strip", z$1.ZodTypeAny, {
    url: string;
    title?: string | undefined;
    duration_in_seconds?: string | number | undefined;
    mime_type?: string | undefined;
    size_in_bytes?: number | undefined;
  }, {
    url: string;
    title?: string | undefined;
    duration_in_seconds?: string | number | undefined;
    mime_type?: string | undefined;
    size_in_bytes?: number | undefined;
  }>, "many">>>;
  media: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
    url: z$1.ZodString;
    type: z$1.ZodEnum<["photo", "video"]>;
    width: z$1.ZodOptional<z$1.ZodNumber>;
    height: z$1.ZodOptional<z$1.ZodNumber>;
    preview_image_url: z$1.ZodOptional<z$1.ZodString>;
    blurhash: z$1.ZodOptional<z$1.ZodString>;
  }, "strip", z$1.ZodTypeAny, {
    type: "photo" | "video";
    url: string;
    width?: number | undefined;
    height?: number | undefined;
    preview_image_url?: string | undefined;
    blurhash?: string | undefined;
  }, {
    type: "photo" | "video";
    url: string;
    width?: number | undefined;
    height?: number | undefined;
    preview_image_url?: string | undefined;
    blurhash?: string | undefined;
  }>, "many">>>;
  extra: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodObject<{
    links: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
      url: z$1.ZodString;
      type: z$1.ZodString;
      content_html: z$1.ZodOptional<z$1.ZodString>;
    }, "strip", z$1.ZodTypeAny, {
      type: string;
      url: string;
      content_html?: string | undefined;
    }, {
      type: string;
      url: string;
      content_html?: string | undefined;
    }>, "many">>>;
  }, "strip", z$1.ZodTypeAny, {
    links?: {
      type: string;
      url: string;
      content_html?: string | undefined;
    }[] | null | undefined;
  }, {
    links?: {
      type: string;
      url: string;
      content_html?: string | undefined;
    }[] | null | undefined;
  }>>>;
}, "strip", z$1.ZodTypeAny, {
  id: string;
  description: string | null;
  title: string | null;
  content: string | null;
  author: string | null;
  url: string | null;
  language: string | null;
  feedId: string;
  guid: string;
  categories: string[] | null;
  authorUrl: string | null;
  authorAvatar: string | null;
  insertedAt: string;
  publishedAt: string;
  media?: {
    type: "photo" | "video";
    url: string;
    width?: number | undefined;
    height?: number | undefined;
    preview_image_url?: string | undefined;
    blurhash?: string | undefined;
  }[] | null | undefined;
  attachments?: {
    url: string;
    title?: string | undefined;
    duration_in_seconds?: string | number | undefined;
    mime_type?: string | undefined;
    size_in_bytes?: number | undefined;
  }[] | null | undefined;
  extra?: {
    links?: {
      type: string;
      url: string;
      content_html?: string | undefined;
    }[] | null | undefined;
  } | null | undefined;
}, {
  id: string;
  description: string | null;
  title: string | null;
  content: string | null;
  author: string | null;
  url: string | null;
  language: string | null;
  feedId: string;
  guid: string;
  categories: string[] | null;
  authorUrl: string | null;
  authorAvatar: string | null;
  insertedAt: string;
  publishedAt: string;
  media?: {
    type: "photo" | "video";
    url: string;
    width?: number | undefined;
    height?: number | undefined;
    preview_image_url?: string | undefined;
    blurhash?: string | undefined;
  }[] | null | undefined;
  attachments?: {
    url: string;
    title?: string | undefined;
    duration_in_seconds?: string | number | undefined;
    mime_type?: string | undefined;
    size_in_bytes?: number | undefined;
  }[] | null | undefined;
  extra?: {
    links?: {
      type: string;
      url: string;
      content_html?: string | undefined;
    }[] | null | undefined;
  } | null | undefined;
}>;
declare const entriesRelations: drizzle_orm142.Relations<"entries", {
  feeds: drizzle_orm142.One<"feeds", true>;
  collections: drizzle_orm142.Many<"collections">;
  feedPowerTokens: drizzle_orm142.One<"feedPowerTokens", true>;
}>;
type EntriesModel = InferInsertModel<typeof entries> & {
  attachments?: AttachmentsModel[] | null;
  media?: MediaModel[] | null;
};
declare const urlReads: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "urlReads";
  schema: undefined;
  columns: {
    url: drizzle_orm_pg_core100.PgColumn<{
      name: "url";
      tableName: "urlReads";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userIds: drizzle_orm_pg_core100.PgColumn<{
      name: "user_ids";
      tableName: "urlReads";
      dataType: "array";
      columnType: "PgArray";
      data: string[];
      driverParam: string | string[];
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: drizzle_orm142.Column<{
        name: "user_ids";
        tableName: "urlReads";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      }, {}, {}>;
      identity: undefined;
      generated: undefined;
    }, {}, {
      baseBuilder: drizzle_orm_pg_core100.PgColumnBuilder<{
        name: "user_ids";
        dataType: "string";
        columnType: "PgText";
        data: string;
        enumValues: [string, ...string[]];
        driverParam: string;
      }, {}, {}, drizzle_orm142.ColumnBuilderExtraConfig>;
      size: undefined;
    }>;
    count: drizzle_orm_pg_core100.PgColumn<{
      name: "count";
      tableName: "urlReads";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
type UrlReadsModel = InferInsertModel<typeof urlReads>;
declare const urlReadsOpenAPISchema: z$1.ZodObject<{
  url: z$1.ZodString;
  userIds: z$1.ZodArray<z$1.ZodString, "many">;
  count: z$1.ZodNumber;
}, z$1.UnknownKeysParam, z$1.ZodTypeAny, {
  url: string;
  userIds: string[];
  count: number;
}, {
  url: string;
  userIds: string[];
  count: number;
}>;
//#endregion
//#region src/schema/feature-flags.d.ts
declare const FEATURE_NAMES: readonly ["ai_chat"];
type FeatureName = typeof FEATURE_NAMES[number];
declare const featureFlags: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "feature_flags";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "feature_flags";
      dataType: "number";
      columnType: "PgSerial";
      data: number;
      driverParam: number;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    name: drizzle_orm_pg_core100.PgColumn<{
      name: "name";
      tableName: "feature_flags";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 100;
    }>;
    description: drizzle_orm_pg_core100.PgColumn<{
      name: "description";
      tableName: "feature_flags";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    enabled: drizzle_orm_pg_core100.PgColumn<{
      name: "enabled";
      tableName: "feature_flags";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    rolloutType: drizzle_orm_pg_core100.PgColumn<{
      name: "rollout_type";
      tableName: "feature_flags";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 20;
    }>;
    rolloutValue: drizzle_orm_pg_core100.PgColumn<{
      name: "rollout_value";
      tableName: "feature_flags";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    rolloutPercentage: drizzle_orm_pg_core100.PgColumn<{
      name: "rollout_percentage";
      tableName: "feature_flags";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    rolloutSeed: drizzle_orm_pg_core100.PgColumn<{
      name: "rollout_seed";
      tableName: "feature_flags";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 50;
    }>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "created_at";
      tableName: "feature_flags";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    updatedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "updated_at";
      tableName: "feature_flags";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const userFeatureOverrides: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "user_feature_overrides";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "user_feature_overrides";
      dataType: "number";
      columnType: "PgSerial";
      data: number;
      driverParam: number;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "user_feature_overrides";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 50;
    }>;
    featureName: drizzle_orm_pg_core100.PgColumn<{
      name: "feature_name";
      tableName: "user_feature_overrides";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 100;
    }>;
    forceEnabled: drizzle_orm_pg_core100.PgColumn<{
      name: "force_enabled";
      tableName: "user_feature_overrides";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    reason: drizzle_orm_pg_core100.PgColumn<{
      name: "reason";
      tableName: "user_feature_overrides";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 50;
    }>;
    expiresAt: drizzle_orm_pg_core100.PgColumn<{
      name: "expires_at";
      tableName: "user_feature_overrides";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "created_at";
      tableName: "user_feature_overrides";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    createdBy: drizzle_orm_pg_core100.PgColumn<{
      name: "created_by";
      tableName: "user_feature_overrides";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 50;
    }>;
  };
  dialect: "pg";
}>;
type FeatureFlagModel = typeof featureFlags.$inferSelect;
type FeatureFlagInsertModel = typeof featureFlags.$inferInsert;
type UserFeatureOverrideModel = typeof userFeatureOverrides.$inferSelect;
type UserFeatureOverrideInsertModel = typeof userFeatureOverrides.$inferInsert;
declare const ROLLOUT_TYPES: readonly ["whitelist", "percentage"];
type RolloutType = typeof ROLLOUT_TYPES[number];
type RolloutValue = 0 | 1;
//#endregion
//#region src/schema/feeds/analytics.d.ts
declare const feedAnalytics: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "feed_analytics";
  schema: undefined;
  columns: {
    feedId: drizzle_orm_pg_core100.PgColumn<{
      name: "feed_id";
      tableName: "feed_analytics";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    updatesPerWeek: drizzle_orm_pg_core100.PgColumn<{
      name: "updates_per_week";
      tableName: "feed_analytics";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    subscriptionCount: drizzle_orm_pg_core100.PgColumn<{
      name: "subscription_count";
      tableName: "feed_analytics";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    latestEntryPublishedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "latest_entry_published_at";
      tableName: "feed_analytics";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    view: drizzle_orm_pg_core100.PgColumn<{
      name: "view";
      tableName: "feed_analytics";
      dataType: "number";
      columnType: "PgSmallInt";
      data: number;
      driverParam: string | number;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const feedAnalyticsOpenAPISchema: zod110.ZodObject<{
  feedId: zod110.ZodString;
  updatesPerWeek: zod110.ZodNullable<zod110.ZodNumber>;
  subscriptionCount: zod110.ZodNullable<zod110.ZodNumber>;
  latestEntryPublishedAt: zod110.ZodNullable<zod110.ZodString>;
  view: zod110.ZodNullable<zod110.ZodNumber>;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  view: number | null;
  feedId: string;
  updatesPerWeek: number | null;
  subscriptionCount: number | null;
  latestEntryPublishedAt: string | null;
}, {
  view: number | null;
  feedId: string;
  updatesPerWeek: number | null;
  subscriptionCount: number | null;
  latestEntryPublishedAt: string | null;
}>;
declare const feedAnalyticsRelations: drizzle_orm142.Relations<"feed_analytics", {
  feed: drizzle_orm142.One<"feeds", true>;
}>;
//#endregion
//#region src/schema/feeds/feeds.d.ts
declare const feeds: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "feeds";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    url: drizzle_orm_pg_core100.PgColumn<{
      name: "url";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    title: drizzle_orm_pg_core100.PgColumn<{
      name: "title";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    description: drizzle_orm_pg_core100.PgColumn<{
      name: "description";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    siteUrl: drizzle_orm_pg_core100.PgColumn<{
      name: "site_url";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    image: drizzle_orm_pg_core100.PgColumn<{
      name: "image";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    checkedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "checked_at";
      tableName: "feeds";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    lastModifiedHeader: drizzle_orm_pg_core100.PgColumn<{
      name: "last_modified_header";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    etagHeader: drizzle_orm_pg_core100.PgColumn<{
      name: "etag_header";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    ttl: drizzle_orm_pg_core100.PgColumn<{
      name: "ttl";
      tableName: "feeds";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    errorMessage: drizzle_orm_pg_core100.PgColumn<{
      name: "error_message";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    errorAt: drizzle_orm_pg_core100.PgColumn<{
      name: "error_at";
      tableName: "feeds";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    ownerUserId: drizzle_orm_pg_core100.PgColumn<{
      name: "owner_user_id";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    language: drizzle_orm_pg_core100.PgColumn<{
      name: "language";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    migrateTo: drizzle_orm_pg_core100.PgColumn<{
      name: "migrate_to";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    rsshubRoute: drizzle_orm_pg_core100.PgColumn<{
      name: "rsshub_route";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    rsshubNamespace: drizzle_orm_pg_core100.PgColumn<{
      name: "rsshub_namespace";
      tableName: "feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    nsfw: drizzle_orm_pg_core100.PgColumn<{
      name: "nsfw";
      tableName: "feeds";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const feedsOpenAPISchema: zod110.ZodObject<{
  id: zod110.ZodString;
  url: zod110.ZodString;
  title: zod110.ZodNullable<zod110.ZodString>;
  description: zod110.ZodNullable<zod110.ZodString>;
  siteUrl: zod110.ZodNullable<zod110.ZodString>;
  image: zod110.ZodNullable<zod110.ZodString>;
  checkedAt: zod110.ZodString;
  lastModifiedHeader: zod110.ZodNullable<zod110.ZodString>;
  etagHeader: zod110.ZodNullable<zod110.ZodString>;
  ttl: zod110.ZodNullable<zod110.ZodNumber>;
  errorMessage: zod110.ZodNullable<zod110.ZodString>;
  errorAt: zod110.ZodNullable<zod110.ZodString>;
  ownerUserId: zod110.ZodNullable<zod110.ZodString>;
  language: zod110.ZodNullable<zod110.ZodString>;
  migrateTo: zod110.ZodNullable<zod110.ZodString>;
  rsshubRoute: zod110.ZodNullable<zod110.ZodString>;
  rsshubNamespace: zod110.ZodNullable<zod110.ZodString>;
  nsfw: zod110.ZodNullable<zod110.ZodBoolean>;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  id: string;
  image: string | null;
  description: string | null;
  title: string | null;
  url: string;
  siteUrl: string | null;
  checkedAt: string;
  lastModifiedHeader: string | null;
  etagHeader: string | null;
  ttl: number | null;
  errorMessage: string | null;
  errorAt: string | null;
  ownerUserId: string | null;
  language: string | null;
  migrateTo: string | null;
  rsshubRoute: string | null;
  rsshubNamespace: string | null;
  nsfw: boolean | null;
}, {
  id: string;
  image: string | null;
  description: string | null;
  title: string | null;
  url: string;
  siteUrl: string | null;
  checkedAt: string;
  lastModifiedHeader: string | null;
  etagHeader: string | null;
  ttl: number | null;
  errorMessage: string | null;
  errorAt: string | null;
  ownerUserId: string | null;
  language: string | null;
  migrateTo: string | null;
  rsshubRoute: string | null;
  rsshubNamespace: string | null;
  nsfw: boolean | null;
}>;
declare const feedsRelations: drizzle_orm142.Relations<"feeds", {
  subscriptions: drizzle_orm142.Many<"subscriptions">;
  entries: drizzle_orm142.Many<"entries">;
  owner: drizzle_orm142.One<"user", false>;
  migrateTo: drizzle_orm142.One<"feeds", false>;
  trendingFeeds: drizzle_orm142.Many<"trendings_feeds">;
}>;
type FeedModel = InferInsertModel<typeof feeds>;
//#endregion
//#region src/schema/feeds/subscriptions.d.ts
declare const subscriptions: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "subscriptions";
  schema: undefined;
  columns: {
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "subscriptions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    feedId: drizzle_orm_pg_core100.PgColumn<{
      name: "feed_id";
      tableName: "subscriptions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    view: drizzle_orm_pg_core100.PgColumn<{
      name: "view";
      tableName: "subscriptions";
      dataType: "number";
      columnType: "PgSmallInt";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    category: drizzle_orm_pg_core100.PgColumn<{
      name: "category";
      tableName: "subscriptions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    title: drizzle_orm_pg_core100.PgColumn<{
      name: "title";
      tableName: "subscriptions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "created_at";
      tableName: "subscriptions";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    isPrivate: drizzle_orm_pg_core100.PgColumn<{
      name: "is_private";
      tableName: "subscriptions";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const subscriptionsOpenAPISchema: zod110.ZodObject<{
  userId: zod110.ZodString;
  feedId: zod110.ZodString;
  view: zod110.ZodNumber;
  category: zod110.ZodNullable<zod110.ZodString>;
  title: zod110.ZodNullable<zod110.ZodString>;
  createdAt: zod110.ZodString;
  isPrivate: zod110.ZodBoolean;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  createdAt: string;
  userId: string;
  title: string | null;
  view: number;
  category: string | null;
  feedId: string;
  isPrivate: boolean;
}, {
  createdAt: string;
  userId: string;
  title: string | null;
  view: number;
  category: string | null;
  feedId: string;
  isPrivate: boolean;
}>;
declare const subscriptionsRelations: drizzle_orm142.Relations<"subscriptions", {
  users: drizzle_orm142.One<"user", true>;
  feeds: drizzle_orm142.One<"feeds", true>;
  timeline: drizzle_orm142.Many<"timeline">;
  rsshubUsage: drizzle_orm142.One<"rsshub_usage", true>;
}>;
//#endregion
//#region src/schema/inboxes/entries.d.ts
declare const inboxesEntries: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "inboxes_entries";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "inboxes_entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    title: drizzle_orm_pg_core100.PgColumn<{
      name: "title";
      tableName: "inboxes_entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    url: drizzle_orm_pg_core100.PgColumn<{
      name: "url";
      tableName: "inboxes_entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    content: drizzle_orm_pg_core100.PgColumn<{
      name: "content";
      tableName: "inboxes_entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    description: drizzle_orm_pg_core100.PgColumn<{
      name: "description";
      tableName: "inboxes_entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    guid: drizzle_orm_pg_core100.PgColumn<{
      name: "guid";
      tableName: "inboxes_entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    author: drizzle_orm_pg_core100.PgColumn<{
      name: "author";
      tableName: "inboxes_entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    authorUrl: drizzle_orm_pg_core100.PgColumn<{
      name: "author_url";
      tableName: "inboxes_entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    authorAvatar: drizzle_orm_pg_core100.PgColumn<{
      name: "author_avatar";
      tableName: "inboxes_entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    insertedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "inserted_at";
      tableName: "inboxes_entries";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    publishedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "published_at";
      tableName: "inboxes_entries";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    media: drizzle_orm_pg_core100.PgColumn<{
      name: "media";
      tableName: "inboxes_entries";
      dataType: "json";
      columnType: "PgJsonb";
      data: MediaModel[];
      driverParam: unknown;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      $type: MediaModel[];
    }>;
    categories: drizzle_orm_pg_core100.PgColumn<{
      name: "categories";
      tableName: "inboxes_entries";
      dataType: "array";
      columnType: "PgArray";
      data: string[];
      driverParam: string | string[];
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: drizzle_orm142.Column<{
        name: "categories";
        tableName: "inboxes_entries";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      }, {}, {}>;
      identity: undefined;
      generated: undefined;
    }, {}, {
      baseBuilder: drizzle_orm_pg_core100.PgColumnBuilder<{
        name: "categories";
        dataType: "string";
        columnType: "PgText";
        data: string;
        enumValues: [string, ...string[]];
        driverParam: string;
      }, {}, {}, drizzle_orm142.ColumnBuilderExtraConfig>;
      size: undefined;
    }>;
    attachments: drizzle_orm_pg_core100.PgColumn<{
      name: "attachments";
      tableName: "inboxes_entries";
      dataType: "json";
      columnType: "PgJsonb";
      data: AttachmentsModel[];
      driverParam: unknown;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      $type: AttachmentsModel[];
    }>;
    extra: drizzle_orm_pg_core100.PgColumn<{
      name: "extra";
      tableName: "inboxes_entries";
      dataType: "json";
      columnType: "PgJsonb";
      data: ExtraModel;
      driverParam: unknown;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      $type: ExtraModel;
    }>;
    language: drizzle_orm_pg_core100.PgColumn<{
      name: "language";
      tableName: "inboxes_entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    inboxHandle: drizzle_orm_pg_core100.PgColumn<{
      name: "inbox_handle";
      tableName: "inboxes_entries";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    read: drizzle_orm_pg_core100.PgColumn<{
      name: "read";
      tableName: "inboxes_entries";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const inboxesEntriesOpenAPISchema: z$1.ZodObject<Omit<{
  id: z$1.ZodString;
  title: z$1.ZodNullable<z$1.ZodString>;
  url: z$1.ZodNullable<z$1.ZodString>;
  content: z$1.ZodNullable<z$1.ZodString>;
  description: z$1.ZodNullable<z$1.ZodString>;
  guid: z$1.ZodString;
  author: z$1.ZodNullable<z$1.ZodString>;
  authorUrl: z$1.ZodNullable<z$1.ZodString>;
  authorAvatar: z$1.ZodNullable<z$1.ZodString>;
  insertedAt: z$1.ZodString;
  publishedAt: z$1.ZodString;
  media: z$1.ZodNullable<z$1.ZodType<string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null, z$1.ZodTypeDef, string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null>>;
  categories: z$1.ZodNullable<z$1.ZodArray<z$1.ZodString, "many">>;
  attachments: z$1.ZodNullable<z$1.ZodType<string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null, z$1.ZodTypeDef, string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null>>;
  extra: z$1.ZodNullable<z$1.ZodType<string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null, z$1.ZodTypeDef, string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null>>;
  language: z$1.ZodNullable<z$1.ZodString>;
  inboxHandle: z$1.ZodString;
  read: z$1.ZodNullable<z$1.ZodBoolean>;
}, "media" | "attachments" | "extra"> & {
  attachments: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
    url: z$1.ZodString;
    duration_in_seconds: z$1.ZodOptional<z$1.ZodUnion<[z$1.ZodNumber, z$1.ZodString]>>;
    mime_type: z$1.ZodOptional<z$1.ZodString>;
    size_in_bytes: z$1.ZodOptional<z$1.ZodNumber>;
    title: z$1.ZodOptional<z$1.ZodString>;
  }, "strip", z$1.ZodTypeAny, {
    url: string;
    title?: string | undefined;
    duration_in_seconds?: string | number | undefined;
    mime_type?: string | undefined;
    size_in_bytes?: number | undefined;
  }, {
    url: string;
    title?: string | undefined;
    duration_in_seconds?: string | number | undefined;
    mime_type?: string | undefined;
    size_in_bytes?: number | undefined;
  }>, "many">>>;
  media: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
    url: z$1.ZodString;
    type: z$1.ZodEnum<["photo", "video"]>;
    width: z$1.ZodOptional<z$1.ZodNumber>;
    height: z$1.ZodOptional<z$1.ZodNumber>;
    preview_image_url: z$1.ZodOptional<z$1.ZodString>;
    blurhash: z$1.ZodOptional<z$1.ZodString>;
  }, "strip", z$1.ZodTypeAny, {
    type: "photo" | "video";
    url: string;
    width?: number | undefined;
    height?: number | undefined;
    preview_image_url?: string | undefined;
    blurhash?: string | undefined;
  }, {
    type: "photo" | "video";
    url: string;
    width?: number | undefined;
    height?: number | undefined;
    preview_image_url?: string | undefined;
    blurhash?: string | undefined;
  }>, "many">>>;
  extra: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodObject<{
    links: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
      url: z$1.ZodString;
      type: z$1.ZodString;
      content_html: z$1.ZodOptional<z$1.ZodString>;
    }, "strip", z$1.ZodTypeAny, {
      type: string;
      url: string;
      content_html?: string | undefined;
    }, {
      type: string;
      url: string;
      content_html?: string | undefined;
    }>, "many">>>;
  }, "strip", z$1.ZodTypeAny, {
    links?: {
      type: string;
      url: string;
      content_html?: string | undefined;
    }[] | null | undefined;
  }, {
    links?: {
      type: string;
      url: string;
      content_html?: string | undefined;
    }[] | null | undefined;
  }>>>;
}, "strip", z$1.ZodTypeAny, {
  id: string;
  description: string | null;
  title: string | null;
  content: string | null;
  author: string | null;
  url: string | null;
  language: string | null;
  guid: string;
  categories: string[] | null;
  authorUrl: string | null;
  authorAvatar: string | null;
  insertedAt: string;
  publishedAt: string;
  read: boolean | null;
  inboxHandle: string;
  media?: {
    type: "photo" | "video";
    url: string;
    width?: number | undefined;
    height?: number | undefined;
    preview_image_url?: string | undefined;
    blurhash?: string | undefined;
  }[] | null | undefined;
  attachments?: {
    url: string;
    title?: string | undefined;
    duration_in_seconds?: string | number | undefined;
    mime_type?: string | undefined;
    size_in_bytes?: number | undefined;
  }[] | null | undefined;
  extra?: {
    links?: {
      type: string;
      url: string;
      content_html?: string | undefined;
    }[] | null | undefined;
  } | null | undefined;
}, {
  id: string;
  description: string | null;
  title: string | null;
  content: string | null;
  author: string | null;
  url: string | null;
  language: string | null;
  guid: string;
  categories: string[] | null;
  authorUrl: string | null;
  authorAvatar: string | null;
  insertedAt: string;
  publishedAt: string;
  read: boolean | null;
  inboxHandle: string;
  media?: {
    type: "photo" | "video";
    url: string;
    width?: number | undefined;
    height?: number | undefined;
    preview_image_url?: string | undefined;
    blurhash?: string | undefined;
  }[] | null | undefined;
  attachments?: {
    url: string;
    title?: string | undefined;
    duration_in_seconds?: string | number | undefined;
    mime_type?: string | undefined;
    size_in_bytes?: number | undefined;
  }[] | null | undefined;
  extra?: {
    links?: {
      type: string;
      url: string;
      content_html?: string | undefined;
    }[] | null | undefined;
  } | null | undefined;
}>;
declare const inboxesEntriesInsertOpenAPISchema: z$1.ZodObject<Omit<{
  id: z$1.ZodOptional<z$1.ZodString>;
  description: z$1.ZodOptional<z$1.ZodNullable<z$1.ZodString>>;
  title: z$1.ZodOptional<z$1.ZodNullable<z$1.ZodString>>;
  content: z$1.ZodOptional<z$1.ZodNullable<z$1.ZodString>>;
  author: z$1.ZodOptional<z$1.ZodNullable<z$1.ZodString>>;
  url: z$1.ZodOptional<z$1.ZodNullable<z$1.ZodString>>;
  language: z$1.ZodOptional<z$1.ZodNullable<z$1.ZodString>>;
  guid: z$1.ZodString;
  media: z$1.ZodOptional<z$1.ZodNullable<z$1.ZodType<string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null, z$1.ZodTypeDef, string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null>>>;
  categories: z$1.ZodOptional<z$1.ZodNullable<z$1.ZodArray<z$1.ZodString, "many">>>;
  attachments: z$1.ZodOptional<z$1.ZodNullable<z$1.ZodType<string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null, z$1.ZodTypeDef, string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null>>>;
  extra: z$1.ZodOptional<z$1.ZodNullable<z$1.ZodType<string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null, z$1.ZodTypeDef, string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | (string | number | boolean | /*elided*/any | /*elided*/any | null)[] | null;
  } | (string | number | boolean | {
    [key: string]: string | number | boolean | /*elided*/any | /*elided*/any | null;
  } | /*elided*/any | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null)[] | null>>>;
  authorUrl: z$1.ZodOptional<z$1.ZodNullable<z$1.ZodString>>;
  authorAvatar: z$1.ZodOptional<z$1.ZodNullable<z$1.ZodString>>;
  insertedAt: z$1.ZodString;
  publishedAt: z$1.ZodString;
  read: z$1.ZodOptional<z$1.ZodNullable<z$1.ZodBoolean>>;
  inboxHandle: z$1.ZodString;
}, "id" | "media" | "attachments" | "extra" | "insertedAt" | "publishedAt" | "inboxHandle"> & {
  attachments: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
    url: z$1.ZodString;
    duration_in_seconds: z$1.ZodOptional<z$1.ZodUnion<[z$1.ZodNumber, z$1.ZodString]>>;
    mime_type: z$1.ZodOptional<z$1.ZodString>;
    size_in_bytes: z$1.ZodOptional<z$1.ZodNumber>;
    title: z$1.ZodOptional<z$1.ZodString>;
  }, "strip", z$1.ZodTypeAny, {
    url: string;
    title?: string | undefined;
    duration_in_seconds?: string | number | undefined;
    mime_type?: string | undefined;
    size_in_bytes?: number | undefined;
  }, {
    url: string;
    title?: string | undefined;
    duration_in_seconds?: string | number | undefined;
    mime_type?: string | undefined;
    size_in_bytes?: number | undefined;
  }>, "many">>>;
  media: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
    url: z$1.ZodString;
    type: z$1.ZodEnum<["photo", "video"]>;
    width: z$1.ZodOptional<z$1.ZodNumber>;
    height: z$1.ZodOptional<z$1.ZodNumber>;
    preview_image_url: z$1.ZodOptional<z$1.ZodString>;
    blurhash: z$1.ZodOptional<z$1.ZodString>;
  }, "strip", z$1.ZodTypeAny, {
    type: "photo" | "video";
    url: string;
    width?: number | undefined;
    height?: number | undefined;
    preview_image_url?: string | undefined;
    blurhash?: string | undefined;
  }, {
    type: "photo" | "video";
    url: string;
    width?: number | undefined;
    height?: number | undefined;
    preview_image_url?: string | undefined;
    blurhash?: string | undefined;
  }>, "many">>>;
  extra: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodObject<{
    links: z$1.ZodNullable<z$1.ZodOptional<z$1.ZodArray<z$1.ZodObject<{
      url: z$1.ZodString;
      type: z$1.ZodString;
      content_html: z$1.ZodOptional<z$1.ZodString>;
    }, "strip", z$1.ZodTypeAny, {
      type: string;
      url: string;
      content_html?: string | undefined;
    }, {
      type: string;
      url: string;
      content_html?: string | undefined;
    }>, "many">>>;
  }, "strip", z$1.ZodTypeAny, {
    links?: {
      type: string;
      url: string;
      content_html?: string | undefined;
    }[] | null | undefined;
  }, {
    links?: {
      type: string;
      url: string;
      content_html?: string | undefined;
    }[] | null | undefined;
  }>>>;
  publishedAt: z$1.ZodString;
}, "strip", z$1.ZodTypeAny, {
  guid: string;
  publishedAt: string;
  description?: string | null | undefined;
  title?: string | null | undefined;
  content?: string | null | undefined;
  author?: string | null | undefined;
  url?: string | null | undefined;
  language?: string | null | undefined;
  media?: {
    type: "photo" | "video";
    url: string;
    width?: number | undefined;
    height?: number | undefined;
    preview_image_url?: string | undefined;
    blurhash?: string | undefined;
  }[] | null | undefined;
  categories?: string[] | null | undefined;
  attachments?: {
    url: string;
    title?: string | undefined;
    duration_in_seconds?: string | number | undefined;
    mime_type?: string | undefined;
    size_in_bytes?: number | undefined;
  }[] | null | undefined;
  extra?: {
    links?: {
      type: string;
      url: string;
      content_html?: string | undefined;
    }[] | null | undefined;
  } | null | undefined;
  authorUrl?: string | null | undefined;
  authorAvatar?: string | null | undefined;
  read?: boolean | null | undefined;
}, {
  guid: string;
  publishedAt: string;
  description?: string | null | undefined;
  title?: string | null | undefined;
  content?: string | null | undefined;
  author?: string | null | undefined;
  url?: string | null | undefined;
  language?: string | null | undefined;
  media?: {
    type: "photo" | "video";
    url: string;
    width?: number | undefined;
    height?: number | undefined;
    preview_image_url?: string | undefined;
    blurhash?: string | undefined;
  }[] | null | undefined;
  categories?: string[] | null | undefined;
  attachments?: {
    url: string;
    title?: string | undefined;
    duration_in_seconds?: string | number | undefined;
    mime_type?: string | undefined;
    size_in_bytes?: number | undefined;
  }[] | null | undefined;
  extra?: {
    links?: {
      type: string;
      url: string;
      content_html?: string | undefined;
    }[] | null | undefined;
  } | null | undefined;
  authorUrl?: string | null | undefined;
  authorAvatar?: string | null | undefined;
  read?: boolean | null | undefined;
}>;
declare const inboxesEntriesRelations: drizzle_orm142.Relations<"inboxes_entries", {
  inboxes: drizzle_orm142.One<"inboxes", true>;
}>;
type inboxesEntriesModel = InferInsertModel<typeof inboxesEntries> & {
  attachments?: AttachmentsModel[] | null;
  media?: MediaModel[] | null;
};
//#endregion
//#region src/schema/inboxes/inboxes.d.ts
declare const inboxes: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "inboxes";
  schema: undefined;
  columns: {
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "inboxes";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    handle: drizzle_orm_pg_core100.PgColumn<{
      name: "handle";
      tableName: "inboxes";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    secret: drizzle_orm_pg_core100.PgColumn<{
      name: "secret";
      tableName: "inboxes";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    title: drizzle_orm_pg_core100.PgColumn<{
      name: "title";
      tableName: "inboxes";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const inboxesOpenAPISchema: z$1.ZodObject<{
  userId: z$1.ZodString;
  handle: z$1.ZodString;
  secret: z$1.ZodString;
  title: z$1.ZodNullable<z$1.ZodString>;
}, z$1.UnknownKeysParam, z$1.ZodTypeAny, {
  handle: string;
  userId: string;
  title: string | null;
  secret: string;
}, {
  handle: string;
  userId: string;
  title: string | null;
  secret: string;
}>;
declare const inboxesRelations: drizzle_orm142.Relations<"inboxes", {
  users: drizzle_orm142.One<"user", true>;
  entries: drizzle_orm142.Many<"inboxes_entries">;
}>;
declare const inboxHandleSchema: z$1.ZodString;
//#endregion
//#region src/schema/invitations.d.ts
declare const invitations: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "invitations";
  schema: undefined;
  columns: {
    code: drizzle_orm_pg_core100.PgColumn<{
      name: "code";
      tableName: "invitations";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "created_at";
      tableName: "invitations";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    usedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "used_at";
      tableName: "invitations";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    fromUserId: drizzle_orm_pg_core100.PgColumn<{
      name: "from_user_id";
      tableName: "invitations";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    toUserId: drizzle_orm_pg_core100.PgColumn<{
      name: "to_user_id";
      tableName: "invitations";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const invitationsOpenAPISchema: zod110.ZodObject<{
  code: zod110.ZodString;
  createdAt: zod110.ZodNullable<zod110.ZodString>;
  usedAt: zod110.ZodNullable<zod110.ZodString>;
  fromUserId: zod110.ZodString;
  toUserId: zod110.ZodNullable<zod110.ZodString>;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  code: string;
  createdAt: string | null;
  usedAt: string | null;
  fromUserId: string;
  toUserId: string | null;
}, {
  code: string;
  createdAt: string | null;
  usedAt: string | null;
  fromUserId: string;
  toUserId: string | null;
}>;
type InvitationDB = typeof invitations.$inferSelect;
declare const invitationsRelations: drizzle_orm142.Relations<"invitations", {
  users: drizzle_orm142.One<"user", false>;
}>;
//#endregion
//#region src/schema/lists/analytics.d.ts
declare const listAnalytics: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "list_analytics";
  schema: undefined;
  columns: {
    listId: drizzle_orm_pg_core100.PgColumn<{
      name: "list_id";
      tableName: "list_analytics";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    subscriptionCount: drizzle_orm_pg_core100.PgColumn<{
      name: "subscription_count";
      tableName: "list_analytics";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const listAnalyticsOpenAPISchema: zod110.ZodObject<{
  listId: zod110.ZodString;
  subscriptionCount: zod110.ZodNullable<zod110.ZodNumber>;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  subscriptionCount: number | null;
  listId: string;
}, {
  subscriptionCount: number | null;
  listId: string;
}>;
declare const listAnalyticsRelations: drizzle_orm142.Relations<"list_analytics", {
  list: drizzle_orm142.One<"lists", true>;
}>;
//#endregion
//#region src/schema/lists/lists.d.ts
declare const lists: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "lists";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "lists";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    feedIds: drizzle_orm_pg_core100.PgColumn<{
      name: "feed_ids";
      tableName: "lists";
      dataType: "array";
      columnType: "PgArray";
      data: string[];
      driverParam: string | string[];
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: drizzle_orm142.Column<{
        name: "feed_ids";
        tableName: "lists";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      }, {}, {}>;
      identity: undefined;
      generated: undefined;
    }, {}, {
      baseBuilder: drizzle_orm_pg_core100.PgColumnBuilder<{
        name: "feed_ids";
        dataType: "string";
        columnType: "PgText";
        data: string;
        enumValues: [string, ...string[]];
        driverParam: string;
      }, {}, {}, drizzle_orm142.ColumnBuilderExtraConfig>;
      size: undefined;
    }>;
    title: drizzle_orm_pg_core100.PgColumn<{
      name: "title";
      tableName: "lists";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    description: drizzle_orm_pg_core100.PgColumn<{
      name: "description";
      tableName: "lists";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    image: drizzle_orm_pg_core100.PgColumn<{
      name: "image";
      tableName: "lists";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    view: drizzle_orm_pg_core100.PgColumn<{
      name: "view";
      tableName: "lists";
      dataType: "number";
      columnType: "PgSmallInt";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    fee: drizzle_orm_pg_core100.PgColumn<{
      name: "fee";
      tableName: "lists";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    language: drizzle_orm_pg_core100.PgColumn<{
      name: "language";
      tableName: "lists";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    ownerUserId: drizzle_orm_pg_core100.PgColumn<{
      name: "owner_user_id";
      tableName: "lists";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "created_at";
      tableName: "lists";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    updatedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "updated_at";
      tableName: "lists";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const listsOpenAPISchema: zod110.ZodObject<{
  id: zod110.ZodString;
  feedIds: zod110.ZodArray<zod110.ZodString, "many">;
  title: zod110.ZodString;
  description: zod110.ZodNullable<zod110.ZodString>;
  image: zod110.ZodNullable<zod110.ZodString>;
  view: zod110.ZodNumber;
  fee: zod110.ZodNumber;
  language: zod110.ZodNullable<zod110.ZodString>;
  ownerUserId: zod110.ZodString;
  createdAt: zod110.ZodNullable<zod110.ZodString>;
  updatedAt: zod110.ZodNullable<zod110.ZodString>;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  id: string;
  image: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  description: string | null;
  title: string;
  view: number;
  ownerUserId: string;
  language: string | null;
  feedIds: string[];
  fee: number;
}, {
  id: string;
  image: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  description: string | null;
  title: string;
  view: number;
  ownerUserId: string;
  language: string | null;
  feedIds: string[];
  fee: number;
}>;
declare const listsRelations: drizzle_orm142.Relations<"lists", {
  owner: drizzle_orm142.One<"user", true>;
  listsSubscriptions: drizzle_orm142.Many<"lists_subscriptions">;
}>;
type ListModel = InferInsertModel<typeof lists>;
//#endregion
//#region src/schema/lists/subscriptions.d.ts
declare const listsSubscriptions: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "lists_subscriptions";
  schema: undefined;
  columns: {
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "lists_subscriptions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    listId: drizzle_orm_pg_core100.PgColumn<{
      name: "list_id";
      tableName: "lists_subscriptions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    view: drizzle_orm_pg_core100.PgColumn<{
      name: "view";
      tableName: "lists_subscriptions";
      dataType: "number";
      columnType: "PgSmallInt";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    title: drizzle_orm_pg_core100.PgColumn<{
      name: "title";
      tableName: "lists_subscriptions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "created_at";
      tableName: "lists_subscriptions";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    isPrivate: drizzle_orm_pg_core100.PgColumn<{
      name: "is_private";
      tableName: "lists_subscriptions";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const listsSubscriptionsOpenAPISchema: zod110.ZodObject<{
  userId: zod110.ZodString;
  listId: zod110.ZodString;
  view: zod110.ZodNumber;
  title: zod110.ZodNullable<zod110.ZodString>;
  createdAt: zod110.ZodString;
  isPrivate: zod110.ZodBoolean;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  createdAt: string;
  userId: string;
  title: string | null;
  view: number;
  isPrivate: boolean;
  listId: string;
}, {
  createdAt: string;
  userId: string;
  title: string | null;
  view: number;
  isPrivate: boolean;
  listId: string;
}>;
declare const listsSubscriptionsRelations: drizzle_orm142.Relations<"lists_subscriptions", {
  users: drizzle_orm142.One<"user", true>;
  lists: drizzle_orm142.One<"lists", true>;
}>;
//#endregion
//#region src/schema/messaging.d.ts
declare const messaging: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "messaging";
  schema: undefined;
  columns: {
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "messaging";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    token: drizzle_orm_pg_core100.PgColumn<{
      name: "token";
      tableName: "messaging";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    channel: drizzle_orm_pg_core100.PgColumn<{
      name: "channel";
      tableName: "messaging";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const messagingOpenAPISchema: z$1.ZodObject<Omit<{
  userId: z$1.ZodNullable<z$1.ZodString>;
  token: z$1.ZodString;
  channel: z$1.ZodString;
}, "channel"> & {
  channel: z$1.ZodEnum<["macos", "windows", "linux", "ios", "android", "web", "desktop"]>;
}, "strip", z$1.ZodTypeAny, {
  userId: string | null;
  token: string;
  channel: "macos" | "windows" | "linux" | "ios" | "android" | "web" | "desktop";
}, {
  userId: string | null;
  token: string;
  channel: "macos" | "windows" | "linux" | "ios" | "android" | "web" | "desktop";
}>;
declare const messagingRelations: drizzle_orm142.Relations<"messaging", {
  users: drizzle_orm142.One<"user", false>;
}>;
declare enum MessagingType {
  NewEntry = "new-entry",
}
type MessagingData = {
  type: MessagingType.NewEntry;
  feedId: string;
  entryId: string;
  view: string;
  title: string;
  description: string;
};
//#endregion
//#region src/schema/readability.d.ts
declare const readabilities: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "readabilities";
  schema: undefined;
  columns: {
    entryId: drizzle_orm_pg_core100.PgColumn<{
      name: "entry_id";
      tableName: "readabilities";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    content: drizzle_orm_pg_core100.PgColumn<{
      name: "content";
      tableName: "readabilities";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    updatedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "updated_at";
      tableName: "readabilities";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
//#endregion
//#region src/schema/rsshub.d.ts
declare const rsshub: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "rsshub";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "rsshub";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    baseUrl: drizzle_orm_pg_core100.PgColumn<{
      name: "base_url";
      tableName: "rsshub";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    accessKey: drizzle_orm_pg_core100.PgColumn<{
      name: "access_key";
      tableName: "rsshub";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    ownerUserId: drizzle_orm_pg_core100.PgColumn<{
      name: "owner_user_id";
      tableName: "rsshub";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    price: drizzle_orm_pg_core100.PgColumn<{
      name: "price";
      tableName: "rsshub";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    description: drizzle_orm_pg_core100.PgColumn<{
      name: "description";
      tableName: "rsshub";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userLimit: drizzle_orm_pg_core100.PgColumn<{
      name: "user_limit";
      tableName: "rsshub";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    errorMessage: drizzle_orm_pg_core100.PgColumn<{
      name: "error_message";
      tableName: "rsshub";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    errorAt: drizzle_orm_pg_core100.PgColumn<{
      name: "error_at";
      tableName: "rsshub";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const rsshubOpenAPISchema: zod110.ZodObject<{
  id: zod110.ZodString;
  baseUrl: zod110.ZodString;
  accessKey: zod110.ZodNullable<zod110.ZodString>;
  ownerUserId: zod110.ZodString;
  price: zod110.ZodNumber;
  description: zod110.ZodNullable<zod110.ZodString>;
  userLimit: zod110.ZodNullable<zod110.ZodNumber>;
  errorMessage: zod110.ZodNullable<zod110.ZodString>;
  errorAt: zod110.ZodNullable<zod110.ZodString>;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  id: string;
  description: string | null;
  errorMessage: string | null;
  errorAt: string | null;
  ownerUserId: string;
  baseUrl: string;
  accessKey: string | null;
  price: number;
  userLimit: number | null;
}, {
  id: string;
  description: string | null;
  errorMessage: string | null;
  errorAt: string | null;
  ownerUserId: string;
  baseUrl: string;
  accessKey: string | null;
  price: number;
  userLimit: number | null;
}>;
declare const rsshubUsage: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "rsshub_usage";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "rsshub_usage";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    rsshubId: drizzle_orm_pg_core100.PgColumn<{
      name: "rsshub_id";
      tableName: "rsshub_usage";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "rsshub_usage";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const rsshubUsageOpenAPISchema: zod110.ZodObject<{
  id: zod110.ZodString;
  rsshubId: zod110.ZodString;
  userId: zod110.ZodString;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  id: string;
  userId: string;
  rsshubId: string;
}, {
  id: string;
  userId: string;
  rsshubId: string;
}>;
declare const rsshubUsageRelations: drizzle_orm142.Relations<"rsshub_usage", {
  rsshub: drizzle_orm142.One<"rsshub", true>;
}>;
//#endregion
//#region src/schema/rsshub-analytics.d.ts
declare const rsshubAnalytics: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "rsshub_analytics";
  schema: undefined;
  columns: {
    rsshubId: drizzle_orm_pg_core100.PgColumn<{
      name: "rsshub_id";
      tableName: "rsshub_analytics";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    rsshubRoute: drizzle_orm_pg_core100.PgColumn<{
      name: "rsshub_route";
      tableName: "rsshub_analytics";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    rsshubNamespace: drizzle_orm_pg_core100.PgColumn<{
      name: "rsshub_namespace";
      tableName: "rsshub_analytics";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    successCount: drizzle_orm_pg_core100.PgColumn<{
      name: "success_count";
      tableName: "rsshub_analytics";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    errorCount: drizzle_orm_pg_core100.PgColumn<{
      name: "error_count";
      tableName: "rsshub_analytics";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    timestamp: drizzle_orm_pg_core100.PgColumn<{
      name: "timestamp";
      tableName: "rsshub_analytics";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const rsshubAnalyticsOpenAPISchema: zod110.ZodObject<{
  rsshubId: zod110.ZodString;
  rsshubRoute: zod110.ZodString;
  rsshubNamespace: zod110.ZodString;
  successCount: zod110.ZodNumber;
  errorCount: zod110.ZodNumber;
  timestamp: zod110.ZodString;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  rsshubRoute: string;
  rsshubNamespace: string;
  rsshubId: string;
  successCount: number;
  errorCount: number;
  timestamp: string;
}, {
  rsshubRoute: string;
  rsshubNamespace: string;
  rsshubId: string;
  successCount: number;
  errorCount: number;
  timestamp: string;
}>;
//#endregion
//#region src/schema/settings.d.ts
declare const settings: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "settings";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "settings";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "settings";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    tab: drizzle_orm_pg_core100.PgColumn<{
      name: "tab";
      tableName: "settings";
      dataType: "string";
      columnType: "PgText";
      data: "general" | "appearance" | "integration" | "ai";
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: ["general", "appearance", "integration", "ai"];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    payload: drizzle_orm_pg_core100.PgColumn<{
      name: "payload";
      tableName: "settings";
      dataType: "json";
      columnType: "PgJsonb";
      data: Record<string, any>;
      driverParam: unknown;
      notNull: false;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      $type: Record<string, any>;
    }>;
    updateAt: drizzle_orm_pg_core100.PgColumn<{
      name: "update_at";
      tableName: "settings";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    version: drizzle_orm_pg_core100.PgColumn<{
      name: "version";
      tableName: "settings";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
//#endregion
//#region src/schema/timeline.d.ts
declare const timeline: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "timeline";
  schema: undefined;
  columns: {
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "timeline";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    feedId: drizzle_orm_pg_core100.PgColumn<{
      name: "feedId";
      tableName: "timeline";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    entryId: drizzle_orm_pg_core100.PgColumn<{
      name: "entry_id";
      tableName: "timeline";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    publishedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "published_at";
      tableName: "timeline";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    insertedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "inserted_at";
      tableName: "timeline";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    view: drizzle_orm_pg_core100.PgColumn<{
      name: "view";
      tableName: "timeline";
      dataType: "number";
      columnType: "PgSmallInt";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    read: drizzle_orm_pg_core100.PgColumn<{
      name: "read";
      tableName: "timeline";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    from: drizzle_orm_pg_core100.PgColumn<{
      name: "from";
      tableName: "timeline";
      dataType: "array";
      columnType: "PgArray";
      data: string[];
      driverParam: string | string[];
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: drizzle_orm142.Column<{
        name: "from";
        tableName: "timeline";
        dataType: "string";
        columnType: "PgText";
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      }, {}, {}>;
      identity: undefined;
      generated: undefined;
    }, {}, {
      baseBuilder: drizzle_orm_pg_core100.PgColumnBuilder<{
        name: "from";
        dataType: "string";
        columnType: "PgText";
        data: string;
        enumValues: [string, ...string[]];
        driverParam: string;
      }, {}, {}, drizzle_orm142.ColumnBuilderExtraConfig>;
      size: undefined;
    }>;
  };
  dialect: "pg";
}>;
declare const timelineOpenAPISchema: zod110.ZodObject<{
  userId: zod110.ZodString;
  feedId: zod110.ZodString;
  entryId: zod110.ZodString;
  publishedAt: zod110.ZodString;
  insertedAt: zod110.ZodString;
  view: zod110.ZodNumber;
  read: zod110.ZodNullable<zod110.ZodBoolean>;
  from: zod110.ZodNullable<zod110.ZodArray<zod110.ZodString, "many">>;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  userId: string;
  view: number;
  from: string[] | null;
  feedId: string;
  insertedAt: string;
  publishedAt: string;
  entryId: string;
  read: boolean | null;
}, {
  userId: string;
  view: number;
  from: string[] | null;
  feedId: string;
  insertedAt: string;
  publishedAt: string;
  entryId: string;
  read: boolean | null;
}>;
declare const timelineRelations: drizzle_orm142.Relations<"timeline", {
  entries: drizzle_orm142.One<"entries", true>;
  feeds: drizzle_orm142.One<"feeds", true>;
  collections: drizzle_orm142.One<"collections", true>;
  subscriptions: drizzle_orm142.One<"subscriptions", true>;
}>;
//#endregion
//#region src/schema/trendings/feeds.d.ts
declare const trendingFeeds: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "trendings_feeds";
  schema: undefined;
  columns: {
    feedId: drizzle_orm_pg_core100.PgColumn<{
      name: "feed_id";
      tableName: "trendings_feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    rankedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "ranked_at";
      tableName: "trendings_feeds";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    score1d: drizzle_orm_pg_core100.PgColumn<{
      name: "score_1d";
      tableName: "trendings_feeds";
      dataType: "string";
      columnType: "PgNumeric";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    score3d: drizzle_orm_pg_core100.PgColumn<{
      name: "score_3d";
      tableName: "trendings_feeds";
      dataType: "string";
      columnType: "PgNumeric";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    score7d: drizzle_orm_pg_core100.PgColumn<{
      name: "score_7d";
      tableName: "trendings_feeds";
      dataType: "string";
      columnType: "PgNumeric";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    score30d: drizzle_orm_pg_core100.PgColumn<{
      name: "score_30d";
      tableName: "trendings_feeds";
      dataType: "string";
      columnType: "PgNumeric";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    view: drizzle_orm_pg_core100.PgColumn<{
      name: "view";
      tableName: "trendings_feeds";
      dataType: "number";
      columnType: "PgSmallInt";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    language: drizzle_orm_pg_core100.PgColumn<{
      name: "language";
      tableName: "trendings_feeds";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    nsfw: drizzle_orm_pg_core100.PgColumn<{
      name: "nsfw";
      tableName: "trendings_feeds";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const trendingFeedsRelations: drizzle_orm142.Relations<"trendings_feeds", {
  feed: drizzle_orm142.One<"feeds", true>;
}>;
declare const trendingFeedsOpenAPISchema: zod110.ZodObject<{
  feedId: zod110.ZodString;
  rankedAt: zod110.ZodString;
  score1d: zod110.ZodString;
  score3d: zod110.ZodString;
  score7d: zod110.ZodString;
  score30d: zod110.ZodString;
  view: zod110.ZodNumber;
  language: zod110.ZodString;
  nsfw: zod110.ZodNullable<zod110.ZodBoolean>;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  view: number;
  language: string;
  nsfw: boolean | null;
  feedId: string;
  rankedAt: string;
  score1d: string;
  score3d: string;
  score7d: string;
  score30d: string;
}, {
  view: number;
  language: string;
  nsfw: boolean | null;
  feedId: string;
  rankedAt: string;
  score1d: string;
  score3d: string;
  score7d: string;
  score30d: string;
}>;
//#endregion
//#region src/lib/constants.d.ts
declare enum UploadType {
  Avatar = "avatar",
}
//#endregion
//#region src/schema/uploads.d.ts
declare const uploads: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "uploads";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "uploads";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "uploads";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    url: drizzle_orm_pg_core100.PgColumn<{
      name: "url";
      tableName: "uploads";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    md5: drizzle_orm_pg_core100.PgColumn<{
      name: "md5";
      tableName: "uploads";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    mimeType: drizzle_orm_pg_core100.PgColumn<{
      name: "mime_type";
      tableName: "uploads";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    size: drizzle_orm_pg_core100.PgColumn<{
      name: "size";
      tableName: "uploads";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    type: drizzle_orm_pg_core100.PgColumn<{
      name: "type";
      tableName: "uploads";
      dataType: "string";
      columnType: "PgText";
      data: UploadType;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [UploadType];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
//#endregion
//#region src/schema/users.d.ts
declare const user$1: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "user";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "user";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    name: drizzle_orm_pg_core100.PgColumn<{
      name: "name";
      tableName: "user";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 64;
    }>;
    email: drizzle_orm_pg_core100.PgColumn<{
      name: "email";
      tableName: "user";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 64;
    }>;
    emailVerified: drizzle_orm_pg_core100.PgColumn<{
      name: "emailVerified";
      tableName: "user";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    image: drizzle_orm_pg_core100.PgColumn<{
      name: "image";
      tableName: "user";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 256;
    }>;
    handle: drizzle_orm_pg_core100.PgColumn<{
      name: "handle";
      tableName: "user";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 36;
    }>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "created_at";
      tableName: "user";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    updatedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "updatedAt";
      tableName: "user";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    twoFactorEnabled: drizzle_orm_pg_core100.PgColumn<{
      name: "two_factor_enabled";
      tableName: "user";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    isAnonymous: drizzle_orm_pg_core100.PgColumn<{
      name: "is_anonymous";
      tableName: "user";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    suspended: drizzle_orm_pg_core100.PgColumn<{
      name: "suspended";
      tableName: "user";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    deleted: drizzle_orm_pg_core100.PgColumn<{
      name: "deleted";
      tableName: "user";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    bio: drizzle_orm_pg_core100.PgColumn<{
      name: "bio";
      tableName: "user";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 256;
    }>;
    website: drizzle_orm_pg_core100.PgColumn<{
      name: "website";
      tableName: "user";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 256;
    }>;
    socialLinks: drizzle_orm_pg_core100.PgColumn<{
      name: "social_links";
      tableName: "user";
      dataType: "json";
      columnType: "PgJsonb";
      data: {
        twitter: string;
        github: string;
        instagram: string;
        facebook: string;
        youtube: string;
      };
      driverParam: unknown;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      $type: {
        twitter: string;
        github: string;
        instagram: string;
        facebook: string;
        youtube: string;
      };
    }>;
    stripeCustomerId: drizzle_orm_pg_core100.PgColumn<{
      name: "stripe_customer_id";
      tableName: "user";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    role: drizzle_orm_pg_core100.PgColumn<{
      name: "role";
      tableName: "user";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    roleEndAt: drizzle_orm_pg_core100.PgColumn<{
      name: "role_end_at";
      tableName: "user";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const users: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "user";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "user";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    name: drizzle_orm_pg_core100.PgColumn<{
      name: "name";
      tableName: "user";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 64;
    }>;
    email: drizzle_orm_pg_core100.PgColumn<{
      name: "email";
      tableName: "user";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 64;
    }>;
    emailVerified: drizzle_orm_pg_core100.PgColumn<{
      name: "emailVerified";
      tableName: "user";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    image: drizzle_orm_pg_core100.PgColumn<{
      name: "image";
      tableName: "user";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 256;
    }>;
    handle: drizzle_orm_pg_core100.PgColumn<{
      name: "handle";
      tableName: "user";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 36;
    }>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "created_at";
      tableName: "user";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    updatedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "updatedAt";
      tableName: "user";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    twoFactorEnabled: drizzle_orm_pg_core100.PgColumn<{
      name: "two_factor_enabled";
      tableName: "user";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    isAnonymous: drizzle_orm_pg_core100.PgColumn<{
      name: "is_anonymous";
      tableName: "user";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    suspended: drizzle_orm_pg_core100.PgColumn<{
      name: "suspended";
      tableName: "user";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    deleted: drizzle_orm_pg_core100.PgColumn<{
      name: "deleted";
      tableName: "user";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    bio: drizzle_orm_pg_core100.PgColumn<{
      name: "bio";
      tableName: "user";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 256;
    }>;
    website: drizzle_orm_pg_core100.PgColumn<{
      name: "website";
      tableName: "user";
      dataType: "string";
      columnType: "PgVarchar";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      length: 256;
    }>;
    socialLinks: drizzle_orm_pg_core100.PgColumn<{
      name: "social_links";
      tableName: "user";
      dataType: "json";
      columnType: "PgJsonb";
      data: {
        twitter: string;
        github: string;
        instagram: string;
        facebook: string;
        youtube: string;
      };
      driverParam: unknown;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {
      $type: {
        twitter: string;
        github: string;
        instagram: string;
        facebook: string;
        youtube: string;
      };
    }>;
    stripeCustomerId: drizzle_orm_pg_core100.PgColumn<{
      name: "stripe_customer_id";
      tableName: "user";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    role: drizzle_orm_pg_core100.PgColumn<{
      name: "role";
      tableName: "user";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    roleEndAt: drizzle_orm_pg_core100.PgColumn<{
      name: "role_end_at";
      tableName: "user";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare function lower(handle: AnyPgColumn): SQL;
declare const usersOpenApiSchema: zod110.ZodObject<Omit<{
  id: zod110.ZodString;
  name: zod110.ZodNullable<zod110.ZodString>;
  email: zod110.ZodString;
  emailVerified: zod110.ZodNullable<zod110.ZodBoolean>;
  image: zod110.ZodNullable<zod110.ZodString>;
  handle: zod110.ZodNullable<zod110.ZodString>;
  createdAt: zod110.ZodDate;
  updatedAt: zod110.ZodDate;
  twoFactorEnabled: zod110.ZodNullable<zod110.ZodBoolean>;
  isAnonymous: zod110.ZodNullable<zod110.ZodBoolean>;
  suspended: zod110.ZodNullable<zod110.ZodBoolean>;
  deleted: zod110.ZodNullable<zod110.ZodBoolean>;
  bio: zod110.ZodNullable<zod110.ZodString>;
  website: zod110.ZodNullable<zod110.ZodString>;
  socialLinks: zod110.ZodNullable<zod110.ZodType<{
    twitter: string;
    github: string;
    instagram: string;
    facebook: string;
    youtube: string;
  }, zod110.ZodTypeDef, {
    twitter: string;
    github: string;
    instagram: string;
    facebook: string;
    youtube: string;
  }>>;
  stripeCustomerId: zod110.ZodNullable<zod110.ZodString>;
  role: zod110.ZodNullable<zod110.ZodString>;
  roleEndAt: zod110.ZodNullable<zod110.ZodDate>;
}, "email">, "strip", zod110.ZodTypeAny, {
  id: string;
  name: string | null;
  emailVerified: boolean | null;
  image: string | null;
  handle: string | null;
  createdAt: Date;
  updatedAt: Date;
  twoFactorEnabled: boolean | null;
  isAnonymous: boolean | null;
  suspended: boolean | null;
  deleted: boolean | null;
  bio: string | null;
  website: string | null;
  socialLinks: {
    twitter: string;
    github: string;
    instagram: string;
    facebook: string;
    youtube: string;
  } | null;
  stripeCustomerId: string | null;
  role: string | null;
  roleEndAt: Date | null;
}, {
  id: string;
  name: string | null;
  emailVerified: boolean | null;
  image: string | null;
  handle: string | null;
  createdAt: Date;
  updatedAt: Date;
  twoFactorEnabled: boolean | null;
  isAnonymous: boolean | null;
  suspended: boolean | null;
  deleted: boolean | null;
  bio: string | null;
  website: string | null;
  socialLinks: {
    twitter: string;
    github: string;
    instagram: string;
    facebook: string;
    youtube: string;
  } | null;
  stripeCustomerId: string | null;
  role: string | null;
  roleEndAt: Date | null;
}>;
declare const account: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "account";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "account";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "userId";
      tableName: "account";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    providerId: drizzle_orm_pg_core100.PgColumn<{
      name: "provider";
      tableName: "account";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    accountId: drizzle_orm_pg_core100.PgColumn<{
      name: "providerAccountId";
      tableName: "account";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    refreshToken: drizzle_orm_pg_core100.PgColumn<{
      name: "refresh_token";
      tableName: "account";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    accessToken: drizzle_orm_pg_core100.PgColumn<{
      name: "access_token";
      tableName: "account";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    accessTokenExpiresAt: drizzle_orm_pg_core100.PgColumn<{
      name: "expires_at";
      tableName: "account";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    refreshTokenExpiresAt: drizzle_orm_pg_core100.PgColumn<{
      name: "refreshTokenExpiresAt";
      tableName: "account";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    scope: drizzle_orm_pg_core100.PgColumn<{
      name: "scope";
      tableName: "account";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    idToken: drizzle_orm_pg_core100.PgColumn<{
      name: "id_token";
      tableName: "account";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    password: drizzle_orm_pg_core100.PgColumn<{
      name: "password";
      tableName: "account";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "createdAt";
      tableName: "account";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    updatedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "updatedAt";
      tableName: "account";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const session: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "session";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "session";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    token: drizzle_orm_pg_core100.PgColumn<{
      name: "sessionToken";
      tableName: "session";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "userId";
      tableName: "session";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    expiresAt: drizzle_orm_pg_core100.PgColumn<{
      name: "expires";
      tableName: "session";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "createdAt";
      tableName: "session";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    updatedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "updatedAt";
      tableName: "session";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    ipAddress: drizzle_orm_pg_core100.PgColumn<{
      name: "ipAddress";
      tableName: "session";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userAgent: drizzle_orm_pg_core100.PgColumn<{
      name: "userAgent";
      tableName: "session";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const verification: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "verificationToken";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "verificationToken";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    identifier: drizzle_orm_pg_core100.PgColumn<{
      name: "identifier";
      tableName: "verificationToken";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    value: drizzle_orm_pg_core100.PgColumn<{
      name: "token";
      tableName: "verificationToken";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    expiresAt: drizzle_orm_pg_core100.PgColumn<{
      name: "expires";
      tableName: "verificationToken";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "createdAt";
      tableName: "verificationToken";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    updatedAt: drizzle_orm_pg_core100.PgColumn<{
      name: "updatedAt";
      tableName: "verificationToken";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const twoFactor: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "two_factor";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "two_factor";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    secret: drizzle_orm_pg_core100.PgColumn<{
      name: "secret";
      tableName: "two_factor";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    backupCodes: drizzle_orm_pg_core100.PgColumn<{
      name: "backup_codes";
      tableName: "two_factor";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "user_id";
      tableName: "two_factor";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const stripeSubscriptions: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "stripe_subscriptions";
  schema: undefined;
  columns: {
    id: drizzle_orm_pg_core100.PgColumn<{
      name: "id";
      tableName: "stripe_subscriptions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: true;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    plan: drizzle_orm_pg_core100.PgColumn<{
      name: "plan";
      tableName: "stripe_subscriptions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    referenceId: drizzle_orm_pg_core100.PgColumn<{
      name: "reference_id";
      tableName: "stripe_subscriptions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    stripeCustomerId: drizzle_orm_pg_core100.PgColumn<{
      name: "stripe_customer_id";
      tableName: "stripe_subscriptions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    stripeSubscriptionId: drizzle_orm_pg_core100.PgColumn<{
      name: "stripe_subscription_id";
      tableName: "stripe_subscriptions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    status: drizzle_orm_pg_core100.PgColumn<{
      name: "status";
      tableName: "stripe_subscriptions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    periodStart: drizzle_orm_pg_core100.PgColumn<{
      name: "period_start";
      tableName: "stripe_subscriptions";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    periodEnd: drizzle_orm_pg_core100.PgColumn<{
      name: "period_end";
      tableName: "stripe_subscriptions";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    cancelAtPeriodEnd: drizzle_orm_pg_core100.PgColumn<{
      name: "cancel_at_period_end";
      tableName: "stripe_subscriptions";
      dataType: "boolean";
      columnType: "PgBoolean";
      data: boolean;
      driverParam: boolean;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    seats: drizzle_orm_pg_core100.PgColumn<{
      name: "seats";
      tableName: "stripe_subscriptions";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    trialStart: drizzle_orm_pg_core100.PgColumn<{
      name: "trial_start";
      tableName: "stripe_subscriptions";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    trialEnd: drizzle_orm_pg_core100.PgColumn<{
      name: "trial_end";
      tableName: "stripe_subscriptions";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const applePayTransactions: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "apple_pay_transactions";
  schema: undefined;
  columns: {
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "userId";
      tableName: "apple_pay_transactions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    signedTransaction: drizzle_orm_pg_core100.PgColumn<{
      name: "signed_transaction";
      tableName: "apple_pay_transactions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const usersRelations: drizzle_orm142.Relations<"user", {
  subscriptions: drizzle_orm142.Many<"subscriptions">;
  listsSubscriptions: drizzle_orm142.Many<"lists_subscriptions">;
  collections: drizzle_orm142.Many<"collections">;
  actions: drizzle_orm142.One<"actions", true>;
  wallets: drizzle_orm142.One<"wallets", true>;
  feeds: drizzle_orm142.Many<"feeds">;
  inboxes: drizzle_orm142.One<"inboxes", true>;
  messaging: drizzle_orm142.Many<"messaging">;
}>;
//#endregion
//#region src/schema/wallets.d.ts
declare const wallets: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "wallets";
  schema: undefined;
  columns: {
    addressIndex: drizzle_orm_pg_core100.PgColumn<{
      name: "address_index";
      tableName: "wallets";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: "always";
      generated: undefined;
    }, {}, {}>;
    address: drizzle_orm_pg_core100.PgColumn<{
      name: "address";
      tableName: "wallets";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "userId";
      tableName: "wallets";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "created_at";
      tableName: "wallets";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    powerToken: drizzle_orm_pg_core100.PgColumn<{
      name: "power_token";
      tableName: "wallets";
      dataType: "string";
      columnType: "PgNumeric";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    dailyPowerToken: drizzle_orm_pg_core100.PgColumn<{
      name: "daily_power_token";
      tableName: "wallets";
      dataType: "string";
      columnType: "PgNumeric";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    cashablePowerToken: drizzle_orm_pg_core100.PgColumn<{
      name: "cashable_power_token";
      tableName: "wallets";
      dataType: "string";
      columnType: "PgNumeric";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const walletsOpenAPISchema: zod110.ZodObject<{
  addressIndex: zod110.ZodNumber;
  address: zod110.ZodNullable<zod110.ZodString>;
  userId: zod110.ZodString;
  createdAt: zod110.ZodString;
  powerToken: zod110.ZodString;
  dailyPowerToken: zod110.ZodString;
  cashablePowerToken: zod110.ZodString;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  createdAt: string;
  userId: string;
  powerToken: string;
  addressIndex: number;
  address: string | null;
  dailyPowerToken: string;
  cashablePowerToken: string;
}, {
  createdAt: string;
  userId: string;
  powerToken: string;
  addressIndex: number;
  address: string | null;
  dailyPowerToken: string;
  cashablePowerToken: string;
}>;
declare const walletsRelations: drizzle_orm142.Relations<"wallets", {
  user: drizzle_orm142.One<"user", true>;
  transactionsFrom: drizzle_orm142.Many<"transactions">;
  transactionTo: drizzle_orm142.Many<"transactions">;
  level: drizzle_orm142.One<"levels", false>;
}>;
declare const transactionType: drizzle_orm_pg_core100.PgEnum<["tip", "mint", "burn", "withdraw", "purchase", "airdrop"]>;
declare const transactions: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "transactions";
  schema: undefined;
  columns: {
    hash: drizzle_orm_pg_core100.PgColumn<{
      name: "hash";
      tableName: "transactions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    type: drizzle_orm_pg_core100.PgColumn<{
      name: "type";
      tableName: "transactions";
      dataType: "string";
      columnType: "PgEnumColumn";
      data: "tip" | "mint" | "burn" | "withdraw" | "purchase" | "airdrop";
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: ["tip", "mint", "burn", "withdraw", "purchase", "airdrop"];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    fromUserId: drizzle_orm_pg_core100.PgColumn<{
      name: "from_user_id";
      tableName: "transactions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    toUserId: drizzle_orm_pg_core100.PgColumn<{
      name: "to_user_id";
      tableName: "transactions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    toFeedId: drizzle_orm_pg_core100.PgColumn<{
      name: "to_feed_id";
      tableName: "transactions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    toListId: drizzle_orm_pg_core100.PgColumn<{
      name: "to_list_id";
      tableName: "transactions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    toEntryId: drizzle_orm_pg_core100.PgColumn<{
      name: "to_entry_id";
      tableName: "transactions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    toRSSHubId: drizzle_orm_pg_core100.PgColumn<{
      name: "to_rsshub_id";
      tableName: "transactions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    powerToken: drizzle_orm_pg_core100.PgColumn<{
      name: "power_token";
      tableName: "transactions";
      dataType: "string";
      columnType: "PgNumeric";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    tax: drizzle_orm_pg_core100.PgColumn<{
      name: "tax";
      tableName: "transactions";
      dataType: "string";
      columnType: "PgNumeric";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    createdAt: drizzle_orm_pg_core100.PgColumn<{
      name: "created_at";
      tableName: "transactions";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    comment: drizzle_orm_pg_core100.PgColumn<{
      name: "comment";
      tableName: "transactions";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const transactionsOpenAPISchema: zod110.ZodObject<{
  hash: zod110.ZodString;
  type: zod110.ZodEnum<["tip", "mint", "burn", "withdraw", "purchase", "airdrop"]>;
  fromUserId: zod110.ZodNullable<zod110.ZodString>;
  toUserId: zod110.ZodNullable<zod110.ZodString>;
  toFeedId: zod110.ZodNullable<zod110.ZodString>;
  toListId: zod110.ZodNullable<zod110.ZodString>;
  toEntryId: zod110.ZodNullable<zod110.ZodString>;
  toRSSHubId: zod110.ZodNullable<zod110.ZodString>;
  powerToken: zod110.ZodString;
  tax: zod110.ZodString;
  createdAt: zod110.ZodString;
  comment: zod110.ZodNullable<zod110.ZodString>;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  createdAt: string;
  type: "tip" | "mint" | "burn" | "withdraw" | "purchase" | "airdrop";
  hash: string;
  powerToken: string;
  fromUserId: string | null;
  toUserId: string | null;
  toFeedId: string | null;
  toListId: string | null;
  toEntryId: string | null;
  toRSSHubId: string | null;
  tax: string;
  comment: string | null;
}, {
  createdAt: string;
  type: "tip" | "mint" | "burn" | "withdraw" | "purchase" | "airdrop";
  hash: string;
  powerToken: string;
  fromUserId: string | null;
  toUserId: string | null;
  toFeedId: string | null;
  toListId: string | null;
  toEntryId: string | null;
  toRSSHubId: string | null;
  tax: string;
  comment: string | null;
}>;
declare const transactionsRelations: drizzle_orm142.Relations<"transactions", {
  fromUser: drizzle_orm142.One<"user", false>;
  toUser: drizzle_orm142.One<"user", false>;
  toFeed: drizzle_orm142.One<"feeds", false>;
  fromWallet: drizzle_orm142.One<"wallets", false>;
  toWallet: drizzle_orm142.One<"wallets", false>;
}>;
declare const feedPowerTokens: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "feedPowerTokens";
  schema: undefined;
  columns: {
    feedId: drizzle_orm_pg_core100.PgColumn<{
      name: "feed_id";
      tableName: "feedPowerTokens";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    powerToken: drizzle_orm_pg_core100.PgColumn<{
      name: "power_token";
      tableName: "feedPowerTokens";
      dataType: "string";
      columnType: "PgNumeric";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const feedPowerTokensOpenAPISchema: zod110.ZodObject<{
  feedId: zod110.ZodString;
  powerToken: zod110.ZodString;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  feedId: string;
  powerToken: string;
}, {
  feedId: string;
  powerToken: string;
}>;
declare const feedPowerTokensRelations: drizzle_orm142.Relations<"feedPowerTokens", {
  feed: drizzle_orm142.One<"feeds", true>;
}>;
declare const levels: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "levels";
  schema: undefined;
  columns: {
    address: drizzle_orm_pg_core100.PgColumn<{
      name: "address";
      tableName: "levels";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    rank: drizzle_orm_pg_core100.PgColumn<{
      name: "rank";
      tableName: "levels";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    level: drizzle_orm_pg_core100.PgColumn<{
      name: "level";
      tableName: "levels";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    prevActivityPoints: drizzle_orm_pg_core100.PgColumn<{
      name: "prev_activity_points";
      tableName: "levels";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    activityPoints: drizzle_orm_pg_core100.PgColumn<{
      name: "activity_points";
      tableName: "levels";
      dataType: "number";
      columnType: "PgInteger";
      data: number;
      driverParam: string | number;
      notNull: false;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    powerToken: drizzle_orm_pg_core100.PgColumn<{
      name: "power_token";
      tableName: "levels";
      dataType: "string";
      columnType: "PgNumeric";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: true;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    userId: drizzle_orm_pg_core100.PgColumn<{
      name: "userId";
      tableName: "levels";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const levelsOpenAPISchema: zod110.ZodObject<{
  address: zod110.ZodString;
  rank: zod110.ZodNullable<zod110.ZodNumber>;
  level: zod110.ZodNullable<zod110.ZodNumber>;
  prevActivityPoints: zod110.ZodNullable<zod110.ZodNumber>;
  activityPoints: zod110.ZodNullable<zod110.ZodNumber>;
  powerToken: zod110.ZodString;
  userId: zod110.ZodString;
}, zod110.UnknownKeysParam, zod110.ZodTypeAny, {
  userId: string;
  rank: number | null;
  powerToken: string;
  address: string;
  level: number | null;
  prevActivityPoints: number | null;
  activityPoints: number | null;
}, {
  userId: string;
  rank: number | null;
  powerToken: string;
  address: string;
  level: number | null;
  prevActivityPoints: number | null;
  activityPoints: number | null;
}>;
declare const levelsRelations: drizzle_orm142.Relations<"levels", {
  wallet: drizzle_orm142.One<"wallets", true>;
  user: drizzle_orm142.One<"user", true>;
}>;
declare const boosts: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "boosts";
  schema: undefined;
  columns: {
    hash: drizzle_orm_pg_core100.PgColumn<{
      name: "hash";
      tableName: "boosts";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    expiresAt: drizzle_orm_pg_core100.PgColumn<{
      name: "expires_at";
      tableName: "boosts";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
declare const rsshubPurchase: drizzle_orm_pg_core100.PgTableWithColumns<{
  name: "rsshub_purchase";
  schema: undefined;
  columns: {
    hash: drizzle_orm_pg_core100.PgColumn<{
      name: "hash";
      tableName: "rsshub_purchase";
      dataType: "string";
      columnType: "PgText";
      data: string;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: true;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: [string, ...string[]];
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
    expiresAt: drizzle_orm_pg_core100.PgColumn<{
      name: "expires_at";
      tableName: "rsshub_purchase";
      dataType: "date";
      columnType: "PgTimestamp";
      data: Date;
      driverParam: string;
      notNull: true;
      hasDefault: false;
      isPrimaryKey: false;
      isAutoincrement: false;
      hasRuntimeDefault: false;
      enumValues: undefined;
      baseColumn: never;
      identity: undefined;
      generated: undefined;
    }, {}, {}>;
  };
  dialect: "pg";
}>;
//#endregion
//#region src/lib/ai/tools/display/types.d.ts
type FeedWithAnalytics = {
  feed: InferSelectModel<typeof feeds>;
  analytics: InferSelectModel<typeof feedAnalytics> | null;
};
type SubscriptionWithFeedAndAnalytics = {
  subscription: InferSelectModel<typeof subscriptions>;
  feed: InferSelectModel<typeof feeds> | null;
  analytics: InferSelectModel<typeof feedAnalytics> | null;
};
type TimelineStats = {
  count: number;
  date: string;
};
type TrendingFeedData = {
  feed: InferSelectModel<typeof feeds>;
  analytics: InferSelectModel<typeof feedAnalytics> | null;
  recentSubscribers: number;
  totalSubscribers: number;
  growthRate: number;
};
type TrendingTopicData = {
  topic: string | null;
  feedCount: number;
  recentSubscribers: number;
  totalSubscribers: number;
};
type TrendingAuthorData = {
  author: string | null;
  feedCount: number;
  recentSubscribers: number;
  totalSubscribers: number;
};
type TrendingCategoryData = {
  category: string | null;
  feedCount: number;
  recentSubscribers: number;
  totalSubscribers: number;
  averageQuality: number;
};
type OverviewStats = {
  totalFeeds: number;
  totalSubscriptions: number;
  totalReads: number;
};
//#endregion
//#region src/lib/ai/tools/management/types.d.ts
interface ActionSuggestion {
  type: string;
  name: string;
  description: string;
  condition: ActionItem["condition"];
  result: SettingsModel;
  useCase: string;
}
interface RuleTypes {
  filter: number;
  translation: number;
  webhook: number;
  notification: number;
  automation: number;
}
interface ComplexityAnalysis {
  average: number;
  max: number;
  distribution: {
    simple: number;
    moderate: number;
    complex: number;
  };
}
//#endregion
//#region src/lib/ai/tools/analytics/types.d.ts
interface FeedEngagement {
  feedId: string;
  title: string;
  reads: number;
  lastRead: Date;
  category: string;
  avgReadTime: number;
}
interface FeedPerformance {
  feedId: string;
  title: string;
  reads: number;
  totalEntries: number;
  readRate: number;
  avgTimeToRead: number;
  quality: number;
  reliability: number;
}
interface QualityMetric {
  feedId: string;
  title: string;
  category: string | null;
  qualityScore: number;
  reliability: number;
  avgContentLength: number;
  totalReads: number;
  hasErrors: boolean;
  language: string | null;
  nsfw: boolean | null;
}
interface CategoryDistribution {
  category: string;
  count: number;
}
interface LanguageDistribution {
  language: string;
  count: number;
}
interface ViewTypeDistribution {
  view: number;
  name: string;
  count: number;
}
interface PerformanceAnalyticsResult {
  performance: {
    totalFeeds: number;
    analyzedFeeds: number;
    avgQuality: number;
    avgReliability: number;
    performanceDistribution: {
      high: number;
      medium: number;
      low: number;
    };
  };
  topPerformers: FeedPerformance[];
  needsAttention: FeedPerformance[];
  metrics: {
    totalReads: number;
    avgReadsPerFeed: number;
  };
  detailed?: {
    qualityFactors: Record<string, string>;
    reliabilityFactors: Record<string, string>;
  };
}
//#endregion
//#region src/lib/ai/tools/data/generate-daily-report.d.ts
interface DailyReportResult {
  report: string;
  startDate: string;
  view: string;
  userId: string;
  isEmpty: boolean;
  error?: string;
}
//#endregion
//#region src/lib/ai/tools/index.d.ts
declare const tools: {
  displayFeeds: ai43.Tool<{
    feedIds: string[];
    title?: string | undefined;
    displayType?: "list" | "grid" | "card" | undefined;
    showAnalytics?: boolean | undefined;
  }, {
    feeds: {
      feed: {
        id: string;
        url: string;
        title: string | null;
        description: string | null;
        siteUrl: string | null;
        image: string | null;
        checkedAt: Date;
        lastModifiedHeader: string | null;
        etagHeader: string | null;
        ttl: number | null;
        errorMessage: string | null;
        errorAt: Date | null;
        ownerUserId: string | null;
        language: string | null;
        migrateTo: string | null;
        rsshubRoute: string | null;
        rsshubNamespace: string | null;
        nsfw: boolean | null;
      };
      analytics: {
        feedId: string;
        updatesPerWeek: number | null;
        subscriptionCount: number | null;
        latestEntryPublishedAt: Date | null;
        view: number | null;
      } | null;
    }[];
    displayType: "list" | "grid" | "card" | undefined;
    showAnalytics: boolean | undefined;
    title: string | undefined;
  }>;
  displayEntries: ai43.Tool<{
    entryIds: string[];
    title?: string | undefined;
    displayType?: "timeline" | "list" | "grid" | "card" | "magazine" | undefined;
    groupBy?: "date" | "feed" | "none" | undefined;
    showSummary?: boolean | undefined;
    showMetadata?: boolean | undefined;
  }, {
    entries: {
      entry: {
        id: string;
        title: string | null;
        url: string | null;
        content: string | null;
        description: string | null;
        guid: string;
        author: string | null;
        authorUrl: string | null;
        authorAvatar: string | null;
        insertedAt: Date;
        publishedAt: Date;
        media: MediaModel[] | null;
        categories: string[] | null;
        attachments: AttachmentsModel[] | null;
        extra: ExtraModel | null;
        language: string | null;
        feedId: string;
      };
      feed: {
        id: string;
        url: string;
        title: string | null;
        description: string | null;
        siteUrl: string | null;
        image: string | null;
        checkedAt: Date;
        lastModifiedHeader: string | null;
        etagHeader: string | null;
        ttl: number | null;
        errorMessage: string | null;
        errorAt: Date | null;
        ownerUserId: string | null;
        language: string | null;
        migrateTo: string | null;
        rsshubRoute: string | null;
        rsshubNamespace: string | null;
        nsfw: boolean | null;
      } | null;
      analytics: {
        feedId: string;
        updatesPerWeek: number | null;
        subscriptionCount: number | null;
        latestEntryPublishedAt: Date | null;
        view: number | null;
      } | null;
    }[];
    displayType: "timeline" | "list" | "grid" | "card" | "magazine" | undefined;
    showSummary: boolean | undefined;
    showMetadata: boolean | undefined;
    title: string | undefined;
    groupBy: "date" | "feed" | "none" | undefined;
  }>;
  displaySubscriptions: ai43.Tool<{
    userId: string;
    title?: string | undefined;
    displayType?: "list" | "grid" | "card" | "compact" | undefined;
    showAnalytics?: boolean | undefined;
    groupBy?: "status" | "category" | "none" | undefined;
    showCategories?: boolean | undefined;
    filterBy?: "all" | "active" | "inactive" | "recent" | undefined;
  }, {
    subscriptions: {
      subscription: {
        userId: string;
        feedId: string;
        view: number;
        category: string | null;
        title: string | null;
        createdAt: Date;
        isPrivate: boolean;
      };
      feed: {
        id: string;
        url: string;
        title: string | null;
        description: string | null;
        siteUrl: string | null;
        image: string | null;
        checkedAt: Date;
        lastModifiedHeader: string | null;
        etagHeader: string | null;
        ttl: number | null;
        errorMessage: string | null;
        errorAt: Date | null;
        ownerUserId: string | null;
        language: string | null;
        migrateTo: string | null;
        rsshubRoute: string | null;
        rsshubNamespace: string | null;
        nsfw: boolean | null;
      } | null;
      analytics: {
        feedId: string;
        updatesPerWeek: number | null;
        subscriptionCount: number | null;
        latestEntryPublishedAt: Date | null;
        view: number | null;
      } | null;
    }[];
    displayType: "list" | "grid" | "card" | "compact" | undefined;
    showAnalytics: boolean | undefined;
    showCategories: boolean | undefined;
    title: string | undefined;
    groupBy: "status" | "category" | "none" | undefined;
    filterBy: "all" | "active" | "inactive" | "recent" | undefined;
  }>;
  displayAnalytics: ai43.Tool<{
    analyticsType: "feed" | "subscription" | "reading" | "trending" | "overview";
    userId?: string | undefined;
    title?: string | undefined;
    feedId?: string | undefined;
    displayType?: "table" | "card" | "chart" | "dashboard" | undefined;
    timeRange?: "all" | "7d" | "30d" | "90d" | "1y" | undefined;
    showComparison?: boolean | undefined;
  }, {
    analyticsData: {
      feedData?: FeedWithAnalytics;
      subscriptionStats?: SubscriptionWithFeedAndAnalytics[];
      readingStats?: TimelineStats[];
      trendingFeeds?: FeedWithAnalytics[];
      overviewStats?: OverviewStats;
    };
    analyticsType: "feed" | "subscription" | "reading" | "trending" | "overview";
    timeRange: "all" | "7d" | "30d" | "90d" | "1y";
    displayType: "table" | "card" | "chart" | "dashboard" | undefined;
    showComparison: boolean | undefined;
    title: string | undefined;
  }>;
  displayTrending: ai43.Tool<{
    trendingType: "feeds" | "categories" | "topics" | "authors";
    title?: string | undefined;
    limit?: number | undefined;
    displayType?: "list" | "ranking" | "grid" | "card" | undefined;
    timeRange?: "1d" | "7d" | "30d" | "90d" | undefined;
    showGrowth?: boolean | undefined;
    showMetrics?: boolean | undefined;
  }, {
    trendingData: {
      trendingFeeds?: TrendingFeedData[];
      trendingTopics?: TrendingTopicData[];
      trendingAuthors?: TrendingAuthorData[];
      trendingCategories?: TrendingCategoryData[];
    };
    trendingType: "feeds" | "categories" | "topics" | "authors";
    timeRange: "1d" | "7d" | "30d" | "90d";
    displayType: "list" | "ranking" | "grid" | "card" | undefined;
    showGrowth: boolean | undefined;
    showMetrics: boolean | undefined;
    limit: number;
    title: string | undefined;
  }>;
  getFeeds: ai43.Tool<{
    select: ("id" | "image" | "description" | "title" | "url" | "siteUrl" | "checkedAt" | "lastModifiedHeader" | "etagHeader" | "ttl" | "errorMessage" | "errorAt" | "ownerUserId" | "language" | "migrateTo" | "rsshubRoute" | "rsshubNamespace" | "nsfw")[];
    ids: string[];
  }, {
    feeds: Record<string, any>[];
  }>;
  getFeedEntries: ai43.Tool<{
    select: ("id" | "description" | "title" | "content" | "author" | "url" | "language" | "feedId" | "guid" | "media" | "categories" | "attachments" | "extra" | "authorUrl" | "authorAvatar" | "insertedAt" | "publishedAt")[];
    feedId?: string | undefined;
    feedIds?: string[] | undefined;
  }, {
    entries: Record<string, any>[];
  }>;
  getEntry: ai43.Tool<{
    id: string;
    select: ("id" | "description" | "title" | "content" | "author" | "url" | "language" | "feedId" | "guid" | "media" | "categories" | "attachments" | "extra" | "authorUrl" | "authorAvatar" | "insertedAt" | "publishedAt")[];
  }, Record<string, any> | null>;
  getUserSubscriptions: ai43.Tool<{
    userId: string;
    view?: number | undefined;
    category?: string | undefined;
    limit?: number | undefined;
  }, {
    subscriptions: {
      feedId: string;
      title: string | null;
      description: string | null;
      url: string;
      siteUrl: string | null;
      category: string | null;
      view: number;
      language: string | null;
      nsfw: boolean | null;
      subscribedAt: Date;
      isPrivate: boolean;
    }[];
    summary: {
      totalSubscriptions: number;
      categories: (string | null)[];
      views: number[];
      languages: (string | null)[];
      nsfwCount: number;
      privateCount: number;
    };
  }>;
  getTrendingFeeds: ai43.Tool<{
    language?: string | undefined;
    limit?: number | undefined;
    timeframe?: "1d" | "3d" | "7d" | "30d" | undefined;
    excludeNsfw?: boolean | undefined;
    minimumScore?: number | undefined;
  }, {
    trending: {
      feedId: string;
      title: string | null;
      description: string | null;
      url: string;
      siteUrl: string | null;
      image: string | null;
      language: string | null;
      nsfw: boolean | null;
      trendingScore: number;
      scores: {
        "1d": string;
        "3d": string;
        "7d": string;
        "30d": string;
      };
      isHealthy: boolean;
      lastChecked: Date;
      rankedAt: Date;
      view: number;
    }[];
    summary: {
      totalFeeds: number;
      timeframeUsed: "1d" | "3d" | "7d" | "30d";
      averageScore: number;
      languages: (string | null)[];
      healthyFeeds: number;
    };
  }>;
  searchFeeds: ai43.Tool<{
    query: string;
    language?: string | undefined;
    limit?: number | undefined;
    excludeNsfw?: boolean | undefined;
  }, {
    results: {
      feedId: string;
      title: string | null;
      description: string | null;
      url: string;
      siteUrl: string | null;
      image: string | null;
      language: string | null;
      nsfw: boolean | null;
      relevanceScore: number;
      isHealthy: boolean;
      lastChecked: Date;
      updateFrequency: number | null;
    }[];
    summary: {
      totalResults: number;
      query: string;
      averageRelevanceScore: number;
      languages: (string | null)[];
      healthyFeeds: number;
    };
  }>;
  getUserReadingHistory: ai43.Tool<{
    userId: string;
    limit?: number | undefined;
    timeframeDays?: number | undefined;
  }, {
    recentReads: {
      readAt: Date;
      entryId: string;
      feedId: string;
      readCount: number;
      entry: {
        id: string;
        title: string | null;
        description: string | null;
        url: string | null;
        author: string | null;
        publishedAt: Date;
        language: string | null;
        categories: string[] | null;
        feedId: string;
      };
      feed: {
        id: string;
        title: string | null;
        description: string | null;
        language: string | null;
        nsfw: boolean | null;
      } | undefined;
    }[];
    statistics: {
      totalReads: number;
      uniqueFeeds: number;
      uniqueAuthors: number;
      readingVelocity: number;
      timeframeDays: number;
    };
    patterns: {
      topFeeds: {
        feedId: string;
        feedTitle: string;
        readCount: number;
      }[];
      languagePreferences: {
        language: string;
        count: number;
      }[];
      topCategories: {
        category: string;
        count: number;
      }[];
    };
    insights: {
      mostActiveLanguage: string;
      diversityScore: number;
      readingConsistency: string;
    };
  }>;
  getContentRecommendations: ai43.Tool<{
    userId: string;
    limit?: number | undefined;
    excludeNsfw?: boolean | undefined;
    timeframeDays?: number | undefined;
    recommendationType?: "entries" | "feeds" | "both" | undefined;
    excludeRead?: boolean | undefined;
    includeLanguages?: string[] | undefined;
  }, {
    recommendations: any;
    summary: {
      userPreferences: {
        topLanguages: {
          language: string;
          readCount: number;
        }[];
        topCategories: {
          category: string;
          readCount: number;
        }[];
        favoriteAuthors: {
          author: string;
          readCount: number;
        }[];
      };
      recommendationMetadata: {
        totalSubscriptions: number;
        recentReads: number;
        timeframeDays: number;
        recommendationType: "entries" | "feeds" | "both";
        filters: {
          excludeRead: boolean;
          excludeNsfw: boolean;
          languages: string[];
        };
      };
    };
  }>;
  manageSubscriptions: ai43.Tool<{
    userId: string;
    action: "analyze" | "categorize" | "cleanup" | "optimize";
    options?: {
      maxSuggestions?: number | undefined;
    } | undefined;
  }, {
    analysis: {
      totalSubscriptions: number;
      categories: number;
      languages: number;
      uncategorized: number;
      inactive: number;
      nsfw: number;
      private: number;
      utilizationRate: number;
    };
    details: {
      categoriesUsed: (string | null)[];
      languagesUsed: (string | null)[];
      uncategorizedFeeds: {
        feedId: string;
        title: string | null;
        description: string | null;
        language: string | null;
      }[];
      inactiveFeeds: {
        feedId: string;
        title: string | null;
        errorMessage: string | null;
        lastChecked: Date;
      }[];
    };
    recommendations: (string | false)[];
    totalUncategorized?: undefined;
    existingCategories?: undefined;
    suggestions?: undefined;
    totalCandidates?: undefined;
    candidates?: undefined;
    potentialSavings?: undefined;
    optimization?: undefined;
    error?: undefined;
  } | {
    totalUncategorized: number;
    existingCategories: string[];
    suggestions: {
      feedId: string;
      title: string | null;
      description: string | null;
      currentCategory: string | null;
      suggestedCategory: string;
      confidence: number;
      reasons: string[];
    }[];
    analysis?: undefined;
    details?: undefined;
    recommendations?: undefined;
    totalCandidates?: undefined;
    candidates?: undefined;
    potentialSavings?: undefined;
    optimization?: undefined;
    error?: undefined;
  } | {
    totalCandidates: number;
    candidates: {
      feedId: string;
      title: string;
      category: string | null;
      issues: string[];
      severity: number;
      recommendation: string;
    }[];
    potentialSavings: number;
    recommendations: string[];
    analysis?: undefined;
    details?: undefined;
    totalUncategorized?: undefined;
    existingCategories?: undefined;
    suggestions?: undefined;
    optimization?: undefined;
    error?: undefined;
  } | {
    optimization: {
      totalSubscriptions: number;
      utilizationRate: number;
      categorizedFeeds: number;
      uncategorizedFeeds: number;
      languageDiversity: number;
    };
    recommendations: {
      type: string;
      description: string;
      impact: string;
      count?: number;
    }[];
    analysis?: undefined;
    details?: undefined;
    totalUncategorized?: undefined;
    existingCategories?: undefined;
    suggestions?: undefined;
    totalCandidates?: undefined;
    candidates?: undefined;
    potentialSavings?: undefined;
    error?: undefined;
  } | {
    error: string;
    details: string;
    analysis?: undefined;
    recommendations?: undefined;
    totalUncategorized?: undefined;
    existingCategories?: undefined;
    suggestions?: undefined;
    totalCandidates?: undefined;
    candidates?: undefined;
    potentialSavings?: undefined;
    optimization?: undefined;
  }>;
  manageActions: ai43.Tool<{
    userId: string;
    operation: "examples" | "analyze" | "optimize" | "suggest" | "validate";
    context?: {
      pattern?: string | undefined;
      ruleType?: "custom" | "filter" | "translation" | "webhook" | "notification" | undefined;
    } | undefined;
  }, {
    analysis: {
      totalActions: number;
      maxActions: number;
      utilizationRate: number;
      ruleTypes: RuleTypes;
      complexity: ComplexityAnalysis;
      potentialIssues: string[];
    };
    recommendations: string[];
    actions: {
      id: number;
      name: string;
      condition: {
        value: string;
        field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
        operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
      }[] | {
        value: string;
        field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
        operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
      }[][];
      result: {
        disabled?: boolean | undefined;
        translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
        summary?: boolean | undefined;
        readability?: boolean | undefined;
        sourceContent?: boolean | undefined;
        silence?: boolean | undefined;
        block?: boolean | undefined;
        star?: boolean | undefined;
        newEntryNotification?: boolean | undefined;
        rewriteRules?: {
          from: string;
          to: string;
        }[] | undefined;
        blockRules?: {
          value: string | number;
          field: "title" | "content" | "all" | "author" | "url" | "order";
          operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
        }[] | undefined;
        webhooks?: string[] | undefined;
      };
      complexity: number;
    }[];
    suggestions?: undefined;
    currentCount?: undefined;
    availableSlots?: undefined;
    context?: undefined;
    overallValid?: undefined;
    totalErrors?: undefined;
    totalWarnings?: undefined;
    validationResults?: undefined;
    optimizations?: undefined;
    summary?: undefined;
    examples?: undefined;
    usage?: undefined;
    categories?: undefined;
    error?: undefined;
    details?: undefined;
  } | {
    suggestions: ActionSuggestion[];
    currentCount: number;
    availableSlots: number;
    context: {
      pattern?: string | undefined;
      ruleType?: "custom" | "filter" | "translation" | "webhook" | "notification" | undefined;
    };
    analysis?: undefined;
    recommendations?: undefined;
    actions?: undefined;
    overallValid?: undefined;
    totalErrors?: undefined;
    totalWarnings?: undefined;
    validationResults?: undefined;
    optimizations?: undefined;
    summary?: undefined;
    examples?: undefined;
    usage?: undefined;
    categories?: undefined;
    error?: undefined;
    details?: undefined;
  } | {
    overallValid: boolean;
    totalErrors: number;
    totalWarnings: number;
    validationResults: {
      id: number;
      name: string;
      isValid: boolean;
      errors: string[];
      warnings: string[];
      suggestions: string[];
    }[];
    recommendations: (string | false)[];
    analysis?: undefined;
    actions?: undefined;
    suggestions?: undefined;
    currentCount?: undefined;
    availableSlots?: undefined;
    context?: undefined;
    optimizations?: undefined;
    summary?: undefined;
    examples?: undefined;
    usage?: undefined;
    categories?: undefined;
    error?: undefined;
    details?: undefined;
  } | {
    optimizations: {
      id: number;
      name: string;
      currentComplexity: number;
      optimizedComplexity: number;
      improvements: string[];
      optimizedAction: {
        name: string;
        condition: {
          value: string;
          field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
          operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
        }[] | {
          value: string;
          field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
          operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
        }[][];
        result: {
          disabled?: boolean | undefined;
          translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
          summary?: boolean | undefined;
          readability?: boolean | undefined;
          sourceContent?: boolean | undefined;
          silence?: boolean | undefined;
          block?: boolean | undefined;
          star?: boolean | undefined;
          newEntryNotification?: boolean | undefined;
          rewriteRules?: {
            from: string;
            to: string;
          }[] | undefined;
          blockRules?: {
            value: string | number;
            field: "title" | "content" | "all" | "author" | "url" | "order";
            operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
          }[] | undefined;
          webhooks?: string[] | undefined;
        };
      };
      performanceGain: number;
    }[];
    summary: {
      totalRules: number;
      totalImprovements: number;
      averagePerformanceGain: number;
      recommendations: (string | false)[];
    };
    analysis?: undefined;
    recommendations?: undefined;
    actions?: undefined;
    suggestions?: undefined;
    currentCount?: undefined;
    availableSlots?: undefined;
    context?: undefined;
    overallValid?: undefined;
    totalErrors?: undefined;
    totalWarnings?: undefined;
    validationResults?: undefined;
    examples?: undefined;
    usage?: undefined;
    categories?: undefined;
    error?: undefined;
    details?: undefined;
  } | {
    examples: {
      contentFiltering: ({
        name: string;
        condition: {
          field: "entry_title";
          operator: "regex";
          value: string;
        }[];
        result: {
          block: boolean;
          star?: undefined;
        };
        description: string;
      } | {
        name: string;
        condition: {
          field: "entry_content";
          operator: "gt";
          value: string;
        }[];
        result: {
          star: boolean;
          block?: undefined;
        };
        description: string;
      })[];
      automation: ({
        name: string;
        condition: {
          field: "entry_content";
          operator: "gt";
          value: string;
        }[];
        result: {
          summary: boolean;
          translation?: undefined;
        };
        description: string;
      } | {
        name: string;
        condition: ({
          field: "category";
          operator: "eq";
          value: string;
        } | {
          field: "entry_title";
          operator: "not_eq";
          value: string;
        })[];
        result: {
          translation: string;
          summary?: undefined;
        };
        description: string;
      })[];
      notifications: {
        name: string;
        condition: {
          field: "entry_author";
          operator: "contains";
          value: string;
        }[];
        result: {
          newEntryNotification: boolean;
        };
        description: string;
      }[];
    };
    usage: {
      howToUse: string;
      customization: string;
      testing: string;
    };
    categories: string[];
    analysis?: undefined;
    recommendations?: undefined;
    actions?: undefined;
    suggestions?: undefined;
    currentCount?: undefined;
    availableSlots?: undefined;
    context?: undefined;
    overallValid?: undefined;
    totalErrors?: undefined;
    totalWarnings?: undefined;
    validationResults?: undefined;
    optimizations?: undefined;
    summary?: undefined;
    error?: undefined;
    details?: undefined;
  } | {
    error: string;
    details: string;
    analysis?: undefined;
    recommendations?: undefined;
    actions?: undefined;
    suggestions?: undefined;
    currentCount?: undefined;
    availableSlots?: undefined;
    context?: undefined;
    overallValid?: undefined;
    totalErrors?: undefined;
    totalWarnings?: undefined;
    validationResults?: undefined;
    optimizations?: undefined;
    summary?: undefined;
    examples?: undefined;
    usage?: undefined;
    categories?: undefined;
  }>;
  subscriptionAnalytics: ai43.Tool<{
    userId: string;
    analysisType: "overview" | "engagement" | "performance" | "trends" | "quality" | "recommendations" | "comparative";
    options?: {
      includeInactive?: boolean | undefined;
      minReadThreshold?: number | undefined;
      compareWithAverage?: boolean | undefined;
      detailedBreakdown?: boolean | undefined;
    } | undefined;
    timeRange?: "all" | "7d" | "30d" | "90d" | "1y" | undefined;
  }, {
    overview: {
      totalSubscriptions: number;
      activeFeeds: number;
      inactiveFeeds: number;
      totalReads: number;
      uniqueActiveFeeds: number;
      readingVelocity: number;
      timeRange: string;
      healthScore: number;
    };
    distribution: {
      categories: CategoryDistribution[];
      languages: LanguageDistribution[];
      viewTypes: ViewTypeDistribution[];
    };
    insights: {
      mostActiveCategory: string;
      primaryLanguage: string;
      subscriptionUtilization: number;
      engagementLevel: string;
    };
  } | {
    engagement: {
      totalFeeds: number;
      activeFeeds: number;
      dormantFeeds: number;
      engagementTiers: {
        high: number;
        medium: number;
        low: number;
      };
    };
    topPerformers: FeedEngagement[];
    underperformers: FeedEngagement[];
    dormantFeeds: {
      feedId: string;
      title: string | null;
      category: string | null;
      subscribedAt: Date;
      lastChecked: Date;
    }[];
    recommendations: (string | false)[];
  } | PerformanceAnalyticsResult | {
    trends: {
      timeRange: string;
      totalDataPoints: number;
      growthTrend: number;
      seasonalPatterns: string[];
    };
    timeline: {
      uniqueFeeds: number;
      period: string;
      reads: number;
      avgEngagement: number;
    }[];
    insights: {
      trendDirection: string;
      peakPeriod: string;
      avgDailyReads: number;
    };
    recommendations: (string | false)[];
  } | {
    quality: {
      totalFeeds: number;
      avgQualityScore: number;
      avgReliability: number;
      qualityDistribution: {
        high: number;
        medium: number;
        low: number;
      };
    };
    highQualityFeeds: QualityMetric[];
    lowQualityFeeds: QualityMetric[];
    problemFeeds: QualityMetric[];
    recommendations: (string | false)[];
  } | {
    recommendations: {
      contentGaps: string[];
      languageOpportunities: string[];
      similarUserPatterns: {
        similarUsers: number;
        commonPatterns: never[];
        recommendations: never[];
      };
    };
    opportunities: {
      newCategories: string[];
      underrepresentedLanguages: string[];
      trendingTopics: never[];
    };
    insights: {
      diversityScore: number;
      explorationPotential: number;
      recommendationReadiness: number;
    };
  } | {
    comparative: {
      timeRange: string;
      compareWithAverage: boolean;
      userMetrics: {
        subscriptions: number;
        dailyReads: number;
        categories: number;
        languages: number;
        engagementRate: number;
      };
      platformAverages: {
        subscriptions: number;
        dailyReads: number;
        categories: number;
        languages: number;
        engagementRate: number;
      } | null;
      comparisons: {
        metric: string;
        userValue: number;
        platformAverage: number;
        percentile: number;
        status: string;
      }[];
    };
    insights: {
      overallRank: string;
      strengths: string[];
      improvements: string[];
    };
  } | {
    error: string;
    details: string;
  }>;
  getWhoami: ai43.Tool<{
    userId: string;
    select?: ("id" | "name" | "email" | "emailVerified" | "image" | "handle" | "createdAt" | "updatedAt" | "twoFactorEnabled" | "isAnonymous" | "suspended" | "deleted" | "bio" | "website" | "socialLinks")[] | undefined;
  }, {
    error: string;
    user: null;
    selectedFields?: undefined;
    metadata?: undefined;
  } | {
    error: null;
    user: any;
    selectedFields: ("id" | "name" | "email" | "emailVerified" | "image" | "handle" | "createdAt" | "updatedAt" | "twoFactorEnabled" | "isAnonymous" | "suspended" | "deleted" | "bio" | "website" | "socialLinks")[];
    metadata: {
      hasProfile: boolean;
      hasImage: boolean;
      hasSocialLinks: boolean;
      accountAge: number | null;
    };
  }>;
  generateDailyReport: ai43.Tool<{
    userId: string;
    view: "0" | "1";
    startDate: string;
  }, DailyReportResult>;
  getUserTimeline: ai43.Tool<{
    userId: string;
    select: ("id" | "description" | "title" | "content" | "author" | "url" | "language" | "feedId" | "guid" | "media" | "categories" | "attachments" | "extra" | "authorUrl" | "authorAvatar" | "insertedAt" | "publishedAt")[];
    view?: number | undefined;
    limit?: number | undefined;
    timeRange?: "last_hour" | "last_day" | "last_week" | "last_month" | undefined;
    onlyUnread?: boolean | undefined;
  }, {
    entries: never[];
    timeRange?: undefined;
    totalCount?: undefined;
  } | {
    entries: Record<string, any>[];
    timeRange: "last_hour" | "last_day" | "last_week" | "last_month" | undefined;
    totalCount: number;
  }>;
};
//#endregion
//#region src/lib/auth-plugins/index.d.ts
declare const authPlugins: ({
  id: "customGetProviders";
  endpoints: {
    customGetProviders: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: any;
      } : any>;
      options: {
        method: "GET";
      } & {
        use: any[];
      };
      path: "/get-providers";
    };
  };
} | {
  id: "getAccountInfo";
  endpoints: {
    getAccountInfo: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: ({
          id: string;
          provider: string;
          profile: {
            id: string;
            name?: string;
            email?: string | null;
            image?: string;
            emailVerified: boolean;
          };
          accountId?: undefined;
        } | {
          id: string;
          accountId: string;
          provider: string;
          profile: {
            id: string;
            name?: string;
            email?: string | null;
            image?: string;
            emailVerified: boolean;
          } | undefined;
        })[] | null;
      } : ({
        id: string;
        provider: string;
        profile: {
          id: string;
          name?: string;
          email?: string | null;
          image?: string;
          emailVerified: boolean;
        };
        accountId?: undefined;
      } | {
        id: string;
        accountId: string;
        provider: string;
        profile: {
          id: string;
          name?: string;
          email?: string | null;
          image?: string;
          emailVerified: boolean;
        } | undefined;
      })[] | null>;
      options: {
        method: "GET";
      } & {
        use: any[];
      };
      path: "/get-account-info";
    };
  };
} | {
  id: "deleteUserCustom";
  endpoints: {
    deleteUserCustom: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          TOTPCode: string;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: void;
      } : void>;
      options: {
        method: "POST";
        body: zod_v490.ZodObject<{
          TOTPCode: zod_v490.ZodString;
        }, zod_v4_core91.$strip>;
      } & {
        use: any[];
      };
      path: "/delete-user-custom";
    };
  };
} | {
  id: "oneTimeToken";
  endpoints: {
    generateOneTimeToken: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          token: string;
        };
      } : {
        token: string;
      }>;
      options: {
        method: "GET";
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
      } & {
        use: any[];
      };
      path: "/one-time-token/generate";
    };
    applyOneTimeToken: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          token: string;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          user: {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            image?: string | null | undefined;
          } & Record<string, any>;
        };
      } : {
        user: {
          id: string;
          name: string;
          email: string;
          emailVerified: boolean;
          createdAt: Date;
          updatedAt: Date;
          image?: string | null | undefined;
        } & Record<string, any>;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          token: zod110.ZodString;
        }, "strip", zod110.ZodTypeAny, {
          token: string;
        }, {
          token: string;
        }>;
      } & {
        use: any[];
      };
      path: "/one-time-token/apply";
    };
  };
})[];
//#endregion
//#region src/common/auth/get-auth-user.d.ts
declare enum UserRole {
  Admin = "admin",
  PreProTrial = "pre_pro_trial",
  PrePro = "pre_pro",
  Free = "free",
  /**
   * @deprecated use `UserRole.Free` instead
   *
   */
  Trial = "trial",
}
//#endregion
//#region src/lib/auth.d.ts
declare const auth: {
  handler: (request: Request) => Promise<Response>;
  api: better_auth771.InferAPI<{
    ok: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          ok: boolean;
        };
      } : {
        ok: boolean;
      }>;
      options: {
        method: "GET";
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        ok: {
                          type: string;
                          description: string;
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
          isAction: false;
        };
      } & {
        use: any[];
      };
      path: "/ok";
    };
    error: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: Response;
      } : Response>;
      options: {
        method: "GET";
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "text/html": {
                    schema: {
                      type: "string";
                      description: string;
                    };
                  };
                };
              };
            };
          };
          isAction: false;
        };
      } & {
        use: any[];
      };
      path: "/error";
    };
    signInSocial: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          provider: "apple" | "discord" | "facebook" | "github" | "google" | "microsoft" | "spotify" | "twitch" | "twitter" | "dropbox" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "vk" | "kick" | "zoom";
          scopes?: string[] | undefined;
          loginHint?: string | undefined;
          idToken?: {
            token: string;
            refreshToken?: string | undefined;
            accessToken?: string | undefined;
            expiresAt?: number | undefined;
            nonce?: string | undefined;
          } | undefined;
          callbackURL?: string | undefined;
          requestSignUp?: boolean | undefined;
          errorCallbackURL?: string | undefined;
          newUserCallbackURL?: string | undefined;
          disableRedirect?: boolean | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          redirect: boolean;
          token: string;
          url: undefined;
          user: {
            id: string;
            email: string;
            name: string;
            image: string | null | undefined;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
          };
        } | {
          url: string;
          redirect: boolean;
        };
      } : {
        redirect: boolean;
        token: string;
        url: undefined;
        user: {
          id: string;
          email: string;
          name: string;
          image: string | null | undefined;
          emailVerified: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
      } | {
        url: string;
        redirect: boolean;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          callbackURL: zod110.ZodOptional<zod110.ZodString>;
          newUserCallbackURL: zod110.ZodOptional<zod110.ZodString>;
          errorCallbackURL: zod110.ZodOptional<zod110.ZodString>;
          provider: zod110.ZodEnum<["github", ...("apple" | "discord" | "facebook" | "github" | "google" | "microsoft" | "spotify" | "twitch" | "twitter" | "dropbox" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "vk" | "kick" | "zoom")[]]>;
          disableRedirect: zod110.ZodOptional<zod110.ZodBoolean>;
          idToken: zod110.ZodOptional<zod110.ZodObject<{
            token: zod110.ZodString;
            nonce: zod110.ZodOptional<zod110.ZodString>;
            accessToken: zod110.ZodOptional<zod110.ZodString>;
            refreshToken: zod110.ZodOptional<zod110.ZodString>;
            expiresAt: zod110.ZodOptional<zod110.ZodNumber>;
          }, "strip", zod110.ZodTypeAny, {
            token: string;
            refreshToken?: string | undefined;
            accessToken?: string | undefined;
            expiresAt?: number | undefined;
            nonce?: string | undefined;
          }, {
            token: string;
            refreshToken?: string | undefined;
            accessToken?: string | undefined;
            expiresAt?: number | undefined;
            nonce?: string | undefined;
          }>>;
          scopes: zod110.ZodOptional<zod110.ZodArray<zod110.ZodString, "many">>;
          requestSignUp: zod110.ZodOptional<zod110.ZodBoolean>;
          loginHint: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          provider: "apple" | "discord" | "facebook" | "github" | "google" | "microsoft" | "spotify" | "twitch" | "twitter" | "dropbox" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "vk" | "kick" | "zoom";
          scopes?: string[] | undefined;
          loginHint?: string | undefined;
          idToken?: {
            token: string;
            refreshToken?: string | undefined;
            accessToken?: string | undefined;
            expiresAt?: number | undefined;
            nonce?: string | undefined;
          } | undefined;
          callbackURL?: string | undefined;
          requestSignUp?: boolean | undefined;
          errorCallbackURL?: string | undefined;
          newUserCallbackURL?: string | undefined;
          disableRedirect?: boolean | undefined;
        }, {
          provider: "apple" | "discord" | "facebook" | "github" | "google" | "microsoft" | "spotify" | "twitch" | "twitter" | "dropbox" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "vk" | "kick" | "zoom";
          scopes?: string[] | undefined;
          loginHint?: string | undefined;
          idToken?: {
            token: string;
            refreshToken?: string | undefined;
            accessToken?: string | undefined;
            expiresAt?: number | undefined;
            nonce?: string | undefined;
          } | undefined;
          callbackURL?: string | undefined;
          requestSignUp?: boolean | undefined;
          errorCallbackURL?: string | undefined;
          newUserCallbackURL?: string | undefined;
          disableRedirect?: boolean | undefined;
        }>;
        metadata: {
          openapi: {
            description: string;
            operationId: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      description: string;
                      properties: {
                        redirect: {
                          type: string;
                          enum: boolean[];
                        };
                        token: {
                          type: string;
                          description: string;
                          url: {
                            type: string;
                            nullable: boolean;
                          };
                          user: {
                            type: string;
                            properties: {
                              id: {
                                type: string;
                              };
                              email: {
                                type: string;
                              };
                              name: {
                                type: string;
                                nullable: boolean;
                              };
                              image: {
                                type: string;
                                nullable: boolean;
                              };
                              emailVerified: {
                                type: string;
                              };
                              createdAt: {
                                type: string;
                                format: string;
                              };
                              updatedAt: {
                                type: string;
                                format: string;
                              };
                            };
                            required: string[];
                          };
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/sign-in/social";
    };
    callbackOAuth: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body?: {
          state?: string | undefined;
          code?: string | undefined;
          device_id?: string | undefined;
          error?: string | undefined;
          user?: string | undefined;
          error_description?: string | undefined;
        } | undefined;
      } & {
        method: "GET" | "POST";
      } & {
        query?: {
          state?: string | undefined;
          code?: string | undefined;
          device_id?: string | undefined;
          error?: string | undefined;
          user?: string | undefined;
          error_description?: string | undefined;
        } | undefined;
      } & {
        params: {
          id: string;
        };
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: void;
      } : void>;
      options: {
        method: ("GET" | "POST")[];
        body: zod110.ZodOptional<zod110.ZodObject<{
          code: zod110.ZodOptional<zod110.ZodString>;
          error: zod110.ZodOptional<zod110.ZodString>;
          device_id: zod110.ZodOptional<zod110.ZodString>;
          error_description: zod110.ZodOptional<zod110.ZodString>;
          state: zod110.ZodOptional<zod110.ZodString>;
          user: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          state?: string | undefined;
          code?: string | undefined;
          device_id?: string | undefined;
          error?: string | undefined;
          user?: string | undefined;
          error_description?: string | undefined;
        }, {
          state?: string | undefined;
          code?: string | undefined;
          device_id?: string | undefined;
          error?: string | undefined;
          user?: string | undefined;
          error_description?: string | undefined;
        }>>;
        query: zod110.ZodOptional<zod110.ZodObject<{
          code: zod110.ZodOptional<zod110.ZodString>;
          error: zod110.ZodOptional<zod110.ZodString>;
          device_id: zod110.ZodOptional<zod110.ZodString>;
          error_description: zod110.ZodOptional<zod110.ZodString>;
          state: zod110.ZodOptional<zod110.ZodString>;
          user: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          state?: string | undefined;
          code?: string | undefined;
          device_id?: string | undefined;
          error?: string | undefined;
          user?: string | undefined;
          error_description?: string | undefined;
        }, {
          state?: string | undefined;
          code?: string | undefined;
          device_id?: string | undefined;
          error?: string | undefined;
          user?: string | undefined;
          error_description?: string | undefined;
        }>>;
        metadata: {
          isAction: false;
        };
      } & {
        use: any[];
      };
      path: "/callback/:id";
    };
    getSession: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: {
          disableCookieCache?: string | boolean | undefined;
          disableRefresh?: string | boolean | undefined;
        } | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined | undefined;
            userAgent?: string | null | undefined | undefined;
          };
          user: {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            image?: string | null | undefined | undefined;
            handle: string;
            deleted: boolean;
            bio: string;
            website: string;
            socialLinks: string;
            role: string;
            roleEndAt: Date;
          } & {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            image?: string | null | undefined | undefined;
            stripeCustomerId?: string | null | undefined;
            handle: string;
            deleted: boolean;
            bio: string;
            website: string;
            socialLinks: string;
            role: string;
            roleEndAt: Date;
          } & {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            image?: string | null | undefined | undefined;
            twoFactorEnabled: boolean | null | undefined;
            handle: string;
            deleted: boolean;
            bio: string;
            website: string;
            socialLinks: string;
            role: string;
            roleEndAt: Date;
          };
        } | null;
      } : {
        session: {
          id: string;
          createdAt: Date;
          updatedAt: Date;
          userId: string;
          expiresAt: Date;
          token: string;
          ipAddress?: string | null | undefined | undefined;
          userAgent?: string | null | undefined | undefined;
        };
        user: {
          id: string;
          name: string;
          email: string;
          emailVerified: boolean;
          createdAt: Date;
          updatedAt: Date;
          image?: string | null | undefined | undefined;
          handle: string;
          deleted: boolean;
          bio: string;
          website: string;
          socialLinks: string;
          role: string;
          roleEndAt: Date;
        } & {
          id: string;
          name: string;
          email: string;
          emailVerified: boolean;
          createdAt: Date;
          updatedAt: Date;
          image?: string | null | undefined | undefined;
          stripeCustomerId?: string | null | undefined;
          handle: string;
          deleted: boolean;
          bio: string;
          website: string;
          socialLinks: string;
          role: string;
          roleEndAt: Date;
        } & {
          id: string;
          name: string;
          email: string;
          emailVerified: boolean;
          createdAt: Date;
          updatedAt: Date;
          image?: string | null | undefined | undefined;
          twoFactorEnabled: boolean | null | undefined;
          handle: string;
          deleted: boolean;
          bio: string;
          website: string;
          socialLinks: string;
          role: string;
          roleEndAt: Date;
        };
      } | null>;
      options: {
        method: "GET";
        query: zod110.ZodOptional<zod110.ZodObject<{
          disableCookieCache: zod110.ZodOptional<zod110.ZodOptional<zod110.ZodUnion<[zod110.ZodBoolean, zod110.ZodEffects<zod110.ZodString, boolean, string>]>>>;
          disableRefresh: zod110.ZodOptional<zod110.ZodUnion<[zod110.ZodBoolean, zod110.ZodEffects<zod110.ZodString, boolean, string>]>>;
        }, "strip", zod110.ZodTypeAny, {
          disableCookieCache?: boolean | undefined;
          disableRefresh?: boolean | undefined;
        }, {
          disableCookieCache?: string | boolean | undefined;
          disableRefresh?: string | boolean | undefined;
        }>>;
        requireHeaders: true;
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        session: {
                          $ref: string;
                        };
                        user: {
                          $ref: string;
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/get-session";
    };
    signOut: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body?: undefined;
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          success: boolean;
        };
      } : {
        success: boolean;
      }>;
      options: {
        method: "POST";
        requireHeaders: true;
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        success: {
                          type: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/sign-out";
    };
    signUpEmail: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: ({
          name: string;
          email: string;
          password: string;
          callbackURL?: string;
        } & ({} | ({} & {
          stripeCustomerId?: string | null | undefined;
        }) | ({} & {}))) & {
          handle: string;
          deleted: boolean;
          bio: string;
          website: string;
          socialLinks: string;
          role: string;
          roleEndAt: Date;
        } & {
          handle?: string | null | undefined;
          deleted?: boolean | null | undefined;
          bio?: string | null | undefined;
          website?: string | null | undefined;
          socialLinks?: string | null | undefined;
          role?: string | null | undefined;
          roleEndAt?: Date | null | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          token: null;
          user: {
            id: string;
            email: string;
            name: string;
            image: string | null | undefined;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
          };
        } | {
          token: string;
          user: {
            id: string;
            email: string;
            name: string;
            image: string | null | undefined;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
          };
        };
      } : {
        token: null;
        user: {
          id: string;
          email: string;
          name: string;
          image: string | null | undefined;
          emailVerified: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
      } | {
        token: string;
        user: {
          id: string;
          email: string;
          name: string;
          image: string | null | undefined;
          emailVerified: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
      }>;
      options: {
        method: "POST";
        body: zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>;
        metadata: {
          $Infer: {
            body: ({
              name: string;
              email: string;
              password: string;
              callbackURL?: string;
            } & ({} | ({} & {
              stripeCustomerId?: string | null | undefined;
            }) | ({} & {}))) & {
              handle: string;
              deleted: boolean;
              bio: string;
              website: string;
              socialLinks: string;
              role: string;
              roleEndAt: Date;
            } & {
              handle?: string | null | undefined;
              deleted?: boolean | null | undefined;
              bio?: string | null | undefined;
              website?: string | null | undefined;
              socialLinks?: string | null | undefined;
              role?: string | null | undefined;
              roleEndAt?: Date | null | undefined;
            };
          };
          openapi: {
            description: string;
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      name: {
                        type: string;
                        description: string;
                      };
                      email: {
                        type: string;
                        description: string;
                      };
                      password: {
                        type: string;
                        description: string;
                      };
                      callbackURL: {
                        type: string;
                        description: string;
                      };
                    };
                    required: string[];
                  };
                };
              };
            };
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        token: {
                          type: string;
                          nullable: boolean;
                          description: string;
                        };
                        user: {
                          type: string;
                          properties: {
                            id: {
                              type: string;
                              description: string;
                            };
                            email: {
                              type: string;
                              format: string;
                              description: string;
                            };
                            name: {
                              type: string;
                              description: string;
                            };
                            image: {
                              type: string;
                              format: string;
                              nullable: boolean;
                              description: string;
                            };
                            emailVerified: {
                              type: string;
                              description: string;
                            };
                            createdAt: {
                              type: string;
                              format: string;
                              description: string;
                            };
                            updatedAt: {
                              type: string;
                              format: string;
                              description: string;
                            };
                          };
                          required: string[];
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/sign-up/email";
    };
    signInEmail: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          password: string;
          email: string;
          callbackURL?: string | undefined;
          rememberMe?: boolean | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          redirect: boolean;
          token: string;
          url: string | undefined;
          user: {
            id: string;
            email: string;
            name: string;
            image: string | null | undefined;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
          };
        };
      } : {
        redirect: boolean;
        token: string;
        url: string | undefined;
        user: {
          id: string;
          email: string;
          name: string;
          image: string | null | undefined;
          emailVerified: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          email: zod110.ZodString;
          password: zod110.ZodString;
          callbackURL: zod110.ZodOptional<zod110.ZodString>;
          rememberMe: zod110.ZodOptional<zod110.ZodDefault<zod110.ZodBoolean>>;
        }, "strip", zod110.ZodTypeAny, {
          password: string;
          email: string;
          callbackURL?: string | undefined;
          rememberMe?: boolean | undefined;
        }, {
          password: string;
          email: string;
          callbackURL?: string | undefined;
          rememberMe?: boolean | undefined;
        }>;
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      description: string;
                      properties: {
                        redirect: {
                          type: string;
                          enum: boolean[];
                        };
                        token: {
                          type: string;
                          description: string;
                        };
                        url: {
                          type: string;
                          nullable: boolean;
                        };
                        user: {
                          type: string;
                          properties: {
                            id: {
                              type: string;
                            };
                            email: {
                              type: string;
                            };
                            name: {
                              type: string;
                              nullable: boolean;
                            };
                            image: {
                              type: string;
                              nullable: boolean;
                            };
                            emailVerified: {
                              type: string;
                            };
                            createdAt: {
                              type: string;
                              format: string;
                            };
                            updatedAt: {
                              type: string;
                              format: string;
                            };
                          };
                          required: string[];
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/sign-in/email";
    };
    forgetPassword: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          email: string;
          redirectTo?: string | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
        };
      } : {
        status: boolean;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          email: zod110.ZodString;
          redirectTo: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          email: string;
          redirectTo?: string | undefined;
        }, {
          email: string;
          redirectTo?: string | undefined;
        }>;
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        status: {
                          type: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/forget-password";
    };
    resetPassword: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          newPassword: string;
          token?: string | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: {
          token?: string | undefined;
        } | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
        };
      } : {
        status: boolean;
      }>;
      options: {
        method: "POST";
        query: zod110.ZodOptional<zod110.ZodObject<{
          token: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          token?: string | undefined;
        }, {
          token?: string | undefined;
        }>>;
        body: zod110.ZodObject<{
          newPassword: zod110.ZodString;
          token: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          newPassword: string;
          token?: string | undefined;
        }, {
          newPassword: string;
          token?: string | undefined;
        }>;
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        status: {
                          type: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/reset-password";
    };
    verifyEmail: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query: {
          token: string;
          callbackURL?: string | undefined;
        };
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: void | {
          status: boolean;
          user: {
            id: any;
            email: any;
            name: any;
            image: any;
            emailVerified: any;
            createdAt: any;
            updatedAt: any;
          };
        } | {
          status: boolean;
          user: null;
        };
      } : void | {
        status: boolean;
        user: {
          id: any;
          email: any;
          name: any;
          image: any;
          emailVerified: any;
          createdAt: any;
          updatedAt: any;
        };
      } | {
        status: boolean;
        user: null;
      }>;
      options: {
        method: "GET";
        query: zod110.ZodObject<{
          token: zod110.ZodString;
          callbackURL: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          token: string;
          callbackURL?: string | undefined;
        }, {
          token: string;
          callbackURL?: string | undefined;
        }>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>)[];
        metadata: {
          openapi: {
            description: string;
            parameters: ({
              name: string;
              in: "query";
              description: string;
              required: true;
              schema: {
                type: "string";
              };
            } | {
              name: string;
              in: "query";
              description: string;
              required: false;
              schema: {
                type: "string";
              };
            })[];
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        user: {
                          type: string;
                          properties: {
                            id: {
                              type: string;
                              description: string;
                            };
                            email: {
                              type: string;
                              description: string;
                            };
                            name: {
                              type: string;
                              description: string;
                            };
                            image: {
                              type: string;
                              description: string;
                            };
                            emailVerified: {
                              type: string;
                              description: string;
                            };
                            createdAt: {
                              type: string;
                              description: string;
                            };
                            updatedAt: {
                              type: string;
                              description: string;
                            };
                          };
                          required: string[];
                        };
                        status: {
                          type: string;
                          description: string;
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/verify-email";
    };
    sendVerificationEmail: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          email: string;
          callbackURL?: string | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
        };
      } : {
        status: boolean;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          email: zod110.ZodString;
          callbackURL: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          email: string;
          callbackURL?: string | undefined;
        }, {
          email: string;
          callbackURL?: string | undefined;
        }>;
        metadata: {
          openapi: {
            description: string;
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      email: {
                        type: string;
                        description: string;
                        example: string;
                      };
                      callbackURL: {
                        type: string;
                        description: string;
                        example: string;
                        nullable: boolean;
                      };
                    };
                    required: string[];
                  };
                };
              };
            };
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        status: {
                          type: string;
                          description: string;
                          example: boolean;
                        };
                      };
                    };
                  };
                };
              };
              "400": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        message: {
                          type: string;
                          description: string;
                          example: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/send-verification-email";
    };
    changeEmail: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          newEmail: string;
          callbackURL?: string | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
        };
      } : {
        status: boolean;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          newEmail: zod110.ZodString;
          callbackURL: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          newEmail: string;
          callbackURL?: string | undefined;
        }, {
          newEmail: string;
          callbackURL?: string | undefined;
        }>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        metadata: {
          openapi: {
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        status: {
                          type: string;
                          description: string;
                        };
                        message: {
                          type: string;
                          enum: string[];
                          description: string;
                          nullable: boolean;
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/change-email";
    };
    changePassword: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          newPassword: string;
          currentPassword: string;
          revokeOtherSessions?: boolean | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          token: string | null;
          user: {
            id: string;
            email: string;
            name: string;
            image: string | null | undefined;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
          };
        };
      } : {
        token: string | null;
        user: {
          id: string;
          email: string;
          name: string;
          image: string | null | undefined;
          emailVerified: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          newPassword: zod110.ZodString;
          currentPassword: zod110.ZodString;
          revokeOtherSessions: zod110.ZodOptional<zod110.ZodBoolean>;
        }, "strip", zod110.ZodTypeAny, {
          newPassword: string;
          currentPassword: string;
          revokeOtherSessions?: boolean | undefined;
        }, {
          newPassword: string;
          currentPassword: string;
          revokeOtherSessions?: boolean | undefined;
        }>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        token: {
                          type: string;
                          nullable: boolean;
                          description: string;
                        };
                        user: {
                          type: string;
                          properties: {
                            id: {
                              type: string;
                              description: string;
                            };
                            email: {
                              type: string;
                              format: string;
                              description: string;
                            };
                            name: {
                              type: string;
                              description: string;
                            };
                            image: {
                              type: string;
                              format: string;
                              nullable: boolean;
                              description: string;
                            };
                            emailVerified: {
                              type: string;
                              description: string;
                            };
                            createdAt: {
                              type: string;
                              format: string;
                              description: string;
                            };
                            updatedAt: {
                              type: string;
                              format: string;
                              description: string;
                            };
                          };
                          required: string[];
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/change-password";
    };
    setPassword: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          newPassword: string;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
        };
      } : {
        status: boolean;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          newPassword: zod110.ZodString;
        }, "strip", zod110.ZodTypeAny, {
          newPassword: string;
        }, {
          newPassword: string;
        }>;
        metadata: {
          SERVER_ONLY: true;
        };
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
      } & {
        use: any[];
      };
      path: "/set-password";
    };
    updateUser: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: Partial<better_auth771.AdditionalUserFieldsInput<{
          appName: string;
          database: (options: BetterAuthOptions) => better_auth771.Adapter;
          databaseHooks: {
            user: {
              create: {
                after: (newUser: {
                  id: string;
                  name: string;
                  email: string;
                  emailVerified: boolean;
                  createdAt: Date;
                  updatedAt: Date;
                  image?: string | null | undefined;
                }, context: better_auth771.GenericEndpointContext | undefined) => Promise<void>;
              };
            };
          };
          advanced: {
            database: {
              generateId: false;
            };
            defaultCookieAttributes: {
              sameSite: "none";
              secure: true;
            };
          };
          session: {
            updateAge: number;
            expiresIn: number;
          };
          basePath: string;
          trustedOrigins: string[];
          user: {
            additionalFields: {
              handle: {
                type: "string";
              };
              socialLinks: {
                type: "string";
                transform: {
                  input: (value: string | number | boolean | string[] | Date | number[] | null | undefined) => string;
                  output: (value: string | number | boolean | string[] | Date | number[] | null | undefined) => any;
                };
              };
              bio: {
                type: "string";
              };
              website: {
                type: "string";
              };
              deleted: {
                type: "boolean";
              };
              role: {
                type: "string";
              };
              roleEndAt: {
                type: "date";
              };
            };
            changeEmail: {
              enabled: true;
              sendChangeEmailVerification: ({
                user,
                url
              }: {
                user: better_auth771.User;
                newEmail: string;
                url: string;
                token: string;
              }) => Promise<void>;
            };
          };
          account: {
            accountLinking: {
              enabled: true;
              trustedProviders: ("github" | "apple" | "google")[];
              allowDifferentEmails: true;
            };
          };
          socialProviders: {
            google: {
              clientId: string;
              clientSecret: string;
            };
            github: {
              clientId: string;
              clientSecret: string;
            };
            apple: {
              enabled: boolean;
              clientId: string;
              clientSecret: string;
              appBundleIdentifier: string | undefined;
            };
          };
          emailAndPassword: {
            enabled: true;
            sendResetPassword({
              user,
              url
            }: {
              user: better_auth771.User;
              url: string;
              token: string;
            }): Promise<void>;
          };
          emailVerification: {
            sendOnSignUp: true;
            sendVerificationEmail({
              user,
              url
            }: {
              user: better_auth771.User;
              url: string;
              token: string;
            }): Promise<void>;
          };
          plugins: ({
            id: "stripe";
            endpoints: {
              stripeWebhook: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_1 extends boolean = false>(inputCtx_0?: ({
                  body?: undefined;
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_1 | undefined;
                }) | undefined): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_1] extends [true] ? {
                  headers: Headers;
                  response: {
                    success: boolean;
                  };
                } : {
                  success: boolean;
                }>;
                options: {
                  method: "POST";
                  metadata: {
                    isAction: boolean;
                  };
                  cloneRequest: true;
                } & {
                  use: any[];
                };
                path: "/stripe/webhook";
              };
            } & {
              readonly upgradeSubscription: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_2 extends boolean = false>(inputCtx_0: {
                  body: {
                    plan: string;
                    metadata?: Record<string, any> | undefined;
                    annual?: boolean | undefined;
                    referenceId?: string | undefined;
                    subscriptionId?: string | undefined;
                    seats?: number | undefined;
                    successUrl?: string | undefined;
                    cancelUrl?: string | undefined;
                    returnUrl?: string | undefined;
                    disableRedirect?: boolean | undefined;
                  };
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_2 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_2] extends [true] ? {
                  headers: Headers;
                  response: {
                    url: string;
                    redirect: boolean;
                  } | {
                    redirect: boolean;
                    id: string;
                    object: "checkout.session";
                    adaptive_pricing: Stripe.Checkout.Session.AdaptivePricing | null;
                    after_expiration: Stripe.Checkout.Session.AfterExpiration | null;
                    allow_promotion_codes: boolean | null;
                    amount_subtotal: number | null;
                    amount_total: number | null;
                    automatic_tax: Stripe.Checkout.Session.AutomaticTax;
                    billing_address_collection: Stripe.Checkout.Session.BillingAddressCollection | null;
                    cancel_url: string | null;
                    client_reference_id: string | null;
                    client_secret: string | null;
                    collected_information: Stripe.Checkout.Session.CollectedInformation | null;
                    consent: Stripe.Checkout.Session.Consent | null;
                    consent_collection: Stripe.Checkout.Session.ConsentCollection | null;
                    created: number;
                    currency: string | null;
                    currency_conversion: Stripe.Checkout.Session.CurrencyConversion | null;
                    custom_fields: Array<Stripe.Checkout.Session.CustomField>;
                    custom_text: Stripe.Checkout.Session.CustomText;
                    customer: string | Stripe.Customer | Stripe.DeletedCustomer | null;
                    customer_creation: Stripe.Checkout.Session.CustomerCreation | null;
                    customer_details: Stripe.Checkout.Session.CustomerDetails | null;
                    customer_email: string | null;
                    discounts: Array<Stripe.Checkout.Session.Discount> | null;
                    expires_at: number;
                    invoice: string | Stripe.Invoice | null;
                    invoice_creation: Stripe.Checkout.Session.InvoiceCreation | null;
                    line_items?: Stripe.ApiList<Stripe.LineItem>;
                    livemode: boolean;
                    locale: Stripe.Checkout.Session.Locale | null;
                    metadata: Stripe.Metadata | null;
                    mode: Stripe.Checkout.Session.Mode;
                    optional_items?: Array<Stripe.Checkout.Session.OptionalItem> | null;
                    payment_intent: string | Stripe.PaymentIntent | null;
                    payment_link: string | Stripe.PaymentLink | null;
                    payment_method_collection: Stripe.Checkout.Session.PaymentMethodCollection | null;
                    payment_method_configuration_details: Stripe.Checkout.Session.PaymentMethodConfigurationDetails | null;
                    payment_method_options: Stripe.Checkout.Session.PaymentMethodOptions | null;
                    payment_method_types: Array<string>;
                    payment_status: Stripe.Checkout.Session.PaymentStatus;
                    permissions: Stripe.Checkout.Session.Permissions | null;
                    phone_number_collection?: Stripe.Checkout.Session.PhoneNumberCollection;
                    presentment_details?: Stripe.Checkout.Session.PresentmentDetails;
                    recovered_from: string | null;
                    redirect_on_completion?: Stripe.Checkout.Session.RedirectOnCompletion;
                    return_url?: string;
                    saved_payment_method_options: Stripe.Checkout.Session.SavedPaymentMethodOptions | null;
                    setup_intent: string | Stripe.SetupIntent | null;
                    shipping_address_collection: Stripe.Checkout.Session.ShippingAddressCollection | null;
                    shipping_cost: Stripe.Checkout.Session.ShippingCost | null;
                    shipping_options: Array<Stripe.Checkout.Session.ShippingOption>;
                    status: Stripe.Checkout.Session.Status | null;
                    submit_type: Stripe.Checkout.Session.SubmitType | null;
                    subscription: string | Stripe.Subscription | null;
                    success_url: string | null;
                    tax_id_collection?: Stripe.Checkout.Session.TaxIdCollection;
                    total_details: Stripe.Checkout.Session.TotalDetails | null;
                    ui_mode: Stripe.Checkout.Session.UiMode | null;
                    url: string | null;
                    lastResponse: {
                      headers: {
                        [key: string]: string;
                      };
                      requestId: string;
                      statusCode: number;
                      apiVersion?: string;
                      idempotencyKey?: string;
                      stripeAccount?: string;
                    };
                  };
                } : {
                  url: string;
                  redirect: boolean;
                } | {
                  redirect: boolean;
                  id: string;
                  object: "checkout.session";
                  adaptive_pricing: Stripe.Checkout.Session.AdaptivePricing | null;
                  after_expiration: Stripe.Checkout.Session.AfterExpiration | null;
                  allow_promotion_codes: boolean | null;
                  amount_subtotal: number | null;
                  amount_total: number | null;
                  automatic_tax: Stripe.Checkout.Session.AutomaticTax;
                  billing_address_collection: Stripe.Checkout.Session.BillingAddressCollection | null;
                  cancel_url: string | null;
                  client_reference_id: string | null;
                  client_secret: string | null;
                  collected_information: Stripe.Checkout.Session.CollectedInformation | null;
                  consent: Stripe.Checkout.Session.Consent | null;
                  consent_collection: Stripe.Checkout.Session.ConsentCollection | null;
                  created: number;
                  currency: string | null;
                  currency_conversion: Stripe.Checkout.Session.CurrencyConversion | null;
                  custom_fields: Array<Stripe.Checkout.Session.CustomField>;
                  custom_text: Stripe.Checkout.Session.CustomText;
                  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null;
                  customer_creation: Stripe.Checkout.Session.CustomerCreation | null;
                  customer_details: Stripe.Checkout.Session.CustomerDetails | null;
                  customer_email: string | null;
                  discounts: Array<Stripe.Checkout.Session.Discount> | null;
                  expires_at: number;
                  invoice: string | Stripe.Invoice | null;
                  invoice_creation: Stripe.Checkout.Session.InvoiceCreation | null;
                  line_items?: Stripe.ApiList<Stripe.LineItem>;
                  livemode: boolean;
                  locale: Stripe.Checkout.Session.Locale | null;
                  metadata: Stripe.Metadata | null;
                  mode: Stripe.Checkout.Session.Mode;
                  optional_items?: Array<Stripe.Checkout.Session.OptionalItem> | null;
                  payment_intent: string | Stripe.PaymentIntent | null;
                  payment_link: string | Stripe.PaymentLink | null;
                  payment_method_collection: Stripe.Checkout.Session.PaymentMethodCollection | null;
                  payment_method_configuration_details: Stripe.Checkout.Session.PaymentMethodConfigurationDetails | null;
                  payment_method_options: Stripe.Checkout.Session.PaymentMethodOptions | null;
                  payment_method_types: Array<string>;
                  payment_status: Stripe.Checkout.Session.PaymentStatus;
                  permissions: Stripe.Checkout.Session.Permissions | null;
                  phone_number_collection?: Stripe.Checkout.Session.PhoneNumberCollection;
                  presentment_details?: Stripe.Checkout.Session.PresentmentDetails;
                  recovered_from: string | null;
                  redirect_on_completion?: Stripe.Checkout.Session.RedirectOnCompletion;
                  return_url?: string;
                  saved_payment_method_options: Stripe.Checkout.Session.SavedPaymentMethodOptions | null;
                  setup_intent: string | Stripe.SetupIntent | null;
                  shipping_address_collection: Stripe.Checkout.Session.ShippingAddressCollection | null;
                  shipping_cost: Stripe.Checkout.Session.ShippingCost | null;
                  shipping_options: Array<Stripe.Checkout.Session.ShippingOption>;
                  status: Stripe.Checkout.Session.Status | null;
                  submit_type: Stripe.Checkout.Session.SubmitType | null;
                  subscription: string | Stripe.Subscription | null;
                  success_url: string | null;
                  tax_id_collection?: Stripe.Checkout.Session.TaxIdCollection;
                  total_details: Stripe.Checkout.Session.TotalDetails | null;
                  ui_mode: Stripe.Checkout.Session.UiMode | null;
                  url: string | null;
                  lastResponse: {
                    headers: {
                      [key: string]: string;
                    };
                    requestId: string;
                    statusCode: number;
                    apiVersion?: string;
                    idempotencyKey?: string;
                    stripeAccount?: string;
                  };
                }>;
                options: {
                  method: "POST";
                  body: zod110.ZodObject<{
                    plan: zod110.ZodString;
                    annual: zod110.ZodOptional<zod110.ZodBoolean>;
                    referenceId: zod110.ZodOptional<zod110.ZodString>;
                    subscriptionId: zod110.ZodOptional<zod110.ZodString>;
                    metadata: zod110.ZodOptional<zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>>;
                    seats: zod110.ZodOptional<zod110.ZodNumber>;
                    successUrl: zod110.ZodDefault<zod110.ZodString>;
                    cancelUrl: zod110.ZodDefault<zod110.ZodString>;
                    returnUrl: zod110.ZodOptional<zod110.ZodString>;
                    disableRedirect: zod110.ZodDefault<zod110.ZodBoolean>;
                  }, "strip", zod110.ZodTypeAny, {
                    plan: string;
                    successUrl: string;
                    cancelUrl: string;
                    disableRedirect: boolean;
                    metadata?: Record<string, any> | undefined;
                    annual?: boolean | undefined;
                    referenceId?: string | undefined;
                    subscriptionId?: string | undefined;
                    seats?: number | undefined;
                    returnUrl?: string | undefined;
                  }, {
                    plan: string;
                    metadata?: Record<string, any> | undefined;
                    annual?: boolean | undefined;
                    referenceId?: string | undefined;
                    subscriptionId?: string | undefined;
                    seats?: number | undefined;
                    successUrl?: string | undefined;
                    cancelUrl?: string | undefined;
                    returnUrl?: string | undefined;
                    disableRedirect?: boolean | undefined;
                  }>;
                  use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                    session: {
                      session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                      };
                      user: Record<string, any> & {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        image?: string | null | undefined;
                      };
                    };
                  }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
                } & {
                  use: any[];
                };
                path: "/subscription/upgrade";
              };
              readonly cancelSubscriptionCallback: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_3 extends boolean = false>(inputCtx_0?: ({
                  body?: undefined;
                } & {
                  method?: "GET" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_3 | undefined;
                }) | undefined): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_3] extends [true] ? {
                  headers: Headers;
                  response: never;
                } : never>;
                options: {
                  method: "GET";
                  query: zod110.ZodOptional<zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>>;
                  use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>)[];
                } & {
                  use: any[];
                };
                path: "/subscription/cancel/callback";
              };
              readonly cancelSubscription: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_4 extends boolean = false>(inputCtx_0: {
                  body: {
                    returnUrl: string;
                    referenceId?: string | undefined;
                    subscriptionId?: string | undefined;
                  };
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_4 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_4] extends [true] ? {
                  headers: Headers;
                  response: {
                    url: string;
                    redirect: boolean;
                  };
                } : {
                  url: string;
                  redirect: boolean;
                }>;
                options: {
                  method: "POST";
                  body: zod110.ZodObject<{
                    referenceId: zod110.ZodOptional<zod110.ZodString>;
                    subscriptionId: zod110.ZodOptional<zod110.ZodString>;
                    returnUrl: zod110.ZodString;
                  }, "strip", zod110.ZodTypeAny, {
                    returnUrl: string;
                    referenceId?: string | undefined;
                    subscriptionId?: string | undefined;
                  }, {
                    returnUrl: string;
                    referenceId?: string | undefined;
                    subscriptionId?: string | undefined;
                  }>;
                  use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                    session: {
                      session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                      };
                      user: Record<string, any> & {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        image?: string | null | undefined;
                      };
                    };
                  }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
                } & {
                  use: any[];
                };
                path: "/subscription/cancel";
              };
              readonly restoreSubscription: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_5 extends boolean = false>(inputCtx_0: {
                  body: {
                    referenceId?: string | undefined;
                    subscriptionId?: string | undefined;
                  };
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_5 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_5] extends [true] ? {
                  headers: Headers;
                  response: Stripe.Response<Stripe.Subscription>;
                } : Stripe.Response<Stripe.Subscription>>;
                options: {
                  method: "POST";
                  body: zod110.ZodObject<{
                    referenceId: zod110.ZodOptional<zod110.ZodString>;
                    subscriptionId: zod110.ZodOptional<zod110.ZodString>;
                  }, "strip", zod110.ZodTypeAny, {
                    referenceId?: string | undefined;
                    subscriptionId?: string | undefined;
                  }, {
                    referenceId?: string | undefined;
                    subscriptionId?: string | undefined;
                  }>;
                  use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                    session: {
                      session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                      };
                      user: Record<string, any> & {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        image?: string | null | undefined;
                      };
                    };
                  }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
                } & {
                  use: any[];
                };
                path: "/subscription/restore";
              };
              readonly listActiveSubscriptions: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_6 extends boolean = false>(inputCtx_0?: ({
                  body?: undefined;
                } & {
                  method?: "GET" | undefined;
                } & {
                  query?: {
                    referenceId?: string | undefined;
                  } | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_6 | undefined;
                }) | undefined): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_6] extends [true] ? {
                  headers: Headers;
                  response: {
                    limits: Record<string, number> | undefined;
                    priceId: string | undefined;
                    id: string;
                    plan: string;
                    stripeCustomerId?: string;
                    stripeSubscriptionId?: string;
                    trialStart?: Date;
                    trialEnd?: Date;
                    referenceId: string;
                    status: "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "paused" | "trialing" | "unpaid";
                    periodStart?: Date;
                    periodEnd?: Date;
                    cancelAtPeriodEnd?: boolean;
                    groupId?: string;
                    seats?: number;
                  }[];
                } : {
                  limits: Record<string, number> | undefined;
                  priceId: string | undefined;
                  id: string;
                  plan: string;
                  stripeCustomerId?: string;
                  stripeSubscriptionId?: string;
                  trialStart?: Date;
                  trialEnd?: Date;
                  referenceId: string;
                  status: "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "paused" | "trialing" | "unpaid";
                  periodStart?: Date;
                  periodEnd?: Date;
                  cancelAtPeriodEnd?: boolean;
                  groupId?: string;
                  seats?: number;
                }[]>;
                options: {
                  method: "GET";
                  query: zod110.ZodOptional<zod110.ZodObject<{
                    referenceId: zod110.ZodOptional<zod110.ZodString>;
                  }, "strip", zod110.ZodTypeAny, {
                    referenceId?: string | undefined;
                  }, {
                    referenceId?: string | undefined;
                  }>>;
                  use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                    session: {
                      session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                      };
                      user: Record<string, any> & {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        image?: string | null | undefined;
                      };
                    };
                  }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
                } & {
                  use: any[];
                };
                path: "/subscription/list";
              };
              readonly subscriptionSuccess: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_7 extends boolean = false>(inputCtx_0?: ({
                  body?: undefined;
                } & {
                  method?: "GET" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_7 | undefined;
                }) | undefined): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_7] extends [true] ? {
                  headers: Headers;
                  response: better_call87.APIError;
                } : better_call87.APIError>;
                options: {
                  method: "GET";
                  query: zod110.ZodOptional<zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>>;
                  use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>)[];
                } & {
                  use: any[];
                };
                path: "/subscription/success";
              };
            };
            init(ctx: better_auth771.AuthContext): {
              options: {
                databaseHooks: {
                  user: {
                    create: {
                      after(user: {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        image?: string | null | undefined;
                      }, ctx: better_auth771.GenericEndpointContext | undefined): Promise<void>;
                    };
                  };
                };
              };
            };
            schema: {
              user: {
                fields: {
                  stripeCustomerId: {
                    type: "string";
                    required: false;
                  };
                };
              };
              subscription?: {
                fields: {
                  plan: {
                    type: "string";
                    required: true;
                  };
                  referenceId: {
                    type: "string";
                    required: true;
                  };
                  stripeCustomerId: {
                    type: "string";
                    required: false;
                  };
                  stripeSubscriptionId: {
                    type: "string";
                    required: false;
                  };
                  status: {
                    type: "string";
                    defaultValue: string;
                  };
                  periodStart: {
                    type: "date";
                    required: false;
                  };
                  periodEnd: {
                    type: "date";
                    required: false;
                  };
                  cancelAtPeriodEnd: {
                    type: "boolean";
                    required: false;
                    defaultValue: false;
                  };
                  seats: {
                    type: "number";
                    required: false;
                  };
                };
              } | undefined;
            };
          } | {
            id: "open-api";
            endpoints: {
              generateOpenAPISchema: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_8 extends boolean = false>(inputCtx_0?: ({
                  body?: undefined;
                } & {
                  method?: "GET" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_8 | undefined;
                }) | undefined): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_8] extends [true] ? {
                  headers: Headers;
                  response: {
                    openapi: string;
                    info: {
                      title: string;
                      description: string;
                      version: string;
                    };
                    components: {
                      securitySchemes: {
                        apiKeyCookie: {
                          type: string;
                          in: string;
                          name: string;
                          description: string;
                        };
                        bearerAuth: {
                          type: string;
                          scheme: string;
                          description: string;
                        };
                      };
                      schemas: {};
                    };
                    security: {
                      apiKeyCookie: never[];
                      bearerAuth: never[];
                    }[];
                    servers: {
                      url: string;
                    }[];
                    tags: {
                      name: string;
                      description: string;
                    }[];
                    paths: Record<string, better_auth_plugins857.Path>;
                  };
                } : {
                  openapi: string;
                  info: {
                    title: string;
                    description: string;
                    version: string;
                  };
                  components: {
                    securitySchemes: {
                      apiKeyCookie: {
                        type: string;
                        in: string;
                        name: string;
                        description: string;
                      };
                      bearerAuth: {
                        type: string;
                        scheme: string;
                        description: string;
                      };
                    };
                    schemas: {};
                  };
                  security: {
                    apiKeyCookie: never[];
                    bearerAuth: never[];
                  }[];
                  servers: {
                    url: string;
                  }[];
                  tags: {
                    name: string;
                    description: string;
                  }[];
                  paths: Record<string, better_auth_plugins857.Path>;
                }>;
                options: {
                  method: "GET";
                } & {
                  use: any[];
                };
                path: "/open-api/generate-schema";
              };
              openAPIReference: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_9 extends boolean = false>(inputCtx_0?: ({
                  body?: undefined;
                } & {
                  method?: "GET" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_9 | undefined;
                }) | undefined): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_9] extends [true] ? {
                  headers: Headers;
                  response: Response;
                } : Response>;
                options: {
                  method: "GET";
                  metadata: {
                    isAction: boolean;
                  };
                } & {
                  use: any[];
                };
                path: "/reference";
              };
            };
          } | {
            id: "two-factor";
            endpoints: {
              enableTwoFactor: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_10 extends boolean = false>(inputCtx_0: {
                  body: {
                    password: string;
                    issuer?: string | undefined;
                  };
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_10 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_10] extends [true] ? {
                  headers: Headers;
                  response: {
                    totpURI: string;
                    backupCodes: string[];
                  };
                } : {
                  totpURI: string;
                  backupCodes: string[];
                }>;
                options: {
                  method: "POST";
                  body: zod110.ZodObject<{
                    password: zod110.ZodString;
                    issuer: zod110.ZodOptional<zod110.ZodString>;
                  }, "strip", zod110.ZodTypeAny, {
                    password: string;
                    issuer?: string | undefined;
                  }, {
                    password: string;
                    issuer?: string | undefined;
                  }>;
                  use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                    session: {
                      session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                      };
                      user: Record<string, any> & {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        image?: string | null | undefined;
                      };
                    };
                  }>)[];
                  metadata: {
                    openapi: {
                      summary: string;
                      description: string;
                      responses: {
                        200: {
                          description: string;
                          content: {
                            "application/json": {
                              schema: {
                                type: "object";
                                properties: {
                                  totpURI: {
                                    type: string;
                                    description: string;
                                  };
                                  backupCodes: {
                                    type: string;
                                    items: {
                                      type: string;
                                    };
                                    description: string;
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    };
                  };
                } & {
                  use: any[];
                };
                path: "/two-factor/enable";
              };
              disableTwoFactor: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_11 extends boolean = false>(inputCtx_0: {
                  body: {
                    password: string;
                  };
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_11 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_11] extends [true] ? {
                  headers: Headers;
                  response: {
                    status: boolean;
                  };
                } : {
                  status: boolean;
                }>;
                options: {
                  method: "POST";
                  body: zod110.ZodObject<{
                    password: zod110.ZodString;
                  }, "strip", zod110.ZodTypeAny, {
                    password: string;
                  }, {
                    password: string;
                  }>;
                  use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                    session: {
                      session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                      };
                      user: Record<string, any> & {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        image?: string | null | undefined;
                      };
                    };
                  }>)[];
                  metadata: {
                    openapi: {
                      summary: string;
                      description: string;
                      responses: {
                        200: {
                          description: string;
                          content: {
                            "application/json": {
                              schema: {
                                type: "object";
                                properties: {
                                  status: {
                                    type: string;
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    };
                  };
                } & {
                  use: any[];
                };
                path: "/two-factor/disable";
              };
              verifyBackupCode: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_12 extends boolean = false>(inputCtx_0: {
                  body: {
                    code: string;
                    trustDevice?: boolean | undefined;
                    disableSession?: boolean | undefined;
                  };
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_12 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_12] extends [true] ? {
                  headers: Headers;
                  response: {
                    token: string | undefined;
                    user: {
                      id: string;
                      email: string;
                      emailVerified: boolean;
                      name: string;
                      image: string | null | undefined;
                      createdAt: Date;
                      updatedAt: Date;
                    };
                  };
                } : {
                  token: string | undefined;
                  user: {
                    id: string;
                    email: string;
                    emailVerified: boolean;
                    name: string;
                    image: string | null | undefined;
                    createdAt: Date;
                    updatedAt: Date;
                  };
                }>;
                options: {
                  method: "POST";
                  body: zod110.ZodObject<{
                    code: zod110.ZodString;
                    disableSession: zod110.ZodOptional<zod110.ZodBoolean>;
                    trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
                  }, "strip", zod110.ZodTypeAny, {
                    code: string;
                    trustDevice?: boolean | undefined;
                    disableSession?: boolean | undefined;
                  }, {
                    code: string;
                    trustDevice?: boolean | undefined;
                    disableSession?: boolean | undefined;
                  }>;
                  metadata: {
                    openapi: {
                      description: string;
                      responses: {
                        "200": {
                          description: string;
                          content: {
                            "application/json": {
                              schema: {
                                type: "object";
                                properties: {
                                  user: {
                                    type: string;
                                    properties: {
                                      id: {
                                        type: string;
                                        description: string;
                                      };
                                      email: {
                                        type: string;
                                        format: string;
                                        nullable: boolean;
                                        description: string;
                                      };
                                      emailVerified: {
                                        type: string;
                                        nullable: boolean;
                                        description: string;
                                      };
                                      name: {
                                        type: string;
                                        nullable: boolean;
                                        description: string;
                                      };
                                      image: {
                                        type: string;
                                        format: string;
                                        nullable: boolean;
                                        description: string;
                                      };
                                      twoFactorEnabled: {
                                        type: string;
                                        description: string;
                                      };
                                      createdAt: {
                                        type: string;
                                        format: string;
                                        description: string;
                                      };
                                      updatedAt: {
                                        type: string;
                                        format: string;
                                        description: string;
                                      };
                                    };
                                    required: string[];
                                    description: string;
                                  };
                                  session: {
                                    type: string;
                                    properties: {
                                      token: {
                                        type: string;
                                        description: string;
                                      };
                                      userId: {
                                        type: string;
                                        description: string;
                                      };
                                      createdAt: {
                                        type: string;
                                        format: string;
                                        description: string;
                                      };
                                      expiresAt: {
                                        type: string;
                                        format: string;
                                        description: string;
                                      };
                                    };
                                    required: string[];
                                    description: string;
                                  };
                                };
                                required: string[];
                              };
                            };
                          };
                        };
                      };
                    };
                  };
                } & {
                  use: any[];
                };
                path: "/two-factor/verify-backup-code";
              };
              generateBackupCodes: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_13 extends boolean = false>(inputCtx_0: {
                  body: {
                    password: string;
                  };
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_13 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_13] extends [true] ? {
                  headers: Headers;
                  response: {
                    status: boolean;
                    backupCodes: string[];
                  };
                } : {
                  status: boolean;
                  backupCodes: string[];
                }>;
                options: {
                  method: "POST";
                  body: zod110.ZodObject<{
                    password: zod110.ZodString;
                  }, "strip", zod110.ZodTypeAny, {
                    password: string;
                  }, {
                    password: string;
                  }>;
                  use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                    session: {
                      session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                      };
                      user: Record<string, any> & {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        image?: string | null | undefined;
                      };
                    };
                  }>)[];
                  metadata: {
                    openapi: {
                      description: string;
                      responses: {
                        "200": {
                          description: string;
                          content: {
                            "application/json": {
                              schema: {
                                type: "object";
                                properties: {
                                  status: {
                                    type: string;
                                    description: string;
                                    enum: boolean[];
                                  };
                                  backupCodes: {
                                    type: string;
                                    items: {
                                      type: string;
                                    };
                                    description: string;
                                  };
                                };
                                required: string[];
                              };
                            };
                          };
                        };
                      };
                    };
                  };
                } & {
                  use: any[];
                };
                path: "/two-factor/generate-backup-codes";
              };
              viewBackupCodes: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_14 extends boolean = false>(inputCtx_0: {
                  body: {
                    userId: string;
                  };
                } & {
                  method?: "GET" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_14 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_14] extends [true] ? {
                  headers: Headers;
                  response: {
                    status: boolean;
                    backupCodes: string[];
                  };
                } : {
                  status: boolean;
                  backupCodes: string[];
                }>;
                options: {
                  method: "GET";
                  body: zod110.ZodObject<{
                    userId: zod110.ZodString;
                  }, "strip", zod110.ZodTypeAny, {
                    userId: string;
                  }, {
                    userId: string;
                  }>;
                  metadata: {
                    SERVER_ONLY: true;
                  };
                } & {
                  use: any[];
                };
                path: "/two-factor/view-backup-codes";
              };
              sendTwoFactorOTP: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_15 extends boolean = false>(inputCtx_0?: ({
                  body?: {
                    trustDevice?: boolean | undefined;
                  } | undefined;
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_15 | undefined;
                }) | undefined): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_15] extends [true] ? {
                  headers: Headers;
                  response: {
                    status: boolean;
                  };
                } : {
                  status: boolean;
                }>;
                options: {
                  method: "POST";
                  body: zod110.ZodOptional<zod110.ZodObject<{
                    trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
                  }, "strip", zod110.ZodTypeAny, {
                    trustDevice?: boolean | undefined;
                  }, {
                    trustDevice?: boolean | undefined;
                  }>>;
                  metadata: {
                    openapi: {
                      summary: string;
                      description: string;
                      responses: {
                        200: {
                          description: string;
                          content: {
                            "application/json": {
                              schema: {
                                type: "object";
                                properties: {
                                  status: {
                                    type: string;
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    };
                  };
                } & {
                  use: any[];
                };
                path: "/two-factor/send-otp";
              };
              verifyTwoFactorOTP: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_16 extends boolean = false>(inputCtx_0: {
                  body: {
                    code: string;
                    trustDevice?: boolean | undefined;
                  };
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_16 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_16] extends [true] ? {
                  headers: Headers;
                  response: {
                    token: string;
                    user: {
                      id: any;
                      email: any;
                      emailVerified: any;
                      name: any;
                      image: any;
                      createdAt: any;
                      updatedAt: any;
                    };
                  };
                } : {
                  token: string;
                  user: {
                    id: any;
                    email: any;
                    emailVerified: any;
                    name: any;
                    image: any;
                    createdAt: any;
                    updatedAt: any;
                  };
                }>;
                options: {
                  method: "POST";
                  body: zod110.ZodObject<{
                    code: zod110.ZodString;
                    trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
                  }, "strip", zod110.ZodTypeAny, {
                    code: string;
                    trustDevice?: boolean | undefined;
                  }, {
                    code: string;
                    trustDevice?: boolean | undefined;
                  }>;
                  metadata: {
                    openapi: {
                      summary: string;
                      description: string;
                      responses: {
                        "200": {
                          description: string;
                          content: {
                            "application/json": {
                              schema: {
                                type: "object";
                                properties: {
                                  token: {
                                    type: string;
                                    description: string;
                                  };
                                  user: {
                                    type: string;
                                    properties: {
                                      id: {
                                        type: string;
                                        description: string;
                                      };
                                      email: {
                                        type: string;
                                        format: string;
                                        nullable: boolean;
                                        description: string;
                                      };
                                      emailVerified: {
                                        type: string;
                                        nullable: boolean;
                                        description: string;
                                      };
                                      name: {
                                        type: string;
                                        nullable: boolean;
                                        description: string;
                                      };
                                      image: {
                                        type: string;
                                        format: string;
                                        nullable: boolean;
                                        description: string;
                                      };
                                      createdAt: {
                                        type: string;
                                        format: string;
                                        description: string;
                                      };
                                      updatedAt: {
                                        type: string;
                                        format: string;
                                        description: string;
                                      };
                                    };
                                    required: string[];
                                    description: string;
                                  };
                                };
                                required: string[];
                              };
                            };
                          };
                        };
                      };
                    };
                  };
                } & {
                  use: any[];
                };
                path: "/two-factor/verify-otp";
              };
              generateTOTP: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_17 extends boolean = false>(inputCtx_0: {
                  body: {
                    secret: string;
                  };
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_17 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_17] extends [true] ? {
                  headers: Headers;
                  response: {
                    code: string;
                  };
                } : {
                  code: string;
                }>;
                options: {
                  method: "POST";
                  body: zod110.ZodObject<{
                    secret: zod110.ZodString;
                  }, "strip", zod110.ZodTypeAny, {
                    secret: string;
                  }, {
                    secret: string;
                  }>;
                  metadata: {
                    openapi: {
                      summary: string;
                      description: string;
                      responses: {
                        200: {
                          description: string;
                          content: {
                            "application/json": {
                              schema: {
                                type: "object";
                                properties: {
                                  code: {
                                    type: string;
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    };
                    SERVER_ONLY: true;
                  };
                } & {
                  use: any[];
                };
                path: "/totp/generate";
              };
              getTOTPURI: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_18 extends boolean = false>(inputCtx_0: {
                  body: {
                    password: string;
                  };
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_18 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_18] extends [true] ? {
                  headers: Headers;
                  response: {
                    totpURI: string;
                  };
                } : {
                  totpURI: string;
                }>;
                options: {
                  method: "POST";
                  use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                    session: {
                      session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                      };
                      user: Record<string, any> & {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        image?: string | null | undefined;
                      };
                    };
                  }>)[];
                  body: zod110.ZodObject<{
                    password: zod110.ZodString;
                  }, "strip", zod110.ZodTypeAny, {
                    password: string;
                  }, {
                    password: string;
                  }>;
                  metadata: {
                    openapi: {
                      summary: string;
                      description: string;
                      responses: {
                        200: {
                          description: string;
                          content: {
                            "application/json": {
                              schema: {
                                type: "object";
                                properties: {
                                  totpURI: {
                                    type: string;
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    };
                  };
                } & {
                  use: any[];
                };
                path: "/two-factor/get-totp-uri";
              };
              verifyTOTP: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_19 extends boolean = false>(inputCtx_0: {
                  body: {
                    code: string;
                    trustDevice?: boolean | undefined;
                  };
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_19 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_19] extends [true] ? {
                  headers: Headers;
                  response: {
                    token: string;
                    user: {
                      id: string;
                      email: string;
                      emailVerified: boolean;
                      name: string;
                      image: string | null | undefined;
                      createdAt: Date;
                      updatedAt: Date;
                    };
                  };
                } : {
                  token: string;
                  user: {
                    id: string;
                    email: string;
                    emailVerified: boolean;
                    name: string;
                    image: string | null | undefined;
                    createdAt: Date;
                    updatedAt: Date;
                  };
                }>;
                options: {
                  method: "POST";
                  body: zod110.ZodObject<{
                    code: zod110.ZodString;
                    trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
                  }, "strip", zod110.ZodTypeAny, {
                    code: string;
                    trustDevice?: boolean | undefined;
                  }, {
                    code: string;
                    trustDevice?: boolean | undefined;
                  }>;
                  metadata: {
                    openapi: {
                      summary: string;
                      description: string;
                      responses: {
                        200: {
                          description: string;
                          content: {
                            "application/json": {
                              schema: {
                                type: "object";
                                properties: {
                                  status: {
                                    type: string;
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    };
                  };
                } & {
                  use: any[];
                };
                path: "/two-factor/verify-totp";
              };
            };
            options: better_auth_plugins857.TwoFactorOptions | undefined;
            hooks: {
              after: {
                matcher(context: better_auth771.HookEndpointContext): boolean;
                handler: (inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                  twoFactorRedirect: boolean;
                } | undefined>;
              }[];
            };
            schema: {
              user: {
                fields: {
                  twoFactorEnabled: {
                    type: "boolean";
                    required: false;
                    defaultValue: false;
                    input: false;
                  };
                };
              };
              twoFactor: {
                fields: {
                  secret: {
                    type: "string";
                    required: true;
                    returned: false;
                  };
                  backupCodes: {
                    type: "string";
                    required: true;
                    returned: false;
                  };
                  userId: {
                    type: "string";
                    required: true;
                    returned: false;
                    references: {
                      model: string;
                      field: string;
                    };
                  };
                };
              };
            };
            rateLimit: {
              pathMatcher(path: string): boolean;
              window: number;
              max: number;
            }[];
            $ERROR_CODES: {
              readonly OTP_NOT_ENABLED: "OTP not enabled";
              readonly OTP_HAS_EXPIRED: "OTP has expired";
              readonly TOTP_NOT_ENABLED: "TOTP not enabled";
              readonly TWO_FACTOR_NOT_ENABLED: "Two factor isn't enabled";
              readonly BACKUP_CODES_NOT_ENABLED: "Backup codes aren't enabled";
              readonly INVALID_BACKUP_CODE: "Invalid backup code";
              readonly INVALID_CODE: "Invalid code";
              readonly TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: "Too many attempts. Please request a new code.";
              readonly INVALID_TWO_FACTOR_COOKIE: "Invalid two factor cookie";
            };
          } | {
            id: "expo";
            init: (ctx: better_auth771.AuthContext) => {
              options: {
                trustedOrigins: string[];
              };
            };
            onRequest(request: Request, ctx: better_auth771.AuthContext): Promise<{
              request: Request;
            } | undefined>;
            hooks: {
              after: {
                matcher(context: better_auth771.HookEndpointContext): boolean;
                handler: (inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>;
              }[];
            };
          } | {
            id: "custom-session";
            endpoints: {
              getSession: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_20 extends boolean = false>(inputCtx_0: {
                  body?: undefined;
                } & {
                  method?: "GET" | undefined;
                } & {
                  query?: {
                    disableCookieCache?: string | boolean | undefined;
                    disableRefresh?: boolean | undefined;
                  } | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_20 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_20] extends [true] ? {
                  headers: Headers;
                  response: {
                    user: {
                      id: string;
                      name: string;
                      email: string;
                      emailVerified: boolean;
                      createdAt: Date;
                      updatedAt: Date;
                      image?: string | null | undefined | undefined;
                    } & {
                      image: string | null;
                      handle: string | null;
                      twoFactorEnabled: boolean | null;
                      socialLinks: Record<string, string> | null;
                      bio: string | null;
                      website: string | null;
                      role: string | null;
                      roleEndAt: Date | null;
                      deleted: boolean | null;
                    };
                    session: {
                      id: string;
                      createdAt: Date;
                      updatedAt: Date;
                      userId: string;
                      expiresAt: Date;
                      token: string;
                      ipAddress?: string | null | undefined | undefined;
                      userAgent?: string | null | undefined | undefined;
                    };
                    role: UserRole.PreProTrial | UserRole.PrePro | UserRole.Free | UserRole.Trial;
                    roleEndAt: Date | null | undefined;
                  } | null;
                } : {
                  user: {
                    id: string;
                    name: string;
                    email: string;
                    emailVerified: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    image?: string | null | undefined | undefined;
                  } & {
                    image: string | null;
                    handle: string | null;
                    twoFactorEnabled: boolean | null;
                    socialLinks: Record<string, string> | null;
                    bio: string | null;
                    website: string | null;
                    role: string | null;
                    roleEndAt: Date | null;
                    deleted: boolean | null;
                  };
                  session: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    expiresAt: Date;
                    token: string;
                    ipAddress?: string | null | undefined | undefined;
                    userAgent?: string | null | undefined | undefined;
                  };
                  role: UserRole.PreProTrial | UserRole.PrePro | UserRole.Free | UserRole.Trial;
                  roleEndAt: Date | null | undefined;
                } | null>;
                options: {
                  method: "GET";
                  query: zod110.ZodOptional<zod110.ZodObject<{
                    disableCookieCache: zod110.ZodOptional<zod110.ZodUnion<[zod110.ZodBoolean, zod110.ZodEffects<zod110.ZodString, boolean, string>]>>;
                    disableRefresh: zod110.ZodOptional<zod110.ZodBoolean>;
                  }, "strip", zod110.ZodTypeAny, {
                    disableCookieCache?: boolean | undefined;
                    disableRefresh?: boolean | undefined;
                  }, {
                    disableCookieCache?: string | boolean | undefined;
                    disableRefresh?: boolean | undefined;
                  }>>;
                  metadata: {
                    CUSTOM_SESSION: boolean;
                    openapi: {
                      description: string;
                      responses: {
                        "200": {
                          description: string;
                          content: {
                            "application/json": {
                              schema: {
                                type: "array";
                                nullable: boolean;
                                items: {
                                  $ref: string;
                                };
                              };
                            };
                          };
                        };
                      };
                    };
                  };
                  requireHeaders: true;
                } & {
                  use: any[];
                };
                path: "/get-session";
              };
            };
          } | {
            id: "customGetProviders";
            endpoints: {
              customGetProviders: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_21 extends boolean = false>(inputCtx_0?: ({
                  body?: undefined;
                } & {
                  method?: "GET" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_21 | undefined;
                }) | undefined): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_21] extends [true] ? {
                  headers: Headers;
                  response: any;
                } : any>;
                options: {
                  method: "GET";
                } & {
                  use: any[];
                };
                path: "/get-providers";
              };
            };
          } | {
            id: "getAccountInfo";
            endpoints: {
              getAccountInfo: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_21 extends boolean = false>(inputCtx_0?: ({
                  body?: undefined;
                } & {
                  method?: "GET" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_21 | undefined;
                }) | undefined): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_21] extends [true] ? {
                  headers: Headers;
                  response: ({
                    id: string;
                    provider: string;
                    profile: {
                      id: string;
                      name?: string;
                      email?: string | null;
                      image?: string;
                      emailVerified: boolean;
                    };
                    accountId?: undefined;
                  } | {
                    id: string;
                    accountId: string;
                    provider: string;
                    profile: {
                      id: string;
                      name?: string;
                      email?: string | null;
                      image?: string;
                      emailVerified: boolean;
                    } | undefined;
                  })[] | null;
                } : ({
                  id: string;
                  provider: string;
                  profile: {
                    id: string;
                    name?: string;
                    email?: string | null;
                    image?: string;
                    emailVerified: boolean;
                  };
                  accountId?: undefined;
                } | {
                  id: string;
                  accountId: string;
                  provider: string;
                  profile: {
                    id: string;
                    name?: string;
                    email?: string | null;
                    image?: string;
                    emailVerified: boolean;
                  } | undefined;
                })[] | null>;
                options: {
                  method: "GET";
                } & {
                  use: any[];
                };
                path: "/get-account-info";
              };
            };
          } | {
            id: "deleteUserCustom";
            endpoints: {
              deleteUserCustom: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_21 extends boolean = false>(inputCtx_0: {
                  body: {
                    TOTPCode: string;
                  };
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_21 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_21] extends [true] ? {
                  headers: Headers;
                  response: void;
                } : void>;
                options: {
                  method: "POST";
                  body: zod_v490.ZodObject<{
                    TOTPCode: zod_v490.ZodString;
                  }, zod_v4_core91.$strip>;
                } & {
                  use: any[];
                };
                path: "/delete-user-custom";
              };
            };
          } | {
            id: "oneTimeToken";
            endpoints: {
              generateOneTimeToken: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_21 extends boolean = false>(inputCtx_0?: ({
                  body?: undefined;
                } & {
                  method?: "GET" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_21 | undefined;
                }) | undefined): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_21] extends [true] ? {
                  headers: Headers;
                  response: {
                    token: string;
                  };
                } : {
                  token: string;
                }>;
                options: {
                  method: "GET";
                  use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                    session: {
                      session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                      };
                      user: Record<string, any> & {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        image?: string | null | undefined;
                      };
                    };
                  }>)[];
                } & {
                  use: any[];
                };
                path: "/one-time-token/generate";
              };
              applyOneTimeToken: {
                <AsResponse_1 extends boolean = false, ReturnHeaders_21 extends boolean = false>(inputCtx_0: {
                  body: {
                    token: string;
                  };
                } & {
                  method?: "POST" | undefined;
                } & {
                  query?: Record<string, any> | undefined;
                } & {
                  params?: Record<string, any>;
                } & {
                  request?: Request;
                } & {
                  headers?: HeadersInit;
                } & {
                  asResponse?: boolean;
                  returnHeaders?: boolean;
                  use?: better_call87.Middleware[];
                  path?: string;
                } & {
                  asResponse?: AsResponse_1 | undefined;
                  returnHeaders?: ReturnHeaders_21 | undefined;
                }): Promise<[AsResponse_1] extends [true] ? Response : [ReturnHeaders_21] extends [true] ? {
                  headers: Headers;
                  response: {
                    user: {
                      id: string;
                      name: string;
                      email: string;
                      emailVerified: boolean;
                      createdAt: Date;
                      updatedAt: Date;
                      image?: string | null | undefined;
                    } & Record<string, any>;
                  };
                } : {
                  user: {
                    id: string;
                    name: string;
                    email: string;
                    emailVerified: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    image?: string | null | undefined;
                  } & Record<string, any>;
                }>;
                options: {
                  method: "POST";
                  body: zod110.ZodObject<{
                    token: zod110.ZodString;
                  }, "strip", zod110.ZodTypeAny, {
                    token: string;
                  }, {
                    token: string;
                  }>;
                } & {
                  use: any[];
                };
                path: "/one-time-token/apply";
              };
            };
          })[];
        }>> & {
          name?: string;
          image?: string;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
        };
      } : {
        status: boolean;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        metadata: {
          $Infer: {
            body: Partial<better_auth771.AdditionalUserFieldsInput<{
              appName: string;
              database: (options: BetterAuthOptions) => better_auth771.Adapter;
              databaseHooks: {
                user: {
                  create: {
                    after: (newUser: {
                      id: string;
                      name: string;
                      email: string;
                      emailVerified: boolean;
                      createdAt: Date;
                      updatedAt: Date;
                      image?: string | null | undefined;
                    }, context: better_auth771.GenericEndpointContext | undefined) => Promise<void>;
                  };
                };
              };
              advanced: {
                database: {
                  generateId: false;
                };
                defaultCookieAttributes: {
                  sameSite: "none";
                  secure: true;
                };
              };
              session: {
                updateAge: number;
                expiresIn: number;
              };
              basePath: string;
              trustedOrigins: string[];
              user: {
                additionalFields: {
                  handle: {
                    type: "string";
                  };
                  socialLinks: {
                    type: "string";
                    transform: {
                      input: (value: string | number | boolean | string[] | Date | number[] | null | undefined) => string;
                      output: (value: string | number | boolean | string[] | Date | number[] | null | undefined) => any;
                    };
                  };
                  bio: {
                    type: "string";
                  };
                  website: {
                    type: "string";
                  };
                  deleted: {
                    type: "boolean";
                  };
                  role: {
                    type: "string";
                  };
                  roleEndAt: {
                    type: "date";
                  };
                };
                changeEmail: {
                  enabled: true;
                  sendChangeEmailVerification: ({
                    user,
                    url
                  }: {
                    user: better_auth771.User;
                    newEmail: string;
                    url: string;
                    token: string;
                  }) => Promise<void>;
                };
              };
              account: {
                accountLinking: {
                  enabled: true;
                  trustedProviders: ("github" | "apple" | "google")[];
                  allowDifferentEmails: true;
                };
              };
              socialProviders: {
                google: {
                  clientId: string;
                  clientSecret: string;
                };
                github: {
                  clientId: string;
                  clientSecret: string;
                };
                apple: {
                  enabled: boolean;
                  clientId: string;
                  clientSecret: string;
                  appBundleIdentifier: string | undefined;
                };
              };
              emailAndPassword: {
                enabled: true;
                sendResetPassword({
                  user,
                  url
                }: {
                  user: better_auth771.User;
                  url: string;
                  token: string;
                }): Promise<void>;
              };
              emailVerification: {
                sendOnSignUp: true;
                sendVerificationEmail({
                  user,
                  url
                }: {
                  user: better_auth771.User;
                  url: string;
                  token: string;
                }): Promise<void>;
              };
              plugins: ({
                id: "stripe";
                endpoints: {
                  stripeWebhook: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
                      body?: undefined;
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        success: boolean;
                      };
                    } : {
                      success: boolean;
                    }>;
                    options: {
                      method: "POST";
                      metadata: {
                        isAction: boolean;
                      };
                      cloneRequest: true;
                    } & {
                      use: any[];
                    };
                    path: "/stripe/webhook";
                  };
                } & {
                  readonly upgradeSubscription: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        plan: string;
                        metadata?: Record<string, any> | undefined;
                        annual?: boolean | undefined;
                        referenceId?: string | undefined;
                        subscriptionId?: string | undefined;
                        seats?: number | undefined;
                        successUrl?: string | undefined;
                        cancelUrl?: string | undefined;
                        returnUrl?: string | undefined;
                        disableRedirect?: boolean | undefined;
                      };
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        url: string;
                        redirect: boolean;
                      } | {
                        redirect: boolean;
                        id: string;
                        object: "checkout.session";
                        adaptive_pricing: Stripe.Checkout.Session.AdaptivePricing | null;
                        after_expiration: Stripe.Checkout.Session.AfterExpiration | null;
                        allow_promotion_codes: boolean | null;
                        amount_subtotal: number | null;
                        amount_total: number | null;
                        automatic_tax: Stripe.Checkout.Session.AutomaticTax;
                        billing_address_collection: Stripe.Checkout.Session.BillingAddressCollection | null;
                        cancel_url: string | null;
                        client_reference_id: string | null;
                        client_secret: string | null;
                        collected_information: Stripe.Checkout.Session.CollectedInformation | null;
                        consent: Stripe.Checkout.Session.Consent | null;
                        consent_collection: Stripe.Checkout.Session.ConsentCollection | null;
                        created: number;
                        currency: string | null;
                        currency_conversion: Stripe.Checkout.Session.CurrencyConversion | null;
                        custom_fields: Array<Stripe.Checkout.Session.CustomField>;
                        custom_text: Stripe.Checkout.Session.CustomText;
                        customer: string | Stripe.Customer | Stripe.DeletedCustomer | null;
                        customer_creation: Stripe.Checkout.Session.CustomerCreation | null;
                        customer_details: Stripe.Checkout.Session.CustomerDetails | null;
                        customer_email: string | null;
                        discounts: Array<Stripe.Checkout.Session.Discount> | null;
                        expires_at: number;
                        invoice: string | Stripe.Invoice | null;
                        invoice_creation: Stripe.Checkout.Session.InvoiceCreation | null;
                        line_items?: Stripe.ApiList<Stripe.LineItem>;
                        livemode: boolean;
                        locale: Stripe.Checkout.Session.Locale | null;
                        metadata: Stripe.Metadata | null;
                        mode: Stripe.Checkout.Session.Mode;
                        optional_items?: Array<Stripe.Checkout.Session.OptionalItem> | null;
                        payment_intent: string | Stripe.PaymentIntent | null;
                        payment_link: string | Stripe.PaymentLink | null;
                        payment_method_collection: Stripe.Checkout.Session.PaymentMethodCollection | null;
                        payment_method_configuration_details: Stripe.Checkout.Session.PaymentMethodConfigurationDetails | null;
                        payment_method_options: Stripe.Checkout.Session.PaymentMethodOptions | null;
                        payment_method_types: Array<string>;
                        payment_status: Stripe.Checkout.Session.PaymentStatus;
                        permissions: Stripe.Checkout.Session.Permissions | null;
                        phone_number_collection?: Stripe.Checkout.Session.PhoneNumberCollection;
                        presentment_details?: Stripe.Checkout.Session.PresentmentDetails;
                        recovered_from: string | null;
                        redirect_on_completion?: Stripe.Checkout.Session.RedirectOnCompletion;
                        return_url?: string;
                        saved_payment_method_options: Stripe.Checkout.Session.SavedPaymentMethodOptions | null;
                        setup_intent: string | Stripe.SetupIntent | null;
                        shipping_address_collection: Stripe.Checkout.Session.ShippingAddressCollection | null;
                        shipping_cost: Stripe.Checkout.Session.ShippingCost | null;
                        shipping_options: Array<Stripe.Checkout.Session.ShippingOption>;
                        status: Stripe.Checkout.Session.Status | null;
                        submit_type: Stripe.Checkout.Session.SubmitType | null;
                        subscription: string | Stripe.Subscription | null;
                        success_url: string | null;
                        tax_id_collection?: Stripe.Checkout.Session.TaxIdCollection;
                        total_details: Stripe.Checkout.Session.TotalDetails | null;
                        ui_mode: Stripe.Checkout.Session.UiMode | null;
                        url: string | null;
                        lastResponse: {
                          headers: {
                            [key: string]: string;
                          };
                          requestId: string;
                          statusCode: number;
                          apiVersion?: string;
                          idempotencyKey?: string;
                          stripeAccount?: string;
                        };
                      };
                    } : {
                      url: string;
                      redirect: boolean;
                    } | {
                      redirect: boolean;
                      id: string;
                      object: "checkout.session";
                      adaptive_pricing: Stripe.Checkout.Session.AdaptivePricing | null;
                      after_expiration: Stripe.Checkout.Session.AfterExpiration | null;
                      allow_promotion_codes: boolean | null;
                      amount_subtotal: number | null;
                      amount_total: number | null;
                      automatic_tax: Stripe.Checkout.Session.AutomaticTax;
                      billing_address_collection: Stripe.Checkout.Session.BillingAddressCollection | null;
                      cancel_url: string | null;
                      client_reference_id: string | null;
                      client_secret: string | null;
                      collected_information: Stripe.Checkout.Session.CollectedInformation | null;
                      consent: Stripe.Checkout.Session.Consent | null;
                      consent_collection: Stripe.Checkout.Session.ConsentCollection | null;
                      created: number;
                      currency: string | null;
                      currency_conversion: Stripe.Checkout.Session.CurrencyConversion | null;
                      custom_fields: Array<Stripe.Checkout.Session.CustomField>;
                      custom_text: Stripe.Checkout.Session.CustomText;
                      customer: string | Stripe.Customer | Stripe.DeletedCustomer | null;
                      customer_creation: Stripe.Checkout.Session.CustomerCreation | null;
                      customer_details: Stripe.Checkout.Session.CustomerDetails | null;
                      customer_email: string | null;
                      discounts: Array<Stripe.Checkout.Session.Discount> | null;
                      expires_at: number;
                      invoice: string | Stripe.Invoice | null;
                      invoice_creation: Stripe.Checkout.Session.InvoiceCreation | null;
                      line_items?: Stripe.ApiList<Stripe.LineItem>;
                      livemode: boolean;
                      locale: Stripe.Checkout.Session.Locale | null;
                      metadata: Stripe.Metadata | null;
                      mode: Stripe.Checkout.Session.Mode;
                      optional_items?: Array<Stripe.Checkout.Session.OptionalItem> | null;
                      payment_intent: string | Stripe.PaymentIntent | null;
                      payment_link: string | Stripe.PaymentLink | null;
                      payment_method_collection: Stripe.Checkout.Session.PaymentMethodCollection | null;
                      payment_method_configuration_details: Stripe.Checkout.Session.PaymentMethodConfigurationDetails | null;
                      payment_method_options: Stripe.Checkout.Session.PaymentMethodOptions | null;
                      payment_method_types: Array<string>;
                      payment_status: Stripe.Checkout.Session.PaymentStatus;
                      permissions: Stripe.Checkout.Session.Permissions | null;
                      phone_number_collection?: Stripe.Checkout.Session.PhoneNumberCollection;
                      presentment_details?: Stripe.Checkout.Session.PresentmentDetails;
                      recovered_from: string | null;
                      redirect_on_completion?: Stripe.Checkout.Session.RedirectOnCompletion;
                      return_url?: string;
                      saved_payment_method_options: Stripe.Checkout.Session.SavedPaymentMethodOptions | null;
                      setup_intent: string | Stripe.SetupIntent | null;
                      shipping_address_collection: Stripe.Checkout.Session.ShippingAddressCollection | null;
                      shipping_cost: Stripe.Checkout.Session.ShippingCost | null;
                      shipping_options: Array<Stripe.Checkout.Session.ShippingOption>;
                      status: Stripe.Checkout.Session.Status | null;
                      submit_type: Stripe.Checkout.Session.SubmitType | null;
                      subscription: string | Stripe.Subscription | null;
                      success_url: string | null;
                      tax_id_collection?: Stripe.Checkout.Session.TaxIdCollection;
                      total_details: Stripe.Checkout.Session.TotalDetails | null;
                      ui_mode: Stripe.Checkout.Session.UiMode | null;
                      url: string | null;
                      lastResponse: {
                        headers: {
                          [key: string]: string;
                        };
                        requestId: string;
                        statusCode: number;
                        apiVersion?: string;
                        idempotencyKey?: string;
                        stripeAccount?: string;
                      };
                    }>;
                    options: {
                      method: "POST";
                      body: zod110.ZodObject<{
                        plan: zod110.ZodString;
                        annual: zod110.ZodOptional<zod110.ZodBoolean>;
                        referenceId: zod110.ZodOptional<zod110.ZodString>;
                        subscriptionId: zod110.ZodOptional<zod110.ZodString>;
                        metadata: zod110.ZodOptional<zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>>;
                        seats: zod110.ZodOptional<zod110.ZodNumber>;
                        successUrl: zod110.ZodDefault<zod110.ZodString>;
                        cancelUrl: zod110.ZodDefault<zod110.ZodString>;
                        returnUrl: zod110.ZodOptional<zod110.ZodString>;
                        disableRedirect: zod110.ZodDefault<zod110.ZodBoolean>;
                      }, "strip", zod110.ZodTypeAny, {
                        plan: string;
                        successUrl: string;
                        cancelUrl: string;
                        disableRedirect: boolean;
                        metadata?: Record<string, any> | undefined;
                        annual?: boolean | undefined;
                        referenceId?: string | undefined;
                        subscriptionId?: string | undefined;
                        seats?: number | undefined;
                        returnUrl?: string | undefined;
                      }, {
                        plan: string;
                        metadata?: Record<string, any> | undefined;
                        annual?: boolean | undefined;
                        referenceId?: string | undefined;
                        subscriptionId?: string | undefined;
                        seats?: number | undefined;
                        successUrl?: string | undefined;
                        cancelUrl?: string | undefined;
                        returnUrl?: string | undefined;
                        disableRedirect?: boolean | undefined;
                      }>;
                      use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                        session: {
                          session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                          };
                          user: Record<string, any> & {
                            id: string;
                            name: string;
                            email: string;
                            emailVerified: boolean;
                            createdAt: Date;
                            updatedAt: Date;
                            image?: string | null | undefined;
                          };
                        };
                      }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
                    } & {
                      use: any[];
                    };
                    path: "/subscription/upgrade";
                  };
                  readonly cancelSubscriptionCallback: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
                      body?: undefined;
                    } & {
                      method?: "GET" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: never;
                    } : never>;
                    options: {
                      method: "GET";
                      query: zod110.ZodOptional<zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>>;
                      use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>)[];
                    } & {
                      use: any[];
                    };
                    path: "/subscription/cancel/callback";
                  };
                  readonly cancelSubscription: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        returnUrl: string;
                        referenceId?: string | undefined;
                        subscriptionId?: string | undefined;
                      };
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        url: string;
                        redirect: boolean;
                      };
                    } : {
                      url: string;
                      redirect: boolean;
                    }>;
                    options: {
                      method: "POST";
                      body: zod110.ZodObject<{
                        referenceId: zod110.ZodOptional<zod110.ZodString>;
                        subscriptionId: zod110.ZodOptional<zod110.ZodString>;
                        returnUrl: zod110.ZodString;
                      }, "strip", zod110.ZodTypeAny, {
                        returnUrl: string;
                        referenceId?: string | undefined;
                        subscriptionId?: string | undefined;
                      }, {
                        returnUrl: string;
                        referenceId?: string | undefined;
                        subscriptionId?: string | undefined;
                      }>;
                      use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                        session: {
                          session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                          };
                          user: Record<string, any> & {
                            id: string;
                            name: string;
                            email: string;
                            emailVerified: boolean;
                            createdAt: Date;
                            updatedAt: Date;
                            image?: string | null | undefined;
                          };
                        };
                      }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
                    } & {
                      use: any[];
                    };
                    path: "/subscription/cancel";
                  };
                  readonly restoreSubscription: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        referenceId?: string | undefined;
                        subscriptionId?: string | undefined;
                      };
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: Stripe.Response<Stripe.Subscription>;
                    } : Stripe.Response<Stripe.Subscription>>;
                    options: {
                      method: "POST";
                      body: zod110.ZodObject<{
                        referenceId: zod110.ZodOptional<zod110.ZodString>;
                        subscriptionId: zod110.ZodOptional<zod110.ZodString>;
                      }, "strip", zod110.ZodTypeAny, {
                        referenceId?: string | undefined;
                        subscriptionId?: string | undefined;
                      }, {
                        referenceId?: string | undefined;
                        subscriptionId?: string | undefined;
                      }>;
                      use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                        session: {
                          session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                          };
                          user: Record<string, any> & {
                            id: string;
                            name: string;
                            email: string;
                            emailVerified: boolean;
                            createdAt: Date;
                            updatedAt: Date;
                            image?: string | null | undefined;
                          };
                        };
                      }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
                    } & {
                      use: any[];
                    };
                    path: "/subscription/restore";
                  };
                  readonly listActiveSubscriptions: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
                      body?: undefined;
                    } & {
                      method?: "GET" | undefined;
                    } & {
                      query?: {
                        referenceId?: string | undefined;
                      } | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        limits: Record<string, number> | undefined;
                        priceId: string | undefined;
                        id: string;
                        plan: string;
                        stripeCustomerId?: string;
                        stripeSubscriptionId?: string;
                        trialStart?: Date;
                        trialEnd?: Date;
                        referenceId: string;
                        status: "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "paused" | "trialing" | "unpaid";
                        periodStart?: Date;
                        periodEnd?: Date;
                        cancelAtPeriodEnd?: boolean;
                        groupId?: string;
                        seats?: number;
                      }[];
                    } : {
                      limits: Record<string, number> | undefined;
                      priceId: string | undefined;
                      id: string;
                      plan: string;
                      stripeCustomerId?: string;
                      stripeSubscriptionId?: string;
                      trialStart?: Date;
                      trialEnd?: Date;
                      referenceId: string;
                      status: "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "paused" | "trialing" | "unpaid";
                      periodStart?: Date;
                      periodEnd?: Date;
                      cancelAtPeriodEnd?: boolean;
                      groupId?: string;
                      seats?: number;
                    }[]>;
                    options: {
                      method: "GET";
                      query: zod110.ZodOptional<zod110.ZodObject<{
                        referenceId: zod110.ZodOptional<zod110.ZodString>;
                      }, "strip", zod110.ZodTypeAny, {
                        referenceId?: string | undefined;
                      }, {
                        referenceId?: string | undefined;
                      }>>;
                      use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                        session: {
                          session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                          };
                          user: Record<string, any> & {
                            id: string;
                            name: string;
                            email: string;
                            emailVerified: boolean;
                            createdAt: Date;
                            updatedAt: Date;
                            image?: string | null | undefined;
                          };
                        };
                      }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
                    } & {
                      use: any[];
                    };
                    path: "/subscription/list";
                  };
                  readonly subscriptionSuccess: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
                      body?: undefined;
                    } & {
                      method?: "GET" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: better_call87.APIError;
                    } : better_call87.APIError>;
                    options: {
                      method: "GET";
                      query: zod110.ZodOptional<zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>>;
                      use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>)[];
                    } & {
                      use: any[];
                    };
                    path: "/subscription/success";
                  };
                };
                init(ctx: better_auth771.AuthContext): {
                  options: {
                    databaseHooks: {
                      user: {
                        create: {
                          after(user: {
                            id: string;
                            name: string;
                            email: string;
                            emailVerified: boolean;
                            createdAt: Date;
                            updatedAt: Date;
                            image?: string | null | undefined;
                          }, ctx: better_auth771.GenericEndpointContext | undefined): Promise<void>;
                        };
                      };
                    };
                  };
                };
                schema: {
                  user: {
                    fields: {
                      stripeCustomerId: {
                        type: "string";
                        required: false;
                      };
                    };
                  };
                  subscription?: {
                    fields: {
                      plan: {
                        type: "string";
                        required: true;
                      };
                      referenceId: {
                        type: "string";
                        required: true;
                      };
                      stripeCustomerId: {
                        type: "string";
                        required: false;
                      };
                      stripeSubscriptionId: {
                        type: "string";
                        required: false;
                      };
                      status: {
                        type: "string";
                        defaultValue: string;
                      };
                      periodStart: {
                        type: "date";
                        required: false;
                      };
                      periodEnd: {
                        type: "date";
                        required: false;
                      };
                      cancelAtPeriodEnd: {
                        type: "boolean";
                        required: false;
                        defaultValue: false;
                      };
                      seats: {
                        type: "number";
                        required: false;
                      };
                    };
                  } | undefined;
                };
              } | {
                id: "open-api";
                endpoints: {
                  generateOpenAPISchema: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
                      body?: undefined;
                    } & {
                      method?: "GET" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        openapi: string;
                        info: {
                          title: string;
                          description: string;
                          version: string;
                        };
                        components: {
                          securitySchemes: {
                            apiKeyCookie: {
                              type: string;
                              in: string;
                              name: string;
                              description: string;
                            };
                            bearerAuth: {
                              type: string;
                              scheme: string;
                              description: string;
                            };
                          };
                          schemas: {};
                        };
                        security: {
                          apiKeyCookie: never[];
                          bearerAuth: never[];
                        }[];
                        servers: {
                          url: string;
                        }[];
                        tags: {
                          name: string;
                          description: string;
                        }[];
                        paths: Record<string, better_auth_plugins857.Path>;
                      };
                    } : {
                      openapi: string;
                      info: {
                        title: string;
                        description: string;
                        version: string;
                      };
                      components: {
                        securitySchemes: {
                          apiKeyCookie: {
                            type: string;
                            in: string;
                            name: string;
                            description: string;
                          };
                          bearerAuth: {
                            type: string;
                            scheme: string;
                            description: string;
                          };
                        };
                        schemas: {};
                      };
                      security: {
                        apiKeyCookie: never[];
                        bearerAuth: never[];
                      }[];
                      servers: {
                        url: string;
                      }[];
                      tags: {
                        name: string;
                        description: string;
                      }[];
                      paths: Record<string, better_auth_plugins857.Path>;
                    }>;
                    options: {
                      method: "GET";
                    } & {
                      use: any[];
                    };
                    path: "/open-api/generate-schema";
                  };
                  openAPIReference: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
                      body?: undefined;
                    } & {
                      method?: "GET" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: Response;
                    } : Response>;
                    options: {
                      method: "GET";
                      metadata: {
                        isAction: boolean;
                      };
                    } & {
                      use: any[];
                    };
                    path: "/reference";
                  };
                };
              } | {
                id: "two-factor";
                endpoints: {
                  enableTwoFactor: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        password: string;
                        issuer?: string | undefined;
                      };
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        totpURI: string;
                        backupCodes: string[];
                      };
                    } : {
                      totpURI: string;
                      backupCodes: string[];
                    }>;
                    options: {
                      method: "POST";
                      body: zod110.ZodObject<{
                        password: zod110.ZodString;
                        issuer: zod110.ZodOptional<zod110.ZodString>;
                      }, "strip", zod110.ZodTypeAny, {
                        password: string;
                        issuer?: string | undefined;
                      }, {
                        password: string;
                        issuer?: string | undefined;
                      }>;
                      use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                        session: {
                          session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                          };
                          user: Record<string, any> & {
                            id: string;
                            name: string;
                            email: string;
                            emailVerified: boolean;
                            createdAt: Date;
                            updatedAt: Date;
                            image?: string | null | undefined;
                          };
                        };
                      }>)[];
                      metadata: {
                        openapi: {
                          summary: string;
                          description: string;
                          responses: {
                            200: {
                              description: string;
                              content: {
                                "application/json": {
                                  schema: {
                                    type: "object";
                                    properties: {
                                      totpURI: {
                                        type: string;
                                        description: string;
                                      };
                                      backupCodes: {
                                        type: string;
                                        items: {
                                          type: string;
                                        };
                                        description: string;
                                      };
                                    };
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    } & {
                      use: any[];
                    };
                    path: "/two-factor/enable";
                  };
                  disableTwoFactor: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        password: string;
                      };
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        status: boolean;
                      };
                    } : {
                      status: boolean;
                    }>;
                    options: {
                      method: "POST";
                      body: zod110.ZodObject<{
                        password: zod110.ZodString;
                      }, "strip", zod110.ZodTypeAny, {
                        password: string;
                      }, {
                        password: string;
                      }>;
                      use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                        session: {
                          session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                          };
                          user: Record<string, any> & {
                            id: string;
                            name: string;
                            email: string;
                            emailVerified: boolean;
                            createdAt: Date;
                            updatedAt: Date;
                            image?: string | null | undefined;
                          };
                        };
                      }>)[];
                      metadata: {
                        openapi: {
                          summary: string;
                          description: string;
                          responses: {
                            200: {
                              description: string;
                              content: {
                                "application/json": {
                                  schema: {
                                    type: "object";
                                    properties: {
                                      status: {
                                        type: string;
                                      };
                                    };
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    } & {
                      use: any[];
                    };
                    path: "/two-factor/disable";
                  };
                  verifyBackupCode: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        code: string;
                        trustDevice?: boolean | undefined;
                        disableSession?: boolean | undefined;
                      };
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        token: string | undefined;
                        user: {
                          id: string;
                          email: string;
                          emailVerified: boolean;
                          name: string;
                          image: string | null | undefined;
                          createdAt: Date;
                          updatedAt: Date;
                        };
                      };
                    } : {
                      token: string | undefined;
                      user: {
                        id: string;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image: string | null | undefined;
                        createdAt: Date;
                        updatedAt: Date;
                      };
                    }>;
                    options: {
                      method: "POST";
                      body: zod110.ZodObject<{
                        code: zod110.ZodString;
                        disableSession: zod110.ZodOptional<zod110.ZodBoolean>;
                        trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
                      }, "strip", zod110.ZodTypeAny, {
                        code: string;
                        trustDevice?: boolean | undefined;
                        disableSession?: boolean | undefined;
                      }, {
                        code: string;
                        trustDevice?: boolean | undefined;
                        disableSession?: boolean | undefined;
                      }>;
                      metadata: {
                        openapi: {
                          description: string;
                          responses: {
                            "200": {
                              description: string;
                              content: {
                                "application/json": {
                                  schema: {
                                    type: "object";
                                    properties: {
                                      user: {
                                        type: string;
                                        properties: {
                                          id: {
                                            type: string;
                                            description: string;
                                          };
                                          email: {
                                            type: string;
                                            format: string;
                                            nullable: boolean;
                                            description: string;
                                          };
                                          emailVerified: {
                                            type: string;
                                            nullable: boolean;
                                            description: string;
                                          };
                                          name: {
                                            type: string;
                                            nullable: boolean;
                                            description: string;
                                          };
                                          image: {
                                            type: string;
                                            format: string;
                                            nullable: boolean;
                                            description: string;
                                          };
                                          twoFactorEnabled: {
                                            type: string;
                                            description: string;
                                          };
                                          createdAt: {
                                            type: string;
                                            format: string;
                                            description: string;
                                          };
                                          updatedAt: {
                                            type: string;
                                            format: string;
                                            description: string;
                                          };
                                        };
                                        required: string[];
                                        description: string;
                                      };
                                      session: {
                                        type: string;
                                        properties: {
                                          token: {
                                            type: string;
                                            description: string;
                                          };
                                          userId: {
                                            type: string;
                                            description: string;
                                          };
                                          createdAt: {
                                            type: string;
                                            format: string;
                                            description: string;
                                          };
                                          expiresAt: {
                                            type: string;
                                            format: string;
                                            description: string;
                                          };
                                        };
                                        required: string[];
                                        description: string;
                                      };
                                    };
                                    required: string[];
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    } & {
                      use: any[];
                    };
                    path: "/two-factor/verify-backup-code";
                  };
                  generateBackupCodes: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        password: string;
                      };
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        status: boolean;
                        backupCodes: string[];
                      };
                    } : {
                      status: boolean;
                      backupCodes: string[];
                    }>;
                    options: {
                      method: "POST";
                      body: zod110.ZodObject<{
                        password: zod110.ZodString;
                      }, "strip", zod110.ZodTypeAny, {
                        password: string;
                      }, {
                        password: string;
                      }>;
                      use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                        session: {
                          session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                          };
                          user: Record<string, any> & {
                            id: string;
                            name: string;
                            email: string;
                            emailVerified: boolean;
                            createdAt: Date;
                            updatedAt: Date;
                            image?: string | null | undefined;
                          };
                        };
                      }>)[];
                      metadata: {
                        openapi: {
                          description: string;
                          responses: {
                            "200": {
                              description: string;
                              content: {
                                "application/json": {
                                  schema: {
                                    type: "object";
                                    properties: {
                                      status: {
                                        type: string;
                                        description: string;
                                        enum: boolean[];
                                      };
                                      backupCodes: {
                                        type: string;
                                        items: {
                                          type: string;
                                        };
                                        description: string;
                                      };
                                    };
                                    required: string[];
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    } & {
                      use: any[];
                    };
                    path: "/two-factor/generate-backup-codes";
                  };
                  viewBackupCodes: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        userId: string;
                      };
                    } & {
                      method?: "GET" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        status: boolean;
                        backupCodes: string[];
                      };
                    } : {
                      status: boolean;
                      backupCodes: string[];
                    }>;
                    options: {
                      method: "GET";
                      body: zod110.ZodObject<{
                        userId: zod110.ZodString;
                      }, "strip", zod110.ZodTypeAny, {
                        userId: string;
                      }, {
                        userId: string;
                      }>;
                      metadata: {
                        SERVER_ONLY: true;
                      };
                    } & {
                      use: any[];
                    };
                    path: "/two-factor/view-backup-codes";
                  };
                  sendTwoFactorOTP: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
                      body?: {
                        trustDevice?: boolean | undefined;
                      } | undefined;
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        status: boolean;
                      };
                    } : {
                      status: boolean;
                    }>;
                    options: {
                      method: "POST";
                      body: zod110.ZodOptional<zod110.ZodObject<{
                        trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
                      }, "strip", zod110.ZodTypeAny, {
                        trustDevice?: boolean | undefined;
                      }, {
                        trustDevice?: boolean | undefined;
                      }>>;
                      metadata: {
                        openapi: {
                          summary: string;
                          description: string;
                          responses: {
                            200: {
                              description: string;
                              content: {
                                "application/json": {
                                  schema: {
                                    type: "object";
                                    properties: {
                                      status: {
                                        type: string;
                                      };
                                    };
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    } & {
                      use: any[];
                    };
                    path: "/two-factor/send-otp";
                  };
                  verifyTwoFactorOTP: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        code: string;
                        trustDevice?: boolean | undefined;
                      };
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        token: string;
                        user: {
                          id: any;
                          email: any;
                          emailVerified: any;
                          name: any;
                          image: any;
                          createdAt: any;
                          updatedAt: any;
                        };
                      };
                    } : {
                      token: string;
                      user: {
                        id: any;
                        email: any;
                        emailVerified: any;
                        name: any;
                        image: any;
                        createdAt: any;
                        updatedAt: any;
                      };
                    }>;
                    options: {
                      method: "POST";
                      body: zod110.ZodObject<{
                        code: zod110.ZodString;
                        trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
                      }, "strip", zod110.ZodTypeAny, {
                        code: string;
                        trustDevice?: boolean | undefined;
                      }, {
                        code: string;
                        trustDevice?: boolean | undefined;
                      }>;
                      metadata: {
                        openapi: {
                          summary: string;
                          description: string;
                          responses: {
                            "200": {
                              description: string;
                              content: {
                                "application/json": {
                                  schema: {
                                    type: "object";
                                    properties: {
                                      token: {
                                        type: string;
                                        description: string;
                                      };
                                      user: {
                                        type: string;
                                        properties: {
                                          id: {
                                            type: string;
                                            description: string;
                                          };
                                          email: {
                                            type: string;
                                            format: string;
                                            nullable: boolean;
                                            description: string;
                                          };
                                          emailVerified: {
                                            type: string;
                                            nullable: boolean;
                                            description: string;
                                          };
                                          name: {
                                            type: string;
                                            nullable: boolean;
                                            description: string;
                                          };
                                          image: {
                                            type: string;
                                            format: string;
                                            nullable: boolean;
                                            description: string;
                                          };
                                          createdAt: {
                                            type: string;
                                            format: string;
                                            description: string;
                                          };
                                          updatedAt: {
                                            type: string;
                                            format: string;
                                            description: string;
                                          };
                                        };
                                        required: string[];
                                        description: string;
                                      };
                                    };
                                    required: string[];
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    } & {
                      use: any[];
                    };
                    path: "/two-factor/verify-otp";
                  };
                  generateTOTP: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        secret: string;
                      };
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        code: string;
                      };
                    } : {
                      code: string;
                    }>;
                    options: {
                      method: "POST";
                      body: zod110.ZodObject<{
                        secret: zod110.ZodString;
                      }, "strip", zod110.ZodTypeAny, {
                        secret: string;
                      }, {
                        secret: string;
                      }>;
                      metadata: {
                        openapi: {
                          summary: string;
                          description: string;
                          responses: {
                            200: {
                              description: string;
                              content: {
                                "application/json": {
                                  schema: {
                                    type: "object";
                                    properties: {
                                      code: {
                                        type: string;
                                      };
                                    };
                                  };
                                };
                              };
                            };
                          };
                        };
                        SERVER_ONLY: true;
                      };
                    } & {
                      use: any[];
                    };
                    path: "/totp/generate";
                  };
                  getTOTPURI: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        password: string;
                      };
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        totpURI: string;
                      };
                    } : {
                      totpURI: string;
                    }>;
                    options: {
                      method: "POST";
                      use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                        session: {
                          session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                          };
                          user: Record<string, any> & {
                            id: string;
                            name: string;
                            email: string;
                            emailVerified: boolean;
                            createdAt: Date;
                            updatedAt: Date;
                            image?: string | null | undefined;
                          };
                        };
                      }>)[];
                      body: zod110.ZodObject<{
                        password: zod110.ZodString;
                      }, "strip", zod110.ZodTypeAny, {
                        password: string;
                      }, {
                        password: string;
                      }>;
                      metadata: {
                        openapi: {
                          summary: string;
                          description: string;
                          responses: {
                            200: {
                              description: string;
                              content: {
                                "application/json": {
                                  schema: {
                                    type: "object";
                                    properties: {
                                      totpURI: {
                                        type: string;
                                      };
                                    };
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    } & {
                      use: any[];
                    };
                    path: "/two-factor/get-totp-uri";
                  };
                  verifyTOTP: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        code: string;
                        trustDevice?: boolean | undefined;
                      };
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        token: string;
                        user: {
                          id: string;
                          email: string;
                          emailVerified: boolean;
                          name: string;
                          image: string | null | undefined;
                          createdAt: Date;
                          updatedAt: Date;
                        };
                      };
                    } : {
                      token: string;
                      user: {
                        id: string;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image: string | null | undefined;
                        createdAt: Date;
                        updatedAt: Date;
                      };
                    }>;
                    options: {
                      method: "POST";
                      body: zod110.ZodObject<{
                        code: zod110.ZodString;
                        trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
                      }, "strip", zod110.ZodTypeAny, {
                        code: string;
                        trustDevice?: boolean | undefined;
                      }, {
                        code: string;
                        trustDevice?: boolean | undefined;
                      }>;
                      metadata: {
                        openapi: {
                          summary: string;
                          description: string;
                          responses: {
                            200: {
                              description: string;
                              content: {
                                "application/json": {
                                  schema: {
                                    type: "object";
                                    properties: {
                                      status: {
                                        type: string;
                                      };
                                    };
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    } & {
                      use: any[];
                    };
                    path: "/two-factor/verify-totp";
                  };
                };
                options: better_auth_plugins857.TwoFactorOptions | undefined;
                hooks: {
                  after: {
                    matcher(context: better_auth771.HookEndpointContext): boolean;
                    handler: (inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                      twoFactorRedirect: boolean;
                    } | undefined>;
                  }[];
                };
                schema: {
                  user: {
                    fields: {
                      twoFactorEnabled: {
                        type: "boolean";
                        required: false;
                        defaultValue: false;
                        input: false;
                      };
                    };
                  };
                  twoFactor: {
                    fields: {
                      secret: {
                        type: "string";
                        required: true;
                        returned: false;
                      };
                      backupCodes: {
                        type: "string";
                        required: true;
                        returned: false;
                      };
                      userId: {
                        type: "string";
                        required: true;
                        returned: false;
                        references: {
                          model: string;
                          field: string;
                        };
                      };
                    };
                  };
                };
                rateLimit: {
                  pathMatcher(path: string): boolean;
                  window: number;
                  max: number;
                }[];
                $ERROR_CODES: {
                  readonly OTP_NOT_ENABLED: "OTP not enabled";
                  readonly OTP_HAS_EXPIRED: "OTP has expired";
                  readonly TOTP_NOT_ENABLED: "TOTP not enabled";
                  readonly TWO_FACTOR_NOT_ENABLED: "Two factor isn't enabled";
                  readonly BACKUP_CODES_NOT_ENABLED: "Backup codes aren't enabled";
                  readonly INVALID_BACKUP_CODE: "Invalid backup code";
                  readonly INVALID_CODE: "Invalid code";
                  readonly TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: "Too many attempts. Please request a new code.";
                  readonly INVALID_TWO_FACTOR_COOKIE: "Invalid two factor cookie";
                };
              } | {
                id: "expo";
                init: (ctx: better_auth771.AuthContext) => {
                  options: {
                    trustedOrigins: string[];
                  };
                };
                onRequest(request: Request, ctx: better_auth771.AuthContext): Promise<{
                  request: Request;
                } | undefined>;
                hooks: {
                  after: {
                    matcher(context: better_auth771.HookEndpointContext): boolean;
                    handler: (inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>;
                  }[];
                };
              } | {
                id: "custom-session";
                endpoints: {
                  getSession: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body?: undefined;
                    } & {
                      method?: "GET" | undefined;
                    } & {
                      query?: {
                        disableCookieCache?: string | boolean | undefined;
                        disableRefresh?: boolean | undefined;
                      } | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        user: {
                          id: string;
                          name: string;
                          email: string;
                          emailVerified: boolean;
                          createdAt: Date;
                          updatedAt: Date;
                          image?: string | null | undefined | undefined;
                        } & {
                          image: string | null;
                          handle: string | null;
                          twoFactorEnabled: boolean | null;
                          socialLinks: Record<string, string> | null;
                          bio: string | null;
                          website: string | null;
                          role: string | null;
                          roleEndAt: Date | null;
                          deleted: boolean | null;
                        };
                        session: {
                          id: string;
                          createdAt: Date;
                          updatedAt: Date;
                          userId: string;
                          expiresAt: Date;
                          token: string;
                          ipAddress?: string | null | undefined | undefined;
                          userAgent?: string | null | undefined | undefined;
                        };
                        role: UserRole.PreProTrial | UserRole.PrePro | UserRole.Free | UserRole.Trial;
                        roleEndAt: Date | null | undefined;
                      } | null;
                    } : {
                      user: {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        image?: string | null | undefined | undefined;
                      } & {
                        image: string | null;
                        handle: string | null;
                        twoFactorEnabled: boolean | null;
                        socialLinks: Record<string, string> | null;
                        bio: string | null;
                        website: string | null;
                        role: string | null;
                        roleEndAt: Date | null;
                        deleted: boolean | null;
                      };
                      session: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined | undefined;
                        userAgent?: string | null | undefined | undefined;
                      };
                      role: UserRole.PreProTrial | UserRole.PrePro | UserRole.Free | UserRole.Trial;
                      roleEndAt: Date | null | undefined;
                    } | null>;
                    options: {
                      method: "GET";
                      query: zod110.ZodOptional<zod110.ZodObject<{
                        disableCookieCache: zod110.ZodOptional<zod110.ZodUnion<[zod110.ZodBoolean, zod110.ZodEffects<zod110.ZodString, boolean, string>]>>;
                        disableRefresh: zod110.ZodOptional<zod110.ZodBoolean>;
                      }, "strip", zod110.ZodTypeAny, {
                        disableCookieCache?: boolean | undefined;
                        disableRefresh?: boolean | undefined;
                      }, {
                        disableCookieCache?: string | boolean | undefined;
                        disableRefresh?: boolean | undefined;
                      }>>;
                      metadata: {
                        CUSTOM_SESSION: boolean;
                        openapi: {
                          description: string;
                          responses: {
                            "200": {
                              description: string;
                              content: {
                                "application/json": {
                                  schema: {
                                    type: "array";
                                    nullable: boolean;
                                    items: {
                                      $ref: string;
                                    };
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                      requireHeaders: true;
                    } & {
                      use: any[];
                    };
                    path: "/get-session";
                  };
                };
              } | {
                id: "customGetProviders";
                endpoints: {
                  customGetProviders: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
                      body?: undefined;
                    } & {
                      method?: "GET" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: any;
                    } : any>;
                    options: {
                      method: "GET";
                    } & {
                      use: any[];
                    };
                    path: "/get-providers";
                  };
                };
              } | {
                id: "getAccountInfo";
                endpoints: {
                  getAccountInfo: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
                      body?: undefined;
                    } & {
                      method?: "GET" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: ({
                        id: string;
                        provider: string;
                        profile: {
                          id: string;
                          name?: string;
                          email?: string | null;
                          image?: string;
                          emailVerified: boolean;
                        };
                        accountId?: undefined;
                      } | {
                        id: string;
                        accountId: string;
                        provider: string;
                        profile: {
                          id: string;
                          name?: string;
                          email?: string | null;
                          image?: string;
                          emailVerified: boolean;
                        } | undefined;
                      })[] | null;
                    } : ({
                      id: string;
                      provider: string;
                      profile: {
                        id: string;
                        name?: string;
                        email?: string | null;
                        image?: string;
                        emailVerified: boolean;
                      };
                      accountId?: undefined;
                    } | {
                      id: string;
                      accountId: string;
                      provider: string;
                      profile: {
                        id: string;
                        name?: string;
                        email?: string | null;
                        image?: string;
                        emailVerified: boolean;
                      } | undefined;
                    })[] | null>;
                    options: {
                      method: "GET";
                    } & {
                      use: any[];
                    };
                    path: "/get-account-info";
                  };
                };
              } | {
                id: "deleteUserCustom";
                endpoints: {
                  deleteUserCustom: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        TOTPCode: string;
                      };
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: void;
                    } : void>;
                    options: {
                      method: "POST";
                      body: zod_v490.ZodObject<{
                        TOTPCode: zod_v490.ZodString;
                      }, zod_v4_core91.$strip>;
                    } & {
                      use: any[];
                    };
                    path: "/delete-user-custom";
                  };
                };
              } | {
                id: "oneTimeToken";
                endpoints: {
                  generateOneTimeToken: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
                      body?: undefined;
                    } & {
                      method?: "GET" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        token: string;
                      };
                    } : {
                      token: string;
                    }>;
                    options: {
                      method: "GET";
                      use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
                        session: {
                          session: Record<string, any> & {
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            expiresAt: Date;
                            token: string;
                            ipAddress?: string | null | undefined;
                            userAgent?: string | null | undefined;
                          };
                          user: Record<string, any> & {
                            id: string;
                            name: string;
                            email: string;
                            emailVerified: boolean;
                            createdAt: Date;
                            updatedAt: Date;
                            image?: string | null | undefined;
                          };
                        };
                      }>)[];
                    } & {
                      use: any[];
                    };
                    path: "/one-time-token/generate";
                  };
                  applyOneTimeToken: {
                    <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
                      body: {
                        token: string;
                      };
                    } & {
                      method?: "POST" | undefined;
                    } & {
                      query?: Record<string, any> | undefined;
                    } & {
                      params?: Record<string, any>;
                    } & {
                      request?: Request;
                    } & {
                      headers?: HeadersInit;
                    } & {
                      asResponse?: boolean;
                      returnHeaders?: boolean;
                      use?: better_call87.Middleware[];
                      path?: string;
                    } & {
                      asResponse?: AsResponse | undefined;
                      returnHeaders?: ReturnHeaders | undefined;
                    }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
                      headers: Headers;
                      response: {
                        user: {
                          id: string;
                          name: string;
                          email: string;
                          emailVerified: boolean;
                          createdAt: Date;
                          updatedAt: Date;
                          image?: string | null | undefined;
                        } & Record<string, any>;
                      };
                    } : {
                      user: {
                        id: string;
                        name: string;
                        email: string;
                        emailVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        image?: string | null | undefined;
                      } & Record<string, any>;
                    }>;
                    options: {
                      method: "POST";
                      body: zod110.ZodObject<{
                        token: zod110.ZodString;
                      }, "strip", zod110.ZodTypeAny, {
                        token: string;
                      }, {
                        token: string;
                      }>;
                    } & {
                      use: any[];
                    };
                    path: "/one-time-token/apply";
                  };
                };
              })[];
            }>> & {
              name?: string;
              image?: string;
            };
          };
          openapi: {
            description: string;
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      name: {
                        type: string;
                        description: string;
                      };
                      image: {
                        type: string;
                        description: string;
                      };
                    };
                  };
                };
              };
            };
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        status: {
                          type: string;
                          description: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/update-user";
    };
    deleteUser: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          password?: string | undefined;
          token?: string | undefined;
          callbackURL?: string | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          success: boolean;
          message: string;
        };
      } : {
        success: boolean;
        message: string;
      }>;
      options: {
        method: "POST";
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        body: zod110.ZodObject<{
          callbackURL: zod110.ZodOptional<zod110.ZodString>;
          password: zod110.ZodOptional<zod110.ZodString>;
          token: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          password?: string | undefined;
          token?: string | undefined;
          callbackURL?: string | undefined;
        }, {
          password?: string | undefined;
          token?: string | undefined;
          callbackURL?: string | undefined;
        }>;
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        success: {
                          type: string;
                          description: string;
                        };
                        message: {
                          type: string;
                          enum: string[];
                          description: string;
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/delete-user";
    };
    forgetPasswordCallback: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query: {
          callbackURL: string;
        };
      } & {
        params: {
          token: string;
        };
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: never;
      } : never>;
      options: {
        method: "GET";
        query: zod110.ZodObject<{
          callbackURL: zod110.ZodString;
        }, "strip", zod110.ZodTypeAny, {
          callbackURL: string;
        }, {
          callbackURL: string;
        }>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>)[];
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        token: {
                          type: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/reset-password/:token";
    };
    listSessions: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: better_auth771.Prettify<{
          id: string;
          createdAt: Date;
          updatedAt: Date;
          userId: string;
          expiresAt: Date;
          token: string;
          ipAddress?: string | null | undefined | undefined;
          userAgent?: string | null | undefined | undefined;
        }>[];
      } : better_auth771.Prettify<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        ipAddress?: string | null | undefined | undefined;
        userAgent?: string | null | undefined | undefined;
      }>[]>;
      options: {
        method: "GET";
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        requireHeaders: true;
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "array";
                      items: {
                        $ref: string;
                      };
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/list-sessions";
    };
    revokeSession: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          token: string;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
        };
      } : {
        status: boolean;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          token: zod110.ZodString;
        }, "strip", zod110.ZodTypeAny, {
          token: string;
        }, {
          token: string;
        }>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        requireHeaders: true;
        metadata: {
          openapi: {
            description: string;
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object";
                    properties: {
                      token: {
                        type: string;
                        description: string;
                      };
                    };
                    required: string[];
                  };
                };
              };
            };
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        status: {
                          type: string;
                          description: string;
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/revoke-session";
    };
    revokeSessions: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body?: undefined;
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
        };
      } : {
        status: boolean;
      }>;
      options: {
        method: "POST";
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        requireHeaders: true;
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        status: {
                          type: string;
                          description: string;
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/revoke-sessions";
    };
    revokeOtherSessions: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body?: undefined;
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
        };
      } : {
        status: boolean;
      }>;
      options: {
        method: "POST";
        requireHeaders: true;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        status: {
                          type: string;
                          description: string;
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/revoke-other-sessions";
    };
    linkSocialAccount: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          provider: "apple" | "discord" | "facebook" | "github" | "google" | "microsoft" | "spotify" | "twitch" | "twitter" | "dropbox" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "vk" | "kick" | "zoom";
          scopes?: string[] | undefined;
          callbackURL?: string | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          url: string;
          redirect: boolean;
        };
      } : {
        url: string;
        redirect: boolean;
      }>;
      options: {
        method: "POST";
        requireHeaders: true;
        body: zod110.ZodObject<{
          callbackURL: zod110.ZodOptional<zod110.ZodString>;
          provider: zod110.ZodEnum<["github", ...("apple" | "discord" | "facebook" | "github" | "google" | "microsoft" | "spotify" | "twitch" | "twitter" | "dropbox" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "vk" | "kick" | "zoom")[]]>;
          scopes: zod110.ZodOptional<zod110.ZodArray<zod110.ZodString, "many">>;
        }, "strip", zod110.ZodTypeAny, {
          provider: "apple" | "discord" | "facebook" | "github" | "google" | "microsoft" | "spotify" | "twitch" | "twitter" | "dropbox" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "vk" | "kick" | "zoom";
          scopes?: string[] | undefined;
          callbackURL?: string | undefined;
        }, {
          provider: "apple" | "discord" | "facebook" | "github" | "google" | "microsoft" | "spotify" | "twitch" | "twitter" | "dropbox" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "vk" | "kick" | "zoom";
          scopes?: string[] | undefined;
          callbackURL?: string | undefined;
        }>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        url: {
                          type: string;
                          description: string;
                        };
                        redirect: {
                          type: string;
                          description: string;
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/link-social";
    };
    listUserAccounts: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          id: string;
          provider: string;
          createdAt: Date;
          updatedAt: Date;
          accountId: string;
          scopes: string[];
        }[];
      } : {
        id: string;
        provider: string;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        scopes: string[];
      }[]>;
      options: {
        method: "GET";
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "array";
                      items: {
                        type: string;
                        properties: {
                          id: {
                            type: string;
                          };
                          provider: {
                            type: string;
                          };
                          createdAt: {
                            type: string;
                            format: string;
                          };
                          updatedAt: {
                            type: string;
                            format: string;
                          };
                        };
                        accountId: {
                          type: string;
                        };
                        scopes: {
                          type: string;
                          items: {
                            type: string;
                          };
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/list-accounts";
    };
    deleteUserCallback: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query: {
          token: string;
          callbackURL?: string | undefined;
        };
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          success: boolean;
          message: string;
        };
      } : {
        success: boolean;
        message: string;
      }>;
      options: {
        method: "GET";
        query: zod110.ZodObject<{
          token: zod110.ZodString;
          callbackURL: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          token: string;
          callbackURL?: string | undefined;
        }, {
          token: string;
          callbackURL?: string | undefined;
        }>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>)[];
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        success: {
                          type: string;
                          description: string;
                        };
                        message: {
                          type: string;
                          enum: string[];
                          description: string;
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/delete-user/callback";
    };
    unlinkAccount: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          providerId: string;
          accountId?: string | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
        };
      } : {
        status: boolean;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          providerId: zod110.ZodString;
          accountId: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          providerId: string;
          accountId?: string | undefined;
        }, {
          providerId: string;
          accountId?: string | undefined;
        }>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        status: {
                          type: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/unlink-account";
    };
    refreshToken: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          providerId: string;
          accountId?: string | undefined;
          userId?: string | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: better_auth771.OAuth2Tokens;
      } : better_auth771.OAuth2Tokens>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          providerId: zod110.ZodString;
          accountId: zod110.ZodOptional<zod110.ZodString>;
          userId: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          providerId: string;
          accountId?: string | undefined;
          userId?: string | undefined;
        }, {
          providerId: string;
          accountId?: string | undefined;
          userId?: string | undefined;
        }>;
        metadata: {
          openapi: {
            description: string;
            responses: {
              200: {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        tokenType: {
                          type: string;
                        };
                        idToken: {
                          type: string;
                        };
                        accessToken: {
                          type: string;
                        };
                        refreshToken: {
                          type: string;
                        };
                        accessTokenExpiresAt: {
                          type: string;
                          format: string;
                        };
                        refreshTokenExpiresAt: {
                          type: string;
                          format: string;
                        };
                      };
                    };
                  };
                };
              };
              400: {
                description: string;
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/refresh-token";
    };
    getAccessToken: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          providerId: string;
          accountId?: string | undefined;
          userId?: string | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          accessToken: string | undefined;
          accessTokenExpiresAt: Date | undefined;
          scopes: string[];
          idToken: string | undefined;
        };
      } : {
        accessToken: string | undefined;
        accessTokenExpiresAt: Date | undefined;
        scopes: string[];
        idToken: string | undefined;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          providerId: zod110.ZodString;
          accountId: zod110.ZodOptional<zod110.ZodString>;
          userId: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          providerId: string;
          accountId?: string | undefined;
          userId?: string | undefined;
        }, {
          providerId: string;
          accountId?: string | undefined;
          userId?: string | undefined;
        }>;
        metadata: {
          openapi: {
            description: string;
            responses: {
              200: {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        tokenType: {
                          type: string;
                        };
                        idToken: {
                          type: string;
                        };
                        accessToken: {
                          type: string;
                        };
                        refreshToken: {
                          type: string;
                        };
                        accessTokenExpiresAt: {
                          type: string;
                          format: string;
                        };
                        refreshTokenExpiresAt: {
                          type: string;
                          format: string;
                        };
                      };
                    };
                  };
                };
              };
              400: {
                description: string;
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/get-access-token";
    };
  } & {
    generateOpenAPISchema: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          openapi: string;
          info: {
            title: string;
            description: string;
            version: string;
          };
          components: {
            securitySchemes: {
              apiKeyCookie: {
                type: string;
                in: string;
                name: string;
                description: string;
              };
              bearerAuth: {
                type: string;
                scheme: string;
                description: string;
              };
            };
            schemas: {};
          };
          security: {
            apiKeyCookie: never[];
            bearerAuth: never[];
          }[];
          servers: {
            url: string;
          }[];
          tags: {
            name: string;
            description: string;
          }[];
          paths: Record<string, better_auth_plugins857.Path>;
        };
      } : {
        openapi: string;
        info: {
          title: string;
          description: string;
          version: string;
        };
        components: {
          securitySchemes: {
            apiKeyCookie: {
              type: string;
              in: string;
              name: string;
              description: string;
            };
            bearerAuth: {
              type: string;
              scheme: string;
              description: string;
            };
          };
          schemas: {};
        };
        security: {
          apiKeyCookie: never[];
          bearerAuth: never[];
        }[];
        servers: {
          url: string;
        }[];
        tags: {
          name: string;
          description: string;
        }[];
        paths: Record<string, better_auth_plugins857.Path>;
      }>;
      options: {
        method: "GET";
      } & {
        use: any[];
      };
      path: "/open-api/generate-schema";
    };
    openAPIReference: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: Response;
      } : Response>;
      options: {
        method: "GET";
        metadata: {
          isAction: boolean;
        };
      } & {
        use: any[];
      };
      path: "/reference";
    };
  } & {
    customGetProviders: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: any;
      } : any>;
      options: {
        method: "GET";
      } & {
        use: any[];
      };
      path: "/get-providers";
    };
  } & {
    getAccountInfo: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: ({
          id: string;
          provider: string;
          profile: {
            id: string;
            name?: string;
            email?: string | null;
            image?: string;
            emailVerified: boolean;
          };
          accountId?: undefined;
        } | {
          id: string;
          accountId: string;
          provider: string;
          profile: {
            id: string;
            name?: string;
            email?: string | null;
            image?: string;
            emailVerified: boolean;
          } | undefined;
        })[] | null;
      } : ({
        id: string;
        provider: string;
        profile: {
          id: string;
          name?: string;
          email?: string | null;
          image?: string;
          emailVerified: boolean;
        };
        accountId?: undefined;
      } | {
        id: string;
        accountId: string;
        provider: string;
        profile: {
          id: string;
          name?: string;
          email?: string | null;
          image?: string;
          emailVerified: boolean;
        } | undefined;
      })[] | null>;
      options: {
        method: "GET";
      } & {
        use: any[];
      };
      path: "/get-account-info";
    };
  } & {
    deleteUserCustom: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          TOTPCode: string;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: void;
      } : void>;
      options: {
        method: "POST";
        body: zod_v490.ZodObject<{
          TOTPCode: zod_v490.ZodString;
        }, zod_v4_core91.$strip>;
      } & {
        use: any[];
      };
      path: "/delete-user-custom";
    };
  } & {
    generateOneTimeToken: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          token: string;
        };
      } : {
        token: string;
      }>;
      options: {
        method: "GET";
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
      } & {
        use: any[];
      };
      path: "/one-time-token/generate";
    };
    applyOneTimeToken: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          token: string;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          user: {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            image?: string | null | undefined;
          } & Record<string, any>;
        };
      } : {
        user: {
          id: string;
          name: string;
          email: string;
          emailVerified: boolean;
          createdAt: Date;
          updatedAt: Date;
          image?: string | null | undefined;
        } & Record<string, any>;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          token: zod110.ZodString;
        }, "strip", zod110.ZodTypeAny, {
          token: string;
        }, {
          token: string;
        }>;
      } & {
        use: any[];
      };
      path: "/one-time-token/apply";
    };
  } & {
    stripeWebhook: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          success: boolean;
        };
      } : {
        success: boolean;
      }>;
      options: {
        method: "POST";
        metadata: {
          isAction: boolean;
        };
        cloneRequest: true;
      } & {
        use: any[];
      };
      path: "/stripe/webhook";
    };
  } & {
    readonly upgradeSubscription: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          plan: string;
          metadata?: Record<string, any> | undefined;
          annual?: boolean | undefined;
          referenceId?: string | undefined;
          subscriptionId?: string | undefined;
          seats?: number | undefined;
          successUrl?: string | undefined;
          cancelUrl?: string | undefined;
          returnUrl?: string | undefined;
          disableRedirect?: boolean | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          url: string;
          redirect: boolean;
        } | {
          redirect: boolean;
          id: string;
          object: "checkout.session";
          adaptive_pricing: Stripe.Checkout.Session.AdaptivePricing | null;
          after_expiration: Stripe.Checkout.Session.AfterExpiration | null;
          allow_promotion_codes: boolean | null;
          amount_subtotal: number | null;
          amount_total: number | null;
          automatic_tax: Stripe.Checkout.Session.AutomaticTax;
          billing_address_collection: Stripe.Checkout.Session.BillingAddressCollection | null;
          cancel_url: string | null;
          client_reference_id: string | null;
          client_secret: string | null;
          collected_information: Stripe.Checkout.Session.CollectedInformation | null;
          consent: Stripe.Checkout.Session.Consent | null;
          consent_collection: Stripe.Checkout.Session.ConsentCollection | null;
          created: number;
          currency: string | null;
          currency_conversion: Stripe.Checkout.Session.CurrencyConversion | null;
          custom_fields: Array<Stripe.Checkout.Session.CustomField>;
          custom_text: Stripe.Checkout.Session.CustomText;
          customer: string | Stripe.Customer | Stripe.DeletedCustomer | null;
          customer_creation: Stripe.Checkout.Session.CustomerCreation | null;
          customer_details: Stripe.Checkout.Session.CustomerDetails | null;
          customer_email: string | null;
          discounts: Array<Stripe.Checkout.Session.Discount> | null;
          expires_at: number;
          invoice: string | Stripe.Invoice | null;
          invoice_creation: Stripe.Checkout.Session.InvoiceCreation | null;
          line_items?: Stripe.ApiList<Stripe.LineItem>;
          livemode: boolean;
          locale: Stripe.Checkout.Session.Locale | null;
          metadata: Stripe.Metadata | null;
          mode: Stripe.Checkout.Session.Mode;
          optional_items?: Array<Stripe.Checkout.Session.OptionalItem> | null;
          payment_intent: string | Stripe.PaymentIntent | null;
          payment_link: string | Stripe.PaymentLink | null;
          payment_method_collection: Stripe.Checkout.Session.PaymentMethodCollection | null;
          payment_method_configuration_details: Stripe.Checkout.Session.PaymentMethodConfigurationDetails | null;
          payment_method_options: Stripe.Checkout.Session.PaymentMethodOptions | null;
          payment_method_types: Array<string>;
          payment_status: Stripe.Checkout.Session.PaymentStatus;
          permissions: Stripe.Checkout.Session.Permissions | null;
          phone_number_collection?: Stripe.Checkout.Session.PhoneNumberCollection;
          presentment_details?: Stripe.Checkout.Session.PresentmentDetails;
          recovered_from: string | null;
          redirect_on_completion?: Stripe.Checkout.Session.RedirectOnCompletion;
          return_url?: string;
          saved_payment_method_options: Stripe.Checkout.Session.SavedPaymentMethodOptions | null;
          setup_intent: string | Stripe.SetupIntent | null;
          shipping_address_collection: Stripe.Checkout.Session.ShippingAddressCollection | null;
          shipping_cost: Stripe.Checkout.Session.ShippingCost | null;
          shipping_options: Array<Stripe.Checkout.Session.ShippingOption>;
          status: Stripe.Checkout.Session.Status | null;
          submit_type: Stripe.Checkout.Session.SubmitType | null;
          subscription: string | Stripe.Subscription | null;
          success_url: string | null;
          tax_id_collection?: Stripe.Checkout.Session.TaxIdCollection;
          total_details: Stripe.Checkout.Session.TotalDetails | null;
          ui_mode: Stripe.Checkout.Session.UiMode | null;
          url: string | null;
          lastResponse: {
            headers: {
              [key: string]: string;
            };
            requestId: string;
            statusCode: number;
            apiVersion?: string;
            idempotencyKey?: string;
            stripeAccount?: string;
          };
        };
      } : {
        url: string;
        redirect: boolean;
      } | {
        redirect: boolean;
        id: string;
        object: "checkout.session";
        adaptive_pricing: Stripe.Checkout.Session.AdaptivePricing | null;
        after_expiration: Stripe.Checkout.Session.AfterExpiration | null;
        allow_promotion_codes: boolean | null;
        amount_subtotal: number | null;
        amount_total: number | null;
        automatic_tax: Stripe.Checkout.Session.AutomaticTax;
        billing_address_collection: Stripe.Checkout.Session.BillingAddressCollection | null;
        cancel_url: string | null;
        client_reference_id: string | null;
        client_secret: string | null;
        collected_information: Stripe.Checkout.Session.CollectedInformation | null;
        consent: Stripe.Checkout.Session.Consent | null;
        consent_collection: Stripe.Checkout.Session.ConsentCollection | null;
        created: number;
        currency: string | null;
        currency_conversion: Stripe.Checkout.Session.CurrencyConversion | null;
        custom_fields: Array<Stripe.Checkout.Session.CustomField>;
        custom_text: Stripe.Checkout.Session.CustomText;
        customer: string | Stripe.Customer | Stripe.DeletedCustomer | null;
        customer_creation: Stripe.Checkout.Session.CustomerCreation | null;
        customer_details: Stripe.Checkout.Session.CustomerDetails | null;
        customer_email: string | null;
        discounts: Array<Stripe.Checkout.Session.Discount> | null;
        expires_at: number;
        invoice: string | Stripe.Invoice | null;
        invoice_creation: Stripe.Checkout.Session.InvoiceCreation | null;
        line_items?: Stripe.ApiList<Stripe.LineItem>;
        livemode: boolean;
        locale: Stripe.Checkout.Session.Locale | null;
        metadata: Stripe.Metadata | null;
        mode: Stripe.Checkout.Session.Mode;
        optional_items?: Array<Stripe.Checkout.Session.OptionalItem> | null;
        payment_intent: string | Stripe.PaymentIntent | null;
        payment_link: string | Stripe.PaymentLink | null;
        payment_method_collection: Stripe.Checkout.Session.PaymentMethodCollection | null;
        payment_method_configuration_details: Stripe.Checkout.Session.PaymentMethodConfigurationDetails | null;
        payment_method_options: Stripe.Checkout.Session.PaymentMethodOptions | null;
        payment_method_types: Array<string>;
        payment_status: Stripe.Checkout.Session.PaymentStatus;
        permissions: Stripe.Checkout.Session.Permissions | null;
        phone_number_collection?: Stripe.Checkout.Session.PhoneNumberCollection;
        presentment_details?: Stripe.Checkout.Session.PresentmentDetails;
        recovered_from: string | null;
        redirect_on_completion?: Stripe.Checkout.Session.RedirectOnCompletion;
        return_url?: string;
        saved_payment_method_options: Stripe.Checkout.Session.SavedPaymentMethodOptions | null;
        setup_intent: string | Stripe.SetupIntent | null;
        shipping_address_collection: Stripe.Checkout.Session.ShippingAddressCollection | null;
        shipping_cost: Stripe.Checkout.Session.ShippingCost | null;
        shipping_options: Array<Stripe.Checkout.Session.ShippingOption>;
        status: Stripe.Checkout.Session.Status | null;
        submit_type: Stripe.Checkout.Session.SubmitType | null;
        subscription: string | Stripe.Subscription | null;
        success_url: string | null;
        tax_id_collection?: Stripe.Checkout.Session.TaxIdCollection;
        total_details: Stripe.Checkout.Session.TotalDetails | null;
        ui_mode: Stripe.Checkout.Session.UiMode | null;
        url: string | null;
        lastResponse: {
          headers: {
            [key: string]: string;
          };
          requestId: string;
          statusCode: number;
          apiVersion?: string;
          idempotencyKey?: string;
          stripeAccount?: string;
        };
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          plan: zod110.ZodString;
          annual: zod110.ZodOptional<zod110.ZodBoolean>;
          referenceId: zod110.ZodOptional<zod110.ZodString>;
          subscriptionId: zod110.ZodOptional<zod110.ZodString>;
          metadata: zod110.ZodOptional<zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>>;
          seats: zod110.ZodOptional<zod110.ZodNumber>;
          successUrl: zod110.ZodDefault<zod110.ZodString>;
          cancelUrl: zod110.ZodDefault<zod110.ZodString>;
          returnUrl: zod110.ZodOptional<zod110.ZodString>;
          disableRedirect: zod110.ZodDefault<zod110.ZodBoolean>;
        }, "strip", zod110.ZodTypeAny, {
          plan: string;
          successUrl: string;
          cancelUrl: string;
          disableRedirect: boolean;
          metadata?: Record<string, any> | undefined;
          annual?: boolean | undefined;
          referenceId?: string | undefined;
          subscriptionId?: string | undefined;
          seats?: number | undefined;
          returnUrl?: string | undefined;
        }, {
          plan: string;
          metadata?: Record<string, any> | undefined;
          annual?: boolean | undefined;
          referenceId?: string | undefined;
          subscriptionId?: string | undefined;
          seats?: number | undefined;
          successUrl?: string | undefined;
          cancelUrl?: string | undefined;
          returnUrl?: string | undefined;
          disableRedirect?: boolean | undefined;
        }>;
        use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
      } & {
        use: any[];
      };
      path: "/subscription/upgrade";
    };
    readonly cancelSubscriptionCallback: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: never;
      } : never>;
      options: {
        method: "GET";
        query: zod110.ZodOptional<zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>)[];
      } & {
        use: any[];
      };
      path: "/subscription/cancel/callback";
    };
    readonly cancelSubscription: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          returnUrl: string;
          referenceId?: string | undefined;
          subscriptionId?: string | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          url: string;
          redirect: boolean;
        };
      } : {
        url: string;
        redirect: boolean;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          referenceId: zod110.ZodOptional<zod110.ZodString>;
          subscriptionId: zod110.ZodOptional<zod110.ZodString>;
          returnUrl: zod110.ZodString;
        }, "strip", zod110.ZodTypeAny, {
          returnUrl: string;
          referenceId?: string | undefined;
          subscriptionId?: string | undefined;
        }, {
          returnUrl: string;
          referenceId?: string | undefined;
          subscriptionId?: string | undefined;
        }>;
        use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
      } & {
        use: any[];
      };
      path: "/subscription/cancel";
    };
    readonly restoreSubscription: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          referenceId?: string | undefined;
          subscriptionId?: string | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: Stripe.Response<Stripe.Subscription>;
      } : Stripe.Response<Stripe.Subscription>>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          referenceId: zod110.ZodOptional<zod110.ZodString>;
          subscriptionId: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          referenceId?: string | undefined;
          subscriptionId?: string | undefined;
        }, {
          referenceId?: string | undefined;
          subscriptionId?: string | undefined;
        }>;
        use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
      } & {
        use: any[];
      };
      path: "/subscription/restore";
    };
    readonly listActiveSubscriptions: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: {
          referenceId?: string | undefined;
        } | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          limits: Record<string, number> | undefined;
          priceId: string | undefined;
          id: string;
          plan: string;
          stripeCustomerId?: string;
          stripeSubscriptionId?: string;
          trialStart?: Date;
          trialEnd?: Date;
          referenceId: string;
          status: "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "paused" | "trialing" | "unpaid";
          periodStart?: Date;
          periodEnd?: Date;
          cancelAtPeriodEnd?: boolean;
          groupId?: string;
          seats?: number;
        }[];
      } : {
        limits: Record<string, number> | undefined;
        priceId: string | undefined;
        id: string;
        plan: string;
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        trialStart?: Date;
        trialEnd?: Date;
        referenceId: string;
        status: "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "paused" | "trialing" | "unpaid";
        periodStart?: Date;
        periodEnd?: Date;
        cancelAtPeriodEnd?: boolean;
        groupId?: string;
        seats?: number;
      }[]>;
      options: {
        method: "GET";
        query: zod110.ZodOptional<zod110.ZodObject<{
          referenceId: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          referenceId?: string | undefined;
        }, {
          referenceId?: string | undefined;
        }>>;
        use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
      } & {
        use: any[];
      };
      path: "/subscription/list";
    };
    readonly subscriptionSuccess: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: better_call87.APIError;
      } : better_call87.APIError>;
      options: {
        method: "GET";
        query: zod110.ZodOptional<zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>)[];
      } & {
        use: any[];
      };
      path: "/subscription/success";
    };
  } & {
    enableTwoFactor: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          password: string;
          issuer?: string | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          totpURI: string;
          backupCodes: string[];
        };
      } : {
        totpURI: string;
        backupCodes: string[];
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          password: zod110.ZodString;
          issuer: zod110.ZodOptional<zod110.ZodString>;
        }, "strip", zod110.ZodTypeAny, {
          password: string;
          issuer?: string | undefined;
        }, {
          password: string;
          issuer?: string | undefined;
        }>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        metadata: {
          openapi: {
            summary: string;
            description: string;
            responses: {
              200: {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        totpURI: {
                          type: string;
                          description: string;
                        };
                        backupCodes: {
                          type: string;
                          items: {
                            type: string;
                          };
                          description: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/two-factor/enable";
    };
    disableTwoFactor: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          password: string;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
        };
      } : {
        status: boolean;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          password: zod110.ZodString;
        }, "strip", zod110.ZodTypeAny, {
          password: string;
        }, {
          password: string;
        }>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        metadata: {
          openapi: {
            summary: string;
            description: string;
            responses: {
              200: {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        status: {
                          type: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/two-factor/disable";
    };
    verifyBackupCode: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          code: string;
          trustDevice?: boolean | undefined;
          disableSession?: boolean | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          token: string | undefined;
          user: {
            id: string;
            email: string;
            emailVerified: boolean;
            name: string;
            image: string | null | undefined;
            createdAt: Date;
            updatedAt: Date;
          };
        };
      } : {
        token: string | undefined;
        user: {
          id: string;
          email: string;
          emailVerified: boolean;
          name: string;
          image: string | null | undefined;
          createdAt: Date;
          updatedAt: Date;
        };
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          code: zod110.ZodString;
          disableSession: zod110.ZodOptional<zod110.ZodBoolean>;
          trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
        }, "strip", zod110.ZodTypeAny, {
          code: string;
          trustDevice?: boolean | undefined;
          disableSession?: boolean | undefined;
        }, {
          code: string;
          trustDevice?: boolean | undefined;
          disableSession?: boolean | undefined;
        }>;
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        user: {
                          type: string;
                          properties: {
                            id: {
                              type: string;
                              description: string;
                            };
                            email: {
                              type: string;
                              format: string;
                              nullable: boolean;
                              description: string;
                            };
                            emailVerified: {
                              type: string;
                              nullable: boolean;
                              description: string;
                            };
                            name: {
                              type: string;
                              nullable: boolean;
                              description: string;
                            };
                            image: {
                              type: string;
                              format: string;
                              nullable: boolean;
                              description: string;
                            };
                            twoFactorEnabled: {
                              type: string;
                              description: string;
                            };
                            createdAt: {
                              type: string;
                              format: string;
                              description: string;
                            };
                            updatedAt: {
                              type: string;
                              format: string;
                              description: string;
                            };
                          };
                          required: string[];
                          description: string;
                        };
                        session: {
                          type: string;
                          properties: {
                            token: {
                              type: string;
                              description: string;
                            };
                            userId: {
                              type: string;
                              description: string;
                            };
                            createdAt: {
                              type: string;
                              format: string;
                              description: string;
                            };
                            expiresAt: {
                              type: string;
                              format: string;
                              description: string;
                            };
                          };
                          required: string[];
                          description: string;
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/two-factor/verify-backup-code";
    };
    generateBackupCodes: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          password: string;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
          backupCodes: string[];
        };
      } : {
        status: boolean;
        backupCodes: string[];
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          password: zod110.ZodString;
        }, "strip", zod110.ZodTypeAny, {
          password: string;
        }, {
          password: string;
        }>;
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        metadata: {
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        status: {
                          type: string;
                          description: string;
                          enum: boolean[];
                        };
                        backupCodes: {
                          type: string;
                          items: {
                            type: string;
                          };
                          description: string;
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/two-factor/generate-backup-codes";
    };
    viewBackupCodes: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          userId: string;
        };
      } & {
        method?: "GET" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
          backupCodes: string[];
        };
      } : {
        status: boolean;
        backupCodes: string[];
      }>;
      options: {
        method: "GET";
        body: zod110.ZodObject<{
          userId: zod110.ZodString;
        }, "strip", zod110.ZodTypeAny, {
          userId: string;
        }, {
          userId: string;
        }>;
        metadata: {
          SERVER_ONLY: true;
        };
      } & {
        use: any[];
      };
      path: "/two-factor/view-backup-codes";
    };
    sendTwoFactorOTP: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
        body?: {
          trustDevice?: boolean | undefined;
        } | undefined;
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          status: boolean;
        };
      } : {
        status: boolean;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodOptional<zod110.ZodObject<{
          trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
        }, "strip", zod110.ZodTypeAny, {
          trustDevice?: boolean | undefined;
        }, {
          trustDevice?: boolean | undefined;
        }>>;
        metadata: {
          openapi: {
            summary: string;
            description: string;
            responses: {
              200: {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        status: {
                          type: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/two-factor/send-otp";
    };
    verifyTwoFactorOTP: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          code: string;
          trustDevice?: boolean | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          token: string;
          user: {
            id: any;
            email: any;
            emailVerified: any;
            name: any;
            image: any;
            createdAt: any;
            updatedAt: any;
          };
        };
      } : {
        token: string;
        user: {
          id: any;
          email: any;
          emailVerified: any;
          name: any;
          image: any;
          createdAt: any;
          updatedAt: any;
        };
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          code: zod110.ZodString;
          trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
        }, "strip", zod110.ZodTypeAny, {
          code: string;
          trustDevice?: boolean | undefined;
        }, {
          code: string;
          trustDevice?: boolean | undefined;
        }>;
        metadata: {
          openapi: {
            summary: string;
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        token: {
                          type: string;
                          description: string;
                        };
                        user: {
                          type: string;
                          properties: {
                            id: {
                              type: string;
                              description: string;
                            };
                            email: {
                              type: string;
                              format: string;
                              nullable: boolean;
                              description: string;
                            };
                            emailVerified: {
                              type: string;
                              nullable: boolean;
                              description: string;
                            };
                            name: {
                              type: string;
                              nullable: boolean;
                              description: string;
                            };
                            image: {
                              type: string;
                              format: string;
                              nullable: boolean;
                              description: string;
                            };
                            createdAt: {
                              type: string;
                              format: string;
                              description: string;
                            };
                            updatedAt: {
                              type: string;
                              format: string;
                              description: string;
                            };
                          };
                          required: string[];
                          description: string;
                        };
                      };
                      required: string[];
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/two-factor/verify-otp";
    };
    generateTOTP: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          secret: string;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          code: string;
        };
      } : {
        code: string;
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          secret: zod110.ZodString;
        }, "strip", zod110.ZodTypeAny, {
          secret: string;
        }, {
          secret: string;
        }>;
        metadata: {
          openapi: {
            summary: string;
            description: string;
            responses: {
              200: {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        code: {
                          type: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
          SERVER_ONLY: true;
        };
      } & {
        use: any[];
      };
      path: "/totp/generate";
    };
    getTOTPURI: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          password: string;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          totpURI: string;
        };
      } : {
        totpURI: string;
      }>;
      options: {
        method: "POST";
        use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
          session: {
            session: Record<string, any> & {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined;
              userAgent?: string | null | undefined;
            };
            user: Record<string, any> & {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            };
          };
        }>)[];
        body: zod110.ZodObject<{
          password: zod110.ZodString;
        }, "strip", zod110.ZodTypeAny, {
          password: string;
        }, {
          password: string;
        }>;
        metadata: {
          openapi: {
            summary: string;
            description: string;
            responses: {
              200: {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        totpURI: {
                          type: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/two-factor/get-totp-uri";
    };
    verifyTOTP: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body: {
          code: string;
          trustDevice?: boolean | undefined;
        };
      } & {
        method?: "POST" | undefined;
      } & {
        query?: Record<string, any> | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers?: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          token: string;
          user: {
            id: string;
            email: string;
            emailVerified: boolean;
            name: string;
            image: string | null | undefined;
            createdAt: Date;
            updatedAt: Date;
          };
        };
      } : {
        token: string;
        user: {
          id: string;
          email: string;
          emailVerified: boolean;
          name: string;
          image: string | null | undefined;
          createdAt: Date;
          updatedAt: Date;
        };
      }>;
      options: {
        method: "POST";
        body: zod110.ZodObject<{
          code: zod110.ZodString;
          trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
        }, "strip", zod110.ZodTypeAny, {
          code: string;
          trustDevice?: boolean | undefined;
        }, {
          code: string;
          trustDevice?: boolean | undefined;
        }>;
        metadata: {
          openapi: {
            summary: string;
            description: string;
            responses: {
              200: {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "object";
                      properties: {
                        status: {
                          type: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      } & {
        use: any[];
      };
      path: "/two-factor/verify-totp";
    };
  } & {
    getSession: {
      <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
        body?: undefined;
      } & {
        method?: "GET" | undefined;
      } & {
        query?: {
          disableCookieCache?: string | boolean | undefined;
          disableRefresh?: boolean | undefined;
        } | undefined;
      } & {
        params?: Record<string, any>;
      } & {
        request?: Request;
      } & {
        headers: HeadersInit;
      } & {
        asResponse?: boolean;
        returnHeaders?: boolean;
        use?: better_call87.Middleware[];
        path?: string;
      } & {
        asResponse?: AsResponse | undefined;
        returnHeaders?: ReturnHeaders | undefined;
      }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
        headers: Headers;
        response: {
          user: {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            image?: string | null | undefined | undefined;
          } & {
            image: string | null;
            handle: string | null;
            twoFactorEnabled: boolean | null;
            socialLinks: Record<string, string> | null;
            bio: string | null;
            website: string | null;
            role: string | null;
            roleEndAt: Date | null;
            deleted: boolean | null;
          };
          session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined | undefined;
            userAgent?: string | null | undefined | undefined;
          };
          role: UserRole.PreProTrial | UserRole.PrePro | UserRole.Free | UserRole.Trial;
          roleEndAt: Date | null | undefined;
        } | null;
      } : {
        user: {
          id: string;
          name: string;
          email: string;
          emailVerified: boolean;
          createdAt: Date;
          updatedAt: Date;
          image?: string | null | undefined | undefined;
        } & {
          image: string | null;
          handle: string | null;
          twoFactorEnabled: boolean | null;
          socialLinks: Record<string, string> | null;
          bio: string | null;
          website: string | null;
          role: string | null;
          roleEndAt: Date | null;
          deleted: boolean | null;
        };
        session: {
          id: string;
          createdAt: Date;
          updatedAt: Date;
          userId: string;
          expiresAt: Date;
          token: string;
          ipAddress?: string | null | undefined | undefined;
          userAgent?: string | null | undefined | undefined;
        };
        role: UserRole.PreProTrial | UserRole.PrePro | UserRole.Free | UserRole.Trial;
        roleEndAt: Date | null | undefined;
      } | null>;
      options: {
        method: "GET";
        query: zod110.ZodOptional<zod110.ZodObject<{
          disableCookieCache: zod110.ZodOptional<zod110.ZodUnion<[zod110.ZodBoolean, zod110.ZodEffects<zod110.ZodString, boolean, string>]>>;
          disableRefresh: zod110.ZodOptional<zod110.ZodBoolean>;
        }, "strip", zod110.ZodTypeAny, {
          disableCookieCache?: boolean | undefined;
          disableRefresh?: boolean | undefined;
        }, {
          disableCookieCache?: string | boolean | undefined;
          disableRefresh?: boolean | undefined;
        }>>;
        metadata: {
          CUSTOM_SESSION: boolean;
          openapi: {
            description: string;
            responses: {
              "200": {
                description: string;
                content: {
                  "application/json": {
                    schema: {
                      type: "array";
                      nullable: boolean;
                      items: {
                        $ref: string;
                      };
                    };
                  };
                };
              };
            };
          };
        };
        requireHeaders: true;
      } & {
        use: any[];
      };
      path: "/get-session";
    };
  }>;
  options: {
    appName: string;
    database: (options: BetterAuthOptions) => better_auth771.Adapter;
    databaseHooks: {
      user: {
        create: {
          after: (newUser: {
            id: string;
            name: string;
            email: string;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            image?: string | null | undefined;
          }, context: better_auth771.GenericEndpointContext | undefined) => Promise<void>;
        };
      };
    };
    advanced: {
      database: {
        generateId: false;
      };
      defaultCookieAttributes: {
        sameSite: "none";
        secure: true;
      };
    };
    session: {
      updateAge: number;
      expiresIn: number;
    };
    basePath: string;
    trustedOrigins: string[];
    user: {
      additionalFields: {
        handle: {
          type: "string";
        };
        socialLinks: {
          type: "string";
          transform: {
            input: (value: string | number | boolean | string[] | Date | number[] | null | undefined) => string;
            output: (value: string | number | boolean | string[] | Date | number[] | null | undefined) => any;
          };
        };
        bio: {
          type: "string";
        };
        website: {
          type: "string";
        };
        deleted: {
          type: "boolean";
        };
        role: {
          type: "string";
        };
        roleEndAt: {
          type: "date";
        };
      };
      changeEmail: {
        enabled: true;
        sendChangeEmailVerification: ({
          user,
          url
        }: {
          user: better_auth771.User;
          newEmail: string;
          url: string;
          token: string;
        }) => Promise<void>;
      };
    };
    account: {
      accountLinking: {
        enabled: true;
        trustedProviders: ("github" | "apple" | "google")[];
        allowDifferentEmails: true;
      };
    };
    socialProviders: {
      google: {
        clientId: string;
        clientSecret: string;
      };
      github: {
        clientId: string;
        clientSecret: string;
      };
      apple: {
        enabled: boolean;
        clientId: string;
        clientSecret: string;
        appBundleIdentifier: string | undefined;
      };
    };
    emailAndPassword: {
      enabled: true;
      sendResetPassword({
        user,
        url
      }: {
        user: better_auth771.User;
        url: string;
        token: string;
      }): Promise<void>;
    };
    emailVerification: {
      sendOnSignUp: true;
      sendVerificationEmail({
        user,
        url
      }: {
        user: better_auth771.User;
        url: string;
        token: string;
      }): Promise<void>;
    };
    plugins: ({
      id: "stripe";
      endpoints: {
        stripeWebhook: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
            body?: undefined;
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              success: boolean;
            };
          } : {
            success: boolean;
          }>;
          options: {
            method: "POST";
            metadata: {
              isAction: boolean;
            };
            cloneRequest: true;
          } & {
            use: any[];
          };
          path: "/stripe/webhook";
        };
      } & {
        readonly upgradeSubscription: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              plan: string;
              metadata?: Record<string, any> | undefined;
              annual?: boolean | undefined;
              referenceId?: string | undefined;
              subscriptionId?: string | undefined;
              seats?: number | undefined;
              successUrl?: string | undefined;
              cancelUrl?: string | undefined;
              returnUrl?: string | undefined;
              disableRedirect?: boolean | undefined;
            };
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              url: string;
              redirect: boolean;
            } | {
              redirect: boolean;
              id: string;
              object: "checkout.session";
              adaptive_pricing: Stripe.Checkout.Session.AdaptivePricing | null;
              after_expiration: Stripe.Checkout.Session.AfterExpiration | null;
              allow_promotion_codes: boolean | null;
              amount_subtotal: number | null;
              amount_total: number | null;
              automatic_tax: Stripe.Checkout.Session.AutomaticTax;
              billing_address_collection: Stripe.Checkout.Session.BillingAddressCollection | null;
              cancel_url: string | null;
              client_reference_id: string | null;
              client_secret: string | null;
              collected_information: Stripe.Checkout.Session.CollectedInformation | null;
              consent: Stripe.Checkout.Session.Consent | null;
              consent_collection: Stripe.Checkout.Session.ConsentCollection | null;
              created: number;
              currency: string | null;
              currency_conversion: Stripe.Checkout.Session.CurrencyConversion | null;
              custom_fields: Array<Stripe.Checkout.Session.CustomField>;
              custom_text: Stripe.Checkout.Session.CustomText;
              customer: string | Stripe.Customer | Stripe.DeletedCustomer | null;
              customer_creation: Stripe.Checkout.Session.CustomerCreation | null;
              customer_details: Stripe.Checkout.Session.CustomerDetails | null;
              customer_email: string | null;
              discounts: Array<Stripe.Checkout.Session.Discount> | null;
              expires_at: number;
              invoice: string | Stripe.Invoice | null;
              invoice_creation: Stripe.Checkout.Session.InvoiceCreation | null;
              line_items?: Stripe.ApiList<Stripe.LineItem>;
              livemode: boolean;
              locale: Stripe.Checkout.Session.Locale | null;
              metadata: Stripe.Metadata | null;
              mode: Stripe.Checkout.Session.Mode;
              optional_items?: Array<Stripe.Checkout.Session.OptionalItem> | null;
              payment_intent: string | Stripe.PaymentIntent | null;
              payment_link: string | Stripe.PaymentLink | null;
              payment_method_collection: Stripe.Checkout.Session.PaymentMethodCollection | null;
              payment_method_configuration_details: Stripe.Checkout.Session.PaymentMethodConfigurationDetails | null;
              payment_method_options: Stripe.Checkout.Session.PaymentMethodOptions | null;
              payment_method_types: Array<string>;
              payment_status: Stripe.Checkout.Session.PaymentStatus;
              permissions: Stripe.Checkout.Session.Permissions | null;
              phone_number_collection?: Stripe.Checkout.Session.PhoneNumberCollection;
              presentment_details?: Stripe.Checkout.Session.PresentmentDetails;
              recovered_from: string | null;
              redirect_on_completion?: Stripe.Checkout.Session.RedirectOnCompletion;
              return_url?: string;
              saved_payment_method_options: Stripe.Checkout.Session.SavedPaymentMethodOptions | null;
              setup_intent: string | Stripe.SetupIntent | null;
              shipping_address_collection: Stripe.Checkout.Session.ShippingAddressCollection | null;
              shipping_cost: Stripe.Checkout.Session.ShippingCost | null;
              shipping_options: Array<Stripe.Checkout.Session.ShippingOption>;
              status: Stripe.Checkout.Session.Status | null;
              submit_type: Stripe.Checkout.Session.SubmitType | null;
              subscription: string | Stripe.Subscription | null;
              success_url: string | null;
              tax_id_collection?: Stripe.Checkout.Session.TaxIdCollection;
              total_details: Stripe.Checkout.Session.TotalDetails | null;
              ui_mode: Stripe.Checkout.Session.UiMode | null;
              url: string | null;
              lastResponse: {
                headers: {
                  [key: string]: string;
                };
                requestId: string;
                statusCode: number;
                apiVersion?: string;
                idempotencyKey?: string;
                stripeAccount?: string;
              };
            };
          } : {
            url: string;
            redirect: boolean;
          } | {
            redirect: boolean;
            id: string;
            object: "checkout.session";
            adaptive_pricing: Stripe.Checkout.Session.AdaptivePricing | null;
            after_expiration: Stripe.Checkout.Session.AfterExpiration | null;
            allow_promotion_codes: boolean | null;
            amount_subtotal: number | null;
            amount_total: number | null;
            automatic_tax: Stripe.Checkout.Session.AutomaticTax;
            billing_address_collection: Stripe.Checkout.Session.BillingAddressCollection | null;
            cancel_url: string | null;
            client_reference_id: string | null;
            client_secret: string | null;
            collected_information: Stripe.Checkout.Session.CollectedInformation | null;
            consent: Stripe.Checkout.Session.Consent | null;
            consent_collection: Stripe.Checkout.Session.ConsentCollection | null;
            created: number;
            currency: string | null;
            currency_conversion: Stripe.Checkout.Session.CurrencyConversion | null;
            custom_fields: Array<Stripe.Checkout.Session.CustomField>;
            custom_text: Stripe.Checkout.Session.CustomText;
            customer: string | Stripe.Customer | Stripe.DeletedCustomer | null;
            customer_creation: Stripe.Checkout.Session.CustomerCreation | null;
            customer_details: Stripe.Checkout.Session.CustomerDetails | null;
            customer_email: string | null;
            discounts: Array<Stripe.Checkout.Session.Discount> | null;
            expires_at: number;
            invoice: string | Stripe.Invoice | null;
            invoice_creation: Stripe.Checkout.Session.InvoiceCreation | null;
            line_items?: Stripe.ApiList<Stripe.LineItem>;
            livemode: boolean;
            locale: Stripe.Checkout.Session.Locale | null;
            metadata: Stripe.Metadata | null;
            mode: Stripe.Checkout.Session.Mode;
            optional_items?: Array<Stripe.Checkout.Session.OptionalItem> | null;
            payment_intent: string | Stripe.PaymentIntent | null;
            payment_link: string | Stripe.PaymentLink | null;
            payment_method_collection: Stripe.Checkout.Session.PaymentMethodCollection | null;
            payment_method_configuration_details: Stripe.Checkout.Session.PaymentMethodConfigurationDetails | null;
            payment_method_options: Stripe.Checkout.Session.PaymentMethodOptions | null;
            payment_method_types: Array<string>;
            payment_status: Stripe.Checkout.Session.PaymentStatus;
            permissions: Stripe.Checkout.Session.Permissions | null;
            phone_number_collection?: Stripe.Checkout.Session.PhoneNumberCollection;
            presentment_details?: Stripe.Checkout.Session.PresentmentDetails;
            recovered_from: string | null;
            redirect_on_completion?: Stripe.Checkout.Session.RedirectOnCompletion;
            return_url?: string;
            saved_payment_method_options: Stripe.Checkout.Session.SavedPaymentMethodOptions | null;
            setup_intent: string | Stripe.SetupIntent | null;
            shipping_address_collection: Stripe.Checkout.Session.ShippingAddressCollection | null;
            shipping_cost: Stripe.Checkout.Session.ShippingCost | null;
            shipping_options: Array<Stripe.Checkout.Session.ShippingOption>;
            status: Stripe.Checkout.Session.Status | null;
            submit_type: Stripe.Checkout.Session.SubmitType | null;
            subscription: string | Stripe.Subscription | null;
            success_url: string | null;
            tax_id_collection?: Stripe.Checkout.Session.TaxIdCollection;
            total_details: Stripe.Checkout.Session.TotalDetails | null;
            ui_mode: Stripe.Checkout.Session.UiMode | null;
            url: string | null;
            lastResponse: {
              headers: {
                [key: string]: string;
              };
              requestId: string;
              statusCode: number;
              apiVersion?: string;
              idempotencyKey?: string;
              stripeAccount?: string;
            };
          }>;
          options: {
            method: "POST";
            body: zod110.ZodObject<{
              plan: zod110.ZodString;
              annual: zod110.ZodOptional<zod110.ZodBoolean>;
              referenceId: zod110.ZodOptional<zod110.ZodString>;
              subscriptionId: zod110.ZodOptional<zod110.ZodString>;
              metadata: zod110.ZodOptional<zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>>;
              seats: zod110.ZodOptional<zod110.ZodNumber>;
              successUrl: zod110.ZodDefault<zod110.ZodString>;
              cancelUrl: zod110.ZodDefault<zod110.ZodString>;
              returnUrl: zod110.ZodOptional<zod110.ZodString>;
              disableRedirect: zod110.ZodDefault<zod110.ZodBoolean>;
            }, "strip", zod110.ZodTypeAny, {
              plan: string;
              successUrl: string;
              cancelUrl: string;
              disableRedirect: boolean;
              metadata?: Record<string, any> | undefined;
              annual?: boolean | undefined;
              referenceId?: string | undefined;
              subscriptionId?: string | undefined;
              seats?: number | undefined;
              returnUrl?: string | undefined;
            }, {
              plan: string;
              metadata?: Record<string, any> | undefined;
              annual?: boolean | undefined;
              referenceId?: string | undefined;
              subscriptionId?: string | undefined;
              seats?: number | undefined;
              successUrl?: string | undefined;
              cancelUrl?: string | undefined;
              returnUrl?: string | undefined;
              disableRedirect?: boolean | undefined;
            }>;
            use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
              session: {
                session: Record<string, any> & {
                  id: string;
                  createdAt: Date;
                  updatedAt: Date;
                  userId: string;
                  expiresAt: Date;
                  token: string;
                  ipAddress?: string | null | undefined;
                  userAgent?: string | null | undefined;
                };
                user: Record<string, any> & {
                  id: string;
                  name: string;
                  email: string;
                  emailVerified: boolean;
                  createdAt: Date;
                  updatedAt: Date;
                  image?: string | null | undefined;
                };
              };
            }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
          } & {
            use: any[];
          };
          path: "/subscription/upgrade";
        };
        readonly cancelSubscriptionCallback: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
            body?: undefined;
          } & {
            method?: "GET" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: never;
          } : never>;
          options: {
            method: "GET";
            query: zod110.ZodOptional<zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>>;
            use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>)[];
          } & {
            use: any[];
          };
          path: "/subscription/cancel/callback";
        };
        readonly cancelSubscription: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              returnUrl: string;
              referenceId?: string | undefined;
              subscriptionId?: string | undefined;
            };
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              url: string;
              redirect: boolean;
            };
          } : {
            url: string;
            redirect: boolean;
          }>;
          options: {
            method: "POST";
            body: zod110.ZodObject<{
              referenceId: zod110.ZodOptional<zod110.ZodString>;
              subscriptionId: zod110.ZodOptional<zod110.ZodString>;
              returnUrl: zod110.ZodString;
            }, "strip", zod110.ZodTypeAny, {
              returnUrl: string;
              referenceId?: string | undefined;
              subscriptionId?: string | undefined;
            }, {
              returnUrl: string;
              referenceId?: string | undefined;
              subscriptionId?: string | undefined;
            }>;
            use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
              session: {
                session: Record<string, any> & {
                  id: string;
                  createdAt: Date;
                  updatedAt: Date;
                  userId: string;
                  expiresAt: Date;
                  token: string;
                  ipAddress?: string | null | undefined;
                  userAgent?: string | null | undefined;
                };
                user: Record<string, any> & {
                  id: string;
                  name: string;
                  email: string;
                  emailVerified: boolean;
                  createdAt: Date;
                  updatedAt: Date;
                  image?: string | null | undefined;
                };
              };
            }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
          } & {
            use: any[];
          };
          path: "/subscription/cancel";
        };
        readonly restoreSubscription: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              referenceId?: string | undefined;
              subscriptionId?: string | undefined;
            };
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: Stripe.Response<Stripe.Subscription>;
          } : Stripe.Response<Stripe.Subscription>>;
          options: {
            method: "POST";
            body: zod110.ZodObject<{
              referenceId: zod110.ZodOptional<zod110.ZodString>;
              subscriptionId: zod110.ZodOptional<zod110.ZodString>;
            }, "strip", zod110.ZodTypeAny, {
              referenceId?: string | undefined;
              subscriptionId?: string | undefined;
            }, {
              referenceId?: string | undefined;
              subscriptionId?: string | undefined;
            }>;
            use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
              session: {
                session: Record<string, any> & {
                  id: string;
                  createdAt: Date;
                  updatedAt: Date;
                  userId: string;
                  expiresAt: Date;
                  token: string;
                  ipAddress?: string | null | undefined;
                  userAgent?: string | null | undefined;
                };
                user: Record<string, any> & {
                  id: string;
                  name: string;
                  email: string;
                  emailVerified: boolean;
                  createdAt: Date;
                  updatedAt: Date;
                  image?: string | null | undefined;
                };
              };
            }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
          } & {
            use: any[];
          };
          path: "/subscription/restore";
        };
        readonly listActiveSubscriptions: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
            body?: undefined;
          } & {
            method?: "GET" | undefined;
          } & {
            query?: {
              referenceId?: string | undefined;
            } | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              limits: Record<string, number> | undefined;
              priceId: string | undefined;
              id: string;
              plan: string;
              stripeCustomerId?: string;
              stripeSubscriptionId?: string;
              trialStart?: Date;
              trialEnd?: Date;
              referenceId: string;
              status: "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "paused" | "trialing" | "unpaid";
              periodStart?: Date;
              periodEnd?: Date;
              cancelAtPeriodEnd?: boolean;
              groupId?: string;
              seats?: number;
            }[];
          } : {
            limits: Record<string, number> | undefined;
            priceId: string | undefined;
            id: string;
            plan: string;
            stripeCustomerId?: string;
            stripeSubscriptionId?: string;
            trialStart?: Date;
            trialEnd?: Date;
            referenceId: string;
            status: "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "paused" | "trialing" | "unpaid";
            periodStart?: Date;
            periodEnd?: Date;
            cancelAtPeriodEnd?: boolean;
            groupId?: string;
            seats?: number;
          }[]>;
          options: {
            method: "GET";
            query: zod110.ZodOptional<zod110.ZodObject<{
              referenceId: zod110.ZodOptional<zod110.ZodString>;
            }, "strip", zod110.ZodTypeAny, {
              referenceId?: string | undefined;
            }, {
              referenceId?: string | undefined;
            }>>;
            use: (((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
              session: {
                session: Record<string, any> & {
                  id: string;
                  createdAt: Date;
                  updatedAt: Date;
                  userId: string;
                  expiresAt: Date;
                  token: string;
                  ipAddress?: string | null | undefined;
                  userAgent?: string | null | undefined;
                };
                user: Record<string, any> & {
                  id: string;
                  name: string;
                  email: string;
                  emailVerified: boolean;
                  createdAt: Date;
                  updatedAt: Date;
                  image?: string | null | undefined;
                };
              };
            }>) | ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>))[];
          } & {
            use: any[];
          };
          path: "/subscription/list";
        };
        readonly subscriptionSuccess: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
            body?: undefined;
          } & {
            method?: "GET" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: better_call87.APIError;
          } : better_call87.APIError>;
          options: {
            method: "GET";
            query: zod110.ZodOptional<zod110.ZodRecord<zod110.ZodString, zod110.ZodAny>>;
            use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>)[];
          } & {
            use: any[];
          };
          path: "/subscription/success";
        };
      };
      init(ctx: better_auth771.AuthContext): {
        options: {
          databaseHooks: {
            user: {
              create: {
                after(user: {
                  id: string;
                  name: string;
                  email: string;
                  emailVerified: boolean;
                  createdAt: Date;
                  updatedAt: Date;
                  image?: string | null | undefined;
                }, ctx: better_auth771.GenericEndpointContext | undefined): Promise<void>;
              };
            };
          };
        };
      };
      schema: {
        user: {
          fields: {
            stripeCustomerId: {
              type: "string";
              required: false;
            };
          };
        };
        subscription?: {
          fields: {
            plan: {
              type: "string";
              required: true;
            };
            referenceId: {
              type: "string";
              required: true;
            };
            stripeCustomerId: {
              type: "string";
              required: false;
            };
            stripeSubscriptionId: {
              type: "string";
              required: false;
            };
            status: {
              type: "string";
              defaultValue: string;
            };
            periodStart: {
              type: "date";
              required: false;
            };
            periodEnd: {
              type: "date";
              required: false;
            };
            cancelAtPeriodEnd: {
              type: "boolean";
              required: false;
              defaultValue: false;
            };
            seats: {
              type: "number";
              required: false;
            };
          };
        } | undefined;
      };
    } | {
      id: "open-api";
      endpoints: {
        generateOpenAPISchema: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
            body?: undefined;
          } & {
            method?: "GET" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              openapi: string;
              info: {
                title: string;
                description: string;
                version: string;
              };
              components: {
                securitySchemes: {
                  apiKeyCookie: {
                    type: string;
                    in: string;
                    name: string;
                    description: string;
                  };
                  bearerAuth: {
                    type: string;
                    scheme: string;
                    description: string;
                  };
                };
                schemas: {};
              };
              security: {
                apiKeyCookie: never[];
                bearerAuth: never[];
              }[];
              servers: {
                url: string;
              }[];
              tags: {
                name: string;
                description: string;
              }[];
              paths: Record<string, better_auth_plugins857.Path>;
            };
          } : {
            openapi: string;
            info: {
              title: string;
              description: string;
              version: string;
            };
            components: {
              securitySchemes: {
                apiKeyCookie: {
                  type: string;
                  in: string;
                  name: string;
                  description: string;
                };
                bearerAuth: {
                  type: string;
                  scheme: string;
                  description: string;
                };
              };
              schemas: {};
            };
            security: {
              apiKeyCookie: never[];
              bearerAuth: never[];
            }[];
            servers: {
              url: string;
            }[];
            tags: {
              name: string;
              description: string;
            }[];
            paths: Record<string, better_auth_plugins857.Path>;
          }>;
          options: {
            method: "GET";
          } & {
            use: any[];
          };
          path: "/open-api/generate-schema";
        };
        openAPIReference: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
            body?: undefined;
          } & {
            method?: "GET" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: Response;
          } : Response>;
          options: {
            method: "GET";
            metadata: {
              isAction: boolean;
            };
          } & {
            use: any[];
          };
          path: "/reference";
        };
      };
    } | {
      id: "two-factor";
      endpoints: {
        enableTwoFactor: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              password: string;
              issuer?: string | undefined;
            };
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              totpURI: string;
              backupCodes: string[];
            };
          } : {
            totpURI: string;
            backupCodes: string[];
          }>;
          options: {
            method: "POST";
            body: zod110.ZodObject<{
              password: zod110.ZodString;
              issuer: zod110.ZodOptional<zod110.ZodString>;
            }, "strip", zod110.ZodTypeAny, {
              password: string;
              issuer?: string | undefined;
            }, {
              password: string;
              issuer?: string | undefined;
            }>;
            use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
              session: {
                session: Record<string, any> & {
                  id: string;
                  createdAt: Date;
                  updatedAt: Date;
                  userId: string;
                  expiresAt: Date;
                  token: string;
                  ipAddress?: string | null | undefined;
                  userAgent?: string | null | undefined;
                };
                user: Record<string, any> & {
                  id: string;
                  name: string;
                  email: string;
                  emailVerified: boolean;
                  createdAt: Date;
                  updatedAt: Date;
                  image?: string | null | undefined;
                };
              };
            }>)[];
            metadata: {
              openapi: {
                summary: string;
                description: string;
                responses: {
                  200: {
                    description: string;
                    content: {
                      "application/json": {
                        schema: {
                          type: "object";
                          properties: {
                            totpURI: {
                              type: string;
                              description: string;
                            };
                            backupCodes: {
                              type: string;
                              items: {
                                type: string;
                              };
                              description: string;
                            };
                          };
                        };
                      };
                    };
                  };
                };
              };
            };
          } & {
            use: any[];
          };
          path: "/two-factor/enable";
        };
        disableTwoFactor: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              password: string;
            };
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              status: boolean;
            };
          } : {
            status: boolean;
          }>;
          options: {
            method: "POST";
            body: zod110.ZodObject<{
              password: zod110.ZodString;
            }, "strip", zod110.ZodTypeAny, {
              password: string;
            }, {
              password: string;
            }>;
            use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
              session: {
                session: Record<string, any> & {
                  id: string;
                  createdAt: Date;
                  updatedAt: Date;
                  userId: string;
                  expiresAt: Date;
                  token: string;
                  ipAddress?: string | null | undefined;
                  userAgent?: string | null | undefined;
                };
                user: Record<string, any> & {
                  id: string;
                  name: string;
                  email: string;
                  emailVerified: boolean;
                  createdAt: Date;
                  updatedAt: Date;
                  image?: string | null | undefined;
                };
              };
            }>)[];
            metadata: {
              openapi: {
                summary: string;
                description: string;
                responses: {
                  200: {
                    description: string;
                    content: {
                      "application/json": {
                        schema: {
                          type: "object";
                          properties: {
                            status: {
                              type: string;
                            };
                          };
                        };
                      };
                    };
                  };
                };
              };
            };
          } & {
            use: any[];
          };
          path: "/two-factor/disable";
        };
        verifyBackupCode: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              code: string;
              trustDevice?: boolean | undefined;
              disableSession?: boolean | undefined;
            };
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              token: string | undefined;
              user: {
                id: string;
                email: string;
                emailVerified: boolean;
                name: string;
                image: string | null | undefined;
                createdAt: Date;
                updatedAt: Date;
              };
            };
          } : {
            token: string | undefined;
            user: {
              id: string;
              email: string;
              emailVerified: boolean;
              name: string;
              image: string | null | undefined;
              createdAt: Date;
              updatedAt: Date;
            };
          }>;
          options: {
            method: "POST";
            body: zod110.ZodObject<{
              code: zod110.ZodString;
              disableSession: zod110.ZodOptional<zod110.ZodBoolean>;
              trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
            }, "strip", zod110.ZodTypeAny, {
              code: string;
              trustDevice?: boolean | undefined;
              disableSession?: boolean | undefined;
            }, {
              code: string;
              trustDevice?: boolean | undefined;
              disableSession?: boolean | undefined;
            }>;
            metadata: {
              openapi: {
                description: string;
                responses: {
                  "200": {
                    description: string;
                    content: {
                      "application/json": {
                        schema: {
                          type: "object";
                          properties: {
                            user: {
                              type: string;
                              properties: {
                                id: {
                                  type: string;
                                  description: string;
                                };
                                email: {
                                  type: string;
                                  format: string;
                                  nullable: boolean;
                                  description: string;
                                };
                                emailVerified: {
                                  type: string;
                                  nullable: boolean;
                                  description: string;
                                };
                                name: {
                                  type: string;
                                  nullable: boolean;
                                  description: string;
                                };
                                image: {
                                  type: string;
                                  format: string;
                                  nullable: boolean;
                                  description: string;
                                };
                                twoFactorEnabled: {
                                  type: string;
                                  description: string;
                                };
                                createdAt: {
                                  type: string;
                                  format: string;
                                  description: string;
                                };
                                updatedAt: {
                                  type: string;
                                  format: string;
                                  description: string;
                                };
                              };
                              required: string[];
                              description: string;
                            };
                            session: {
                              type: string;
                              properties: {
                                token: {
                                  type: string;
                                  description: string;
                                };
                                userId: {
                                  type: string;
                                  description: string;
                                };
                                createdAt: {
                                  type: string;
                                  format: string;
                                  description: string;
                                };
                                expiresAt: {
                                  type: string;
                                  format: string;
                                  description: string;
                                };
                              };
                              required: string[];
                              description: string;
                            };
                          };
                          required: string[];
                        };
                      };
                    };
                  };
                };
              };
            };
          } & {
            use: any[];
          };
          path: "/two-factor/verify-backup-code";
        };
        generateBackupCodes: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              password: string;
            };
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              status: boolean;
              backupCodes: string[];
            };
          } : {
            status: boolean;
            backupCodes: string[];
          }>;
          options: {
            method: "POST";
            body: zod110.ZodObject<{
              password: zod110.ZodString;
            }, "strip", zod110.ZodTypeAny, {
              password: string;
            }, {
              password: string;
            }>;
            use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
              session: {
                session: Record<string, any> & {
                  id: string;
                  createdAt: Date;
                  updatedAt: Date;
                  userId: string;
                  expiresAt: Date;
                  token: string;
                  ipAddress?: string | null | undefined;
                  userAgent?: string | null | undefined;
                };
                user: Record<string, any> & {
                  id: string;
                  name: string;
                  email: string;
                  emailVerified: boolean;
                  createdAt: Date;
                  updatedAt: Date;
                  image?: string | null | undefined;
                };
              };
            }>)[];
            metadata: {
              openapi: {
                description: string;
                responses: {
                  "200": {
                    description: string;
                    content: {
                      "application/json": {
                        schema: {
                          type: "object";
                          properties: {
                            status: {
                              type: string;
                              description: string;
                              enum: boolean[];
                            };
                            backupCodes: {
                              type: string;
                              items: {
                                type: string;
                              };
                              description: string;
                            };
                          };
                          required: string[];
                        };
                      };
                    };
                  };
                };
              };
            };
          } & {
            use: any[];
          };
          path: "/two-factor/generate-backup-codes";
        };
        viewBackupCodes: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              userId: string;
            };
          } & {
            method?: "GET" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              status: boolean;
              backupCodes: string[];
            };
          } : {
            status: boolean;
            backupCodes: string[];
          }>;
          options: {
            method: "GET";
            body: zod110.ZodObject<{
              userId: zod110.ZodString;
            }, "strip", zod110.ZodTypeAny, {
              userId: string;
            }, {
              userId: string;
            }>;
            metadata: {
              SERVER_ONLY: true;
            };
          } & {
            use: any[];
          };
          path: "/two-factor/view-backup-codes";
        };
        sendTwoFactorOTP: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
            body?: {
              trustDevice?: boolean | undefined;
            } | undefined;
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              status: boolean;
            };
          } : {
            status: boolean;
          }>;
          options: {
            method: "POST";
            body: zod110.ZodOptional<zod110.ZodObject<{
              trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
            }, "strip", zod110.ZodTypeAny, {
              trustDevice?: boolean | undefined;
            }, {
              trustDevice?: boolean | undefined;
            }>>;
            metadata: {
              openapi: {
                summary: string;
                description: string;
                responses: {
                  200: {
                    description: string;
                    content: {
                      "application/json": {
                        schema: {
                          type: "object";
                          properties: {
                            status: {
                              type: string;
                            };
                          };
                        };
                      };
                    };
                  };
                };
              };
            };
          } & {
            use: any[];
          };
          path: "/two-factor/send-otp";
        };
        verifyTwoFactorOTP: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              code: string;
              trustDevice?: boolean | undefined;
            };
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              token: string;
              user: {
                id: any;
                email: any;
                emailVerified: any;
                name: any;
                image: any;
                createdAt: any;
                updatedAt: any;
              };
            };
          } : {
            token: string;
            user: {
              id: any;
              email: any;
              emailVerified: any;
              name: any;
              image: any;
              createdAt: any;
              updatedAt: any;
            };
          }>;
          options: {
            method: "POST";
            body: zod110.ZodObject<{
              code: zod110.ZodString;
              trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
            }, "strip", zod110.ZodTypeAny, {
              code: string;
              trustDevice?: boolean | undefined;
            }, {
              code: string;
              trustDevice?: boolean | undefined;
            }>;
            metadata: {
              openapi: {
                summary: string;
                description: string;
                responses: {
                  "200": {
                    description: string;
                    content: {
                      "application/json": {
                        schema: {
                          type: "object";
                          properties: {
                            token: {
                              type: string;
                              description: string;
                            };
                            user: {
                              type: string;
                              properties: {
                                id: {
                                  type: string;
                                  description: string;
                                };
                                email: {
                                  type: string;
                                  format: string;
                                  nullable: boolean;
                                  description: string;
                                };
                                emailVerified: {
                                  type: string;
                                  nullable: boolean;
                                  description: string;
                                };
                                name: {
                                  type: string;
                                  nullable: boolean;
                                  description: string;
                                };
                                image: {
                                  type: string;
                                  format: string;
                                  nullable: boolean;
                                  description: string;
                                };
                                createdAt: {
                                  type: string;
                                  format: string;
                                  description: string;
                                };
                                updatedAt: {
                                  type: string;
                                  format: string;
                                  description: string;
                                };
                              };
                              required: string[];
                              description: string;
                            };
                          };
                          required: string[];
                        };
                      };
                    };
                  };
                };
              };
            };
          } & {
            use: any[];
          };
          path: "/two-factor/verify-otp";
        };
        generateTOTP: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              secret: string;
            };
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              code: string;
            };
          } : {
            code: string;
          }>;
          options: {
            method: "POST";
            body: zod110.ZodObject<{
              secret: zod110.ZodString;
            }, "strip", zod110.ZodTypeAny, {
              secret: string;
            }, {
              secret: string;
            }>;
            metadata: {
              openapi: {
                summary: string;
                description: string;
                responses: {
                  200: {
                    description: string;
                    content: {
                      "application/json": {
                        schema: {
                          type: "object";
                          properties: {
                            code: {
                              type: string;
                            };
                          };
                        };
                      };
                    };
                  };
                };
              };
              SERVER_ONLY: true;
            };
          } & {
            use: any[];
          };
          path: "/totp/generate";
        };
        getTOTPURI: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              password: string;
            };
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              totpURI: string;
            };
          } : {
            totpURI: string;
          }>;
          options: {
            method: "POST";
            use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
              session: {
                session: Record<string, any> & {
                  id: string;
                  createdAt: Date;
                  updatedAt: Date;
                  userId: string;
                  expiresAt: Date;
                  token: string;
                  ipAddress?: string | null | undefined;
                  userAgent?: string | null | undefined;
                };
                user: Record<string, any> & {
                  id: string;
                  name: string;
                  email: string;
                  emailVerified: boolean;
                  createdAt: Date;
                  updatedAt: Date;
                  image?: string | null | undefined;
                };
              };
            }>)[];
            body: zod110.ZodObject<{
              password: zod110.ZodString;
            }, "strip", zod110.ZodTypeAny, {
              password: string;
            }, {
              password: string;
            }>;
            metadata: {
              openapi: {
                summary: string;
                description: string;
                responses: {
                  200: {
                    description: string;
                    content: {
                      "application/json": {
                        schema: {
                          type: "object";
                          properties: {
                            totpURI: {
                              type: string;
                            };
                          };
                        };
                      };
                    };
                  };
                };
              };
            };
          } & {
            use: any[];
          };
          path: "/two-factor/get-totp-uri";
        };
        verifyTOTP: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              code: string;
              trustDevice?: boolean | undefined;
            };
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              token: string;
              user: {
                id: string;
                email: string;
                emailVerified: boolean;
                name: string;
                image: string | null | undefined;
                createdAt: Date;
                updatedAt: Date;
              };
            };
          } : {
            token: string;
            user: {
              id: string;
              email: string;
              emailVerified: boolean;
              name: string;
              image: string | null | undefined;
              createdAt: Date;
              updatedAt: Date;
            };
          }>;
          options: {
            method: "POST";
            body: zod110.ZodObject<{
              code: zod110.ZodString;
              trustDevice: zod110.ZodOptional<zod110.ZodBoolean>;
            }, "strip", zod110.ZodTypeAny, {
              code: string;
              trustDevice?: boolean | undefined;
            }, {
              code: string;
              trustDevice?: boolean | undefined;
            }>;
            metadata: {
              openapi: {
                summary: string;
                description: string;
                responses: {
                  200: {
                    description: string;
                    content: {
                      "application/json": {
                        schema: {
                          type: "object";
                          properties: {
                            status: {
                              type: string;
                            };
                          };
                        };
                      };
                    };
                  };
                };
              };
            };
          } & {
            use: any[];
          };
          path: "/two-factor/verify-totp";
        };
      };
      options: better_auth_plugins857.TwoFactorOptions | undefined;
      hooks: {
        after: {
          matcher(context: better_auth771.HookEndpointContext): boolean;
          handler: (inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
            twoFactorRedirect: boolean;
          } | undefined>;
        }[];
      };
      schema: {
        user: {
          fields: {
            twoFactorEnabled: {
              type: "boolean";
              required: false;
              defaultValue: false;
              input: false;
            };
          };
        };
        twoFactor: {
          fields: {
            secret: {
              type: "string";
              required: true;
              returned: false;
            };
            backupCodes: {
              type: "string";
              required: true;
              returned: false;
            };
            userId: {
              type: "string";
              required: true;
              returned: false;
              references: {
                model: string;
                field: string;
              };
            };
          };
        };
      };
      rateLimit: {
        pathMatcher(path: string): boolean;
        window: number;
        max: number;
      }[];
      $ERROR_CODES: {
        readonly OTP_NOT_ENABLED: "OTP not enabled";
        readonly OTP_HAS_EXPIRED: "OTP has expired";
        readonly TOTP_NOT_ENABLED: "TOTP not enabled";
        readonly TWO_FACTOR_NOT_ENABLED: "Two factor isn't enabled";
        readonly BACKUP_CODES_NOT_ENABLED: "Backup codes aren't enabled";
        readonly INVALID_BACKUP_CODE: "Invalid backup code";
        readonly INVALID_CODE: "Invalid code";
        readonly TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: "Too many attempts. Please request a new code.";
        readonly INVALID_TWO_FACTOR_COOKIE: "Invalid two factor cookie";
      };
    } | {
      id: "expo";
      init: (ctx: better_auth771.AuthContext) => {
        options: {
          trustedOrigins: string[];
        };
      };
      onRequest(request: Request, ctx: better_auth771.AuthContext): Promise<{
        request: Request;
      } | undefined>;
      hooks: {
        after: {
          matcher(context: better_auth771.HookEndpointContext): boolean;
          handler: (inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<void>;
        }[];
      };
    } | {
      id: "custom-session";
      endpoints: {
        getSession: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body?: undefined;
          } & {
            method?: "GET" | undefined;
          } & {
            query?: {
              disableCookieCache?: string | boolean | undefined;
              disableRefresh?: boolean | undefined;
            } | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              user: {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                image?: string | null | undefined | undefined;
              } & {
                image: string | null;
                handle: string | null;
                twoFactorEnabled: boolean | null;
                socialLinks: Record<string, string> | null;
                bio: string | null;
                website: string | null;
                role: string | null;
                roleEndAt: Date | null;
                deleted: boolean | null;
              };
              session: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined | undefined;
                userAgent?: string | null | undefined | undefined;
              };
              role: UserRole.PreProTrial | UserRole.PrePro | UserRole.Free | UserRole.Trial;
              roleEndAt: Date | null | undefined;
            } | null;
          } : {
            user: {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined | undefined;
            } & {
              image: string | null;
              handle: string | null;
              twoFactorEnabled: boolean | null;
              socialLinks: Record<string, string> | null;
              bio: string | null;
              website: string | null;
              role: string | null;
              roleEndAt: Date | null;
              deleted: boolean | null;
            };
            session: {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              userId: string;
              expiresAt: Date;
              token: string;
              ipAddress?: string | null | undefined | undefined;
              userAgent?: string | null | undefined | undefined;
            };
            role: UserRole.PreProTrial | UserRole.PrePro | UserRole.Free | UserRole.Trial;
            roleEndAt: Date | null | undefined;
          } | null>;
          options: {
            method: "GET";
            query: zod110.ZodOptional<zod110.ZodObject<{
              disableCookieCache: zod110.ZodOptional<zod110.ZodUnion<[zod110.ZodBoolean, zod110.ZodEffects<zod110.ZodString, boolean, string>]>>;
              disableRefresh: zod110.ZodOptional<zod110.ZodBoolean>;
            }, "strip", zod110.ZodTypeAny, {
              disableCookieCache?: boolean | undefined;
              disableRefresh?: boolean | undefined;
            }, {
              disableCookieCache?: string | boolean | undefined;
              disableRefresh?: boolean | undefined;
            }>>;
            metadata: {
              CUSTOM_SESSION: boolean;
              openapi: {
                description: string;
                responses: {
                  "200": {
                    description: string;
                    content: {
                      "application/json": {
                        schema: {
                          type: "array";
                          nullable: boolean;
                          items: {
                            $ref: string;
                          };
                        };
                      };
                    };
                  };
                };
              };
            };
            requireHeaders: true;
          } & {
            use: any[];
          };
          path: "/get-session";
        };
      };
    } | {
      id: "customGetProviders";
      endpoints: {
        customGetProviders: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
            body?: undefined;
          } & {
            method?: "GET" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: any;
          } : any>;
          options: {
            method: "GET";
          } & {
            use: any[];
          };
          path: "/get-providers";
        };
      };
    } | {
      id: "getAccountInfo";
      endpoints: {
        getAccountInfo: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
            body?: undefined;
          } & {
            method?: "GET" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: ({
              id: string;
              provider: string;
              profile: {
                id: string;
                name?: string;
                email?: string | null;
                image?: string;
                emailVerified: boolean;
              };
              accountId?: undefined;
            } | {
              id: string;
              accountId: string;
              provider: string;
              profile: {
                id: string;
                name?: string;
                email?: string | null;
                image?: string;
                emailVerified: boolean;
              } | undefined;
            })[] | null;
          } : ({
            id: string;
            provider: string;
            profile: {
              id: string;
              name?: string;
              email?: string | null;
              image?: string;
              emailVerified: boolean;
            };
            accountId?: undefined;
          } | {
            id: string;
            accountId: string;
            provider: string;
            profile: {
              id: string;
              name?: string;
              email?: string | null;
              image?: string;
              emailVerified: boolean;
            } | undefined;
          })[] | null>;
          options: {
            method: "GET";
          } & {
            use: any[];
          };
          path: "/get-account-info";
        };
      };
    } | {
      id: "deleteUserCustom";
      endpoints: {
        deleteUserCustom: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              TOTPCode: string;
            };
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: void;
          } : void>;
          options: {
            method: "POST";
            body: zod_v490.ZodObject<{
              TOTPCode: zod_v490.ZodString;
            }, zod_v4_core91.$strip>;
          } & {
            use: any[];
          };
          path: "/delete-user-custom";
        };
      };
    } | {
      id: "oneTimeToken";
      endpoints: {
        generateOneTimeToken: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0?: ({
            body?: undefined;
          } & {
            method?: "GET" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }) | undefined): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              token: string;
            };
          } : {
            token: string;
          }>;
          options: {
            method: "GET";
            use: ((inputContext: better_call87.MiddlewareInputContext<better_call87.MiddlewareOptions>) => Promise<{
              session: {
                session: Record<string, any> & {
                  id: string;
                  createdAt: Date;
                  updatedAt: Date;
                  userId: string;
                  expiresAt: Date;
                  token: string;
                  ipAddress?: string | null | undefined;
                  userAgent?: string | null | undefined;
                };
                user: Record<string, any> & {
                  id: string;
                  name: string;
                  email: string;
                  emailVerified: boolean;
                  createdAt: Date;
                  updatedAt: Date;
                  image?: string | null | undefined;
                };
              };
            }>)[];
          } & {
            use: any[];
          };
          path: "/one-time-token/generate";
        };
        applyOneTimeToken: {
          <AsResponse extends boolean = false, ReturnHeaders extends boolean = false>(inputCtx_0: {
            body: {
              token: string;
            };
          } & {
            method?: "POST" | undefined;
          } & {
            query?: Record<string, any> | undefined;
          } & {
            params?: Record<string, any>;
          } & {
            request?: Request;
          } & {
            headers?: HeadersInit;
          } & {
            asResponse?: boolean;
            returnHeaders?: boolean;
            use?: better_call87.Middleware[];
            path?: string;
          } & {
            asResponse?: AsResponse | undefined;
            returnHeaders?: ReturnHeaders | undefined;
          }): Promise<[AsResponse] extends [true] ? Response : [ReturnHeaders] extends [true] ? {
            headers: Headers;
            response: {
              user: {
                id: string;
                name: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                image?: string | null | undefined;
              } & Record<string, any>;
            };
          } : {
            user: {
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              createdAt: Date;
              updatedAt: Date;
              image?: string | null | undefined;
            } & Record<string, any>;
          }>;
          options: {
            method: "POST";
            body: zod110.ZodObject<{
              token: zod110.ZodString;
            }, "strip", zod110.ZodTypeAny, {
              token: string;
            }, {
              token: string;
            }>;
          } & {
            use: any[];
          };
          path: "/one-time-token/apply";
        };
      };
    })[];
  };
  $context: Promise<better_auth771.AuthContext>;
  $Infer: {
    Session: {
      session: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        ipAddress?: string | null | undefined | undefined;
        userAgent?: string | null | undefined | undefined;
      };
      user: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        image?: string | null | undefined | undefined;
        handle: string;
        deleted: boolean;
        bio: string;
        website: string;
        socialLinks: string;
        role: string;
        roleEndAt: Date;
        stripeCustomerId?: string | null | undefined;
        twoFactorEnabled: boolean | null | undefined;
      };
    };
  };
  $ERROR_CODES: {
    readonly OTP_NOT_ENABLED: "OTP not enabled";
    readonly OTP_HAS_EXPIRED: "OTP has expired";
    readonly TOTP_NOT_ENABLED: "TOTP not enabled";
    readonly TWO_FACTOR_NOT_ENABLED: "Two factor isn't enabled";
    readonly BACKUP_CODES_NOT_ENABLED: "Backup codes aren't enabled";
    readonly INVALID_BACKUP_CODE: "Invalid backup code";
    readonly INVALID_CODE: "Invalid code";
    readonly TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: "Too many attempts. Please request a new code.";
    readonly INVALID_TWO_FACTOR_COOKIE: "Invalid two factor cookie";
  } & {
    USER_NOT_FOUND: string;
    FAILED_TO_CREATE_USER: string;
    FAILED_TO_CREATE_SESSION: string;
    FAILED_TO_UPDATE_USER: string;
    FAILED_TO_GET_SESSION: string;
    INVALID_PASSWORD: string;
    INVALID_EMAIL: string;
    INVALID_EMAIL_OR_PASSWORD: string;
    SOCIAL_ACCOUNT_ALREADY_LINKED: string;
    PROVIDER_NOT_FOUND: string;
    INVALID_TOKEN: string;
    ID_TOKEN_NOT_SUPPORTED: string;
    FAILED_TO_GET_USER_INFO: string;
    USER_EMAIL_NOT_FOUND: string;
    EMAIL_NOT_VERIFIED: string;
    PASSWORD_TOO_SHORT: string;
    PASSWORD_TOO_LONG: string;
    USER_ALREADY_EXISTS: string;
    EMAIL_CAN_NOT_BE_UPDATED: string;
    CREDENTIAL_ACCOUNT_NOT_FOUND: string;
    SESSION_EXPIRED: string;
    FAILED_TO_UNLINK_LAST_ACCOUNT: string;
    ACCOUNT_NOT_FOUND: string;
  };
};
//#endregion
//#region src/types/auth.d.ts
type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
type AuthUser = NonNullable<AuthSession>["user"];
//#endregion
//#region src/bootstrap.d.ts
declare const _routes: hono_hono_base42.HonoBase<Env, ({
  "/better-auth/*": {
    $get: {
      input: {};
      output: {};
      outputFormat: string;
      status: hono_utils_http_status0.StatusCode;
    };
  };
} & {
  "/better-auth/*": {
    $post: {
      input: {};
      output: {};
      outputFormat: string;
      status: hono_utils_http_status0.StatusCode;
    };
  };
}) | hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {
        query: {
          type?: "checking" | "completed" | "incomplete" | "audit" | "received" | "all" | undefined;
        };
      };
      output: {
        code: number;
        data: {
          id: string;
          userId: string;
          type: "checking" | "completed" | "incomplete" | "audit" | "received";
          actionId: number;
          progress: number;
          progressMax: number;
          done: boolean;
          doneAt: string | null;
          tx: string | null;
          power: string;
        }[];
        done: number;
        total: number;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $put: {
      input: {
        json: {
          actionId: number;
        };
      };
      output: {
        code: number;
        data: {
          actionId: number;
          result: boolean;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/check": {
    $post: {
      input: {
        json: {
          actionId: number;
        };
      };
      output: {
        code: number;
        data: {
          actionId: number;
          result: boolean;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/audit": {
    $post: {
      input: {
        json: {
          actionId: number;
          payload?: any;
        };
      };
      output: {
        code: number;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/achievement"> | hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {};
      output: {
        code: 0;
        data?: {
          createdAt: string | null;
          updatedAt: string | null;
          userId: string;
          rules?: {
            name: string;
            condition: {
              value: string;
              field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
              operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
            }[] | {
              value: string;
              field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
              operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
            }[][];
            result: {
              disabled?: boolean | undefined;
              translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
              summary?: boolean | undefined;
              readability?: boolean | undefined;
              sourceContent?: boolean | undefined;
              silence?: boolean | undefined;
              block?: boolean | undefined;
              star?: boolean | undefined;
              newEntryNotification?: boolean | undefined;
              rewriteRules?: {
                from: string;
                to: string;
              }[] | undefined;
              blockRules?: {
                value: string | number;
                field: "title" | "content" | "all" | "author" | "url" | "order";
                operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
              }[] | undefined;
              webhooks?: string[] | undefined;
            };
          }[] | null | undefined;
        } | undefined;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $put: {
      input: {
        json: {
          rules?: {
            name: string;
            condition: {
              value: string;
              field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
              operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
            }[] | {
              value: string;
              field: "title" | "status" | "view" | "site_url" | "feed_url" | "category" | "entry_title" | "entry_content" | "entry_url" | "entry_author" | "entry_media_length" | "entry_attachments_duration";
              operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
            }[][];
            result: {
              disabled?: boolean | undefined;
              translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
              summary?: boolean | undefined;
              readability?: boolean | undefined;
              sourceContent?: boolean | undefined;
              silence?: boolean | undefined;
              block?: boolean | undefined;
              star?: boolean | undefined;
              newEntryNotification?: boolean | undefined;
              rewriteRules?: {
                from: string;
                to: string;
              }[] | undefined;
              blockRules?: {
                value: string | number;
                field: "title" | "content" | "all" | "author" | "url" | "order";
                operator: "contains" | "not_contains" | "eq" | "not_eq" | "gt" | "lt" | "regex";
              }[] | undefined;
              webhooks?: string[] | undefined;
            };
          }[] | null | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/actions"> | hono_types2.MergeSchemaPath<hono_types2.MergeSchemaPath<{
  "/": {
    $post: {
      input: {
        json: {
          messages: {
            role: string;
            content: string;
          }[];
        };
      };
      output: {
        title: string;
        remainingTokens?: number | undefined;
      };
      outputFormat: "json";
      status: 200;
    } | {
      input: {
        json: {
          messages: {
            role: string;
            content: string;
          }[];
        };
      };
      output: {
        error: string;
      };
      outputFormat: "json";
      status: 400;
    } | {
      input: {
        json: {
          messages: {
            role: string;
            content: string;
          }[];
        };
      };
      output: {
        error: string;
      };
      outputFormat: "json";
      status: 500;
    };
  };
}, "/summary-title"> & hono_types2.MergeSchemaPath<{
  "/": {
    $post: {
      input: {
        json: {
          messages: any[];
          context?: {
            mainEntryId?: string | undefined;
            referEntryIds?: string[] | undefined;
            referFeedIds?: string[] | undefined;
            selectedText?: string | undefined;
          } | undefined;
        };
      };
      output: Response;
      outputFormat: "json";
      status: hono_utils_http_status0.StatusCode;
    };
  };
}, "/chat"> & hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {
        query: {
          view: "0" | "1";
          startDate: string;
        };
      };
      output: {
        code: 0;
        data: string;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/daily"> & hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {
        query: {
          id: string;
          language?: "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
          target?: "content" | "readabilityContent" | undefined;
        };
      };
      output: {
        code: 0;
        data?: string | undefined;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/summary"> & hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {
        query: {
          id: string;
          language: "en" | "ja" | "zh-CN" | "zh-TW";
          fields: string;
          part?: string | undefined;
        };
      };
      output: {
        code: 0;
        data?: {
          description?: string | undefined;
          title?: string | undefined;
          content?: string | undefined;
          readabilityContent?: string | undefined;
        } | undefined;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/translation">, "/ai"> | hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {
        query: {
          view?: string | undefined;
        };
      };
      output: {
        data?: string[] | undefined;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $delete: {
      input: {
        json: {
          feedIdList: string[];
          deleteSubscriptions: boolean;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $patch: {
      input: {
        json: {
          category: string;
          feedIdList: string[];
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/categories"> | hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {
        query: {
          entryId: string;
        };
      };
      output: {
        code: 0;
        data: boolean;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $post: {
      input: {
        json: {
          entryId: string;
          view?: number | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $delete: {
      input: {
        json: {
          entryId: string;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/collections"> | hono_types2.MergeSchemaPath<{
  "/": {
    $post: {
      input: {
        json: {
          keyword: string;
          target?: "feeds" | "lists" | undefined;
        };
      };
      output: {
        data: {
          entries?: {
            id: string;
            description: string | null;
            title: string | null;
            content: string | null;
            author: string | null;
            url: string | null;
            language: string | null;
            feedId: string;
            guid: string;
            categories: string[] | null;
            authorUrl: string | null;
            authorAvatar: string | null;
            insertedAt: string;
            publishedAt: string;
            media?: {
              type: "photo" | "video";
              url: string;
              width?: number | undefined;
              height?: number | undefined;
              preview_image_url?: string | undefined;
              blurhash?: string | undefined;
            }[] | null | undefined;
            attachments?: {
              url: string;
              title?: string | undefined;
              duration_in_seconds?: string | number | undefined;
              mime_type?: string | undefined;
              size_in_bytes?: number | undefined;
            }[] | null | undefined;
            extra?: {
              links?: {
                type: string;
                url: string;
                content_html?: string | undefined;
              }[] | null | undefined;
            } | null | undefined;
          }[] | undefined;
          updatesPerWeek?: number | undefined;
          subscriptionCount?: number | undefined;
          feed?: {
            id: string;
            type: "feed";
            url: string;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            siteUrl?: string | null | undefined;
            errorMessage?: string | null | undefined;
            errorAt?: string | null | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
            tipUsers?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            }[] | null | undefined;
          } | undefined;
          list?: {
            id: string;
            createdAt: string | null;
            updatedAt: string | null;
            type: "list";
            view: number;
            feedIds: string[];
            fee: number;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            feeds?: {
              id: string;
              type: "feed";
              url: string;
              image?: string | null | undefined;
              description?: string | null | undefined;
              title?: string | null | undefined;
              siteUrl?: string | null | undefined;
              errorMessage?: string | null | undefined;
              errorAt?: string | null | undefined;
              ownerUserId?: string | null | undefined;
              owner?: {
                id: string;
                name: string | null;
                emailVerified: boolean | null;
                image: string | null;
                handle: string | null;
                createdAt: string;
                updatedAt: string;
                suspended: boolean | null;
                deleted: boolean | null;
              } | null | undefined;
              tipUsers?: {
                id: string;
                name: string | null;
                emailVerified: boolean | null;
                image: string | null;
                handle: string | null;
                createdAt: string;
                updatedAt: string;
                suspended: boolean | null;
                deleted: boolean | null;
              }[] | null | undefined;
            }[] | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
          } | undefined;
          docs?: string | undefined;
          analytics?: {
            view: number | null;
            feedId: string;
            updatesPerWeek: number | null;
            subscriptionCount: number | null;
            latestEntryPublishedAt: string | null;
          } | undefined;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/rsshub": {
    $get: {
      input: {
        query: {
          category?: string | undefined;
          categories?: string | undefined;
          namespace?: string | undefined;
          lang?: string | undefined;
        };
      };
      output: {
        data: {
          [x: string]: {
            name: string;
            description: string;
            url: string;
            lang: string;
            routes: {
              [x: string]: {
                path: string;
                name: string;
                example: string;
                description: string;
                categories: string[];
                parameters: {
                  [x: string]: string;
                };
                maintainers: string[];
                location: string;
                view?: number | undefined;
              };
            };
          };
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/rsshub/route": {
    $get: {
      input: {
        query: {
          route: string;
        };
      };
      output: {
        data: {
          name: string;
          description: string;
          url: string;
          prefix: string;
          route?: any;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/rsshub-analytics": {
    $get: {
      input: {
        query: {
          lang?: string | undefined;
        };
      };
      output: {
        data: {
          [x: string]: {
            subscriptionCount: number;
            topFeeds: {
              id: string;
              type: "feed";
              url: string;
              image?: string | null | undefined;
              description?: string | null | undefined;
              title?: string | null | undefined;
              siteUrl?: string | null | undefined;
              errorMessage?: string | null | undefined;
              errorAt?: string | null | undefined;
              ownerUserId?: string | null | undefined;
              owner?: {
                id: string;
                name: string | null;
                emailVerified: boolean | null;
                image: string | null;
                handle: string | null;
                createdAt: string;
                updatedAt: string;
                suspended: boolean | null;
                deleted: boolean | null;
              } | null | undefined;
              tipUsers?: {
                id: string;
                name: string | null;
                emailVerified: boolean | null;
                image: string | null;
                handle: string | null;
                createdAt: string;
                updatedAt: string;
                suspended: boolean | null;
                deleted: boolean | null;
              }[] | null | undefined;
            }[];
          };
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/discover"> | hono_types2.MergeSchemaPath<hono_types2.MergeSchemaPath<{
  "/": {
    $post: {
      input: {
        json: {
          inboxId: string;
          read?: boolean | undefined;
          limit?: number | undefined;
          publishedAfter?: string | undefined;
          publishedBefore?: string | undefined;
        };
      };
      output: {
        code: 0;
        remaining: number;
        data?: {
          entries: {
            id: string;
            description: string | null;
            title: string | null;
            author: string | null;
            url: string | null;
            language: string | null;
            guid: string;
            categories: string[] | null;
            authorUrl: string | null;
            authorAvatar: string | null;
            insertedAt: string;
            publishedAt: string;
            read: boolean | null;
            inboxHandle: string;
            media?: {
              type: "photo" | "video";
              url: string;
              width?: number | undefined;
              height?: number | undefined;
              preview_image_url?: string | undefined;
              blurhash?: string | undefined;
            }[] | null | undefined;
            attachments?: {
              url: string;
              title?: string | undefined;
              duration_in_seconds?: string | number | undefined;
              mime_type?: string | undefined;
              size_in_bytes?: number | undefined;
            }[] | null | undefined;
            extra?: {
              links?: {
                type: string;
                url: string;
                content_html?: string | undefined;
              }[] | null | undefined;
            } | null | undefined;
          };
          feeds: {
            id: string;
            type: "inbox";
            secret: string;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
          };
          read: boolean | null;
          collections?: {
            createdAt: string;
          } | undefined;
          settings?: {
            disabled?: boolean | undefined;
            translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
            summary?: boolean | undefined;
            readability?: boolean | undefined;
            sourceContent?: boolean | undefined;
            silence?: boolean | undefined;
            block?: boolean | undefined;
            star?: boolean | undefined;
            newEntryNotification?: boolean | undefined;
            rewriteRules?: {
              from: string;
              to: string;
            }[] | undefined;
            webhooks?: string[] | undefined;
          } | undefined;
        }[] | undefined;
        total?: number | undefined;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $get: {
      input: {
        query: {
          id: string;
        };
      };
      output: {
        code: 0;
        data?: {
          entries: {
            id: string;
            description: string | null;
            title: string | null;
            content: string | null;
            author: string | null;
            url: string | null;
            language: string | null;
            guid: string;
            categories: string[] | null;
            authorUrl: string | null;
            authorAvatar: string | null;
            insertedAt: string;
            publishedAt: string;
            read: boolean | null;
            inboxHandle: string;
            media?: {
              type: "photo" | "video";
              url: string;
              width?: number | undefined;
              height?: number | undefined;
              preview_image_url?: string | undefined;
              blurhash?: string | undefined;
            }[] | null | undefined;
            attachments?: {
              url: string;
              title?: string | undefined;
              duration_in_seconds?: string | number | undefined;
              mime_type?: string | undefined;
              size_in_bytes?: number | undefined;
            }[] | null | undefined;
            extra?: {
              links?: {
                type: string;
                url: string;
                content_html?: string | undefined;
              }[] | null | undefined;
            } | null | undefined;
          };
          feeds: {
            id: string;
            type: "inbox";
            secret: string;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
          };
        } | undefined;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $delete: {
      input: {
        json: {
          entryId: string;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/inbox"> & hono_types2.MergeSchemaPath<{
  "/:id": {
    $get: {
      input: {
        param: {
          id?: any;
        };
      } & {
        query: {
          size?: number | undefined;
          page?: number | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          users: {
            [x: string]: {
              id: string;
              name: string | null;
              image: string | null;
              handle: string | null;
            };
          };
          total: number;
          entryReadHistories: {
            userIds: string[];
            readCount: number;
          } | null;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/read-histories"> & hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {
        query: {
          insertedAfter: number;
          view?: number | undefined;
          feedId?: string | undefined;
          read?: string | undefined;
          feedIdList?: string[] | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          has_new: boolean;
          entry_id?: string | undefined;
          lastest_at?: string | undefined;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/check-new"> & {
  "/": {
    $post: {
      input: {
        json: {
          view?: number | undefined;
          feedId?: string | undefined;
          read?: boolean | undefined;
          listId?: string | undefined;
          feedIdList?: string[] | undefined;
          limit?: number | undefined;
          publishedAfter?: string | undefined;
          publishedBefore?: string | undefined;
          collected?: boolean | undefined;
          isCollection?: boolean | undefined;
          isArchived?: boolean | undefined;
          withContent?: boolean | undefined;
          excludePrivate?: boolean | undefined;
        };
      };
      output: {
        code: 0;
        data?: {
          entries: {
            id: string;
            description: string | null;
            title: string | null;
            author: string | null;
            url: string | null;
            language: string | null;
            guid: string;
            categories: string[] | null;
            authorUrl: string | null;
            authorAvatar: string | null;
            insertedAt: string;
            publishedAt: string;
            media?: {
              type: "photo" | "video";
              url: string;
              width?: number | undefined;
              height?: number | undefined;
              preview_image_url?: string | undefined;
              blurhash?: string | undefined;
            }[] | null | undefined;
            attachments?: {
              url: string;
              title?: string | undefined;
              duration_in_seconds?: string | number | undefined;
              mime_type?: string | undefined;
              size_in_bytes?: number | undefined;
            }[] | null | undefined;
            extra?: {
              links?: {
                type: string;
                url: string;
                content_html?: string | undefined;
              }[] | null | undefined;
            } | null | undefined;
          };
          feeds: {
            id: string;
            type: "feed";
            url: string;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            siteUrl?: string | null | undefined;
            errorMessage?: string | null | undefined;
            errorAt?: string | null | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
            tipUsers?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            }[] | null | undefined;
          };
          read: boolean | null;
          view?: number | undefined;
          from?: string[] | undefined;
          collections?: {
            createdAt: string;
          } | undefined;
          settings?: {
            disabled?: boolean | undefined;
            translation?: boolean | "en" | "ja" | "zh-CN" | "zh-TW" | undefined;
            summary?: boolean | undefined;
            readability?: boolean | undefined;
            sourceContent?: boolean | undefined;
            silence?: boolean | undefined;
            block?: boolean | undefined;
            star?: boolean | undefined;
            newEntryNotification?: boolean | undefined;
            rewriteRules?: {
              from: string;
              to: string;
            }[] | undefined;
            webhooks?: string[] | undefined;
          } | undefined;
        }[] | undefined;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $get: {
      input: {
        query: {
          id: string;
        };
      };
      output: {
        code: 0;
        data?: {
          entries: {
            id: string;
            description: string | null;
            title: string | null;
            content: string | null;
            author: string | null;
            url: string | null;
            language: string | null;
            guid: string;
            categories: string[] | null;
            authorUrl: string | null;
            authorAvatar: string | null;
            insertedAt: string;
            publishedAt: string;
            media?: {
              type: "photo" | "video";
              url: string;
              width?: number | undefined;
              height?: number | undefined;
              preview_image_url?: string | undefined;
              blurhash?: string | undefined;
            }[] | null | undefined;
            attachments?: {
              url: string;
              title?: string | undefined;
              duration_in_seconds?: string | number | undefined;
              mime_type?: string | undefined;
              size_in_bytes?: number | undefined;
            }[] | null | undefined;
            extra?: {
              links?: {
                type: string;
                url: string;
                content_html?: string | undefined;
              }[] | null | undefined;
            } | null | undefined;
          };
          feeds: {
            id: string;
            type: "feed";
            url: string;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            siteUrl?: string | null | undefined;
            errorMessage?: string | null | undefined;
            errorAt?: string | null | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
            tipUsers?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            }[] | null | undefined;
          };
        } | undefined;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/readability": {
    $get: {
      input: {
        query: {
          id: string;
        };
      };
      output: {
        code: 0;
        data: {
          content?: string | null | undefined;
        } | null;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/stream": {
    $post: {
      input: {
        json: {
          ids: string[];
        };
      };
      output: {};
      outputFormat: "text";
      status: 200;
    };
  };
} & {
  "/preview": {
    $get: {
      input: {
        query: {
          id: string;
        };
      };
      output: {
        code: 0;
        data: {
          id: string;
          description: string | null;
          title: string | null;
          content: string | null;
          author: string | null;
          url: string | null;
          language: string | null;
          feedId: string;
          guid: string;
          categories: string[] | null;
          authorUrl: string | null;
          authorAvatar: string | null;
          insertedAt: string;
          publishedAt: string;
          media?: {
            type: "photo" | "video";
            url: string;
            width?: number | undefined;
            height?: number | undefined;
            preview_image_url?: string | undefined;
            blurhash?: string | undefined;
          }[] | null | undefined;
          attachments?: {
            url: string;
            title?: string | undefined;
            duration_in_seconds?: string | number | undefined;
            mime_type?: string | undefined;
            size_in_bytes?: number | undefined;
          }[] | null | undefined;
          extra?: {
            links?: {
              type: string;
              url: string;
              content_html?: string | undefined;
            }[] | null | undefined;
          } | null | undefined;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/entries"> | hono_types2.MergeSchemaPath<hono_types2.MergeSchemaPath<{
  "/message": {
    $get: {
      input: {
        query: {
          feedId: string;
        };
      };
      output: {
        code: 0;
        data: {
          json: string;
          xml: string;
          description: string;
          content: string;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/challenge": {
    $post: {
      input: {
        json: {
          feedId: string;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/list": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          subscriptionCount: number;
          feed: {
            id: string;
            type: "feed";
            url: string;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            siteUrl?: string | null | undefined;
            errorMessage?: string | null | undefined;
            errorAt?: string | null | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
            tipUsers?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            }[] | null | undefined;
          };
          tipAmount: number;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/claim"> & {
  "/": {
    $get: {
      input: {
        query: {
          id?: string | undefined;
          url?: string | undefined;
          entriesLimit?: number | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          entries: {
            description: string | null;
            title: string | null;
            author: string | null;
            url: string | null;
            language: string | null;
            guid: string;
            categories: string[] | null;
            authorUrl: string | null;
            authorAvatar: string | null;
            publishedAt: string;
            media?: {
              type: "photo" | "video";
              url: string;
              width?: number | undefined;
              height?: number | undefined;
              preview_image_url?: string | undefined;
              blurhash?: string | undefined;
            }[] | null | undefined;
            attachments?: {
              url: string;
              title?: string | undefined;
              duration_in_seconds?: string | number | undefined;
              mime_type?: string | undefined;
              size_in_bytes?: number | undefined;
            }[] | null | undefined;
            extra?: {
              links?: {
                type: string;
                url: string;
                content_html?: string | undefined;
              }[] | null | undefined;
            } | null | undefined;
          }[];
          subscriptionCount: number;
          feed: {
            id: string;
            type: "feed";
            url: string;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            siteUrl?: string | null | undefined;
            errorMessage?: string | null | undefined;
            errorAt?: string | null | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
            tipUsers?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            }[] | null | undefined;
          };
          readCount: number;
          subscription?: {
            createdAt: string;
            userId: string;
            title: string | null;
            view: number;
            category: string | null;
            feedId: string;
            isPrivate: boolean;
          } | undefined;
          analytics?: {
            view: number | null;
            feedId: string;
            updatesPerWeek: number | null;
            subscriptionCount: number | null;
            latestEntryPublishedAt: string | null;
          } | undefined;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/refresh": {
    $get: {
      input: {
        query: {
          id: string;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/reset": {
    $get: {
      input: {
        query: {
          id: string;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/analytics": {
    $post: {
      input: {
        json: {
          id: string[];
        };
      };
      output: {
        code: 0;
        data: {
          analytics: {
            [x: string]: {
              view: number | null;
              feedId: string;
              updatesPerWeek: number | null;
              subscriptionCount: number | null;
              latestEntryPublishedAt: string | null;
            };
          };
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/feeds"> | hono_types2.MergeSchemaPath<{
  "/new": {
    $post: {
      input: {
        json: {
          TOTPCode?: string | undefined;
        };
      };
      output: {
        code: 0;
        data: string;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/use": {
    $post: {
      input: {
        json: {
          code: string;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          code: string;
          createdAt: string | null;
          users: {
            id: string;
            name: string | null;
            image: string | null;
          } | null;
          usedAt: string | null;
          toUserId: string | null;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/limitation": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: number;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/invitations"> | hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {
        query: {
          id?: string | undefined;
          handle?: string | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          id: string;
          name: string | null;
          emailVerified: boolean | null;
          image: string | null;
          handle: string | null;
          createdAt: string;
          updatedAt: string;
          twoFactorEnabled: boolean | null;
          isAnonymous: boolean | null;
          suspended: boolean | null;
          deleted: boolean | null;
          bio: string | null;
          website: string | null;
          socialLinks: {
            twitter: string;
            github: string;
            instagram: string;
            facebook: string;
            youtube: string;
          } | null;
          stripeCustomerId: string | null;
          role: string | null;
          roleEndAt: string | null;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/batch": {
    $post: {
      input: {
        json: {
          ids: string[];
        };
      };
      output: {
        code: 0;
        data: {
          [x: string]: {
            id: string;
            name: string | null;
            emailVerified: boolean | null;
            image: string | null;
            handle: string | null;
            createdAt: string;
            updatedAt: string;
            twoFactorEnabled: boolean | null;
            isAnonymous: boolean | null;
            suspended: boolean | null;
            deleted: boolean | null;
            bio: string | null;
            website: string | null;
            socialLinks: {
              twitter: string;
              github: string;
              instagram: string;
              facebook: string;
              youtube: string;
            } | null;
            stripeCustomerId: string | null;
            role: string | null;
            roleEndAt: string | null;
          };
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/profiles"> | hono_types2.MergeSchemaPath<{
  "/": {
    $post: {
      input: {
        json: {
          entryIds: string[];
          isInbox?: boolean | undefined;
          readHistories?: string[] | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $delete: {
      input: {
        json: {
          entryId: string;
          isInbox?: boolean | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $get: {
      input: {
        query: {
          view?: string | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          [x: string]: number;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/all": {
    $post: {
      input: {
        json: {
          view?: number | undefined;
          feedId?: string | undefined;
          listId?: string | undefined;
          feedIdList?: string[] | undefined;
          inboxId?: string | undefined;
          excludePrivate?: boolean | undefined;
          startTime?: number | undefined;
          endTime?: number | undefined;
          insertedBefore?: number | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          read: {
            [x: string]: number;
          };
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/total-count": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          count: number;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/reads"> | hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {
        query: {
          tab?: "general" | "appearance" | "integration" | "ai" | undefined;
        };
      };
      output: {
        code: 0;
        settings: {
          [x: string]: any;
        };
        updated: {
          [x: string]: string;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/:tab": {
    $patch: {
      input: {
        param: {
          tab: string;
        };
      } & {
        json: Record<string, any>;
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/settings"> | hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {
        query: {
          userId?: string | undefined;
          view?: string | undefined;
        };
      };
      output: {
        code: 0;
        data: ({
          createdAt: string;
          userId: string;
          title: string | null;
          view: number;
          category: string | null;
          feeds: {
            id: string;
            type: "feed";
            url: string;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            siteUrl?: string | null | undefined;
            errorMessage?: string | null | undefined;
            errorAt?: string | null | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
            tipUsers?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            }[] | null | undefined;
          };
          feedId: string;
          isPrivate: boolean;
          boost: {
            boosters: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              twoFactorEnabled: boolean | null;
              isAnonymous: boolean | null;
              suspended: boolean | null;
              deleted: boolean | null;
              bio: string | null;
              website: string | null;
              socialLinks: {
                twitter: string;
                github: string;
                instagram: string;
                facebook: string;
                youtube: string;
              } | null;
              stripeCustomerId: string | null;
              role: string | null;
              roleEndAt: string | null;
            }[];
          };
        } | {
          createdAt: string;
          userId: string;
          title: string | null;
          view: number;
          feedId: string;
          isPrivate: boolean;
          lists: {
            id: string;
            createdAt: string | null;
            updatedAt: string | null;
            type: "list";
            view: number;
            feedIds: string[];
            fee: number;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            feeds?: {
              id: string;
              type: "feed";
              url: string;
              image?: string | null | undefined;
              description?: string | null | undefined;
              title?: string | null | undefined;
              siteUrl?: string | null | undefined;
              errorMessage?: string | null | undefined;
              errorAt?: string | null | undefined;
              ownerUserId?: string | null | undefined;
              owner?: {
                id: string;
                name: string | null;
                emailVerified: boolean | null;
                image: string | null;
                handle: string | null;
                createdAt: string;
                updatedAt: string;
                suspended: boolean | null;
                deleted: boolean | null;
              } | null | undefined;
              tipUsers?: {
                id: string;
                name: string | null;
                emailVerified: boolean | null;
                image: string | null;
                handle: string | null;
                createdAt: string;
                updatedAt: string;
                suspended: boolean | null;
                deleted: boolean | null;
              }[] | null | undefined;
            }[] | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
          };
          listId: string;
          category?: string | undefined;
        } | {
          createdAt: string;
          userId: string;
          title: string | null;
          view: number;
          category: string | null;
          feedId: string;
          isPrivate: boolean;
          inboxes: {
            id: string;
            type: "inbox";
            secret: string;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
          };
          inboxId: string;
        })[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $post: {
      input: {
        json: {
          view: number;
          title?: string | null | undefined;
          category?: string | null | undefined;
          url?: string | undefined;
          isPrivate?: boolean | undefined;
          listId?: string | undefined;
          TOTPCode?: string | undefined;
        };
      };
      output: {
        code: 0;
        feed: {
          id: string;
          image: string | null;
          description: string | null;
          title: string | null;
          url: string;
          siteUrl: string | null;
          checkedAt: string;
          lastModifiedHeader: string | null;
          etagHeader: string | null;
          ttl: number | null;
          errorMessage: string | null;
          errorAt: string | null;
          ownerUserId: string | null;
          language: string | null;
          migrateTo: string | null;
          rsshubRoute: string | null;
          rsshubNamespace: string | null;
          nsfw: boolean | null;
        } | null;
        list: {
          id: string;
          image: string | null;
          createdAt: string | null;
          updatedAt: string | null;
          description: string | null;
          title: string;
          view: number;
          ownerUserId: string;
          language: string | null;
          feedIds: string[];
          fee: number;
        } | null;
        unread: {
          [x: string]: number;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $delete: {
      input: {
        json: {
          url?: string | undefined;
          feedId?: string | undefined;
          listId?: string | undefined;
          feedIdList?: string[] | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $patch: {
      input: {
        json: {
          view: number;
          title?: string | null | undefined;
          category?: string | null | undefined;
          feedId?: string | undefined;
          isPrivate?: boolean | undefined;
          listId?: string | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/export": {
    $get: {
      input: {
        query: {
          RSSHubURL?: string | undefined;
          folderMode?: "view" | "category" | undefined;
        };
      };
      output: {};
      outputFormat: string;
      status: 200;
    };
  };
} & {
  "/import": {
    $post: {
      input: {};
      output: {
        code: 0;
        data: {
          successfulItems: {
            id?: string | undefined;
            title?: string | null | undefined;
            url?: string | undefined;
          }[];
          conflictItems: {
            id: string;
            url: string;
            title?: string | null | undefined;
          }[];
          parsedErrorItems: {
            url: string;
            id?: string | undefined;
            title?: string | null | undefined;
          }[];
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/batch": {
    $patch: {
      input: {
        json: {
          view: number;
          feedIds: string[];
          title?: string | null | undefined;
          category?: string | null | undefined;
          isPrivate?: boolean | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/parse-opml": {
    $post: {
      input: {};
      output: {
        code: 0;
        data: {
          subscriptions: {
            userId: string;
            title: string | null;
            view: number;
            category: string | null;
            url: string;
          }[];
          remaining: number;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/subscriptions"> | hono_types2.MergeSchemaPath<hono_types2.MergeSchemaPath<{
  "/": {
    $post: {
      input: {};
      output: {
        code: 0;
        data: {
          transactionHash: string;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          tx: string | null;
          amount: string;
          rank: string | null;
          detail: {
            "Invitations count": number;
            "Purchase lists cost": number;
            "Total tip amount": number;
            "Feeds subscriptions count": number;
            "Lists subscriptions count": number;
            "Inbox subscriptions count": number;
            "Recent read count in the last month": number;
            "Mint count": number;
            "Claimed feeds count": number;
            "Claimed feeds subscriptions count": number;
            "Lists with more than 1 feed count": number;
            "Created lists subscriptions count": number;
            "Created lists income amount": number;
            "GitHub Community Contributions": number;
            "Invitations count Rank": number;
            "Purchase lists cost Rank": number;
            "Total tip amount Rank": number;
            "Feeds subscriptions count Rank": number;
            "Lists subscriptions count Rank": number;
            "Inbox subscriptions count Rank": number;
            "Recent read count in the last month Rank": number;
            "Mint count Rank": number;
            "Claimed feeds count Rank": number;
            "Claimed feeds subscriptions count Rank": number;
            "Lists with more than 1 feed count Rank": number;
            "Created lists subscriptions count Rank": number;
            "Created lists income amount Rank": number;
            "GitHub Community Contributions Rank": number;
          } | null;
          verify: string | null;
        } | null;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $put: {
      input: {
        json: {
          verify: string | null;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/airdrop"> & hono_types2.MergeSchemaPath<{
  "/tip": {
    $post: {
      input: {
        json: {
          amount: string;
          entryId: string;
          TOTPCode?: string | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          transactionHash: string;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $get: {
      input: {
        query: {
          type?: "tip" | "mint" | "burn" | "withdraw" | "purchase" | "airdrop" | undefined;
          hash?: string | undefined;
          fromUserId?: string | undefined;
          toUserId?: string | undefined;
          toFeedId?: string | undefined;
          fromOrToUserId?: string | undefined;
          createdAfter?: string | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          createdAt: string;
          type: "tip" | "mint" | "burn" | "withdraw" | "purchase" | "airdrop";
          hash: string;
          powerToken: string;
          fromUserId: string | null;
          toUserId: string | null;
          toFeedId: string | null;
          toListId: string | null;
          toEntryId: string | null;
          toRSSHubId: string | null;
          tax: string;
          comment: string | null;
          fromUser?: {
            id: string;
            name: string | null;
            emailVerified: boolean | null;
            image: string | null;
            handle: string | null;
            createdAt: string;
            updatedAt: string;
            twoFactorEnabled: boolean | null;
            isAnonymous: boolean | null;
            suspended: boolean | null;
            deleted: boolean | null;
            bio: string | null;
            website: string | null;
            socialLinks: {
              twitter: string;
              github: string;
              instagram: string;
              facebook: string;
              youtube: string;
            } | null;
            stripeCustomerId: string | null;
            role: string | null;
            roleEndAt: string | null;
          } | null | undefined;
          toUser?: {
            id: string;
            name: string | null;
            emailVerified: boolean | null;
            image: string | null;
            handle: string | null;
            createdAt: string;
            updatedAt: string;
            twoFactorEnabled: boolean | null;
            isAnonymous: boolean | null;
            suspended: boolean | null;
            deleted: boolean | null;
            bio: string | null;
            website: string | null;
            socialLinks: {
              twitter: string;
              github: string;
              instagram: string;
              facebook: string;
              youtube: string;
            } | null;
            stripeCustomerId: string | null;
            role: string | null;
            roleEndAt: string | null;
          } | null | undefined;
          toFeed?: {
            id: string;
            type: "feed";
            url: string;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            siteUrl?: string | null | undefined;
            errorMessage?: string | null | undefined;
            errorAt?: string | null | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
            tipUsers?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            }[] | null | undefined;
          } | null | undefined;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/claim_daily": {
    $post: {
      input: {};
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/withdraw": {
    $post: {
      input: {
        json: {
          amount: string;
          address: string;
          TOTPCode?: string | undefined;
          toRss3?: boolean | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          transactionHash: string;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/claim-check": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: boolean;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/transactions"> & {
  "/": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          createdAt: string;
          userId: string;
          powerToken: string;
          addressIndex: number;
          address: string | null;
          dailyPowerToken: string;
          cashablePowerToken: string;
          level: {
            rank: number | null;
            level: number | null;
            prevActivityPoints: number | null;
            activityPoints: number | null;
          } | null;
          todayDailyPower: string;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $post: {
      input: {};
      output: {
        code: 0;
        data: string;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/refresh": {
    $post: {
      input: {};
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/ranking": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          user: {
            id: string;
            name: string | null;
            emailVerified: boolean | null;
            image: string | null;
            handle: string | null;
            createdAt: string;
            updatedAt: string;
            twoFactorEnabled: boolean | null;
            isAnonymous: boolean | null;
            suspended: boolean | null;
            deleted: boolean | null;
            bio: string | null;
            website: string | null;
            socialLinks: {
              twitter: string;
              github: string;
              instagram: string;
              facebook: string;
              youtube: string;
            } | null;
            stripeCustomerId: string | null;
            role: string | null;
            roleEndAt: string | null;
          };
          userId: string;
          rank: number | null;
          powerToken: string;
          address: string;
          level: number | null;
          prevActivityPoints: number | null;
          activityPoints: number | null;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/power-price": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          rss3: number;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/wallets"> | hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {
        query: {
          listId: string;
          noExtras?: boolean | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          entries: {
            id: string;
            description: string | null;
            title: string | null;
            content: string | null;
            author: string | null;
            url: string | null;
            feeds: {
              id: string;
              type: "feed";
              url: string;
              image?: string | null | undefined;
              description?: string | null | undefined;
              title?: string | null | undefined;
              siteUrl?: string | null | undefined;
              errorMessage?: string | null | undefined;
              errorAt?: string | null | undefined;
              ownerUserId?: string | null | undefined;
              owner?: {
                id: string;
                name: string | null;
                emailVerified: boolean | null;
                image: string | null;
                handle: string | null;
                createdAt: string;
                updatedAt: string;
                suspended: boolean | null;
                deleted: boolean | null;
              } | null | undefined;
              tipUsers?: {
                id: string;
                name: string | null;
                emailVerified: boolean | null;
                image: string | null;
                handle: string | null;
                createdAt: string;
                updatedAt: string;
                suspended: boolean | null;
                deleted: boolean | null;
              }[] | null | undefined;
            };
            language: string | null;
            feedId: string;
            guid: string;
            categories: string[] | null;
            authorUrl: string | null;
            authorAvatar: string | null;
            insertedAt: string;
            publishedAt: string;
            media?: {
              type: "photo" | "video";
              url: string;
              width?: number | undefined;
              height?: number | undefined;
              preview_image_url?: string | undefined;
              blurhash?: string | undefined;
            }[] | null | undefined;
            attachments?: {
              url: string;
              title?: string | undefined;
              duration_in_seconds?: string | number | undefined;
              mime_type?: string | undefined;
              size_in_bytes?: number | undefined;
            }[] | null | undefined;
            extra?: {
              links?: {
                type: string;
                url: string;
                content_html?: string | undefined;
              }[] | null | undefined;
            } | null | undefined;
          }[];
          subscriptionCount: number;
          list: {
            id: string;
            createdAt: string | null;
            updatedAt: string | null;
            type: "list";
            view: number;
            feedIds: string[];
            fee: number;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            feeds?: {
              id: string;
              type: "feed";
              url: string;
              image?: string | null | undefined;
              description?: string | null | undefined;
              title?: string | null | undefined;
              siteUrl?: string | null | undefined;
              errorMessage?: string | null | undefined;
              errorAt?: string | null | undefined;
              ownerUserId?: string | null | undefined;
              owner?: {
                id: string;
                name: string | null;
                emailVerified: boolean | null;
                image: string | null;
                handle: string | null;
                createdAt: string;
                updatedAt: string;
                suspended: boolean | null;
                deleted: boolean | null;
              } | null | undefined;
              tipUsers?: {
                id: string;
                name: string | null;
                emailVerified: boolean | null;
                image: string | null;
                handle: string | null;
                createdAt: string;
                updatedAt: string;
                suspended: boolean | null;
                deleted: boolean | null;
              }[] | null | undefined;
            }[] | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
          };
          readCount: number;
          feedCount: number;
          subscription?: {
            createdAt: string;
            userId: string;
            title: string | null;
            view: number;
            isPrivate: boolean;
            listId: string;
          } | undefined;
          analytics?: {
            subscriptionCount: number | null;
            listId: string;
          } | undefined;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $post: {
      input: {
        json: {
          title: string;
          view: number;
          fee: number;
          image?: string | null | undefined;
          description?: string | null | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          id: string;
          createdAt: string | null;
          updatedAt: string | null;
          type: "list";
          view: number;
          feedIds: string[];
          fee: number;
          image?: string | null | undefined;
          description?: string | null | undefined;
          title?: string | null | undefined;
          feeds?: {
            id: string;
            type: "feed";
            url: string;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            siteUrl?: string | null | undefined;
            errorMessage?: string | null | undefined;
            errorAt?: string | null | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
            tipUsers?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            }[] | null | undefined;
          }[] | undefined;
          ownerUserId?: string | null | undefined;
          owner?: {
            id: string;
            name: string | null;
            emailVerified: boolean | null;
            image: string | null;
            handle: string | null;
            createdAt: string;
            updatedAt: string;
            suspended: boolean | null;
            deleted: boolean | null;
          } | null | undefined;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $delete: {
      input: {
        json: {
          listId: string;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $patch: {
      input: {
        json: {
          title: string;
          view: number;
          fee: number;
          listId: string;
          image?: string | null | undefined;
          description?: string | null | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/list": {
    $get: {
      input: {
        query: {
          userId?: string | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          id: string;
          createdAt: string | null;
          updatedAt: string | null;
          type: "list";
          view: number;
          feedIds: string[];
          fee: number;
          image?: string | null | undefined;
          description?: string | null | undefined;
          title?: string | null | undefined;
          feeds?: {
            id: string;
            type: "feed";
            url: string;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            siteUrl?: string | null | undefined;
            errorMessage?: string | null | undefined;
            errorAt?: string | null | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
            tipUsers?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            }[] | null | undefined;
          }[] | undefined;
          ownerUserId?: string | null | undefined;
          subscriptionCount?: number | undefined;
          owner?: {
            id: string;
            name: string | null;
            emailVerified: boolean | null;
            image: string | null;
            handle: string | null;
            createdAt: string;
            updatedAt: string;
            suspended: boolean | null;
            deleted: boolean | null;
          } | null | undefined;
          purchaseAmount?: number | undefined;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/feeds": {
    $post: {
      input: {
        json: {
          feedId: string;
          listId: string;
        } | {
          feedIds: string[];
          listId: string;
        };
      };
      output: {
        code: 0;
        data: {
          id: string;
          type: "feed";
          url: string;
          image?: string | null | undefined;
          description?: string | null | undefined;
          title?: string | null | undefined;
          siteUrl?: string | null | undefined;
          errorMessage?: string | null | undefined;
          errorAt?: string | null | undefined;
          ownerUserId?: string | null | undefined;
          owner?: {
            id: string;
            name: string | null;
            emailVerified: boolean | null;
            image: string | null;
            handle: string | null;
            createdAt: string;
            updatedAt: string;
            suspended: boolean | null;
            deleted: boolean | null;
          } | null | undefined;
          tipUsers?: {
            id: string;
            name: string | null;
            emailVerified: boolean | null;
            image: string | null;
            handle: string | null;
            createdAt: string;
            updatedAt: string;
            suspended: boolean | null;
            deleted: boolean | null;
          }[] | null | undefined;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/feeds": {
    $delete: {
      input: {
        json: {
          feedId: string;
          listId: string;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/lists"> | hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {};
      output: {};
      outputFormat: "text";
      status: 200;
    };
  };
} & {
  "/pools": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          totalCount: number;
          idleCount: number;
          waitingCount: number;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/metrics"> | hono_types2.MergeSchemaPath<{}, "/admin"> | hono_types2.MergeSchemaPath<{
  "/": {
    $delete: {
      input: {
        json: {
          handle: string;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $get: {
      input: {
        query: {
          handle: string;
        };
      };
      output: {
        code: 0;
        data: {
          id: string;
          type: "inbox";
          secret: string;
          image?: string | null | undefined;
          description?: string | null | undefined;
          title?: string | null | undefined;
          ownerUserId?: string | null | undefined;
          owner?: {
            id: string;
            name: string | null;
            emailVerified: boolean | null;
            image: string | null;
            handle: string | null;
            createdAt: string;
            updatedAt: string;
            suspended: boolean | null;
            deleted: boolean | null;
          } | null | undefined;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $post: {
      input: {
        json: {
          handle: string;
          title?: string | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/webhook": {
    $post: {
      input: {
        json: {
          guid: string;
          publishedAt: string;
          description?: string | null | undefined;
          title?: string | null | undefined;
          content?: string | null | undefined;
          author?: string | null | undefined;
          url?: string | null | undefined;
          language?: string | null | undefined;
          media?: {
            type: "photo" | "video";
            url: string;
            width?: number | undefined;
            height?: number | undefined;
            preview_image_url?: string | undefined;
            blurhash?: string | undefined;
          }[] | null | undefined;
          categories?: string[] | null | undefined;
          attachments?: {
            url: string;
            title?: string | undefined;
            duration_in_seconds?: string | number | undefined;
            mime_type?: string | undefined;
            size_in_bytes?: number | undefined;
          }[] | null | undefined;
          extra?: {
            links?: {
              type: string;
              url: string;
              content_html?: string | undefined;
            }[] | null | undefined;
          } | null | undefined;
          authorUrl?: string | null | undefined;
          authorAvatar?: string | null | undefined;
          read?: boolean | null | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/email": {
    $post: {
      input: {
        json: {
          date: string;
          from: {
            name?: string | undefined;
            address?: string | undefined;
          };
          to: {
            address: string;
          };
          messageId: string;
          subject?: string | undefined;
          html?: string | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $put: {
      input: {
        json: {
          handle: string;
          title: string;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/list": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          id: string;
          type: "inbox";
          secret: string;
          image?: string | null | undefined;
          description?: string | null | undefined;
          title?: string | null | undefined;
          ownerUserId?: string | null | undefined;
          owner?: {
            id: string;
            name: string | null;
            emailVerified: boolean | null;
            image: string | null;
            handle: string | null;
            createdAt: string;
            updatedAt: string;
            suspended: boolean | null;
            deleted: boolean | null;
          } | null | undefined;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/inboxes"> | hono_types2.MergeSchemaPath<{
  "/": {
    $post: {
      input: {
        json: {
          token: string;
          channel: "macos" | "windows" | "linux" | "ios" | "android" | "web" | "desktop";
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/test": {
    $get: {
      input: {
        query: {
          channel?: string | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $delete: {
      input: {
        json: {
          channel: "macos" | "windows" | "linux" | "ios" | "android" | "web" | "desktop";
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          userId: string | null;
          token: string;
          channel: "macos" | "windows" | "linux" | "ios" | "android" | "web" | "desktop";
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/messaging"> | hono_types2.MergeSchemaPath<{
  "/configs": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          AI_CHAT_ENABLED: boolean;
          ANNOUNCEMENT: string;
          DAILY_CLAIM_AMOUNT: {
            trial: number;
            normal: number;
          };
          DAILY_POWER_PERCENTAGES: number[];
          DAILY_POWER_SUPPLY: number;
          IMPORTING_TITLE: string;
          INVITATION_ENABLED: boolean;
          INVITATION_INTERVAL_DAYS: number;
          INVITATION_PRICE: number;
          IS_RSS3_TESTNET: boolean;
          LEVEL_PERCENTAGES: number[];
          MAX_ACTIONS: number;
          MAX_INBOXES: number;
          MAX_LISTS: number;
          MAX_SUBSCRIPTIONS: number;
          MAX_TRIAL_USER_FEED_SUBSCRIPTION: number;
          MAX_TRIAL_USER_LIST_SUBSCRIPTION: number;
          MAX_WEBHOOKS_PER_ACTION: number;
          PRODUCT_HUNT_VOTE_URL: string;
          REFERRAL_ENABLED: boolean;
          REFERRAL_PRO_PREVIEW_STRIPE_PRICE_IN_DOLLAR: number;
          REFERRAL_REQUIRED_INVITATIONS: number;
          REFERRAL_RULE_LINK: string;
          TAX_POINT: string;
          MAS_IN_REVIEW_VERSION?: string | undefined;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/status"> | hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {
        query: {
          feedId: string;
        };
      };
      output: {
        code: 0;
        data: {
          level: number;
          monthlyBoostCost: number;
          boostCount: number;
          remainingBoostsToLevelUp: number;
          lastValidBoost: {
            hash: string | null;
            expiresAt: string;
          } | null;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/boosters": {
    $get: {
      input: {
        query: {
          feedId: string;
        };
      };
      output: {
        code: 0;
        data: {
          id: string;
          name: string | null;
          emailVerified: boolean | null;
          image: string | null;
          handle: string | null;
          createdAt: string;
          updatedAt: string;
          twoFactorEnabled: boolean | null;
          isAnonymous: boolean | null;
          suspended: boolean | null;
          deleted: boolean | null;
          bio: string | null;
          website: string | null;
          socialLinks: {
            twitter: string;
            github: string;
            instagram: string;
            facebook: string;
            youtube: string;
          } | null;
          stripeCustomerId: string | null;
          role: string | null;
          roleEndAt: string | null;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $post: {
      input: {
        json: {
          amount: string;
          feedId: string;
          TOTPCode?: string | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          expiresAt: string;
          transactionHash: string;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/boosts"> | hono_types2.MergeSchemaPath<{
  "/postgresql": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: number;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/redis": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: number;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/bullmq": {
    $get: {
      input: {
        query: {
          name: "follow-queue" | "admin-wallet-queue";
        };
      };
      output: {
        code: 0;
        data: {
          current: {
            completed: number;
            wait: number;
            failed: number;
          };
          metrics: {
            completed: {
              data: number[];
              count: number;
            };
            failed: {
              data: number[];
              count: number;
            };
          };
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/rsshub": {
    $get: {
      input: {
        query: {
          route?: string | undefined;
          namespace?: string | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          successCount: number;
          errorCount: number;
          timestamp: string;
          successRate: number;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/probes"> | hono_types2.MergeSchemaPath<{
  "/": {
    $post: {
      input: {
        json: {
          baseUrl: string;
          id?: string | undefined;
          accessKey?: string | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/list": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          id: string;
          description: string | null;
          errorMessage: string | null;
          errorAt: string | null;
          ownerUserId: string;
          owner: {
            id: string;
            name: string | null;
            image: string | null;
            handle: string | null;
          } | null;
          price: number;
          userLimit: number | null;
          userCount: number;
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $delete: {
      input: {
        json: {
          id: string;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/use": {
    $post: {
      input: {
        json: {
          id: string | null;
          TOTPCode?: string | undefined;
          durationInMonths?: number | undefined;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/": {
    $get: {
      input: {
        query: {
          id: string;
        };
      };
      output: {
        code: 0;
        data: {
          purchase: {
            hash: string | null;
            expiresAt: string;
          } | null;
          instance: {
            id: string;
            description: string | null;
            errorMessage: string | null;
            errorAt: string | null;
            ownerUserId: string;
            price: number;
            userLimit: number | null;
            baseUrl?: string | null | undefined;
            accessKey?: string | null | undefined;
          };
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/status": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          purchase: {
            hash: string | null;
            expiresAt: string;
          } | null;
          usage?: {
            id: string;
            userId: string;
            rsshubId: string;
          } | undefined;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/rsshub"> | hono_types2.MergeSchemaPath<{
  "/avatar": {
    $post: {
      input: {};
      output: {
        code: 0;
        url: string;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/upload"> | hono_types2.MergeSchemaPath<{
  "/feeds": {
    $get: {
      input: {
        query: {
          view?: number | undefined;
          language?: "eng" | "cmn" | undefined;
          limit?: number | undefined;
          range?: "1d" | "3d" | "7d" | "30d" | undefined;
        };
      };
      output: {
        code: 0;
        data: {
          view: number | null;
          feedId: string;
          feed: {
            id: string;
            type: "feed";
            url: string;
            image?: string | null | undefined;
            description?: string | null | undefined;
            title?: string | null | undefined;
            siteUrl?: string | null | undefined;
            errorMessage?: string | null | undefined;
            errorAt?: string | null | undefined;
            ownerUserId?: string | null | undefined;
            owner?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            } | null | undefined;
            tipUsers?: {
              id: string;
              name: string | null;
              emailVerified: boolean | null;
              image: string | null;
              handle: string | null;
              createdAt: string;
              updatedAt: string;
              suspended: boolean | null;
              deleted: boolean | null;
            }[] | null | undefined;
          };
          analytics: {
            view: number | null;
            feedId: string;
            updatesPerWeek: number | null;
            subscriptionCount: number | null;
            latestEntryPublishedAt: string | null;
          };
        }[];
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/trending"> | hono_types2.MergeSchemaPath<{
  "/g": {
    $post: {
      input: {
        json: any;
      };
      output: Response;
      outputFormat: "json";
      status: hono_utils_http_status0.StatusCode;
    };
  };
}, "/data"> | hono_types2.MergeSchemaPath<{
  "/": {
    $get: {
      input: {};
      output: {
        code: 0;
        data: {
          invitations: {
            code: string;
            user: {
              id: string;
              name: string | null;
              image: string | null;
            } | null;
            createdAt: string | null;
            usedAt: string | null;
            toUserId: string | null;
          }[];
          referralCycleDays: number;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/days": {
    $get: {
      input: {
        query: {
          code: string;
        };
      };
      output: {
        code: 0;
        data: {
          referralCycleDays: number;
        };
      };
      outputFormat: "json";
      status: 200;
    };
  };
} & {
  "/verify-receipt": {
    $post: {
      input: {
        json: {
          appReceipt: string;
        };
      };
      output: {
        code: 0;
      };
      outputFormat: "json";
      status: 200;
    };
  };
}, "/referrals">, "/">;
type AppType = typeof _routes;
//#endregion
export { ActionItem, ActionsModel, AirdropActivity, AppType, AttachmentsModel, AuthSession, AuthUser, CommonEntryFields, ConditionItem, DetailModel, EntriesModel, ExtraModel, FEATURE_NAMES, FeatureFlagInsertModel, FeatureFlagModel, FeatureName, FeedModel, InvitationDB, ListModel, MediaModel, MessagingData, MessagingType, ROLLOUT_TYPES, RolloutType, RolloutValue, SettingsModel, UrlReadsModel, UserFeatureOverrideInsertModel, UserFeatureOverrideModel, account, achievements, achievementsOpenAPISchema, actions, actionsItemOpenAPISchema, actionsOpenAPISchema, actionsRelations, activities, activitiesOpenAPISchema, activityEnum, airdrops, airdropsOpenAPISchema, applePayTransactions, attachmentsZodSchema, authPlugins, boosts, captcha, collections, collectionsOpenAPISchema, collectionsRelations, detailModelSchema, entries, entriesOpenAPISchema, entriesRelations, extraZodSchema, featureFlags, feedAnalytics, feedAnalyticsOpenAPISchema, feedAnalyticsRelations, feedPowerTokens, feedPowerTokensOpenAPISchema, feedPowerTokensRelations, feeds, feedsOpenAPISchema, feedsRelations, inboxHandleSchema, inboxes, inboxesEntries, inboxesEntriesInsertOpenAPISchema, inboxesEntriesModel, inboxesEntriesOpenAPISchema, inboxesEntriesRelations, inboxesOpenAPISchema, inboxesRelations, invitations, invitationsOpenAPISchema, invitationsRelations, languageSchema, levels, levelsOpenAPISchema, levelsRelations, listAnalytics, listAnalyticsOpenAPISchema, listAnalyticsRelations, lists, listsOpenAPISchema, listsRelations, listsSubscriptions, listsSubscriptionsOpenAPISchema, listsSubscriptionsRelations, lower, mediaZodSchema, messaging, messagingOpenAPISchema, messagingRelations, readabilities, rsshub, rsshubAnalytics, rsshubAnalyticsOpenAPISchema, rsshubOpenAPISchema, rsshubPurchase, rsshubUsage, rsshubUsageOpenAPISchema, rsshubUsageRelations, session, settings, stripeSubscriptions, subscriptions, subscriptionsOpenAPISchema, subscriptionsRelations, timeline, timelineOpenAPISchema, timelineRelations, tools, transactionType, transactions, transactionsOpenAPISchema, transactionsRelations, trendingFeeds, trendingFeedsOpenAPISchema, trendingFeedsRelations, twoFactor, uploads, urlReads, urlReadsOpenAPISchema, user$1 as user, userFeatureOverrides, users, usersOpenApiSchema, usersRelations, verification, wallets, walletsOpenAPISchema, walletsRelations };