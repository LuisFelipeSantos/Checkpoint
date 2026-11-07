# Imagens privadas no Cloudflare R2

Esta pasta contém o gateway seguro das imagens do Checkpoint. O bucket permanece privado; o Worker valida a sessão do Supabase antes de gravar, assinar ou excluir uma imagem.

## Configuração

1. Ative o R2 no painel Cloudflare e crie o bucket privado `checkpoint-images`.
2. Copie `wrangler.toml.example` para `wrangler.toml` e ajuste os valores públicos.
3. Gere um segredo longo e cadastre-o somente no Worker com `npx wrangler secret put SIGNING_SECRET`.
4. Publique com `npx wrangler deploy`.
5. Cadastre a URL pública do Worker no front-end do Checkpoint.

Nunca coloque Access Key, Secret Access Key ou `SIGNING_SECRET` no GitHub, no navegador ou no chat. O plano gratuito do R2 inclui 10 GB-mês; uso excedente e operações acima da franquia podem ser cobrados.
