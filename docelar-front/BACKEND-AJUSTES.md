# Ajustes no back-end

**Já foram feitos.** A versão corrigida do back-end tem um arquivo `CORRECOES.md` que lista tudo o que mudou.

Resumo do que o front precisa do back:

- O servidor rodando em `http://localhost:3000` (ou o endereço em `VITE_API_URL` no `.env` do front).
- `GET /estoque` listando **todos** os lotes (corrigido).
- `JWT_SECRET` no `.env` do back, para o login funcionar (corrigido).
- Opcional: a coluna `estoque_minimo` na tabela `produto` (arquivo `banco/estoque_minimo.sql` do back). Sem ela, o mínimo de todos os produtos é 10.
