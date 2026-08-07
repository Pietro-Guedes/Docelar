const express = require('express');
const router = express.Router();

const produtoController = require('../controllers/ProdutoController');


router.get('/', produtoController.listar);
router.get('/:id', produtoController.buscarPorId);
router.post('/', produtoController.cadastrar);
router.put('/:id', produtoController.atualizar);
router.delete('/:id', produtoController.deletar);

module.exports = router;