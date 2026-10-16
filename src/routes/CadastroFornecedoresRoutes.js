const express = require('express');
const router = express.Router();

const { verificarToken } = require('../middlewares/authMiddleware');
const cadastrofornecedoresController = require('../controllers/CadastroFornecedoresController');

router.get('/', cadastrofornecedoresController.listar);
router.get('/:id', cadastrofornecedoresController.buscarPorId);
router.post('/', verificarToken, cadastrofornecedoresController.cadastrar);
router.put('/:id', verificarToken, cadastrofornecedoresController.atualizar);
router.delete('/:id', verificarToken, cadastrofornecedoresController.deletar);

module.exports = router;