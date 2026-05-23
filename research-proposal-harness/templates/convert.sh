#!/usr/bin/env bash
# convert.sh — proposal_draft.md → Overleaf ZIP + HTML 미리보기
# Usage: bash convert.sh [input.md] [output_dir]

set -euo pipefail

INPUT_MD="${1:-proposal_draft.md}"
OUTPUT_DIR="${2:-.}"
BASE="${INPUT_MD%.md}"
BASENAME="$(basename "$BASE")"

# ── 사전 조건 확인 ───────────────────────────────────────────
if ! command -v pandoc &>/dev/null; then
  echo "❌ pandoc가 없습니다." >&2
  echo "   설치: https://pandoc.org/installing.html" >&2
  exit 1
fi

if [[ ! -f "$INPUT_MD" ]]; then
  echo "❌ 입력 파일 '$INPUT_MD' 를 찾을 수 없습니다." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CSL_FILE="$SCRIPT_DIR/apa.csl"
INPUT_DIR="$(cd "$(dirname "$INPUT_MD")" && pwd)"
BIB_FILE="$INPUT_DIR/references.bib"

mkdir -p "$OUTPUT_DIR"

# ── Step 1: md → tex (Overleaf용) ────────────────────────────
echo "📝 Step 1: Markdown → LaTeX"

pandoc "$INPUT_MD" \
  --from=markdown \
  --to=latex \
  --standalone \
  --pdf-engine=xelatex \
  --citeproc \
  $([ -f "$BIB_FILE" ] && echo "--bibliography=$BIB_FILE" || true) \
  $([ -f "$CSL_FILE" ] && echo "--csl=$CSL_FILE" || true) \
  --output="$OUTPUT_DIR/${BASENAME}.tex"

# XeLaTeX 컴파일러 지정 — Overleaf 자동 감지용 매직 커멘트
TEX_FILE="$OUTPUT_DIR/${BASENAME}.tex"
MAGIC="% !TEX program = xelatex"
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "1s|^|${MAGIC}\n|" "$TEX_FILE"
else
  sed -i "1s|^|${MAGIC}\n|" "$TEX_FILE"
fi

echo "   ✓ ${BASENAME}.tex"

# ── Step 2: Overleaf ZIP 패키징 ──────────────────────────────
echo "📦 Step 2: Overleaf ZIP 패키징"

ZIP_FILE="$OUTPUT_DIR/${BASENAME}_overleaf.zip"
ZIP_SOURCES=("$TEX_FILE")
[[ -f "$BIB_FILE" ]] && ZIP_SOURCES+=("$BIB_FILE")

zip -j "$ZIP_FILE" "${ZIP_SOURCES[@]}"
echo "   ✓ $(basename "$ZIP_FILE") ($(du -h "$ZIP_FILE" | cut -f1))"

# ── Step 3: md → html (로컬 미리보기) ───────────────────────
echo "🌐 Step 3: Markdown → HTML 미리보기"

pandoc "$INPUT_MD" \
  --from=markdown \
  --to=html5 \
  --standalone \
  --embed-resources \
  --citeproc \
  $([ -f "$BIB_FILE" ] && echo "--bibliography=$BIB_FILE" || true) \
  $([ -f "$CSL_FILE" ] && echo "--csl=$CSL_FILE" || true) \
  --css="data:text/css,body{font-family:'Apple SD Gothic Neo',sans-serif;max-width:820px;margin:2rem auto;line-height:1.9;padding:0 1.5rem;color:#222}h1,h2,h3{border-bottom:1px solid #e0e0e0;padding-bottom:.3em}h1{font-size:1.6rem}h2{font-size:1.3rem}p{text-indent:1em}" \
  --output="$OUTPUT_DIR/${BASENAME}.html"

echo "   ✓ ${BASENAME}.html"

# ── 완료 안내 ────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 변환 완료"
echo ""
echo "   📦 Overleaf ZIP : $ZIP_FILE"
echo "   🌐 HTML 미리보기: $OUTPUT_DIR/${BASENAME}.html"
echo ""
echo "Overleaf 업로드 방법:"
echo "  1. https://www.overleaf.com 접속"
echo "  2. New Project → Upload Project"
echo "  3. $(basename "$ZIP_FILE") 선택 → 업로드"
echo "  4. 업로드 완료 후 Recompile 클릭"
echo "     (XeLaTeX은 매직 커멘트로 자동 감지됩니다)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
