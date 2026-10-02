const express = require('express');
const router = express.Router();

const estoqueController = require('../controllers/EstoqueController');

// Rotas com nome vêm ANTES de "/:id", senão o Express acha que "vencidos" é um id
router.get('/vencidos', estoqueController.listarVencidos);
router.get('/proximos-vencimento', estoqueController.listarProximosVencimento);

router.get('/', estoqueController.listar);
router.get('/:id', estoqueController.buscarPorId);
router.post('/', estoqueController.cadastrar);
router.put('/:id', estoqueController.atualizar);
router.delete('/:id', estoqueController.deletar);

module.exports = router;
