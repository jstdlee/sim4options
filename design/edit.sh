#!/usr/bin/env bash
# Make pose variants of one reference image with Grok Build (image_edit).
# Usage: SRC=fox/fox_ref2.png OUT=fox design/edit.sh jobs_poses.txt
# Each job line: name|prompt. Output: design/$OUT/<name>.png
set -u
cd "$(dirname "$0")"
SRC=$(realpath "$SRC"); JOBS=$(realpath "$1")
cd "${OUT:-fox}"
export SRC
SUFFIX="Keep exactly the same character as the source image: same face, colors, proportions, dark ear tips and paws, teal neckerchief, and the same even black ink outline and flat cel colors. Full body, centered, with empty space around it. Solid flat uniform magenta (#FF00FF) background with no texture, no shadow on the ground and nothing else. No text, letters or symbols."
export SUFFIX

edit() {
  IFS='|' read -r name prompt <<<"$1"
  [ -z "$name" ] && return
  d=$(mktemp -d -p "$PWD" w.XXXX)
  (cd "$d" && timeout 420 grok -p "Use the image_edit tool exactly once. Source image: $SRC. Edit prompt, verbatim: '$prompt $SUFFIX' Then save the result into the current directory as out.png (convert to PNG if needed) and print only its absolute path." \
    --always-approve --output-format plain </dev/null >log.txt 2>&1)
  if [ -f "$d/out.png" ]; then mv "$d/out.png" "$name.png" && rm -rf "$d" && echo "OK $name"
  else echo "FAIL $name"; tail -5 "$d/log.txt"; fi
}
export -f edit
xargs -d '\n' -P 5 -I{} bash -c 'edit "$@"' _ {} <"$JOBS"
