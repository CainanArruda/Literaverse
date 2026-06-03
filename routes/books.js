const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const FALLBACK_PATH = path.join(__dirname, '..', 'database', 'books_fallback.json');

let booksCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas de cache no servidor

// Carrega os livros do arquivo fallback local como valor inicial instantâneo no startup
try {
    const fallbackData = fs.readFileSync(FALLBACK_PATH, 'utf-8');
    booksCache = JSON.parse(fallbackData);
    console.log("[Server Cache] Fallback local carregado com sucesso como cache inicial.");
} catch (err) {
    console.error("[Server Cache] Erro ao carregar fallback local de livros:", err.message);
}

// Função para buscar livros da API externa Gutendex e atualizar o cache do servidor
async function fetchAndCacheBooks() {
    try {
        console.log("[Server Cache] Buscando livros atualizados da API externa Gutendex...");
        
        // Define um tempo limite (timeout) de 8 segundos para evitar que a API trave
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch('https://gutendex.com/books/?search=machado%20de%20assis', {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Resposta da API Gutendex não foi OK: ${response.status}`);
        }
        const data = await response.json();
        booksCache = data;
        lastFetchTime = Date.now();
        console.log("[Server Cache] Cache de livros atualizado com dados frescos do Gutendex.");
    } catch (err) {
        console.warn("[Server Cache] Não foi possível obter novos dados da API externa (usando cache anterior/fallback):", err.message);
    }
}

// Dispara a busca atualizada em segundo plano no startup
fetchAndCacheBooks();

// Rota RESTful para obter livros (com proxy e cache em memória)
router.get('/', async (req, res) => {
    const now = Date.now();

    // Se o cache expirou, atualiza em background
    if (now - lastFetchTime > CACHE_DURATION) {
        console.log("[API Books] Cache expirado ou necessitando verificação. Atualizando em background...");
        fetchAndCacheBooks();
    }

    if (booksCache) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(booksCache);
    } else {
        return res.status(502).json({ message: 'Erro ao obter livros da API.' });
    }
});

module.exports = router;
