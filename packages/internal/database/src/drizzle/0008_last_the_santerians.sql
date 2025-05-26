CREATE TABLE `collections` (
	`feed_id` text,
	`entry_id` text PRIMARY KEY NOT NULL,
	`created_at` text,
	`view` integer NOT NULL
);
