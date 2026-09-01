ALTER TABLE `sheep` ADD `business_tag_number` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `sheep` ADD `birth_date` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `sheep` ADD `mother_tag_number` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `sheep` ADD `activity_status` text DEFAULT 'Aktif' NOT NULL;
--> statement-breakpoint
ALTER TABLE `sheep` ADD `passive_reason` text DEFAULT '' NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sheep_business_tag_number` ON `sheep` (`business_tag_number`) WHERE `business_tag_number` <> '';
--> statement-breakpoint
CREATE INDEX `idx_sheep_mother_tag_number` ON `sheep` (`mother_tag_number`);
--> statement-breakpoint
CREATE TABLE `treatments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sheep_id` integer NOT NULL,
	`description` text NOT NULL,
	`treatment_date` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`sheep_id`) REFERENCES `sheep`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_treatments_sheep_date` ON `treatments` (`sheep_id`,`treatment_date`);

