function carregarDadosUsuario(sessao) {
    console.log("Carregando dados do usuário na página de perfil...");
    const nomeEl = document.getElementById('perfil-nome-usuario');
    const bioEl = document.getElementById('perfil-bio-usuario');
    const fotoEl = document.getElementById('perfil-avatar'); // Seleciona a foto pelo ID novo

    const usuarios = getUsuariosDB();
    const usuarioCompleto = usuarios.find(u => u.id === sessao.id);

    if (!usuarioCompleto) {
        console.error("Dados não encontrados. Forçando logout.");
        fazerLogout();
        return;
    }

    // Preenche o Nome
    if (nomeEl) {
        nomeEl.textContent = usuarioCompleto.nome || usuarioCompleto.usuario;
    }

    // Preenche a Foto (Se não tiver foto salva, usa o placeholder padrão)
    if (fotoEl && usuarioCompleto.foto) {
        fotoEl.src = usuarioCompleto.foto;
    }

    // Preenche a Bio/Data
    if (bioEl) {
        const data = new Date(usuarioCompleto.dataCadastro).toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
        });
        bioEl.textContent = `Um explorador de mundos literários. Juntou-se em ${data}.`;
    }
}
