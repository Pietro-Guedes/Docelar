const express = require('express');
const router = express.Router();

const { verificarToken } = require('../middlewares/authMiddleware');
const imagemController = require('../controllers/imagemController');
const upload = require('../config/multer');

router.get('/produto/:id_produto', imagemController.listarPorProduto);
router.post('/produto/:id_produto', verificarToken, upload.single('imagem'), imagemController.cadastrar);
router.delete('/:id', verificarToken, imagemController.deletar);

module.exports = router;