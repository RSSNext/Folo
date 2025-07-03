CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`handle` text,
	`name` text,
	`image` text,
	`is_me` integer NOT NULL
);
