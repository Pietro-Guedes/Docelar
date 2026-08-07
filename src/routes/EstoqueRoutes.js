const express = require('express');
const router = express.Router();

const estoqueController = require('../controllers/EstoqueController');


router.get('/', estoqueController.listar);
router.get('/:id', estoqueController.buscarPorId);
router.post('/', estoqueController.cadastrar);
router.put('/:id', estoqueController.atualizar);
router.delete('/:id', estoqueController.deletar);

module.exports = router;