PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_summaries` (
	`entry_id` text PRIMARY KEY NOT NULL,
	`summary` text NOT NULL,
	`created_at` text,
	`language` text
);
--> statement-breakpoint
INSERT INTO `__new_summaries`("entry_id", "summary", "created_at", "language") SELECT "entry_id", "summary", "created_at", "language" FROM `summaries`;--> statement-breakpoint
DROP TABLE `summaries`;--> statement-breakpoint
ALTER TABLE `__new_summaries` RENAME TO `summaries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `unq` ON `summaries` (`entry_id`,`language`);