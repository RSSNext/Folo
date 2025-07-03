PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_translations` (
	`entry_id` text PRIMARY KEY NOT NULL,
	`language` text NOT NULL,
	`title` text,
	`description` text,
	`content` text,
	`readability_content` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_translations`("entry_id", "language", "title", "description", "content", "readability_content", "created_at") SELECT "entry_id", "language", "title", "description", "content", "readability_content", "created_at" FROM `translations`;--> statement-breakpoint
DROP TABLE `translations`;--> statement-breakpoint
ALTER TABLE `__new_translations` RENAME TO `translations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `translation-unique-index` ON `translations` (`entry_id`,`language`);