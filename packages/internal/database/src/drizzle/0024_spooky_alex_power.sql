PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`title` text NOT NULL,
	`feed_ids` text,
	`description` text,
	`view` integer NOT NULL,
	`image` text,
	`fee` integer,
	`owner_user_id` text,
	`subscription_count` integer,
	`purchase_amount` text
);
--> statement-breakpoint
INSERT INTO `__new_lists`("id", "user_id", "title", "feed_ids", "description", "view", "image", "fee", "owner_user_id", "subscription_count", "purchase_amount") SELECT "id", "user_id", "title", "feed_ids", "description", "view", "image", "fee", "owner_user_id", "subscription_count", "purchase_amount" FROM `lists`;--> statement-breakpoint
DROP TABLE `lists`;--> statement-breakpoint
ALTER TABLE `__new_lists` RENAME TO `lists`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
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
ALTER TABLE `feeds` ADD `tip_users` text;--> statement-breakpoint
ALTER TABLE `feeds` ADD `published_at` integer;--> statement-breakpoint
ALTER TABLE `inboxes` ADD `secret` text DEFAULT '' NOT NULL;