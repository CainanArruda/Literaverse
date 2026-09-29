require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/Public', express.static(path.join(__dirname, 'Literaverse', 'Public')));
app.use('/Views', express.static(path.join(__dirname, 'Literaverse', 'Views')));

app.get('/', (req, res) => {
    res.redirect('/Views/index.html');
});

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const booksRoutes = require('./routes/books');
const authorsRoutes = require('./routes/authors');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/authors', authorsRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
