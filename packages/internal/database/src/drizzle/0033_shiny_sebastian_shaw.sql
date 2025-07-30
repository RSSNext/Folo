ALTER TABLE `ai_chat` RENAME TO `ai_chat_sessions`;--> statement-breakpoint
ALTER TABLE `ai_chat_sessions` RENAME COLUMN "room_id" TO "id";--> statement-breakpoint
ALTER TABLE `ai_chat_sessions` ADD `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_ai_chat_sessions_updated_at` ON `ai_chat_sessions` (`updated_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ai_chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`role` text NOT NULL,
	`rich_text_schema` text,
	`created_at` integer,
	`metadata` text,
	`status` text DEFAULT 'completed',
	`finished_at` integer,
	`message_parts` text,
	FOREIGN KEY (`chat_id`) REFERENCES `ai_chat_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_ai_chat_messages`("id", "chat_id", "role", "rich_text_schema", "created_at", "metadata", "status", "finished_at", "message_parts") SELECT "id", "chat_id", "role", "rich_text_schema", "created_at", "metadata", "status", "finished_at", "message_parts" FROM `ai_chat_messages`;--> statement-breakpoint
DROP TABLE `ai_chat_messages`;--> statement-breakpoint
ALTER TABLE `__new_ai_chat_messages` RENAME TO `ai_chat_messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_ai_chat_messages_chat_id_created_at` ON `ai_chat_messages` (`chat_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_ai_chat_messages_status` ON `ai_chat_messages` (`status`);--> statement-breakpoint
CREATE INDEX `idx_ai_chat_messages_chat_id_role` ON `ai_chat_messages` (`chat_id`,`role`);