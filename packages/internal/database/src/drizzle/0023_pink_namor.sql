ALTER TABLE `feeds` ADD `subscription_count` integer;--> statement-breakpoint
ALTER TABLE `feeds` ADD `updates_per_week` integer;--> statement-breakpoint
ALTER TABLE `feeds` ADD `latest_entry_published_at` text;