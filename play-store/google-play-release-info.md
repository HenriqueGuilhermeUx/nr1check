# NR1Check — Informações finais para Google Play Console

## Identidade do app

```txt
Nome do app: NR1Check
Package name / Application ID: br.com.nr1check.app
Versão inicial: 1.0.0
Version code: 1
Desenvolvedor: Alternative Ventures Ltda
CNPJ: 61.920.356/0001-38
Categoria sugerida: Business ou Productivity
Público-alvo: 18+ / profissionais / empresas
```

## URLs obrigatórias/recomendadas

```txt
Política de Privacidade:
https://nr1check.netlify.app/privacidade

Exclusão de conta e dados:
https://nr1check.netlify.app/excluir-conta

Suporte:
https://nr1check.netlify.app/suporte

Termos de Uso:
https://nr1check.netlify.app/termos

Disclaimer técnico/jurídico:
https://nr1check.netlify.app/disclaimer
```

## Conta de teste para revisão Google Play

```txt
E-mail: notarizex@gmail.com
Perfil: patrão/RH
Acesso: liberado como conta de revisão Google Play
Empresa demo: Empresa Demonstração Google Play
```

Informe a senha cadastrada por você no campo de credenciais do Play Console.

Fluxo para o revisor:

```txt
1. Abrir o app NR1Check
2. Tocar em “Sou patrão, RH ou gestor”
3. Entrar com notarizex@gmail.com e a senha informada no Play Console
4. O app volta para o painel rápido
5. Abrir Minha empresa, Funcionários, Enviar link, Avaliação, Documentos ou Relatos
6. Usar o botão “Sair” no topo para encerrar a sessão
```

## Descrição curta

```txt
App NR-1 psicossocial para funcionários, patrões, RH e gestores.
```

## Descrição longa

```txt
NR1Check é um app de apoio à organização da NR-1 psicossocial para empresas brasileiras.

O app foi desenhado para uso simples no celular por funcionários, patrões, RH e gestores.

FUNCIONÁRIOS
- Acesso por link enviado pela empresa.
- Entrada com CPF cadastrado e código/token.
- Resposta de avaliação psicossocial pelo celular.
- Canal de relatos para situações sensíveis.
- Acesso a documentos, comunicados e confirmações de ciência.

PATRÕES, RH E GESTORES
- Painel rápido da empresa.
- Checklist do que falta fazer.
- Cadastro e importação de trabalhadores.
- Envio de link do app aos funcionários.
- Acompanhamento de avaliações, achados, plano de ação e documentos.
- Organização de evidências para gestão interna.

PRIVACIDADE E CONTROLE
- Política de Privacidade pública.
- Canal público de suporte.
- Canal público de solicitação de exclusão de conta e dados.
- Acesso de funcionários condicionado a empresa, CPF cadastrado e código/token.
- Acesso de patrão/RH condicionado à autenticação e vínculo com empresa.

O NR1Check não realiza diagnóstico médico individual e não substitui profissional legalmente habilitado, médico, psicólogo, técnico ou engenheiro de segurança, advogado ou consultor especializado.

A plataforma organiza dados, fluxos, documentos e evidências para apoiar a gestão empresarial, mantendo a responsabilidade técnica, legal, trabalhista e operacional com a empresa contratante e seus profissionais designados.
```

## Arquivos que o GitHub Actions gera

Artifact:

```txt
nr1check-android-apk-aab-google-play
```

Dentro dele:

```txt
apk/NR1Check-teste-debug.apk
apk/NR1Check-release.apk
aab/NR1Check-v1.0.0.aab
signing/upload-keystore.jks
signing/upload-keystore-passwords.txt
play-store/images/icon-512.png
play-store/images/feature-graphic-1024x500.png
play-store/images/screenshot-01-funcionario.png
play-store/images/screenshot-02-patrao.png
play-store/images/screenshot-03-acesso.png
```

## Imagens exigidas

O script `scripts/generate_play_assets.py` gera:

```txt
Ícone: 512 x 512
Feature graphic: 1024 x 500
Screenshots: 1080 x 1920
```

## Observação sobre a chave

Se o primeiro AAB publicado usar a keystore gerada pelo workflow, guarde para sempre:

```txt
signing/upload-keystore.jks
signing/upload-keystore-passwords.txt
```

Sem essa chave, futuras atualizações do mesmo app ficam comprometidas.
