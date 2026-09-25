ALTER TABLE "missions" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "missions_project_idx" ON "missions" USING btree ("project_id");