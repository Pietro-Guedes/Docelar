
const express = require('express');
const router = express.Router();
 
const movimentacaoEstoqueController = require('../controllers/MovimentacaoEstoqueController');
const { verificarToken }= require('../middlewares/authMiddleware');
 
// Qualquer funcionário autenticado pode consultar e registrar movimentações
router.get('/produto/:id_produto', verificarToken, movimentacaoEstoqueController.listarPorProduto);
router.post('/entrada', verificarToken, movimentacaoEstoqueController.entrada);
router.post('/saida', verificarToken, movimentacaoEstoqueController.saida);
router.post('/devolucao', verificarToken, movimentacaoEstoqueController.devolucao);
router.post('/troca', verificarToken, movimentacaoEstoqueController.troca);
router.post('/saida-lote-vencido', verificarToken, movimentacaoEstoqueController.saidaLoteVencido);
router.post('/:id/estorno', verificarToken, movimentacaoEstoqueController.estornar);
 
module.exports = router;