const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'users.json');

function readUsers() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Erro ao ler banco de dados JSON:', err);
        return [];
    }
}

function writeUsers(users) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
    } catch (err) {
        console.error('Erro ao escrever no banco de dados JSON:', err);
    }
}

module.exports = {
    readUsers,
    writeUsers
};
