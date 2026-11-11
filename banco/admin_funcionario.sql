-- Adiciona o papel de administrador aos funcionários.
-- Rode UMA vez no banco do Docelar.

ALTER TABLE funcionario
  ADD COLUMN admin TINYINT(1) NOT NULL DEFAULT 0;

-- Torna admin a conta mais antiga (normalmente a do dono do sistema).
-- Se quiser outra pessoa, troque pelo e-mail dela:
--   UPDATE funcionario SET admin = 1 WHERE email = 'seu@email.com';
UPDATE funcionario
   SET admin = 1
 WHERE id_funcionario = (SELECT id FROM (SELECT MIN(id_funcionario) AS id FROM funcionario) t);
