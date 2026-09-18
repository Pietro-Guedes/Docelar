
const express = require('express');
const router = express.Router();
 
const movimentacaoEstoqueController = require('../controllers/MovimentacaoEstoqueController');
const verificarToken = require('../middleware/auth');
 
// Qualquer funcionário autenticado pode consultar e registrar movimentações
router.get('/produto/:id_produto', verificarToken, movimentacaoEstoqueController.listarPorProduto);
router.post('/entrada', verificarToken, movimentacaoEstoqueController.entrada);
router.post('/saida', verificarToken, movimentacaoEstoqueController.saida);
router.post('/devolucao', verificarToken, movimentacaoEstoqueController.devolucao);
 
module.exports = router;