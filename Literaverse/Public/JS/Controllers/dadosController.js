document.addEventListener('DOMContentLoaded', () => {
    const tabela = document.getElementById('dados-tabela');
    const cabecalho = document.getElementById('dados-cabecalho');
    const corpo = document.getElementById('dados-corpo');
    const status = document.getElementById('dados-status');
    const intervalo = document.getElementById('dados-intervalo');
    const anterior = document.getElementById('dados-anterior');
    const proximo = document.getElementById('dados-proximo');
    const seletorLimite = document.getElementById('dados-limite');
    const abas = document.querySelectorAll('[data-recurso]');

    if (!tabela || !cabecalho || !corpo || !status || !intervalo || !anterior || !proximo || !seletorLimite) return;

    const colunas = {
        books: [
            ['id', 'ID'],
            ['titulo', 'Obra'],
            ['autor', 'Autor(es)'],
            ['descricao', 'Descrição'],
            ['faixaEtaria', 'Faixa etária']
        ],
        authors: [
            ['id', 'ID'],
            ['nome', 'Autor'],
            ['anoNascimento', 'Nascimento'],
            ['anoFalecimento', 'Falecimento'],
            ['quantidadeObras', 'Obras']
        ],
        users: [
            ['id', 'ID'],
            ['nome', 'Nome'],
            ['usuario', 'Usuário']
        ]
    };

    let recursoAtual = 'books';
    let limitAtual = Number(seletorLimite.value) || 10;
    const offsets = { books: 0, authors: 0, users: 0 };
    let requestSequence = 0;

    async function carregarPagina() {
        const sequence = ++requestSequence;
        const recurso = recursoAtual;
        const offset = offsets[recurso];
        const limit = limitAtual;
        status.textContent = 'Carregando...';
        tabela.setAttribute('aria-busy', 'true');
        anterior.disabled = true;
        proximo.disabled = true;

        try {
            const pagina = await obterPaginaDados(recurso, offset, limit);
            if (sequence !== requestSequence) return;

            const nomesColunas = colunas[recurso];
            cabecalho.replaceChildren();
            corpo.replaceChildren();

            for (const [, rotulo] of nomesColunas) {
                const th = document.createElement('th');
                th.scope = 'col';
                th.textContent = rotulo;
                cabecalho.appendChild(th);
            }

            for (const item of pagina.results) {
                const linha = document.createElement('tr');
                for (const [campo] of nomesColunas) {
                    const celula = document.createElement('td');
                    const valor = item[campo];
                    if (valor === null || valor === undefined || valor === '') {
                        celula.textContent = '—';
                    } else if (campo === 'faixaEtaria') {
                        celula.textContent = `${valor} anos`;
                    } else {
                        celula.textContent = String(valor);
                    }
                    linha.appendChild(celula);
                }
                corpo.appendChild(linha);
            }

            const total = pagina.pagination.total;
            const primeiro = total === 0 ? 0 : offset + 1;
            const ultimo = offset + pagina.results.length;
            intervalo.textContent = `${primeiro}–${ultimo} de ${total}`;
            status.textContent = total === 0 ? 'Nenhum registro encontrado.' : '';
            anterior.disabled = !pagina.pagination.hasPrevious;
            proximo.disabled = !pagina.pagination.hasNext;
        } catch (error) {
            if (sequence !== requestSequence) return;
            cabecalho.replaceChildren();
            corpo.replaceChildren();
            intervalo.textContent = '';
            status.textContent = error.message || 'Erro ao carregar os dados.';
        } finally {
            if (sequence === requestSequence) tabela.setAttribute('aria-busy', 'false');
        }
    }

    abas.forEach((aba) => {
        aba.addEventListener('click', () => {
            recursoAtual = aba.dataset.recurso;
            abas.forEach((item) => item.setAttribute('aria-pressed', String(item === aba)));
            carregarPagina();
        });
    });

    anterior.addEventListener('click', () => {
        offsets[recursoAtual] = Math.max(0, offsets[recursoAtual] - limitAtual);
        carregarPagina();
    });

    proximo.addEventListener('click', () => {
        offsets[recursoAtual] += limitAtual;
        carregarPagina();
    });

    seletorLimite.addEventListener('change', () => {
        limitAtual = Number(seletorLimite.value);
        Object.keys(offsets).forEach((recurso) => { offsets[recurso] = 0; });
        carregarPagina();
    });

    carregarPagina();
});