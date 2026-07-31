const express = require('express')
const router = express.Router()

const funcionarioRoutes = require('./FuncionarioRoutes')
const categoriaRoutes = require('./CategoriaRoutes')
const estoqueRoutes = require('./EstoqueRoutes')
const cadastrofornecedoresRoutes = require('./CadastroFornecedoresRoutes')
const produtoRoutes = require('./ProdutoRoutes')
const movimentacaoestoqueRoutes = require('./MovimentacaoEstoqueRoutes')

router.get('/', (req, res) =>{
    res.json({
        mensagem: 'API Docelar',
        versao: '1.0.0',
        arquitetura:'MVC + SOLID'
    })
})

route.use('/funcionario', funcionarioRoutes)
route.use('/categoria', categoriaRoutes)
route.use('/estoque', estoqueRoutes)
route.use('/cadastrofornecedroes', cadastrofornecedoresRoutes)
route.use('/produtos', produtoRoutes)
route.use('/movimentacaoestoque', movimentacaoestoqueRoutes)
