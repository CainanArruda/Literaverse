const { sql, getPool } = require('../utils/db');

const BOOK_SELECT = `
    SELECT o.id_obra AS id,
           o.nome_obra AS titulo,
           o.descricao_obra AS descricao,
           o.sinopse AS sinopse,
           o.faixa_etaria AS faixaEtaria,
           o.capa_url AS imagem,
           a.nome_autor AS nomeAutor,
           a.ano_nascimento AS anoNascimento,
           a.ano_falecimento AS anoFalecimento
    FROM Obra o
    LEFT JOIN Escrever e ON e.id_obra = o.id_obra
    LEFT JOIN Autor a ON a.id_autor = e.id_autor`;

function mapBooks(rows) {
    const booksById = new Map();

    for (const row of rows) {
        if (!booksById.has(row.id)) {
            booksById.set(row.id, {
                id: row.id,
                titulo: row.titulo,
                title: row.titulo,
                descricao: row.descricao,
                sinopse: row.sinopse,
                faixaEtaria: row.faixaEtaria,
                imagem: row.imagem,
                formats: row.imagem ? { 'image/jpeg': row.imagem } : {},
                authors: []
            });
        }

        if (row.nomeAutor) {
            booksById.get(row.id).authors.push({
                name: row.nomeAutor,
                birth_year: row.anoNascimento,
                death_year: row.anoFalecimento
            });
        }
    }

    const books = Array.from(booksById.values());
    for (const book of books) {
        book.autor = book.authors.map((author) => author.name).join(', ') || 'Autor desconhecido';
    }

    return books;
}

async function findAll() {
    const pool = await getPool();
    const result = await pool.request().query(`${BOOK_SELECT} ORDER BY o.nome_obra, a.nome_autor`);
    return mapBooks(result.recordset);
}

async function findPage(offset, limit) {
    const pool = await getPool();
    const result = await pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit)
        .query(`
            SELECT COUNT(1) AS total FROM Obra;
            WITH PaginatedWorks AS (
                SELECT id_obra
                FROM Obra
                ORDER BY nome_obra, id_obra
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            )
            SELECT o.id_obra AS id,
                   o.nome_obra AS titulo,
                   o.descricao_obra AS descricao,
                   o.sinopse AS sinopse,
                   o.faixa_etaria AS faixaEtaria,
                   o.capa_url AS imagem,
                   a.nome_autor AS nomeAutor,
                   a.ano_nascimento AS anoNascimento,
                   a.ano_falecimento AS anoFalecimento
            FROM PaginatedWorks p
            JOIN Obra o ON o.id_obra = p.id_obra
            LEFT JOIN Escrever e ON e.id_obra = o.id_obra
            LEFT JOIN Autor a ON a.id_autor = e.id_autor
            ORDER BY o.nome_obra, o.id_obra, a.nome_autor
        `);

    return {
        items: mapBooks(result.recordsets[1]),
        total: result.recordsets[0][0].total
    };
}

async function findById(id) {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`${BOOK_SELECT} WHERE o.id_obra = @id ORDER BY a.nome_autor`);

    return mapBooks(result.recordset)[0] || null;
}

module.exports = { findAll, findPage, findById };
