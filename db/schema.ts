import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const missionStatus = pgEnum("mission_status", [
  "planned",
  "completed",
  "cancelled",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const missions = pgTable(
  "missions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    status: missionStatus("status").default("planned").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("missions_user_status_idx").on(table.userId, table.status),
    index("missions_user_due_idx").on(table.userId, table.dueAt),
  ],
);
export const focusStatus = pgEnum("focus_status", [
  "active",
  "completed",
  "cancelled",
]);

export const focusSessions = pgTable(
  "focus_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    missionId: uuid("mission_id").references(() => missions.id),
    subject: text("subject").notNull(),
    startedAt: timestamp("started_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", {
      withTimezone: true,
    }),
    durationSeconds: integer("duration_seconds").default(0).notNull(),
    status: focusStatus("status").default("active").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
  (table) => [
    index("focus_sessions_user_started_idx").on(
      table.userId,
      table.startedAt,
    ),
    index("focus_sessions_user_subject_idx").on(
      table.userId,
      table.subject,
    ),
  ],
);