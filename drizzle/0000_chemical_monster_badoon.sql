CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`runner_token` text,
	`corp_token` text,
	`runner_name` text,
	`corp_name` text,
	`state` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`last_request` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
