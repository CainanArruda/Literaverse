// Editor WYSIWYG com modal e gerenciador de rascunhos (versão consolidada)
(function () {
    const editor = document.getElementById('editor');
    const toolbar = document.querySelector('.toolbar');
    const fontSize = document.getElementById('fontSize');

    // elementos opcionais (checados antes de usar)
    const modal = document.getElementById('modalInserir');
    const formInserir = document.getElementById('formInserir');
    const tipoInserir = document.getElementById('tipoInserir');
    const urlInserir = document.getElementById('urlInserir');
    const textoInserir = document.getElementById('textoInserir');
    const cancelarInserir = document.getElementById('cancelarInserir');

    const btnRascunhos = document.getElementById('btnRascunhos');
    const rascunhosPanel = document.getElementById('rascunhosPanel');
    const fecharRascunhos = document.getElementById('fecharRascunhos');
    const listaRascunhos = document.getElementById('listaRascunhos');
    const novaVersao = document.getElementById('novaVersao');

    function execFormatting(cmd, value = null) {
        try {
            document.execCommand(cmd, false, value);
        } catch (e) {
            console.warn('execCommand falhou:', cmd, e);
        }
    }

    // toolbar
    if (toolbar) {
        toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const cmd = btn.dataset.cmd;
            if (cmd) {
                if (cmd === 'formatBlock') {
                    const value = btn.dataset.value;
                    execFormatting(cmd, value);
                    return;
                }
                execFormatting(cmd);
            }

            if (btn.id === 'inserirLink') openModal('link');
            if (btn.id === 'inserirImagem') openModal('imagem');
            if (btn.id === 'desfazer') execFormatting('undo');
            if (btn.id === 'refazer') execFormatting('redo');
            if (btn.id === 'salvarRascunho') saveDraft();
            if (btn.id === 'baixar') downloadHTML();
            if (btn.id === 'btnRascunhos') toggleRascunhos();
        });
    }

    // font size handler
    if (fontSize && editor) {
        fontSize.addEventListener('change', () => {
            execFormatting('fontSize', 7);
            const elements = editor.querySelectorAll('font[size="7"]');
            elements.forEach(el => {
                el.removeAttribute('size');
                el.style.fontSize = fontSize.value + 'px';
            });
        });
    }

    // modal logic
    function openModal(type) {
        if (!modal) return;
        tipoInserir.value = (type === 'imagem') ? 'imagem' : 'link';
        urlInserir.value = '';
        textoInserir.value = '';
        modal.setAttribute('aria-hidden', 'false');
        modal.style.display = 'flex';
        urlInserir.focus();
    }

    function closeModal() {
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'true');
        modal.style.display = 'none';
    }

    if (cancelarInserir) {
        cancelarInserir.addEventListener('click', (ev) => {
            ev.preventDefault();
            closeModal();
        });
    }

    if (formInserir) {
        formInserir.addEventListener('submit', (ev) => {
            ev.preventDefault();
            const tipo = tipoInserir.value;
            const url = (urlInserir.value || '').trim();
            const texto = (textoInserir.value || '').trim();
            if (!url) return alert('Por favor informe uma URL válida.');

            if (tipo === 'link') {
                const selection = window.getSelection();
                if (selection && !selection.isCollapsed) {
                    execFormatting('createLink', url);
                } else {
                    const display = texto || url;
                    execFormatting('insertHTML', `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(display)}</a>`);
                }
            } else {
                execFormatting('insertImage', url);
            }

            closeModal();
        });
    }

    function escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // rascunhos
    function getRascunhos() {
        try {
            const raw = localStorage.getItem('rascunhos_list');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function setRascunhos(list) {
        localStorage.setItem('rascunhos_list', JSON.stringify(list));
    }

    function saveDraft() {
        if (!editor) return;
        const content = editor.innerHTML;
        const title = prompt('Título do rascunho (opcional)');
        const id = 'r_' + Date.now();
        const rascunhos = getRascunhos();
        rascunhos.unshift({ id, title: title || 'Sem título', content, date: new Date().toISOString() });
        setRascunhos(rascunhos);
        renderRascunhos();
        alert('Rascunho salvo localmente.');
    }

    function renderRascunhos() {
        if (!listaRascunhos) return;
        const list = getRascunhos();
        listaRascunhos.innerHTML = '';
        if (list.length === 0) {
            listaRascunhos.innerHTML = '<li class="empty">Nenhum rascunho salvo.</li>';
            return;
        }
        list.forEach(item => {
            const li = document.createElement('li');
            li.className = 'rascunho-item';
            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.innerHTML = `<strong>${escapeHtml(item.title)}</strong><br/><small>${new Date(item.date).toLocaleString()}</small>`;
            const actions = document.createElement('div');
            actions.className = 'rascunho-actions';
            const btnLoad = document.createElement('button');
            btnLoad.className = 'botao-acao';
            btnLoad.textContent = 'Carregar';
            btnLoad.addEventListener('click', () => loadDraft(item.id));
            const btnDelete = document.createElement('button');
            btnDelete.className = 'botao-acao';
            btnDelete.textContent = 'Excluir';
            btnDelete.addEventListener('click', () => deleteDraft(item.id));
            actions.appendChild(btnLoad);
            actions.appendChild(btnDelete);
            li.appendChild(meta);
            li.appendChild(actions);
            listaRascunhos.appendChild(li);
        });
    }

    function loadDraft(id) {
        const list = getRascunhos();
        const item = list.find(i => i.id === id);
        if (!item) return alert('Rascunho não encontrado.');
        if (confirm('Carregar este rascunho substituirá o conteúdo atual. Continuar?')) {
            editor.innerHTML = item.content;
            toggleRascunhos(false);
        }
    }

    function deleteDraft(id) {
        let list = getRascunhos();
        list = list.filter(i => i.id !== id);
        setRascunhos(list);
        renderRascunhos();
    }

    function toggleRascunhos(forceState) {
        if (!rascunhosPanel) return;
        const isOpen = rascunhosPanel.getAttribute('aria-hidden') === 'false';
        const open = (typeof forceState === 'boolean') ? forceState : !isOpen;
        rascunhosPanel.setAttribute('aria-hidden', String(!open));
        rascunhosPanel.style.display = open ? 'block' : 'none';
        if (open) renderRascunhos();
    }

    if (fecharRascunhos) fecharRascunhos.addEventListener('click', () => toggleRascunhos(false));
    if (novaVersao) novaVersao.addEventListener('click', () => { toggleRascunhos(false); editor && editor.focus(); });

    function downloadHTML() {
        if (!editor) return;
        const blob = new Blob([editor.innerHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'obra.html';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // autosave simples
    setInterval(() => {
        if (!editor) return;
        const content = editor.innerHTML;
        localStorage.setItem('autosave_obra', content);
    }, 5000);

    // restaurar autosave se houver
    window.addEventListener('load', () => {
        const saved = localStorage.getItem('autosave_obra');
        if (saved && confirm('Restaurar rascunho automático?')) {
            editor.innerHTML = saved;
        }
        if (rascunhosPanel) rascunhosPanel.style.display = 'none';
    });

})();
