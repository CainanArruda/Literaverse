const fs = require('fs');
const path = require('path');

class DatabaseConnection {
    constructor() {
        if (DatabaseConnection.instance) {
            return DatabaseConnection.instance;
        }
        this.dbPath = path.join(__dirname, '..', 'database', 'users.json');
        this.readUsers = this.readUsers.bind(this);
        this.writeUsers = this.writeUsers.bind(this);
        DatabaseConnection.instance = this;
    }

    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    readUsers() {
        try {
            if (!fs.existsSync(this.dbPath)) {
                return [];
            }
            const data = fs.readFileSync(this.dbPath, 'utf-8');
            if (!data.trim()) {
                return [];
            }
            return JSON.parse(data);
        } catch (err) {
            console.error('[Singleton DB] Erro crítico ao ler/analisar banco de dados JSON:', err);

            throw err;
        }
    }

    writeUsers(users) {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(users, null, 2), 'utf-8');
        } catch (err) {
            console.error('[Singleton DB] Erro ao gravar banco de dados JSON:', err);
        }
    }
}

const { sql, getPool } = require('../database/connections');
const instance = DatabaseConnection.getInstance();
instance.sql = sql;
instance.getPool = getPool;

module.exports = instance;
