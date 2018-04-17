CREATE EVENT `user_status_offline`
ON SCHEDULE EVERY 1 MINUTE
ON COMPLETION NOT PRESERVE
ENABLE
COMMENT 'clear online pool of users who have been inactive for more than 5 minutes'
DO
UPDATE user_status SET status='offline' WHERE status='online' AND last_online <= Now() - INTERVAL 5 Minute;

CREATE EVENT `user_session_invalid`
ON SCHEDULE EVERY 1 HOUR
ON COMPLETION NOT PRESERVE
ENABLE
COMMENT 'clear session of paired users who have spent more than 3 hours'
DO
UPDATE user_groups SET status="invalid" WHERE status='valid' AND created_at <= Now() - INTERVAL 180 Minute;


//trigger
DROP TRIGGER after_user_status_update;
DELIMITER $$
CREATE
    TRIGGER `after_user_status_update` AFTER UPDATE
    ON `user_status`
    FOR EACH ROW BEGIN
        IF NEW.status="offline"
            THEN UPDATE user_groups SET status='invalid' WHERE (user1=New.user_id or user2=New.user_id) AND status="valid";
        END IF;
END$$
DELIMITER ;

//trigger for gender table used in install script
DROP TRIGGER edxapp.new_user_add_gender;
DELIMITER $$
CREATE
    TRIGGER `new_user_add_gender` AFTER INSERT
    ON `auth_user`
    FOR EACH ROW BEGIN
        INSERT INTO collab_assess.user_info values(New.id, ( case when round(rand()) = 1 Then 'male' else 'female' end));
END$$
DELIMITER ;
CREATE TRIGGER new_user_add_gender AFTER INSERT ON auth_user FOR EACH ROW BEGIN INSERT INTO collab_assess.user_info values(New.id, ( case when round(rand()) = 1 Then 'male' else 'female' end));

//script execute
mysql -u root -pedx -Bse "insert into collab_assess.user_info select id, ( case when round(rand()) = 1 Then 'male' else 'female' end) from edxapp.auth_user;"

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

alter table user_info change gender demo_shark_jet varchar(30) default NULL;
select * from user_info;

CREATE VIEW get_available_partners AS
SELECT s.user_id as user_id,i.demo_shark_jet as demo_shark_jet, a.`gender` as gender
FROM user_status s, user_info i, edxapp.auth_userprofile a
WHERE s.user_id = i.user_id
AND i.user_id = a.`id`
AND s.status = 'online'
AND s.grouped=False;


DROP TRIGGER after_gender_update;

DELIMITER $$
CREATE
    TRIGGER `after_gender_update` AFTER UPDATE
    ON `auth_userprofile`
    FOR EACH ROW BEGIN
        IF NEW.gender is not NULL
            THEN UPDATE collab_assess.`user_info` SET gender=NEW.gender WHERE `user_id`=New.user_id;
        END IF;
END$$
DELIMITER;

DROP TRIGGER after_gender_insert;

DELIMITER $$
CREATE
    TRIGGER `after_gender_insert` AFTER INSERT
    ON `auth_userprofile`
    FOR EACH ROW BEGIN
        IF NEW.gender is not NULL
            THEN UPDATE collab_assess.`user_info` SET gender=NEW.gender WHERE `user_id`=New.user_id;
        END IF;
END$$
DELIMITER;