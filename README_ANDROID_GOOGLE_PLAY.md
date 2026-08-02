# NR1Check Android / Google Play

Este repositório inclui um app Android simples e objetivo, usando WebView seguro para abrir a experiência mobile:

```txt
https://nr1check.netlify.app/app?source=android
```

A estratégia de lançamento é dupla:

1. **PWA imediato**: clientes usam pelo navegador e adicionam à tela inicial.
2. **App Android oficial**: APK para teste e AAB para Google Play.

## O que o app entrega no dia a dia

### Funcionários

- Acesso por link da empresa.
- CPF cadastrado pela empresa.
- Código/token de acesso.
- Avaliação psicossocial.
- Canal de relatos.
- Documentos/comunicados e ciência.

### Patrões, RH e gestores

- Cockpit da empresa.
- Checklist do que falta fazer.
- Importação/cadastro de funcionários.
- Link pronto para enviar aos trabalhadores.
- Acompanhamento de avaliação, plano e documentos.

### Contadores e consultores

- Mantido como opção complementar.
- Multiempresas.
- Cadastro de clientes.
- Importação de folha/CSV.
- Status por cliente.

## Como gerar APK e AAB

No GitHub:

```txt
Actions → Build Android APK and AAB → Run workflow
```

Baixe o artifact:

```txt
nr1check-android-apk-aab-google-play
```

Dentro dele haverá:

```txt
apk/NR1Check-teste-debug.apk
apk/NR1Check-release.apk
aab/NR1Check-v1.0.0.aab
signing/upload-keystore.jks
signing/upload-keystore-passwords.txt
play-store/images/
play-store/listing/
```

## Qual arquivo usar

### Para testar em celular Android

Use:

```txt
apk/NR1Check-teste-debug.apk
```

Envie para seu próprio celular, instale e teste.

### Para Google Play

Use:

```txt
aab/NR1Check-v1.0.0.aab
```

A Google Play exige AAB para novos apps.

## Chave de upload

Se você publicar o primeiro AAB gerado com a chave temporária do workflow, guarde para sempre:

```txt
signing/upload-keystore.jks
signing/upload-keystore-passwords.txt
```

Sem essa chave, você pode perder a capacidade de atualizar o app.

Recomendado para produção: criar uma chave definitiva e salvar nos GitHub Secrets:

```txt
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
```

## Dados para Google Play

Nome do app:

```txt
NR1Check
```

Descrição curta:

```txt
NR-1 psicossocial para funcionários, patrões e RH, com acesso simples pelo celular.
```

Categoria sugerida:

```txt
Business / Productivity
```

URL de política de privacidade:

```txt
https://nr1check.netlify.app/privacidade
```

URL pública do app/PWA:

```txt
https://nr1check.netlify.app/app
```

## Permissões Android

O app usa apenas:

```txt
INTERNET
```

Não solicita câmera, localização, microfone, agenda, arquivos ou SMS.

## Requisitos de revisão Google Play

Se a Google pedir acesso para revisão, forneça instruções claras:

- Para funcionário: abrir app, tocar em “Acesso funcionário”, usar link/empresa/CPF/token de teste.
- Para patrão/RH: usar conta de teste paga ou liberar uma conta de demonstração.
- Informar que o app não realiza diagnóstico médico individual e não substitui profissional habilitado.

## Observação legal

O NR1Check organiza fluxo, evidências e documentos de apoio. A empresa contratante continua responsável pela validação técnica, jurídica, trabalhista e de SST aplicável.
