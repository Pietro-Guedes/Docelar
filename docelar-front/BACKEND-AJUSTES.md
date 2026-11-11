# Ajustes no back-end

**Já foram feitos.** A versão corrigida do back-end tem um arquivo `CORRECOES.md` que lista tudo o que mudou.

Resumo do que o front precisa do back:

- O servidor rodando em `http://localhost:3000` (ou o endereço em `VITE_API_URL` no `.env` do front).
- `GET /estoque` listando **todos** os lotes (corrigido).
- `JWT_SECRET` no `.env` do back, para o login funcionar (corrigido).
- Opcional: a coluna `estoque_minimo` na tabela `produto` (arquivo `banco/estoque_minimo.sql` do back). Sem ela, o mínimo de todos os produtos é 10.
- Necessária para desativar produtos: rode uma vez `banco/produto_ativo.sql` no MySQL do back-end. A coluna começa como ativa para preservar o comportamento dos produtos existentes.
- A tela de troca usa `POST /movimentacaoestoque/troca` para registrar devolução e saída na mesma transação. Produtos vencidos usam `POST /movimentacaoestoque/saida-lote-vencido`; estornos são feitos por `POST /movimentacaoestoque/:id/estorno`.
- A troca, as baixas e as devoluções ao fornecedor podem ser desfeitas pelo histórico, desde que ainda haja saldo no lote para reverter com segurança.
