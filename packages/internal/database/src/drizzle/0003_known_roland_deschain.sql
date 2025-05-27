PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_unread` (
	`subscription_id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_unread`("subscription_id", "count") SELECT "subscription_id", "count" FROM `unread`;--> statement-breakpoint
DROP TABLE `unread`;--> statement-breakpoint
ALTER TABLE `__new_unread` RENAME TO `unread`;--> statement-breakpoint
PRAGMA foreign_keys=ON;