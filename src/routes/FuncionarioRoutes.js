const express = require('express');
const router = express.Router();
 
const funcionarioController = require('../controllers/FuncionarioController');
const verificarToken = require('../middleware/auth');
 
// Públicas: sem essas duas, ninguém consegue criar conta ou entrar
router.post('/', funcionarioController.cadastrar);
router.post('/login', funcionarioController.login);
 
// Protegidas: precisa estar logado
router.get('/', verificarToken, funcionarioController.listar);
router.get('/:id', verificarToken, funcionarioController.buscarPorId);
router.put('/:id', verificarToken, funcionarioController.atualizar);
router.delete('/:id', verificarToken, funcionarioController.deletar);
 
module.exports = router;