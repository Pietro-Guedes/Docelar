-- ============================================================
-- DOCELAR — cria todas as tabelas do sistema
-- Rode no MySQL Workbench: abra este arquivo e clique no raio ⚡
-- (seguro rodar mais de uma vez: só cria o que ainda não existe)
-- ============================================================
 
CREATE DATABASE IF NOT EXISTS db_docelar;
USE db_docelar;
 
CREATE TABLE IF NOT EXISTS funcionario (
  id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL
);
 
CREATE TABLE IF NOT EXISTS categoria (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nome_categoria VARCHAR(60) NOT NULL UNIQUE
);
 
CREATE TABLE IF NOT EXISTS fornecedor (
  id_fornecedor INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  cnpj VARCHAR(20) NOT NULL UNIQUE,
  telefone VARCHAR(20),
  email VARCHAR(120)
);
 
CREATE TABLE IF NOT EXISTS produto (
  id_produto INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  estoque_minimo INT NOT NULL DEFAULT 10,
  id_categoria INT NULL,
  id_fornecedor INT NULL,
  id_funcionario INT NOT NULL,
  FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria),
  FOREIGN KEY (id_fornecedor) REFERENCES fornecedor(id_fornecedor),
  FOREIGN KEY (id_funcionario) REFERENCES funcionario(id_funcionario)
);
 
CREATE TABLE IF NOT EXISTS estoque (
  id_estoque INT AUTO_INCREMENT PRIMARY KEY,
  quantidade INT NOT NULL,
  validade DATE NULL,
  data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
  id_produto INT NOT NULL,
  id_fornecedor INT NULL,
  FOREIGN KEY (id_produto) REFERENCES produto(id_produto) ON DELETE CASCADE,
  FOREIGN KEY (id_fornecedor) REFERENCES fornecedor(id_fornecedor)
);
 
CREATE TABLE IF NOT EXISTS movimentacao_estoque (
  id_movimentacao INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('ENTRADA','SAIDA','DEVOLUCAO') NOT NULL,
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(10,2) NULL,
  motivo_devolucao VARCHAR(255) NULL,
  observacao TEXT NULL,
  data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  id_estoque INT NOT NULL,
  id_funcionario INT NOT NULL,
  FOREIGN KEY (id_estoque) REFERENCES estoque(id_estoque) ON DELETE CASCADE,
  FOREIGN KEY (id_funcionario) REFERENCES funcionario(id_funcionario)
);
 
CREATE TABLE IF NOT EXISTS imagem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  link VARCHAR(255) NOT NULL,
  id_produto INT NOT NULL,
  FOREIGN KEY (id_produto) REFERENCES produto(id_produto) ON DELETE CASCADE
);
 
-- Categorias do Figma
INSERT IGNORE INTO categoria (nome_categoria) VALUES
('Derivados do Leite'), ('Frios'), ('Salgados'), ('Doces'),
('Bebidas'), ('Recheios'), ('Embalagens');