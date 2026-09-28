const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MAX_OFFSET = 2147483647;

function parsePagination(query) {
    const offset = query.offset === undefined ? 0 : Number(query.offset);
    const limit = query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);

    if (!Number.isInteger(offset) || offset < 0 || offset > MAX_OFFSET) {
        return { error: 'offset deve ser um inteiro entre 0 e 2147483647.' };
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
        return { error: `limit deve ser um inteiro entre 1 e ${MAX_LIMIT}.` };
    }

    return { offset, limit };
}

function paginatedResponse(page, offset, limit) {
    return {
        results: page.items,
        pagination: {
            offset,
            limit,
            total: page.total,
            hasPrevious: offset > 0,
            hasNext: offset + page.items.length < page.total
        }
    };
}

module.exports = { parsePagination, paginatedResponse };