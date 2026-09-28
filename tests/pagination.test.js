const test = require('node:test');
const assert = require('node:assert');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

test('Validação de Paginação - Deve retornar valores padrão quando parâmetros não forem informados', () => {
    const result = parsePagination({});
    assert.strictEqual(result.offset, 0);
    assert.strictEqual(result.limit, 10);
    assert.strictEqual(result.error, undefined);
});

test('Validação de Paginação - Deve converter strings numéricas válidas para inteiros', () => {
    const result = parsePagination({ offset: '20', limit: '5' });
    assert.strictEqual(result.offset, 20);
    assert.strictEqual(result.limit, 5);
});

test('Validação de Paginação - Deve rejeitar offset negativo', () => {
    const result = parsePagination({ offset: '-1', limit: '10' });
    assert.ok(result.error);
    assert.match(result.error, /offset/);
});

test('Validação de Paginação - Deve rejeitar limit menor que 1 ou maior que 100', () => {
    const zeroLimit = parsePagination({ limit: '0' });
    assert.ok(zeroLimit.error);

    const excessiveLimit = parsePagination({ limit: '101' });
    assert.ok(excessiveLimit.error);
});

test('Formatação de Resposta Paginada - Deve calcular hasPrevious e hasNext corretamente', () => {
    const mockPage = { items: [1, 2, 3], total: 10 };
    const response = paginatedResponse(mockPage, 0, 3);

    assert.strictEqual(response.results.length, 3);
    assert.strictEqual(response.pagination.total, 10);
    assert.strictEqual(response.pagination.hasPrevious, false);
    assert.strictEqual(response.pagination.hasNext, true);

    const lastPageResponse = paginatedResponse({ items: [10], total: 10 }, 9, 3);
    assert.strictEqual(lastPageResponse.pagination.hasPrevious, true);
    assert.strictEqual(lastPageResponse.pagination.hasNext, false);
});
