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
	FOREIGN KEY (`chat_id`) REFERENCES `ai_chat_sessions`(`room_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_ai_chat_messages`("id", "chat_id", "role", "rich_text_schema", "created_at", "metadata", "status", "finished_at", "message_parts") SELECT "id", "chat_id", "role", "rich_text_schema", "created_at", "metadata", "status", "finished_at", "message_parts" FROM `ai_chat_messages`;--> statement-breakpoint
DROP TABLE `ai_chat_messages`;--> statement-breakpoint
ALTER TABLE `__new_ai_chat_messages` RENAME TO `ai_chat_messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;