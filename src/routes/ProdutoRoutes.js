const express = require('express');
const router = express.Router();

const { verificarToken } = require('../middlewares/authMiddleware');
const produtoController = require('../controllers/ProdutoController');

router.get('/', produtoController.listar);
router.get('/:id', produtoController.buscarPorId);
router.post('/', verificarToken, produtoController.cadastrar);
router.put('/:id', verificarToken, produtoController.atualizar);
router.delete('/:id', verificarToken, produtoController.deletar);

module.exports = router;