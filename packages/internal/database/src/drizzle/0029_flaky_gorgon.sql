CREATE TABLE `ai_chat_messages` (
	`room_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`message` blob,
	FOREIGN KEY (`room_id`) REFERENCES `ai_chat`(`room_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_chat_messages_unq` ON `ai_chat_messages` (`room_id`,`id`);--> statement-breakpoint
CREATE TABLE `ai_chat` (
	`room_id` text PRIMARY KEY NOT NULL,
	`title` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
