CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`slot_id` text NOT NULL,
	`student_id` text NOT NULL,
	`start` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`topic` text NOT NULL,
	`room` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`slot_id`) REFERENCES `slots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_active_booking_per_slot` ON `bookings` (`slot_id`) WHERE "bookings"."status" IN ('pending','accepted','completed');--> statement-breakpoint
CREATE UNIQUE INDEX `student_active_hour` ON `bookings` (`student_id`,`start`) WHERE "bookings"."status" IN ('pending','accepted','completed');--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`message` text NOT NULL,
	`read` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`subject` text DEFAULT '' NOT NULL,
	`level` text DEFAULT 'Universitario' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`score` integer NOT NULL,
	`comment` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_review_per_booking` ON `reviews` (`booking_id`);--> statement-breakpoint
CREATE TABLE `slots` (
	`id` text PRIMARY KEY NOT NULL,
	`tutor_id` text NOT NULL,
	`start` text NOT NULL,
	`mode` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`tutor_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tutor_hour` ON `slots` (`tutor_id`,`start`);