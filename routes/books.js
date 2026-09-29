const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bookRepository = require('../repositories/bookRepository');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const FALLBACK_PATH = path.join(__dirname, '..', 'database', 'books_fallback.json');

let booksCache = null;

try {
    const fallbackData = fs.readFileSync(FALLBACK_PATH, 'utf-8');
    booksCache = JSON.parse(fallbackData);
} catch (err) {
    console.error('[Server Cache] Erro ao carregar fallback local de livros:', err.message);
}

router.get('/', async (req, res) => {
    const page = parsePagination(req.query);
    if (page.error) {
        return res.status(400).json({ message: page.error });
    }

    try {
        const result = await bookRepository.findPage(page.offset, page.limit);
        return res.json(paginatedResponse(result, page.offset, page.limit));
    } catch (err) {
        console.warn('[API Books] SQL Server indisponível ou erro na consulta, usando fallback:', err.message);

        if (booksCache && Array.isArray(booksCache.results)) {
            const rawItems = booksCache.results;
            const sliced = rawItems.slice(page.offset, page.offset + page.limit).map((b) => ({
                id: b.id,
                titulo: b.title,
                autor: (b.authors || []).map((a) => a.name).join(', ') || 'Autor desconhecido',
                descricao: 'Clássico da literatura',
                faixaEtaria: 14,
                imagem: b.formats ? b.formats['image/jpeg'] : null
            }));

            return res.json(paginatedResponse({ items: sliced, total: rawItems.length }, page.offset, page.limit));
        }

        return res.status(500).json({ message: 'Erro ao obter livros do banco de dados.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const book = await bookRepository.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Obra não encontrada.' });
        }
        return res.json(book);
    } catch (err) {
        console.error('[API Books] Erro ao consultar obra:', err.message);
        return res.status(500).json({ message: 'Erro ao obter obra do banco de dados.' });
    }
});

module.exports = router;
