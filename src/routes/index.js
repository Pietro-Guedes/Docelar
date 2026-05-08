const express = require('express')
const router = express.Router()

const funcionarioRoutesRoutes = require('./FuncionarioRoutes')

router.get('/', (req, res) =>{
    res.json({
        mensagem: 'API Docelar',
        versao: '1.0.0',
        arquitetura:'MVC + SOLID'
    })
})

route.use('/funcionarios', funcionarioRoutes)
