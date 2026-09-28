const sql = require('mssql');

const configSQLServer = {
    user: process.env.DB_USER || 'samuel2',
    password: process.env.DB_PASSWORD || 'forsaken',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'Literaverse',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
        trustedConnection: false,
        enableArithAbort: true,
        encrypt: process.env.DB_ENCRYPT === 'true',
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

async function getPool() {
    if (!pool) {
        pool = await sql.connect(configSQLServer);
    }
    return pool;
}

module.exports = { sql, getPool };
