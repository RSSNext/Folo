PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ai_chat_messages` (
	`room_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`message` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `ai_chat`(`room_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_ai_chat_messages`("room_id", "id", "created_at", "message") SELECT "room_id", "id", "created_at", "message" FROM `ai_chat_messages`;--> statement-breakpoint
DROP TABLE `ai_chat_messages`;--> statement-breakpoint
ALTER TABLE `__new_ai_chat_messages` RENAME TO `ai_chat_messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `ai_chat_messages_unq` ON `ai_chat_messages` (`room_id`,`id`);