CREATE TABLE `unread` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`count` integer NOT NULL
);
