CREATE TABLE `mode_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`modeId` varchar(32) NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	`durationMs` bigint,
	`wasShared` boolean NOT NULL DEFAULT false,
	CONSTRAINT `mode_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moment_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`momentId` varchar(64) NOT NULL,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`price` int NOT NULL,
	CONSTRAINT `moment_purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `owner_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(64) NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text,
	`userId` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `owner_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `presence_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(32) NOT NULL,
	`modeId` varchar(32) NOT NULL,
	`hostUserId` int NOT NULL,
	`guestUserId` int,
	`status` enum('waiting','active','ended') NOT NULL DEFAULT 'waiting',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	CONSTRAINT `presence_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `presence_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`status` enum('active','cancelled','expired') NOT NULL DEFAULT 'active',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
