# Supabase — configuração do Checkpoint

## Etapa 1: criar o banco seguro

1. Crie um projeto em <https://supabase.com/dashboard>.
2. Selecione uma região próxima dos usuários.
3. Gere e guarde a senha forte do banco em um gerenciador de senhas.
4. No painel, abra **SQL Editor** e crie uma nova consulta.
5. Copie todo o conteúdo de `migrations/20261106170000_initial_schema.sql` e execute uma única vez.
6. Confirme no **Table Editor** que existem `profiles`, `games`, `folders` e `note_items`.
7. Em **Authentication > Providers**, mantenha inicialmente apenas **Email** habilitado.

## Segurança

- O navegador usará somente a URL do projeto e a chave **publishable/anon**.
- Nunca coloque `service_role`, senha do banco ou access token no front-end ou no GitHub.
- Todas as tabelas públicas desta migração têm RLS habilitado.
- O papel `anon` não recebe acesso às tabelas.
- Usuários autenticados recebem permissões limitadas e políticas por `auth.uid()`.

O Storage será configurado em uma migração separada, depois que login e sincronização básica estiverem funcionando.

