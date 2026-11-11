-- Permite desativar funcionários em vez de apagá-los,
-- mantendo produtos e movimentações no histórico.
-- Rode UMA vez no banco do Docelar.

ALTER TABLE funcionario
  ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1;
