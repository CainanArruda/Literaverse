        // --- Lógica da Página de Cadastro (cadastro.html) ---
    const formCadastro = document.getElementById('formulario-cadastro');
    if (formCadastro) {
        console.log("Página de cadastro detectada.");
        
        // (Função validarSenha do script.js original)
        function validarSenha(valor) {
           const erros = [];
            if (!valor || valor.length < 8) {
                erros.push('Mínimo de 8 caracteres.');
            }
            if (!/[A-Z]/.test(valor)) erros.push('Inclua pelo menos uma letra maiúscula.');
            if (!/[a-z]/.test(valor)) erros.push('Inclua pelo menos uma letra minúscula.');
            if (!/\d/.test(valor)) erros.push('Inclua pelo menos um número.');
            if (!/[!@#\$%\^&\*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(valor)) erros.push('Inclua pelo menos um caractere especial.');
            if (/(.)\1\1/.test(valor)) erros.push('Não use o mesmo caractere repetido 3 vezes seguidas.');
            
            function temSequencia(s) {
                const seqLen = 3;
                for (let i = 0; i <= s.length - seqLen; i++) {
                    const slice = s.slice(i, i + seqLen);
                    if (/^[0-9]+$/.test(slice) || /^[a-zA-Z]+$/.test(slice)) {
                        const codes = slice.split('').map(ch => ch.charCodeAt(0));
                        let asc = true, desc = true;
                        for (let j = 1; j < codes.length; j++) {
                            if (codes[j] !== codes[j - 1] + 1) asc = false;
                            if (codes[j] !== codes[j - 1] - 1) desc = false;
                        }
                        if (asc || desc) return true;
                    }
                }
                return false;
            }
            if (temSequencia(valor)) erros.push('Evite sequências (ex: 123 ou abc).');
            return erros;
        }

        formCadastro.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("Formulário de cadastro enviado.");

            const nome = document.getElementById('nome');
            const usuarioEl = document.getElementById('usuario');
            const email = document.getElementById('email');
            const nascimento = document.getElementById('nascimento');
            const senha = document.getElementById('senha');
            const confirmar = document.getElementById('confirmar-senha');
            const termos = document.getElementById('termos');
            const erroForm = document.getElementById('erro-formulario');

            let valido = true;
            formCadastro.querySelectorAll('.mensagem-erro').forEach(el => el.textContent = '');

            if (!nome || !nome.value.trim()) { document.getElementById('erro-nome').textContent = 'Informe seu nome.'; valido = false; }
            if (!usuarioEl || !usuarioEl.value.trim()) { document.getElementById('erro-usuario').textContent = 'Informe um nome de usuário.'; valido = false; }
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { document.getElementById('erro-email').textContent = 'Email inválido.'; valido = false; }
            if (!nascimento || !nascimento.value) { document.getElementById('erro-nascimento').textContent = 'Informe sua data de nascimento.'; valido = false; }

            const errosSenha = validarSenha(senha ? senha.value : '');
            if (errosSenha.length) {
                document.getElementById('erro-senha').textContent = errosSenha.join(' ');
                valido = false;
            }

            if (senha && confirmar && senha.value !== confirmar.value) { document.getElementById('erro-confirmar-senha').textContent = 'As senhas não coincidem.'; valido = false; }
            if (!termos || !termos.checked) { if(erroForm) erroForm.textContent = 'Aceite os termos para continuar.'; valido = false; }

            if (!valido) {
                console.warn("Validação do formulário falhou.");
                return;
            }
            
            const novoUsuario = {
                nome: nome.value.trim(),
                usuario: usuarioEl.value.trim(),
                email: email.value.toLowerCase(),
                nascimento: nascimento.value,
                senha: senha.value
            };

            const botao = document.getElementById('botao-enviar');
            if (botao) { botao.disabled = true; botao.textContent = 'Criando conta...'; }

            // Usando a simulação de API 
            simularRegistroAPI(novoUsuario)
                .then(sessaoUsuario => {
                    // Sucesso no registro
                    console.log("Registro bem-sucedido, salvando sessão...");
                    salvarSessao(sessaoUsuario);
                    
                    // Redireciona para o perfil
                    window.location.href = 'usuario.html';
                })
                .catch(erro => {
                    // Falha no registro (ex: email duplicado)
                    console.error("Falha no registro:", erro.message);
                    if (erro.message.includes('email')) {
                        document.getElementById('erro-email').textContent = erro.message;
                    } else if (erro.message.includes('usuário')) {
                         document.getElementById('erro-usuario').textContent = erro.message;
                    } else {
                        if(erroForm) erroForm.textContent = erro.message;
                    }
                    if (botao) { botao.disabled = false; botao.textContent = 'Criar conta'; }
                });
        });
    }