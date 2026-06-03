require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend com o mapeamento de caminhos relativos
app.use('/Public', express.static(path.join(__dirname, 'Literaverse', 'Public')));
app.use('/Views', express.static(path.join(__dirname, 'Literaverse', 'Views')));

// Redireciona a raiz '/' para a index.html dentro das Views
app.get('/', (req, res) => {
    res.redirect('/Views/index.html');
});

// Importar rotas da API
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const booksRoutes = require('./routes/books');

// Registrar rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', booksRoutes);

// Tratamento de erros genérico
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
