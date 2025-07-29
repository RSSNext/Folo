PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_images` (
	`url` text PRIMARY KEY NOT NULL,
	`colors` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_images`("url", "colors", "created_at") SELECT "url", "colors", "created_at" FROM `images`;--> statement-breakpoint
DROP TABLE `images`;--> statement-breakpoint
ALTER TABLE `__new_images` RENAME TO `images`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
