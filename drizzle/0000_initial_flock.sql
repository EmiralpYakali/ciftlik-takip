CREATE TABLE `sheep` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tag_number` text NOT NULL,
	`age` integer NOT NULL,
	`weight` integer NOT NULL,
	`breed` text NOT NULL,
	`gender` text DEFAULT 'Dişi' NOT NULL,
	`status` text DEFAULT 'Sağlıklı' NOT NULL,
	`medications` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sheep_tag_number` ON `sheep` (`tag_number`);

