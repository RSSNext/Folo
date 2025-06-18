PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_inboxes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`secret` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_inboxes`("id", "title", "secret") SELECT "id", "title", "secret" FROM `inboxes`;--> statement-breakpoint
DROP TABLE `inboxes`;--> statement-breakpoint
ALTER TABLE `__new_inboxes` RENAME TO `inboxes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;