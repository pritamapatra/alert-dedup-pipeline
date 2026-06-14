import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";

export const severityEnum = pgEnum("severity", ["critical", "high", "medium", "low"]);

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  service: text("service").notNull(),
  errorSignature: text("error_signature").notNull(),
  severity: severityEnum("severity").notNull().default("medium"),
  message: text("message").notNull(),
  rawPayload: text("raw_payload").notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isDuplicate: boolean("is_duplicate").default(false).notNull(),
  dedupeGroupId: text("dedupe_group_id"),
});

export const dedupeGroups = pgTable("dedupe_groups", {
  id: text("id").primaryKey(),
  service: text("service").notNull(),
  errorSignature: text("error_signature").notNull(),
  severity: severityEnum("severity").notNull(),
  firstSeenAt: timestamp("first_seen_at").notNull(),
  lastSeenAt: timestamp("last_seen_at").notNull(),
  count: integer("count").default(1).notNull(),
  isActionable: boolean("is_actionable").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});