#!/usr/bin/env bash
# build-frames.sh — IDB pergola scrub
# Extracts WebP frames + manifest for the SCRUBBED segments in TWO quality tiers.
# The client measures connection speed and picks a tier (see src/tier.ts):
#   hq — every native frame (24fps), 1600px  → smoothest, ~15-25MB/segment
#   lq — 12fps, 960px                        → light tier for slow connections
# 0_loop.mp4 is NOT scrubbed (ambient bookend <video>) — poster only.
#
# Usage:  ./build-frames.sh ./clips ./public/seq
# Clips in ./clips named exactly:
#   0_loop.mp4        (people loop)              -> poster only
#   1_assembly.mp4    (D->C floating->structure) -> segment "assemble"
#   2_furnish.mp4     (C->A structure->furnished)-> segment "furnish"

set -euo pipefail
INPUT_DIR="${1:-./clips}"
OUTPUT_DIR="${2:-./public/seq}"

command -v ffmpeg  >/dev/null || { echo "need ffmpeg";  exit 1; }
command -v ffprobe >/dev/null || { echo "need ffprobe"; exit 1; }

extract_tier () {
  local src="$1" seg="$2" tier="$3" fps="$4" width="$5" quality="$6"
  local out="$OUTPUT_DIR/$tier/$seg"
  [ -f "$src" ] || { echo "!! missing $src — skipping [$tier/$seg]"; return; }
  mkdir -p "$out"; rm -f "$out"/*.webp 2>/dev/null || true
  ffmpeg -hide_banner -loglevel error -y -i "$src" \
    -vf "fps=$fps,scale=$width:-2:flags=lanczos" \
    -c:v libwebp -lossless 0 -quality "$quality" -compression_level 6 \
    "$out/frame_%04d.webp"
  local count; count=$(find "$out" -name 'frame_*.webp' | wc -l | tr -d ' ')
  read -r W H < <(ffprobe -v error -select_streams v:0 \
    -show_entries stream=width,height -of csv=p=0:s=x "$out/frame_0001.webp" | tr 'x' ' ')
  printf '{ "count": %s, "w": %s, "h": %s, "ext": "webp", "fps": %s }\n' \
    "$count" "$W" "$H" "$fps" > "$out/manifest.json"
  echo "[$tier/$seg] $count frames ${W}x${H} (q=$quality)"
}

for pair in "1_assembly.mp4 assemble" "2_furnish.mp4 furnish"; do
  # shellcheck disable=SC2086
  set -- $pair
  extract_tier "$INPUT_DIR/$1" "$2" hq 24 1600 75
  extract_tier "$INPUT_DIR/$1" "$2" lq 12 960 65
done

# poster from the loop's first frame + the loop clip itself for the <video> bookend
mkdir -p "$OUTPUT_DIR/loop"
if [ -f "$INPUT_DIR/0_loop.mp4" ]; then
  ffmpeg -hide_banner -loglevel error -y -i "$INPUT_DIR/0_loop.mp4" \
    -vf "scale=1600:-2:flags=lanczos" -frames:v 1 \
    "$OUTPUT_DIR/loop/poster.webp"
  cp -f "$INPUT_DIR/0_loop.mp4" "$OUTPUT_DIR/loop/loop.mp4"
  echo "[loop] poster.webp + loop.mp4 ready"
else
  echo "!! missing 0_loop.mp4 — no bookend video/poster"
fi

echo "done -> $OUTPUT_DIR"
