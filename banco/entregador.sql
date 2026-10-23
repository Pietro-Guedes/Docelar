ALTER TABLE movimentacao_estoque ADD COLUMN id_entregador INT NULL;
ALTER TABLE movimentacao_estoque ADD FOREIGN KEY (id_entregador) REFERENCES funcionario(id_funcionario);
