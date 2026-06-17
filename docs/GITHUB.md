# Como subir o projeto pro GitHub

## Setup local

```bash
cd nr1check
git init
git add .
git commit -m "feat: initial NR1Check monorepo"
```

## Conectar ao GitHub

1. Crie um repositório novo em https://github.com/new
   - **NÃO** marque "Add README", "Add .gitignore" ou "Add license" (já temos tudo)
2. Conecte e faça push:

```bash
git remote add origin https://github.com/SEU_USUARIO/nr1check.git
git branch -M main
git push -u origin main
```

## Configurar Secrets (opcional, para CI/CD)

Em **Settings → Secrets and variables → Actions**, adicione:
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`
- `RENDER_DEPLOY_HOOK`

## Branches recomendadas

- `main` → produção (deploys automáticos no Netlify + Render)
- `develop` → staging (deploys em ambiente separado)
- `feat/*` → features em desenvolvimento
