ALTER TABLE `attachments` ADD `user_id` integer;
--> statement-breakpoint
-- 回填历史数据:已挂在某篇笔记上的附件,归属跟随笔记作者;
-- 没挂笔记的(站点背景图/头像/早期散件)留空,按站长所有处理
UPDATE `attachments`
SET `user_id` = (
  SELECT `notes`.`user_id` FROM `notes` WHERE `notes`.`id` = `attachments`.`note_id`
)
WHERE `note_id` IS NOT NULL;
