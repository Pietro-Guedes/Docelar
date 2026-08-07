const express = require('express')
const router = express.Router()

const funcionarioRoutes = require('./FuncionarioRoutes')
const categoriaRoutes = require('./CategoriaRoutes')
const estoqueRoutes = require('./EstoqueRoutes')
const cadastrofornecedoresRoutes = require('./CadastroFornecedoresRoutes')
const produtoRoutes = require('./ProdutoRoutes')
const movimentacaoestoqueRoutes = require('./MovimentacaoEstoqueRoutes')
const imagemRoutes = require('./ImagemRoutes')

router.get('/', (req, res) =>{
    res.json({
        mensagem: 'API Docelar',
        versao: '1.0.0',
        arquitetura:'MVC + SOLID'
    })
})

router.use('/funcionario', funcionarioRoutes)
router.use('/categoria', categoriaRoutes)
router.use('/estoque', estoqueRoutes)
router.use('/cadastrofornecedroes', cadastrofornecedoresRoutes)
router.use('/produtos', produtoRoutes)
router.use('/movimentacaoestoque', movimentacaoestoqueRoutes)
router.use('/imagens', imagemRoutes)

module.exports = router