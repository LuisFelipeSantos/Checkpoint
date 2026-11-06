# Política de segurança

## Princípios

O Checkpoint deve aplicar segurança e privacidade desde o desenvolvimento. Dados importantes devem ser protegidos em trânsito e em repouso, com acesso limitado ao usuário autorizado.

## Requisitos para a versão com nuvem

- TLS/HTTPS obrigatório em todas as conexões.
- Senhas processadas exclusivamente pelo provedor de autenticação, com hash forte e salt; nunca armazenadas em texto puro.
- Tokens e chaves mantidos somente no servidor ou em um gerenciador de segredos.
- Criptografia do banco, backups e arquivos armazenados.
- Políticas por usuário no banco e no storage para impedir acesso entre contas.
- Validação e sanitização de entradas, limites de upload e verificação do tipo de arquivo.
- Expiração de sessões, proteção contra abuso e registro de eventos de segurança sem dados sensíveis.
- Plano de backup, recuperação, exportação e exclusão de dados.

## Relato de vulnerabilidades

Evite publicar vulnerabilidades com dados sensíveis em issues públicas. Quando um canal privado de segurança for configurado no GitHub, utilize-o para os relatos.

