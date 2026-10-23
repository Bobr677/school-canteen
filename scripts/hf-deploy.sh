#!/usr/bin/env bash
set -euo pipefail
: "${HF_TOKEN:?нужен HF_TOKEN}"
REPO=/home/z/my-project
STAGE=$REPO/hf-stage

HF_USER=$(curl -sf https://huggingface.co/api/whoami-v2 -H "Authorization: Bearer $HF_TOKEN" | sed -n 's/.*"name":"\([^"]*\)".*/\1/p')
[ -n "$HF_USER" ] || { echo "FAIL: HF token invalid"; exit 1; }
echo "HF user: $HF_USER"

rm -rf "$STAGE"; mkdir -p "$STAGE"
rsync -a --exclude .git --exclude node_modules --exclude .next --exclude db/ \
      --exclude '.env*' --exclude .vercel --exclude '*.log' --exclude hf-stage \
      --exclude download --exclude upload --exclude agent --exclude docs \
      --exclude skills --exclude skills-lock.json --exclude worklog.md \
      --exclude scripts --exclude prisma/dev.db --exclude '*/dev.db*' \
      "$REPO/" "$STAGE/"
cp "$REPO/scripts/hf-files/Dockerfile" "$STAGE/Dockerfile"
cp "$REPO/scripts/hf-files/.dockerignore" "$STAGE/.dockerignore"
cp "$REPO/scripts/hf-files/README.md" "$STAGE/README.md"

if ! curl -sf -X POST https://huggingface.co/api/repos/create \
     -H "Authorization: Bearer $HF_TOKEN" -H 'Content-Type: application/json' \
     -d '{"type":"space","name":"obedclass","sdk":"docker","private":false}' >/dev/null; then
  echo "space already exists (ok)"
fi

cd "$REPO"
vercel env pull .env.tmp.pull --environment production --yes --token "$VERCEL_TOKEN" >/dev/null 2>&1
POOL=$(grep '^DATABASE_URL=' .env.tmp.pull | cut -d= -f2- | tr -d '"')
DIRECT=$(grep '^DATABASE_URL_UNPOOLED=' .env.tmp.pull | cut -d= -f2- | tr -d '"')
rm -f .env.tmp.pull
[ -n "$POOL" ] && [ -n "$DIRECT" ] || { echo "FAIL: пустые DATABASE_URL/DIRECT_URL"; exit 1; }
SECRET=$(openssl rand -hex 24)

for KV in "DATABASE_URL:$POOL" "DIRECT_URL:$DIRECT" "SESSION_SECRET:$SECRET"; do
  K=${KV%%:*}; V=${KV#*:}
  PAYLOAD=$(python3 -c "import json,sys;print(json.dumps({'value':sys.argv[1]}))" "$V")
  if curl -sf -X PUT "https://huggingface.co/api/spaces/$HF_USER/obedclass/secrets/$K" \
       -H "Authorization: Bearer $HF_TOKEN" -H 'Content-Type: application/json' \
       -d "$PAYLOAD" >/dev/null; then
    echo "secret $K set"
  else
    echo "FAIL: secret $K"; exit 1
  fi
done

cd "$STAGE"
git init -q -b main 2>/dev/null || git init -q
git add -A
git -c user.email=agent@local -c user.name=agent commit -qm "deploy obedclass to hf space"
git push -q -f "https://$HF_USER:$HF_TOKEN@huggingface.co/spaces/$HF_USER/obedclass" main
echo "PUSHED. App URL: https://$HF_USER-obedclass.hf.space"
echo "SPACE_API: https://huggingface.co/api/spaces/$HF_USER/obedclass/runtime"
