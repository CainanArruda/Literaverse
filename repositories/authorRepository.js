const { sql, getPool } = require('../utils/db');

async function findPage(offset, limit) {
    const pool = await getPool();
    const result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit)
        .query(`
            SELECT COUNT(1) AS total FROM Autor;
            SELECT a.id_autor AS id,
                   a.nome_autor AS nome,
                   a.ano_nascimento AS anoNascimento,
                   a.ano_falecimento AS anoFalecimento,
                   COUNT(e.id_obra) AS quantidadeObras
            FROM Autor a
            LEFT JOIN Escrever e ON e.id_autor = a.id_autor
            GROUP BY a.id_autor, a.nome_autor, a.ano_nascimento, a.ano_falecimento
            ORDER BY a.nome_autor, a.id_autor
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

    return { items: result.recordsets[1], total: result.recordsets[0][0].total };
}

module.exports = { findPage };
