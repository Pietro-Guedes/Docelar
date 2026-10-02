const pool = require('../config/database');

let avisou = false;
function avisarSemColuna() {
    if (avisou) return;
    avisou = true;
    console.warn('Aviso: a tabela produto não tem a coluna estoque_minimo. Rode o arquivo banco/estoque_minimo.sql no MySQL.');
}

class ProdutoRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM produto ORDER BY id_produto DESC');
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM produto WHERE id_produto = ?', [id]);
        return rows[0];
    }

    async create(produtoData) {
        const { nome, descricao, valor_unitario, id_categoria, id_fornecedor, id_funcionario, estoque_minimo } = produtoData;

        if (estoque_minimo !== undefined) {
            try {
                const [result] = await pool.query(
                    'INSERT INTO produto (nome, descricao, valor_unitario, id_categoria, id_fornecedor, id_funcionario, estoque_minimo) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [nome, descricao, valor_unitario, id_categoria, id_fornecedor, id_funcionario, estoque_minimo]
                );
                return result.insertId;
            } catch (erro) {
                // Banco ainda sem a coluna estoque_minimo (rode o arquivo banco/estoque_minimo.sql): salva sem ela
                if (erro.code !== 'ER_BAD_FIELD_ERROR') throw erro;
                avisarSemColuna();
            }
        }

        const [result] = await pool.query(
            'INSERT INTO produto (nome, descricao, valor_unitario, id_categoria, id_fornecedor, id_funcionario) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, descricao, valor_unitario, id_categoria, id_fornecedor, id_funcionario]
        );
        return result.insertId;
    }

    async update(id, produtoData) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(produtoData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        if (fields.length === 0) return null;

        values.push(id);
        const query = `UPDATE produto SET ${fields.join(', ')} WHERE id_produto = ?`;
        try {
            const [result] = await pool.query(query, values);
            return result.affectedRows;
        } catch (erro) {
            // Banco ainda sem a coluna estoque_minimo: atualiza o resto
            if (erro.code !== 'ER_BAD_FIELD_ERROR' || produtoData.estoque_minimo === undefined) throw erro;
            avisarSemColuna();
            const { estoque_minimo, ...resto } = produtoData;
            return Object.keys(resto).length ? this.update(id, resto) : 0;
        }
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM produto WHERE id_produto = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = new ProdutoRepository();