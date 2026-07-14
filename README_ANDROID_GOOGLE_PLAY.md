# NR1Check Android / Google Play

Este repositório agora inclui um app Android simples em WebView apontando para:

```txt
https://nr1check.netlify.app/app
```

A ideia é manter o PWA como opção imediata e gerar um AAB para publicar na Google Play.

## Como gerar o AAB no GitHub

1. Abra o repositório no GitHub.
2. Vá em `Actions`.
3. Selecione `Build Android AAB`.
4. Clique em `Run workflow`.
5. Aguarde terminar.
6. Baixe o artifact chamado:

```txt
nr1check-google-play-release
```

Dentro dele haverá:

```txt
NR1Check-v1.0.0.aab
upload-keystore.jks
upload-keystore-passwords.txt
play-store-images/
play-store-listing/
```

## Muito importante sobre a chave

O arquivo `upload-keystore.jks` é a chave de upload do app.

Guarde com segurança:

```txt
upload-keystore.jks
upload-keystore-passwords.txt
```

Para publicar atualizações futuras do mesmo app na Google Play, será necessário usar a mesma chave de upload ou configurar uma chave definitiva como secret do GitHub depois.

## Imagens geradas

O workflow gera automaticamente:

```txt
icon-512.png
feature-graphic-1024x500.png
screenshot-01-funcionario.png
screenshot-02-patrao.png
screenshot-03-pwa.png
```

## Textos da loja

Os textos ficam em:

```txt
play-store/listing/pt-BR/short-description.txt
play-store/listing/pt-BR/full-description.txt
```

## Observação

Esta é uma versão simples para Google Play usando WebView. Ela mantém a lógica do produto no web/PWA e abre a experiência mobile do NR1Check no Android.
