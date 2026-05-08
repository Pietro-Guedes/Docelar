const express = require('express');
const router = express.Router();

const ProdutoController = require('../controllers/ProdutoController');
const produtoController = new ProdutoController();

router.get('/', produtoController.listar);
router.get('/:id', produtoController.buscarPorId);
router.post('/', produtoController.cadastrar);
router.put('/:id', produtoController.atualizar);
router.delete('/:id', produtoController.deletar);

module.exports = router;