# CSS modular do Literaverse

Este diretório contém estilos modulares que substituem o antigo `estilo.css`. A divisão foi feita por responsabilidade para facilitar manutenção.

Arquivos e propósito:

- `base.css` — variáveis CSS, reset e tipografia base.
- `header.css` — estilos do cabeçalho e navegação principal.
- `layout.css` — grid, containers e estruturas de página.
- `components.css` — botões, formulários e componentes compartilhados.
- `cards.css` — estilos para cartões/listagens (biblioteca, livros).
- `perfil.css` — estilos específicos da página de usuário/perfil.
- `footer.css` — rodapé e áreas relacionadas.
- `responsive.css` — media queries e ajustes responsivos.
- `editor.css` — estilos específicos para a página de escrita (editor WYSIWYG, modal, rascunhos).

Importância/ordem de importação:
1. `base.css`
2. `layout.css`
3. `header.css`
4. `components.css`
5. `cards.css`
6. `perfil.css`
7. `editor.css` (carregado apenas onde necessário)
8. `footer.css`
9. `responsive.css` (último para sobrescrever quando necessário)

Notas:
- Mantivemos `estilo.css` como arquivo legado (comentado) para compatibilidade. Novos estilos devem ser adicionados aos módulos existentes ou a novos arquivos específicos.
- Prefira classes utilitárias em `components.css` em vez de estilos inline.
- Para alterar variáveis (cores, espaçamentos), atualize `base.css`.
- Paleta de Cores:
    Azul Marinho Escuro	#1A1934
	Azul Real/Índigo	#343D75
	Azul Lavanda Médio	#6B74B8
	Roxo/Malva Acinzentado	#996E9C
	Bege Claro/Pêssego Pálido	#F4E0CC

Como contribuir:
- Adicione novas classes em `components.css` quando forem genéricas.
- Para componentes de página únicos, crie/edite o arquivo correspondente (`perfil.css`, `editor.css`, etc.).
- Atualize este README caso adicione ou renomeie arquivos.
