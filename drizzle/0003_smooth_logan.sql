CREATE TABLE `post_views` (
	`slug` text PRIMARY KEY NOT NULL,
	`views` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `notes` ADD `cover` text;