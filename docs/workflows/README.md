# GitHub Actions Workflows

Estes arquivos de workflow precisam ser **adicionados manualmente** em `.github/workflows/` no GitHub porque exigem um Personal Access Token (PAT) com scope `workflow`.

## Por que não estão no repo automaticamente?

Por segurança, o GitHub **bloqueia** pushes que modificam `.github/workflows/*.yml` quando o PAT não tem o scope `workflow`. Isso evita que tokens comprometidos alterem seus CI/CD.

## Como ativar

### Opção 1 — Token novo com scope workflow (recomendado)

1. Vá em https://github.com/settings/tokens/new
2. Marque o scope **`workflow`** (além dos outros que você precisa: `repo`, `read:packages`)
3. Use esse novo token pra subir o workflow

### Opção 2 — Adicionar manualmente pelo GitHub UI

1. Vá em https://github.com/HenriqueGuilhermeUx/nr1check/tree/main/.github/workflows
2. Clique em **Add file → Create new file**
3. Nome: `ci.yml`
4. Cole o conteúdo de `ci.yml` deste diretório
5. Commit

### Opção 3 — Mover os arquivos pelo terminal

```bash
mkdir -p .github/workflows
mv docs/workflows/ci.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml
git rm docs/workflows/ci.yml
# Use um token com scope workflow
git push
```

Depois da primeira subida, você pode voltar a usar o token antigo normalmente — o bloqueio só acontece na criação/edição de arquivos em `.github/workflows/`.
