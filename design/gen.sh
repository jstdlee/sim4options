#!/usr/bin/env bash
# Generate style candidate images with Grok Build (image_gen). Usage: design/gen.sh [jobs-file]
# Each job line: name|aspect_ratio|prompt. Output: design/candidates/<name>.png
set -u
cd "$(dirname "$0")/${OUT:-candidates}"
JOBS="${1:-../jobs.txt}"

gen() {
  IFS='|' read -r name ar prompt <<<"$1"
  [ -z "$name" ] && return
  d=$(mktemp -d -p "$PWD" w.XXXX)
  (cd "$d" && timeout 420 grok -p "Use the image_gen tool exactly once with aspect_ratio $ar and this prompt, verbatim: '$prompt' Then save the generated image into the current directory as out.png (convert to PNG if needed) and print only its absolute path." \
    --always-approve --output-format plain </dev/null >log.txt 2>&1)
  if [ -f "$d/out.png" ]; then mv "$d/out.png" "$name.png" && rm -rf "$d" && echo "OK $name"
  else echo "FAIL $name"; tail -5 "$d/log.txt"; fi
}
export -f gen
xargs -d '\n' -P 5 -I{} bash -c 'gen "$@"' _ {} <"$JOBS"
