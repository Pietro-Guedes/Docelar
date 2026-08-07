// MovimentacaoEstoqueRoutes.js
const express = require('express');
const router = express.Router();

const movimentacaoEstoqueController = require('../controllers/MovimentacaoEstoqueController');

router.get('/produto/:id_produto', movimentacaoEstoqueController.listarPorProduto);
router.post('/entrada', movimentacaoEstoqueController.entrada);
router.post('/saida', movimentacaoEstoqueController.saida);
router.post('/devolucao', movimentacaoEstoqueController.devolucao);

module.exports = router;