ALTER TABLE `ai_chat` RENAME TO `ai_chat_sessions`;--> statement-breakpoint
ALTER TABLE `ai_chat_sessions` ADD `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ai_chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`role` text NOT NULL,
	`content_format` text DEFAULT 'plaintext' NOT NULL,
	`content` text NOT NULL,
	`rich_text_schema` text,
	`created_at` integer,
	`annotations` text,
	`status` text DEFAULT 'completed',
	`finished_at` integer,
	`message_parts` text,
	FOREIGN KEY (`room_id`) REFERENCES `ai_chat_sessions`(`room_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_ai_chat_messages`("id", "room_id", "role", "content_format", "content", "rich_text_schema", "created_at", "annotations", "status", "finished_at", "message_parts") SELECT "id", "room_id", "role", "content_format", "content", "rich_text_schema", "created_at", "annotations", "status", "finished_at", "message_parts" FROM `ai_chat_messages`;--> statement-breakpoint
DROP TABLE `ai_chat_messages`;--> statement-breakpoint
ALTER TABLE `__new_ai_chat_messages` RENAME TO `ai_chat_messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `ai_chat_messages_room_idx` ON `ai_chat_messages` (`room_id`,`created_at`);