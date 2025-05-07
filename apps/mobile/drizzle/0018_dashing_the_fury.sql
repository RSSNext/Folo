CREATE TABLE `translations` (
	`entry_id` text PRIMARY KEY NOT NULL,
	`language` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `translation-unique-index` ON `translations` (`entry_id`,`language`);