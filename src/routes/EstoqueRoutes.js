const express = require('express');
const router = express.Router();

const { verificarToken } = require('../middlewares/authMiddleware');
const estoqueController = require('../controllers/EstoqueController');

router.get('/vencidos', estoqueController.listarVencidos);
router.get('/proximos-vencimento', estoqueController.listarProximosVencimento);

router.get('/', estoqueController.listar);
router.get('/:id', estoqueController.buscarPorId);
router.post('/', verificarToken, estoqueController.cadastrar);
router.put('/:id', verificarToken, estoqueController.atualizar);
router.delete('/:id', verificarToken, estoqueController.deletar);

module.exports = router;
