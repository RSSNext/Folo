CREATE TABLE `feeds` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`url` text NOT NULL,
	`description` text,
	`image` text,
	`error_at` text,
	`site_url` text,
	`owner_user_id` text,
	`error_message` text
);
--> statement-breakpoint
CREATE TABLE `inboxes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text
);
--> statement-breakpoint
CREATE TABLE `lists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`feed_ids` text,
	`description` text,
	`view` integer NOT NULL,
	`image` text,
	`fee` integer,
	`owner_user_id` text
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`feed_id` text,
	`list_id` text,
	`inbox_id` text,
	`user_id` text NOT NULL,
	`view` integer NOT NULL,
	`is_private` integer NOT NULL,
	`title` text,
	`category` text,
	`created_at` text,
	`type` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL
);
