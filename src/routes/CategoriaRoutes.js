const express = require('express');
const router = express.Router();

const { verificarToken } = require('../middlewares/authMiddleware');
const categoriaController = require('../controllers/CategoriaController');

router.get('/', categoriaController.listar);
router.get('/:id', categoriaController.buscarPorId);
router.post('/', verificarToken, categoriaController.cadastrar);
router.put('/:id', verificarToken, categoriaController.atualizar);
router.delete('/:id', verificarToken, categoriaController.deletar);

module.exports = router;