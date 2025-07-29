CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`url` text,
	`content` text,
	`description` text,
	`guid` text NOT NULL,
	`author` text,
	`author_url` text,
	`author_avatar` text,
	`inserted_at` integer NOT NULL,
	`published_at` integer NOT NULL,
	`media` text,
	`categories` text,
	`attachments` text,
	`extra` text,
	`language` text
);
