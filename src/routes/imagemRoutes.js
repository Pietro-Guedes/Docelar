const express = require('express');
const router = express.Router();

const imagemController = require('../controllers/ImagemController');
const upload = require('../config/multer');

router.get('/produto/:id_produto', imagemController.listarPorProduto);
router.post('/produto/:id_produto', upload.single('imagem'), imagemController.cadastrar);
router.delete('/:id', imagemController.deletar);

module.exports = router;