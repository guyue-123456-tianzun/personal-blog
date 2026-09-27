CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_slug` text NOT NULL,
	`author` text NOT NULL,
	`content` text NOT NULL,
	`is_visible` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_views` (
	`date` text PRIMARY KEY NOT NULL,
	`views` integer DEFAULT 0 NOT NULL
);
