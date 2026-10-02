# Correções feitas no back-end

Tudo o que mudou em relação à versão que estava no zip. Testei com um banco MySQL (MariaDB) de teste: cadastro e login de funcionário, fornecedor, produto, entrada, saída (inclusive com saldo insuficiente), devolução, lotes, vencidos, upload de imagem. Também testei com o front ligado.

Para ver cada linha alterada: `git diff` dentro desta pasta. Não fiz commit, isso fica com vocês.

## O que impedia o servidor de iniciar

| Arquivo | Problema | Correção |
|---|---|---|
| `src/routes/FuncionarioRoutes.js` | Conflito de merge (`<<<<<<<`) | Mantida a versão com `/login` e `POST /` públicos, e o resto protegido por token |
| `src/controllers/EstoqueController.js` | Conflito de merge | Mantidos `listarVencidos` e `listarProximosVencimento`, agora com tratamento de erro como os outros métodos |
| `src/services/MovimentacaoEstoqueService.js` | 3 conflitos de merge e `registrarEntrada` duplicada | Uma versão só, com transação. A saída baixa o saldo de cada lote (do que vence primeiro para o último) |
| `src/routes/FuncionarioRoutes.js` e `src/routes/MovimentacaoEstoqueRoutes.js` | `require('../middleware/auth')`, mas o arquivo é outro | `require('../middlewares/authMiddleware')` |
| `src/routes/index.js`, `src/routes/imagemRoutes.js`, `src/services/imagemService.js` | `require` com letra maiúscula para arquivos com minúscula (quebra no Linux/Mac) | Nomes iguais aos arquivos |
| `.env` | `DH_HOST` em vez de `DB_HOST`; faltava `JWT_SECRET` | Corrigido; `JWT_SECRET` gerado aleatoriamente |
| `src/server.js` | Testava o banco com callback, mas o `mysql2/promise` não usa callback, então nunca avisava erro de conexão | Usa `await`; se o banco não conectar, mostra uma mensagem clara e para |

## Rotas

- **`GET /estoque`** agora lista **todos** os lotes. Antes, a primeira das três rotas `GET /` respondia sempre e devolvia só os vencidos.
- Novas rotas:
  - `GET /estoque/vencidos`
  - `GET /estoque/proximos-vencimento?dias=7` (o `dias` é opcional; o padrão é 7)

## Estoque mínimo (do Figma)

- `ProdutoService` e `ProdutoRepository` aceitam o campo `estoque_minimo` (número inteiro ≥ 0) no cadastro e na edição.
- Para o banco guardar esse valor, rode **uma vez** o arquivo `banco/estoque_minimo.sql` no MySQL.
- Enquanto a coluna não existir, o produto é salvo normalmente sem ela, e o terminal mostra um aviso. Nada quebra.

## Arquivos novos

- `.env.example`: modelo do `.env` sem senha, para o grupo copiar.
- `banco/estoque_minimo.sql`: adiciona a coluna de estoque mínimo.

## ⚠️ Importante: senha do banco no GitHub

O `.env` (com a senha do banco) e a pasta `node_modules` **estão salvos no repositório do GitHub**. O `.gitignore` só impede arquivos novos, não os que já foram enviados. Para tirar do repositório sem apagar do computador:

```bash
git rm --cached .env
git rm -r --cached node_modules
git commit -m "Remove .env e node_modules do repositório"
git push
```

Se o repositório for público, **troque a senha do usuário do MySQL**. A senha antiga continua no histórico do GitHub.

## Para o grupo decidir (não mexi)

- **A devolução não devolve a quantidade ao lote**: só registra a movimentação. Se o produto devolvido volta para venda, é preciso somar no lote. Se for descartado, está certo como está.
- **Não existe rota que liste todas as movimentações**: o front busca produto por produto. Funciona, mas uma rota `GET /movimentacaoestoque` deixaria a tela principal e os relatórios mais rápidos.

## Como rodar

```bash
npm install
npm start          # ou: npm run dev (com nodemon)
```

O terminal deve mostrar:

```
Conectado ao Mysql com sucesso
Servidor rodando na porta 3000
```

## Integração com o front-end

- A pasta `docelar-frontend-main` (front antigo) foi removida e o front novo está em `frontend/`.
- `src/app.js`: as rotas da API também respondem em **`/api/...`**. As antigas, sem `/api`, continuam funcionando.
- `src/app.js`: depois de `npm run build`, o back entrega o site (`frontend/dist`). Se o navegador abrir uma página como `/inventario` ou `/produtos/4`, recebe o site; chamadas da API (que pedem JSON) continuam indo para as rotas.
- `package.json`: novos comandos:
  - `npm install` instala back e front
  - `npm run dev` liga os dois juntos
  - `npm run build` gera o site
  - `npm start` liga o back servindo o site
- Novas dependências de desenvolvimento: `concurrently` (liga os dois juntos) e `nodemon` (o `npm run dev` antigo já usava, mas ele não estava instalado).
