-- Adiciona o "Estoque mínimo" do Figma na tabela de produtos.
-- Rode uma vez no MySQL (Workbench: abra este arquivo e clique no raio ⚡).
ALTER TABLE produto ADD COLUMN estoque_minimo INT NOT NULL DEFAULT 10;
