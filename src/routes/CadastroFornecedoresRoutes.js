const express = require('express');
const router = express.Router();

const cadastrofornecedoresController = require('../controllers/CadastroFornecedoresController');


router.get('/', cadastrofornecedoresController.listar);
router.get('/:id', cadastrofornecedoresController.buscarPorId);
router.post('/', cadastrofornecedoresController.cadastrar);
router.put('/:id', cadastrofornecedoresController.atualizar);
router.delete('/:id', cadastrofornecedoresController.deletar);

module.exports = router;