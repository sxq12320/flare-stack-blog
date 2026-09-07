CREATE TABLE `albums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`location` text,
	`status` text DEFAULT 'published' NOT NULL,
	`published_at` integer,
	`pinned_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `albums_published_at_idx` ON `albums` (`published_at`,`status`);--> statement-breakpoint
CREATE INDEX `albums_created_at_idx` ON `albums` (`created_at`);--> statement-breakpoint
CREATE TABLE `album_media` (
	`album_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`album_id`, `media_id`),
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `album_media_album_idx` ON `album_media` (`album_id`);--> statement-breakpoint
CREATE INDEX `album_media_media_idx` ON `album_media` (`media_id`);
