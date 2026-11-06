# Checkpoint — Diário de Jogos

Protótipo de um aplicativo para organizar jogos, tarefas, anotações, pastas, subpastas e pontos de backtracking.

## Funcionalidades atuais

- Biblioteca de jogos com busca e filtros
- Status manual de jogo zerado
- Avaliação de 0 a 100
- Pastas e subpastas personalizáveis
- Tarefas com checkbox e anotações de texto
- Filtros por tipo e por conclusão
- Banner personalizado por URL ou upload
- Dados salvos localmente no navegador
- Edição e exclusão de jogos, pastas, subpastas e itens
- Busca dentro de cada pasta
- Movimentação de itens entre pastas e subpastas
- Imagens anexadas às tarefas e anotações
- Imagens por URL em tarefas e anotações, sem ocupar o armazenamento de uploads
- Otimização automática de uploads para WebP, com redimensionamento proporcional e prévia da economia
- Exportação e importação de backup em JSON

## Executar localmente

Abra `dist/index.html` no navegador ou sirva a pasta `dist` com um servidor HTTP local.

## Versões

O projeto usa versionamento semântico. As versões estáveis são identificadas por tags como `v0.1.0`.

### v0.2.0

Primeiro pacote de gerenciamento de dados: edição, exclusão com confirmação, busca interna, anexos, movimentação e backup portátil. Integrações externas e conquistas não fazem parte desta versão.

## Segurança

- Nunca armazenar senhas, tokens, chaves de API ou segredos no repositório ou no código do front-end.
- Usar HTTPS para dados em trânsito e criptografia apropriada para dados sensíveis armazenados.
- Armazenar credenciais em variáveis de ambiente ou gerenciadores de segredos.
- Aplicar autenticação, autorização por usuário e regras de acesso no banco e no armazenamento.
- Coletar somente os dados pessoais necessários e oferecer meios seguros de exportação e exclusão.
- Revisar dependências, permissões, logs e políticas de backup antes de cada versão pública.

O protótipo atual salva apenas dados locais no navegador e não deve ser usado para guardar informações sensíveis.

## Backend em preparação

O esquema inicial do Supabase e suas políticas RLS estão em `supabase/`. Consulte `supabase/README.md` antes de conectar autenticação ou dados reais.


