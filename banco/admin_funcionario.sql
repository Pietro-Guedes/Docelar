

ALTER TABLE funcionario
  ADD COLUMN admin TINYINT(1) NOT NULL DEFAULT 0;


UPDATE funcionario
   SET admin = 1
 WHERE id_funcionario = (SELECT id FROM (SELECT MIN(id_funcionario) AS id FROM funcionario) t);
