CREATE INDEX "chat_ownerId_idx" ON "chat" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "chat_message_chatId_idx" ON "chat_message" USING btree ("chat_id");