CREATE EVENT `user_status_offline`
ON SCHEDULE EVERY 1 MINUTE
ON COMPLETION NOT PRESERVE
ENABLE
COMMENT 'clear online pool of users who have '
DO
UPDATE user_status SET status='offline' WHERE status='online' AND last_online <= Now() - INTERVAL 5 Minute;


CREATE EVENT `user_status_insert`
ON SCHEDULE EVERY 1 MINUTE
DO
insert into collab_assess.user_status(user_id,status,grouped) values(3,'online',false);


CREATE TABLE user_status(
`user_id` int(11) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'offline',
  `last_online` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `grouped` BOOL
);