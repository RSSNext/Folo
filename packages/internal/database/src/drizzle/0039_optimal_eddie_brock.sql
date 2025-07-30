CREATE INDEX `idx_ai_chat_messages_chat_id_created_at` ON `ai_chat_messages` (`chat_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_ai_chat_messages_status` ON `ai_chat_messages` (`status`);--> statement-breakpoint
CREATE INDEX `idx_ai_chat_messages_chat_id_role` ON `ai_chat_messages` (`chat_id`,`role`);--> statement-breakpoint
CREATE INDEX `idx_ai_chat_sessions_updated_at` ON `ai_chat_sessions` (`updated_at`);