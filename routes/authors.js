const express = require('express');
const router = express.Router();
const authorRepository = require('../repositories/authorRepository');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

router.get('/', async (req, res) => {
    const page = parsePagination(req.query);
    if (page.error) return res.status(400).json({ message: page.error });

    try {
        const result = await authorRepository.findPage(page.offset, page.limit);
        return res.json(paginatedResponse(result, page.offset, page.limit));
    } catch (err) {
        console.error('[API Authors] Erro ao consultar autores no SQL Server:', err);
        return res.status(500).json({ message: 'Erro ao obter autores do banco de dados.' });
    }
});

module.exports = router;
