import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/* ─────────────────────────────────────────────
   ENUMS
───────────────────────────────────────────── */

export const goalStatus = pgEnum("goal_status", [
  "active",
  "completed",
  "paused",
  "archived",
]);

export const milestoneStatus = pgEnum("milestone_status", [
  "active",
  "completed",
  "paused",
  "archived",
]);

export const missionStatus = pgEnum("mission_status", [
  "planned",
  "completed",
  "cancelled",
]);

export const focusStatus = pgEnum("focus_status", [
  "active",
  "completed",
  "cancelled",
]);

/* ─────────────────────────────────────────────
   USERS
───────────────────────────────────────────── */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  firebaseUid: text("firebase_uid")
    .notNull()
    .unique(),

  email: text("email")
    .notNull()
    .unique(),

  displayName: text("display_name"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

/* ─────────────────────────────────────────────
   GOALS
───────────────────────────────────────────── */

export const goals = pgTable(
  "goals",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    title: text("title").notNull(),

    description: text("description"),

    status: goalStatus("status")
      .default("active")
      .notNull(),

    targetDate: timestamp("target_date", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("goals_user_status_idx").on(
      table.userId,
      table.status,
    ),

    index("goals_user_target_date_idx").on(
      table.userId,
      table.targetDate,
    ),
  ],
);

/* ─────────────────────────────────────────────
   MILESTONES
───────────────────────────────────────────── */

export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id),

    title: text("title").notNull(),

    description: text("description"),

    status: milestoneStatus("status")
      .default("active")
      .notNull(),

    targetDate: timestamp("target_date", {
      withTimezone: true,
    }),

    position: integer("position")
      .default(0)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("milestones_goal_status_idx").on(
      table.goalId,
      table.status,
    ),

    index("milestones_goal_position_idx").on(
      table.goalId,
      table.position,
    ),
  ],
);

export const projectStatus = pgEnum("project_status", [
  "active",
  "completed",
  "paused",
  "archived",
]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    milestoneId: uuid("milestone_id")
      .notNull()
      .references(() => milestones.id),

    title: text("title").notNull(),

    description: text("description"),

    status: projectStatus("status")
      .default("active")
      .notNull(),

    targetDate: timestamp("target_date", {
      withTimezone: true,
    }),

    position: integer("position")
      .default(0)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("projects_milestone_status_idx").on(
      table.milestoneId,
      table.status,
    ),

    index("projects_milestone_position_idx").on(
      table.milestoneId,
      table.position,
    ),
  ],
);

/* ─────────────────────────────────────────────
   MISSIONS
───────────────────────────────────────────── */

export const missions = pgTable(
  "missions",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    milestoneId: uuid("milestone_id")
      .references(() => milestones.id),
      
    projectId: uuid("project_id")
      .references(() => projects.id),

    title: text("title").notNull(),

    description: text("description"),

    dueAt: timestamp("due_at", {
      withTimezone: true,
    }),

    status: missionStatus("status")
      .default("planned")
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("missions_user_status_idx").on(
      table.userId,
      table.status,
    ),

    index("missions_user_due_idx").on(
      table.userId,
      table.dueAt,
    ),

    index("missions_milestone_idx").on(
      table.milestoneId,
    ),
    index("missions_project_idx").on(
      table.projectId),
  ],
);

/* ─────────────────────────────────────────────
   FOCUS SESSIONS
───────────────────────────────────────────── */

export const focusSessions = pgTable(
  "focus_sessions",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    missionId: uuid("mission_id")
      .references(() => missions.id),

    subject: text("subject").notNull(),

    startedAt: timestamp("started_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    endedAt: timestamp("ended_at", {
      withTimezone: true,
    }),

    durationSeconds: integer("duration_seconds")
      .default(0)
      .notNull(),

    status: focusStatus("status")
      .default("active")
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
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