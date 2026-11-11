const express = require('express');
const router = express.Router();

const funcionarioController = require('../controllers/FuncionarioController');
const {verificarToken, verificarAdmin} = require('../middlewares/authMiddleware');

router.post('/login', funcionarioController.login);
router.post('/', funcionarioController.cadastrar); // cadastro aberto a qualquer pessoa

router.get('/', verificarToken, funcionarioController.listar);
router.get('/:id', verificarToken, funcionarioController.buscarPorId);
router.put('/:id', verificarToken, funcionarioController.atualizar);

// só administrador desativa e reativa funcionários
router.delete('/:id', verificarToken, verificarAdmin, funcionarioController.deletar);
router.put('/:id/reativar', verificarToken, verificarAdmin, funcionarioController.reativar);

module.exports = router;
