function obterBaseApiDados() {
    const usarUrlAbsoluta = window.location.protocol === 'file:' || window.location.port === '5500';
    return usarUrlAbsoluta ? 'http://localhost:3000' : '';
}

async function obterPaginaDados(recurso, offset, limit) {
    const endpoints = {
        books: '/api/books',
        authors: '/api/authors',
        users: '/api/users'
    };
    const endpoint = endpoints[recurso];

    if (!endpoint) {
        throw new Error('Conjunto de dados inválido.');
    }

    const query = new URLSearchParams({ offset: String(offset), limit: String(limit) });
    const response = await fetch(`${obterBaseApiDados()}${endpoint}?${query}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Não foi possível carregar os dados.');
    }

    return data;
}
