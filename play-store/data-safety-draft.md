# Data Safety — rascunho operacional para Google Play

Este documento serve para preencher a seção **Data Safety** do Google Play Console. Ele deve refletir o comportamento real do app e da plataforma NR1Check.

## Identificação

```txt
App name: NR1Check
Package name: br.com.nr1check.app
Developer: Alternative Ventures Ltda
CNPJ: 61.920.356/0001-38
Privacy Policy URL: https://nr1check.netlify.app/privacidade
Account/Data deletion URL: https://nr1check.netlify.app/excluir-conta
Support URL: https://nr1check.netlify.app/suporte
```

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

Embora o app Android seja um shell mobile/WebView, a plataforma web NR1Check trata dados necessários à operação do produto.

### Informações pessoais

Dados possíveis:

- Nome.
- E-mail.
- Telefone, quando informado.
- CPF de funcionários, quando cadastrado pela empresa.
- Cargo, setor/departamento e vínculo com empresa.

Finalidades:

- autenticação;
- controle de acesso;
- cadastro operacional;
- identificação de funcionário cadastrado;
- resposta a solicitações de suporte;
- segurança da conta e prevenção de uso indevido.

### Informações da empresa

Dados possíveis:

- Nome empresarial.
- CNPJ.
- setor, cargo, departamento;
- dados de empregados inseridos pela empresa;
- status de processos, documentos e evidências.

Finalidades:

- organização do fluxo NR-1 psicossocial;
- gestão de trabalhadores cadastrados;
- geração de documentos e evidências;
- acompanhamento de pendências e plano de ação.

### Saúde e bem-estar / respostas organizacionais

Dados possíveis:

- Respostas de avaliação psicossocial.
- Relatos ou ocorrências enviados.
- Dados organizacionais agregados.

Finalidades:

- geração de achados agregados;
- apoio à gestão organizacional;
- elaboração de plano de ação;
- organização de evidências.

Observação para o Play Console: o produto não realiza diagnóstico médico individual e deve evitar exposição indevida de respostas individuais.

### Informações financeiras

Dados possíveis:

- Pagamentos por Pix via Woovi.
- Status de plano.
- Identificadores de cobrança/transação.

Finalidades:

- liberação de acesso;
- cobrança;
- conciliação;
- prevenção a fraudes;
- suporte financeiro.

## Compartilhamento/processamento por terceiros

Possíveis fornecedores/processadores:

- Clerk: autenticação.
- Supabase/Render/Netlify: infraestrutura, hospedagem e banco de dados.
- Woovi: pagamento Pix.

Declarar conforme a política de privacidade, contratos e funcionamento real.

## Segurança

Declarar somente o que for verdadeiro:

- dados trafegam por HTTPS;
- acesso de patrão/RH exige autenticação;
- acesso de funcionário depende de empresa + CPF/token;
- áreas pagas dependem de status de cobrança;
- não há solicitação nativa de câmera, localização, microfone, contatos, SMS ou arquivos.

## Exclusão de conta e dados

URL obrigatória no Play Console:

```txt
https://nr1check.netlify.app/excluir-conta
```

A página pública informa:

- quem pode solicitar exclusão;
- como solicitar por e-mail ou WhatsApp;
- dados necessários para localizar a conta;
- limitações de retenção por obrigações legais, auditoria, segurança, defesa de direitos e registros financeiros;
- tratamento específico para funcionários cadastrados por empresas contratantes.

## Sugestão de preenchimento no Play Console

- O app coleta dados pessoais? Sim.
- Dados são criptografados em trânsito? Sim, via HTTPS.
- Usuários podem solicitar exclusão de dados? Sim.
- Link de exclusão: https://nr1check.netlify.app/excluir-conta
- O app compartilha dados com terceiros? Sim, com operadores necessários para autenticação, infraestrutura, pagamento e suporte.
- Público-alvo: empresas, trabalhadores vinculados a empresas, RH, gestores, contadores e consultores. Não direcionado a crianças.
