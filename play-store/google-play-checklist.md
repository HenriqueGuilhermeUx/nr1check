# Checklist Google Play — NR1Check

## Arquivos gerados pelo GitHub Actions

Workflow:

```txt
Actions → Build Android APK and AAB → Run workflow
```

Artifact:

```txt
nr1check-android-apk-aab-google-play
```

Conteúdo esperado:

```txt
apk/NR1Check-teste-debug.apk
aab/NR1Check-v1.0.0.aab
signing/upload-keystore.jks
signing/upload-keystore-passwords.txt
play-store/images/icon-512.png
play-store/images/feature-graphic-1024x500.png
play-store/images/screenshot-01-funcionario.png
play-store/images/screenshot-02-patrao.png
play-store/images/screenshot-03-pwa.png
play-store/listing/pt-BR/short-description.txt
play-store/listing/pt-BR/full-description.txt
```

## Informações principais

Nome do app:

```txt
NR1Check
```

Package name:

```txt
br.com.nr1check.app
```

Categoria sugerida:

```txt
Business / Productivity
```

Site:

```txt
https://nr1check.netlify.app
```

Política de privacidade:

```txt
https://nr1check.netlify.app/privacidade
```

Termos:

```txt
https://nr1check.netlify.app/termos
```

Disclaimer:

```txt
https://nr1check.netlify.app/disclaimer
```

## App access para revisão

Se a Google Play pedir credenciais:

1. Criar uma conta teste de patrão/RH no Clerk.
2. Ativar `billing_status = active` para a empresa teste.
3. Cadastrar pelo menos 1 funcionário teste com CPF.
4. Informar no campo de acesso:

```txt
Conta patrão/RH de teste:
E-mail: [preencher]
Senha/instrução: [preencher]

Funcionário teste:
Abrir /acesso-funcionario?companyId=[ID]
CPF: [preencher]
Token: [preencher ou informar que é enviado pelo fluxo]
```

## Data Safety — orientação inicial

O app usa apenas permissão nativa de internet. Não solicita câmera, localização, microfone, contatos, SMS ou armazenamento.

Dados tratados pela plataforma web:

- nome/e-mail do usuário contratante;
- dados da empresa;
- dados cadastrais de trabalhadores inseridos pela empresa;
- respostas de avaliação psicossocial;
- relatos enviados;
- documentos e evidências cadastradas.

Preencher a seção Data Safety de forma consistente com a Política de Privacidade.

## Regras de descrição

Evitar promessas como:

- “regulariza automaticamente”;
- “substitui laudo”;
- “garante conformidade”;
- “diagnostica burnout”;
- “elimina risco de multa”.

Usar linguagem segura:

- “apoia a organização”;
- “organiza evidências”;
- “ajuda a conduzir o fluxo”;
- “não substitui profissional habilitado”.
