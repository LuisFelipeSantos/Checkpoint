# Imagens privadas no Cloudflare R2

Esta pasta contém o gateway seguro das imagens do Checkpoint. O bucket permanece privado; o Worker valida a sessão do Supabase antes de gravar, assinar ou excluir uma imagem.

## Limites de segurança

- 8 GB para todo o bucket, deixando margem abaixo da franquia de 10 GB-mês.
- 200 MB de imagens por usuário.
- 2 MB por imagem já otimizada.
- `GET /usage` informa o consumo autenticado para exibição no aplicativo.

O Worker recusa novos uploads quando uma das cotas seria ultrapassada. Como o R2 mede armazenamento em GB-mês e também cobra operações acima da franquia, acompanhe o painel de uso e configure um alerta de orçamento na Cloudflare.

## Configuração

1. Ative o R2 no painel Cloudflare e crie o bucket privado `checkpoint-images`.
2. Copie `wrangler.toml.example` para `wrangler.toml` e ajuste os valores públicos.
3. Gere um segredo longo e cadastre-o somente no Worker com `npx wrangler secret put SIGNING_SECRET`.
4. Publique com `npx wrangler deploy`.
5. Cadastre a URL pública do Worker no front-end do Checkpoint.

Nunca coloque Access Key, Secret Access Key ou `SIGNING_SECRET` no GitHub, no navegador ou no chat. O plano gratuito do R2 inclui 10 GB-mês; uso excedente e operações acima da franquia podem ser cobrados.
