#!/bin/sh
# Сборка статической версии в docs/ (для GitHub Pages) без npm install:
# библиотеки подгружаются из CDN esm.sh через import map.
set -e
if [ -z "$ESBUILD" ]; then ESBUILD="npx esbuild"; fi
mkdir -p ../docs
$ESBUILD src/main.jsx --bundle --format=esm --jsx=automatic --minify \
  --external:react --external:react/jsx-runtime --external:react-dom/client \
  --external:react-router-dom --external:@supabase/supabase-js \
  --loader:.css=empty --outfile=../docs/app.js
cp src/styles.css ../docs/styles.css
cp static-index.html ../docs/index.html
touch ../docs/.nojekyll
