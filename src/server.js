require('dotenv').config()

const app = require('./app')
const pool = require('./config/database')

const PORT = process.env.PORT || 3000;

async function iniciar() {
    try {
        const connection = await pool.getConnection()
        console.log('Conectado ao Mysql com sucesso')
        connection.release()
    } catch (err) {
        console.error('Erro ao conectar ao banco:', err.message)
        console.error('Confira DB_HOST, DB_USER, DB_PASSWORD, DB_NAME e DB_PORT no arquivo .env')
        process.exit(1)
    }

    if (!process.env.JWT_SECRET) {
        console.error('Erro: JWT_SECRET não está no .env — defina antes de ligar o servidor.')
        process.exit(1)
    }

    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`)
    })
}

iniciar()
