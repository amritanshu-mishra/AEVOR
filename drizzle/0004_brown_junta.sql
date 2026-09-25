ALTER TABLE "missions" ADD COLUMN "milestone_id" uuid;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "missions_milestone_idx" ON "missions" USING btree ("milestone_id");