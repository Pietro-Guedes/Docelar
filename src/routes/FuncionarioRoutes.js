const express = require('express');
const router = express.Router();
 
const funcionarioController = require('../controllers/FuncionarioController');
<<<<<<< HEAD
const verificarToken = require('../middleware/auth');
 
// Públicas: sem essas duas, ninguém consegue criar conta ou entrar
=======

//rota de login
router.post('/login', funcionarioController.login)

router.get('/', funcionarioController.listar);
router.get('/:id', funcionarioController.buscarPorId);
>>>>>>> 2db61e85edae4a35697288d96896dda5c407764a
router.post('/', funcionarioController.cadastrar);
router.post('/login', funcionarioController.login);
 
// Protegidas: precisa estar logado
router.get('/', verificarToken, funcionarioController.listar);
router.get('/:id', verificarToken, funcionarioController.buscarPorId);
router.put('/:id', verificarToken, funcionarioController.atualizar);
router.delete('/:id', verificarToken, funcionarioController.deletar);
 
module.exports = router;