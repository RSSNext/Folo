PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_translations` (
	`entry_id` text NOT NULL,
	`language` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_translations`("entry_id", "language", "title", "description", "content", "created_at") SELECT "entry_id", "language", "title", "description", "content", "created_at" FROM `translations`;--> statement-breakpoint
DROP TABLE `translations`;--> statement-breakpoint
ALTER TABLE `__new_translations` RENAME TO `translations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
