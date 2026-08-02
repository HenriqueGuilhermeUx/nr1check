# Data Safety — rascunho para Google Play

Este documento é um apoio para preencher a seção Data Safety. A resposta final deve ser revisada antes do envio à Google Play.

## Permissões nativas Android

O app Android solicita apenas:

```txt
android.permission.INTERNET
```

Não solicita permissões nativas de:

- localização;
- câmera;
- microfone;
- contatos;
- SMS;
- telefone;
- armazenamento externo;
- agenda/calendário.

## Coleta/tratamento de dados pela plataforma

Embora o app Android seja um shell mobile, a plataforma web NR1Check trata dados necessários para operação do produto.

Possíveis categorias:

### Informações pessoais

- Nome.
- E-mail.
- Telefone, quando informado.
- CPF de funcionários, quando cadastrado pela empresa.

Finalidade:

- autenticação;
- controle de acesso;
- cadastro operacional;
- identificação de funcionário cadastrado.

### Informações da empresa

- Nome empresarial.
- CNPJ.
- setor/cargo/departamento;
- dados de empregados inseridos pela empresa.

Finalidade:

- organização do fluxo NR-1;
- gestão de trabalhadores cadastrados;
- geração de documentos e evidências.

### Saúde e bem-estar / respostas organizacionais

- Respostas de avaliação psicossocial.
- Relatos ou ocorrências enviados.

Finalidade:

- geração de achados agregados;
- apoio à gestão organizacional;
- plano de ação;
- evidências.

Observação: o produto deve evitar diagnóstico médico individual.

### Informações financeiras

- Pagamentos por Pix via Woovi.
- Status de plano.

Finalidade:

- liberação de acesso;
- cobrança;
- gestão de assinatura.

## Compartilhamento

Possíveis terceiros/processadores:

- Clerk: autenticação.
- Supabase/Render/Netlify: infraestrutura e hospedagem.
- Woovi: pagamento Pix.

Declarar conforme a política de privacidade e contratos/termos de cada fornecedor.

## Segurança

Declarar somente o que for verdadeiro:

- dados trafegam por HTTPS;
- acesso de patrão/RH exige autenticação;
- acesso de funcionário depende de empresa + CPF/token;
- áreas pagas dependem de status de cobrança.

## Exclusão de dados

Criar/usar canal de solicitação de exclusão previsto na Política de Privacidade:

```txt
https://nr1check.netlify.app/privacidade
```

Sugestão operacional: manter um procedimento interno para solicitações de exclusão/correção de dados.
