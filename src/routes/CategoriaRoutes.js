const express = require('express');
const router = express.Router();

const CategoriaController = require('../controllers/CategoriaController');
const categoriaController = new CategoriaController();

router.get('/', categoriaController.listar);
router.get('/:id', categoriaController.buscarPorId);
router.post('/', categoriaController.cadastrar);
router.put('/:id', categoriaController.atualizar);
router.delete('/:id', categoriaController.deletar);

module.exports = router;