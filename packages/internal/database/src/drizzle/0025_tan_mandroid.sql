PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`handle` text,
	`name` text,
	`image` text,
	`is_me` integer,
	`email_verified` integer
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "handle", "name", "image", "is_me", "email_verified") SELECT "id", "email", "handle", "name", "image", "is_me", "email_verified" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `feeds` ADD `tip_users` text;