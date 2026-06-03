const fs = require('fs');
const path = require('path');

/**
 * Padrão Design: Singleton
 * Garante uma única instância de conexão/acesso ao banco de dados em arquivo JSON em toda a aplicação.
 */
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

    /**
     * Retorna a instância única da conexão
     * @returns {DatabaseConnection}
     */
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    /**
     * Lê a lista de usuários salvos
     * @returns {Array<object>}
     */
    readUsers() {
        try {
            const data = fs.readFileSync(this.dbPath, 'utf-8');
            return JSON.parse(data);
        } catch (err) {
            console.error('[Singleton DB] Erro ao ler banco de dados JSON:', err);
            return [];
        }
    }

    /**
     * Grava a lista atualizada de usuários
     * @param {Array<object>} users 
     */
    writeUsers(users) {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(users, null, 2), 'utf-8');
        } catch (err) {
            console.error('[Singleton DB] Erro ao gravar banco de dados JSON:', err);
        }
    }
}

// Exporta a instância única (Singleton) diretamente para manter a compatibilidade
module.exports = DatabaseConnection.getInstance();
