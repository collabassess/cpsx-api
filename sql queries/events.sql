CREATE EVENT `user_status_offline`
ON SCHEDULE EVERY 1 MINUTE
ON COMPLETION NOT PRESERVE
ENABLE
COMMENT 'clear online pool of users who have '
DO
UPDATE user_status SET status='offline' WHERE status='online' AND last_online <= Now() - INTERVAL 5 Minute;

CREATE EVENT `user_session_invalid`
ON SCHEDULE EVERY 1 HOUR
ON COMPLETION NOT PRESERVE
ENABLE
COMMENT 'clear session of paired users who have spent more than 3 hours'
DO
UPDATE user_groups SET status="invalid" WHERE status='valid' AND created_at <= Now() - INTERVAL 180 Minute;


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

CREATE TABLE user_info(
  user_id int(11),
  gender varchar(30) NOT NULL,
  PRIMARY KEY (user_id));

INSERT INTO user_info values(12,'male');
INSERT INTO user_info values(13,'male');
INSERT INTO user_info values(15,'male');
INSERT INTO user_info values(16,'female');
INSERT INTO user_info values(17,'male');
INSERT INTO user_info values(18,'female');
INSERT INTO user_info values(19,'male');
INSERT INTO user_info values(20,'female');


CREATE VIEW get_available_partners AS
SELECT s.user_id,i.gender
FROM user_status s, user_info i
WHERE s.user_id = i.user_id AND s.status = 'online' AND s.grouped=False;