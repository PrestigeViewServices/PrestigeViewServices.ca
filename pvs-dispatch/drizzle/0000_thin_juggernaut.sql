CREATE TABLE `activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`detail` text,
	`actor` text DEFAULT 'owner' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE TABLE `availability` (
	`id` text PRIMARY KEY NOT NULL,
	`worker_id` text NOT NULL,
	`weekday` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `certifications` (
	`id` text PRIMARY KEY NOT NULL,
	`worker_id` text NOT NULL,
	`division` text NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`issued_date` text,
	`expiry_date` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `crew_members` (
	`id` text PRIMARY KEY NOT NULL,
	`crew_id` text NOT NULL,
	`worker_id` text NOT NULL,
	`is_lead` integer DEFAULT false NOT NULL,
	`effective_from` text,
	`effective_to` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`crew_id`) REFERENCES `crews`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `crews` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`division` text NOT NULL,
	`color_hex` text DEFAULT '#3b82f6' NOT NULL,
	`default_vehicle_id` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`billing_address` text,
	`customer_type` text DEFAULT 'residential' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`jobber_client_id` text,
	`lifetime_value` real DEFAULT 0 NOT NULL,
	`notes` text,
	`do_not_service` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE TABLE `day_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`crew_id` text NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`generated_by` text DEFAULT 'human' NOT NULL,
	`ai_rationale` text,
	`planned_revenue` real DEFAULT 0 NOT NULL,
	`planned_crew_hours` real DEFAULT 0 NOT NULL,
	`approved_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`crew_id`) REFERENCES `crews`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `equipment` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`serial` text,
	`status` text DEFAULT 'active' NOT NULL,
	`assigned_vehicle_id` text,
	`last_service_date` text,
	`next_service_due` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE TABLE `equipment_checkouts` (
	`id` text PRIMARY KEY NOT NULL,
	`equipment_id` text NOT NULL,
	`job_id` text NOT NULL,
	`checked_out_at` integer NOT NULL,
	`returned_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `job_checklist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`label` text NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`completed_by_worker_id` text,
	`completed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `job_line_items` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`service_catalog_id` text,
	`description` text NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit` text,
	`price` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_catalog_id`) REFERENCES `service_catalog`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `job_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`worker_id` text,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `job_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`type` text NOT NULL,
	`file_path` text NOT NULL,
	`caption` text,
	`taken_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`property_id` text NOT NULL,
	`division` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'Unscheduled' NOT NULL,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`scheduled_date` text,
	`scheduled_start_at` integer,
	`estimated_duration_minutes` integer DEFAULT 60 NOT NULL,
	`assigned_crew_id` text,
	`sequence_order` integer,
	`quoted_amount` real DEFAULT 0 NOT NULL,
	`estimated_crew_hours` real DEFAULT 0 NOT NULL,
	`recurrence_rule` text,
	`parent_recurring_job_id` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`jobber_job_id` text,
	`weather_dependent` integer DEFAULT false NOT NULL,
	`description` text,
	`internal_notes` text,
	`customer_facing_notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_crew_id`) REFERENCES `crews`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`address` text NOT NULL,
	`lat` real,
	`lng` real,
	`lot_size_sqft` integer,
	`gate_code` text,
	`pet_on_site` integer DEFAULT false NOT NULL,
	`parking_notes` text,
	`access_notes` text,
	`hazards` text,
	`property_photos` text DEFAULT '[]' NOT NULL,
	`route_zone` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`division` text NOT NULL,
	`description` text,
	`default_duration_minutes` integer DEFAULT 60 NOT NULL,
	`unit` text DEFAULT 'per visit' NOT NULL,
	`default_price` real DEFAULT 0 NOT NULL,
	`crew_size_required` integer DEFAULT 2 NOT NULL,
	`required_certification_level` integer DEFAULT 1 NOT NULL,
	`required_equipment` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`company_name` text DEFAULT 'Prestige View Services' NOT NULL,
	`company_phone` text,
	`company_email` text,
	`logo_path` text,
	`monthly_overhead` real DEFAULT 13088 NOT NULL,
	`target_revenue_per_crew_hour` real DEFAULT 145 NOT NULL,
	`working_days_per_month` integer DEFAULT 22 NOT NULL,
	`max_crew_hours_per_day` real DEFAULT 10 NOT NULL,
	`division_colors` text DEFAULT '{}' NOT NULL,
	`route_zones` text DEFAULT '[]' NOT NULL,
	`anthropic_api_key_encrypted` text,
	`travel_provider` text DEFAULT 'haversine' NOT NULL,
	`travel_api_key_encrypted` text,
	`cloud_share_enabled` integer DEFAULT false NOT NULL,
	`cloud_share_credentials_encrypted` text,
	`backup_folder` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE TABLE `snow_contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`property_id` text NOT NULL,
	`tier` text DEFAULT 'Residential Standard' NOT NULL,
	`season_price` real DEFAULT 0 NOT NULL,
	`trigger_cm` real DEFAULT 3 NOT NULL,
	`sla_hours` real DEFAULT 12 NOT NULL,
	`included_services` text DEFAULT '[]' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `storm_events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`start_at` integer NOT NULL,
	`classification` text DEFAULT 'Standard' NOT NULL,
	`snowfall_cm` real DEFAULT 0 NOT NULL,
	`trigger_threshold_cm` real DEFAULT 3 NOT NULL,
	`sla_hours_by_tier` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'Forecast' NOT NULL,
	`dispatch_notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE TABLE `storm_service_records` (
	`id` text PRIMARY KEY NOT NULL,
	`storm_event_id` text NOT NULL,
	`snow_contract_id` text NOT NULL,
	`crew_id` text,
	`completed_at` integer,
	`photo_path` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`storm_event_id`) REFERENCES `storm_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`snow_contract_id`) REFERENCES `snow_contracts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `time_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`worker_id` text NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `time_off` (
	`id` text PRIMARY KEY NOT NULL,
	`worker_id` text NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`type` text DEFAULT 'unavailable' NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer,
	FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`plate` text,
	`type` text,
	`capacity_notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`assigned_crew_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE TABLE `workers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`photo_path` text,
	`role` text DEFAULT 'Technician' NOT NULL,
	`division_affinities` text DEFAULT '[]' NOT NULL,
	`hourly_cost` real DEFAULT 0 NOT NULL,
	`employment_type` text DEFAULT 'Full-Time' NOT NULL,
	`hire_date` text,
	`status` text DEFAULT 'Active' NOT NULL,
	`emergency_contact` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
	`archived_at` integer
);
