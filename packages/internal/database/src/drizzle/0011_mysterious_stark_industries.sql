CREATE TABLE `images` (
	`url` text PRIMARY KEY NOT NULL,
	`colors` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP)
);
