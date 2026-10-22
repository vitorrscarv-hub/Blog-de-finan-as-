#!/usr/bin/env bash
# Uso: scripts/abrir-pr.sh <branch> <titulo> <corpo>
# Se houve mudança em src/, cria a branch, faz o commit e abre o pull request para o main. Nunca faz merge:
# publicar é decisão de Vitor. Sem mudança, ou com a branch já enviada antes, não faz nada.
set -euo pipefail
branch="$1"; titulo="$2"; corpo="$3"

if [ -z "$(git status --porcelain src)" ]; then echo "sem mudanças"; exit 0; fi
if git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then echo "branch $branch já existe: nada a fazer"; exit 0; fi

git config user.name "Rotinas Grafous"
git config user.email "rotinas@users.noreply.github.com"
git checkout -b "$branch"
git add src
git commit -m "$titulo"
git push origin "$branch"
gh pr create --base main --head "$branch" --title "$titulo" --body "$corpo"
