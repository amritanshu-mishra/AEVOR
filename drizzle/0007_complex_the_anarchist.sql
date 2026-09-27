CREATE TYPE "public"."proof_type" AS ENUM('note', 'url');--> statement-breakpoint
CREATE TABLE "proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mission_id" uuid NOT NULL,
	"focus_session_id" uuid,
	"type" "proof_type" NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_focus_session_id_focus_sessions_id_fk" FOREIGN KEY ("focus_session_id") REFERENCES "public"."focus_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "proofs_user_mission_idx" ON "proofs" USING btree ("user_id","mission_id");--> statement-breakpoint
CREATE INDEX "proofs_user_created_idx" ON "proofs" USING btree ("user_id","created_at");