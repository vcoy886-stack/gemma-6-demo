#!/bin/bash
set -euo pipefail

# Este repo es un sitio estático (HTML/CSS/JS puro) sin build step. El único
# subproyecto con dependencias es mini-apps/payments-api (funciones
# serverless de Node para el checkout de Wompi). Instala dependencias Node
# en cualquier carpeta que tenga package.json, para que sigan funcionando
# cuando se le agreguen dependencias reales.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

find . -maxdepth 3 -name "package.json" -not -path "*/node_modules/*" -not -path "./.git/*" | while read -r pkg; do
  dir="$(dirname "$pkg")"
  echo "Instalando dependencias Node en $dir"
  (cd "$dir" && npm install)
done
