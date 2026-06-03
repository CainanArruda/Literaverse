/**
 * Carrega as informações reais do perfil do usuário a partir do backend.
 * @param {object} sessao
 */
async function carregarDadosUsuario(sessao) {
    console.log("Carregando dados do usuário na página de perfil...");
    const nomeEl = document.getElementById('perfil-nome-usuario');
    const bioEl = document.getElementById('perfil-bio-usuario');
    const fotoEl = document.getElementById('perfil-avatar');

    try {
        // Busca os dados atualizados diretamente do servidor
        const usuarioCompleto = await obterPerfilAPI();

        // Preenche o Nome na página
        if (nomeEl) {
            nomeEl.textContent = usuarioCompleto.nome || usuarioCompleto.usuario;
        }

        // Preenche a Foto de Perfil
        if (fotoEl && usuarioCompleto.foto) {
            fotoEl.src = usuarioCompleto.foto;
        }

        // Preenche a data de cadastro e biografia
        if (bioEl) {
            const data = new Date(usuarioCompleto.dataCadastro).toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric' 
            });
            bioEl.textContent = `Um explorador de mundos literários. Juntou-se em ${data}.`;
        }

        // Preenche os campos do modal de edição com os dados atuais
        const inputNome = document.getElementById('edit-nome');
        const inputNascimento = document.getElementById('edit-nascimento');
        
        if (inputNome) inputNome.value = usuarioCompleto.nome || '';
        if (inputNascimento && usuarioCompleto.nascimento) {
            // Ajustar formato de data yyyy-MM-dd para input tipo date
            const dataNasc = new Date(usuarioCompleto.nascimento);
            if (!isNaN(dataNasc.getTime())) {
                inputNascimento.value = dataNasc.toISOString().split('T')[0];
            }
        }

    } catch (erro) {
        console.error("Erro ao carregar dados do usuário a partir do backend:", erro);
        // Se houver falha de autenticação (Token inválido/expirado), desloga o usuário
        fazerLogout();
    }
}

// Inicializa controles do modal de edição e exclusão de perfil
document.addEventListener('DOMContentLoaded', () => {
    const modalEditar = document.getElementById('model-editar-perfil');
    const btnAbrir = document.getElementById('botao-abrir-editar');
    const btnFechar = document.getElementById('FecharModalEditar');
    const formEditar = document.getElementById('formulario-editar-perfil');
    const btnExcluir = document.getElementById('botao-excluir-conta');

    if (btnAbrir && modalEditar) {
        btnAbrir.addEventListener('click', () => {
            modalEditar.showModal();
        });
    }

    if (btnFechar && modalEditar) {
        btnFechar.addEventListener('click', () => {
            modalEditar.close();
            limparMensagensErro();
        });
    }

    if (formEditar) {
        formEditar.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const inputNome = document.getElementById('edit-nome');
            const inputNascimento = document.getElementById('edit-nascimento');
            const inputSenha = document.getElementById('edit-senha');
            const erroForm = document.getElementById('erro-formulario-editar');
            const sucessoForm = document.getElementById('sucesso-formulario-editar');
            const btnSalvar = document.getElementById('botao-salvar-perfil');

            if (erroForm) erroForm.textContent = '';
            if (sucessoForm) sucessoForm.textContent = '';

            let valido = true;
            // Limpa mensagens de erro individuais
            formEditar.querySelectorAll('.mensagem-erro').forEach(el => el.textContent = '');

            if (!inputNome || !inputNome.value.trim()) {
                const erroNome = document.getElementById('erro-edit-nome');
                if (erroNome) erroNome.textContent = 'Informe seu nome.';
                valido = false;
            }

            if (!inputNascimento || !inputNascimento.value) {
                const erroNasc = document.getElementById('erro-edit-nascimento');
                if (erroNasc) erroNasc.textContent = 'Informe sua data de nascimento.';
                valido = false;
            }

            if (!valido) return;

            if (btnSalvar) {
                btnSalvar.disabled = true;
                btnSalvar.textContent = 'Salvando...';
            }

            try {
                const dadosAtualizados = {
                    nome: inputNome.value.trim(),
                    nascimento: inputNascimento.value
                };

                // Senha só é atualizada se o usuário preencher o campo
                if (inputSenha && inputSenha.value.trim() !== '') {
                    dadosAtualizados.senha = inputSenha.value;
                }

                const response = await atualizarPerfilAPI(dadosAtualizados);
                
                if (sucessoForm) sucessoForm.textContent = response.message || 'Perfil atualizado!';
                
                // Atualiza dados na sessão local para manter consistência no header
                const sessao = getSessao();
                if (sessao) {
                    sessao.nome = response.user.nome;
                    salvarSessao(sessao);
                }
                
                // Recarrega informações visuais
                await carregarDadosUsuario(sessao);
                
                // Fecha o modal após 1.5s
                setTimeout(() => {
                    modalEditar.close();
                    limparMensagensErro();
                }, 1500);

            } catch (erro) {
                console.error("Erro ao atualizar perfil:", erro);
                if (erroForm) erroForm.textContent = erro.message || 'Erro ao salvar alterações.';
            } finally {
                if (btnSalvar) {
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = 'Salvar Alterações';
                }
            }
        });
    }

    if (btnExcluir) {
        btnExcluir.addEventListener('click', async () => {
            const confirmar = confirm("Tem certeza de que deseja excluir sua conta permanentemente? Todos os seus dados serão apagados definitivamente.");
            if (confirmar) {
                try {
                    await excluirPerfilAPI();
                    alert("Sua conta foi excluída com sucesso.");
                    fazerLogout();
                } catch (erro) {
                    console.error("Erro ao excluir conta:", erro);
                    const erroForm = document.getElementById('erro-formulario-editar');
                    if (erroForm) erroForm.textContent = erro.message || 'Erro ao excluir conta.';
                }
            }
        });
    }

    function limparMensagensErro() {
        if (formEditar) {
            formEditar.querySelectorAll('.mensagem-erro').forEach(el => el.textContent = '');
            const erroForm = document.getElementById('erro-formulario-editar');
            const sucessoForm = document.getElementById('sucesso-formulario-editar');
            if (erroForm) erroForm.textContent = '';
            if (sucessoForm) sucessoForm.textContent = '';
            const inputSenha = document.getElementById('edit-senha');
            if (inputSenha) inputSenha.value = '';
        }
    }
});
