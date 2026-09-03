#!/usr/bin/env bash
# Download tool icons locally so the site doesn't depend on third-party CDNs.
# (Most entries point to cdn.fanquanpintuan.cn, whose TLS certificate is
# expired, so browsers refuse to load images from it.)
# Files land in public/icons/<id>.png and are gitignored; CI re-fetches them.
set -u
cd "$(dirname "$0")/.."

mkdir -p public/icons

jq -r '.[] | select(.image != null) | .id + "\t" + .image' data.json |
  while IFS=$'\t' read -r id img; do
    [ -s "public/icons/$id.png" ] || [ -s "public/icons/$id.svg" ] ||
      printf '%s\t%s\n' "$id" "$img"
  done |
  xargs -P 16 -n 2 sh -c \
    'curl -sfkL --max-time 25 -o "public/icons/$0.png" "$1" \
     && file "public/icons/$0.png" | grep -qiE "image|icon" \
     || rm -f "public/icons/$0.png";
     if [ -f "public/icons/$0.png" ] \
        && file "public/icons/$0.png" | grep -qi "scalable vector"; then
       mv "public/icons/$0.png" "public/icons/$0.svg";
     fi'

echo "icons: $(ls public/icons | wc -l | tr -d ' ') files"
