#!/usr/bin/env bash
# convert.sh — proposal_draft.md → .tex → .pdf + .html
# Usage: bash convert.sh <input.md> [output_dir]

set -euo pipefail

INPUT_MD="${1:-proposal_draft.md}"
OUTPUT_DIR="${2:-.}"
BASE="${INPUT_MD%.md}"
BASENAME="$(basename "$BASE")"

# ── 사전 조건 확인 ──────────────────────────────────────────
check_command() {
  if ! command -v "$1" &>/dev/null; then
    echo "❌ '$1' 를 찾을 수 없습니다." >&2
    echo "   설치: $2" >&2
    exit 1
  fi
}

check_font() {
  if ! fc-list 2>/dev/null | grep -qi "$1"; then
    echo "⚠️  폰트 '$1' 를 찾을 수 없습니다." >&2
    echo "   macOS: brew install font-nanum" >&2
    echo "   Ubuntu: sudo apt-get install fonts-nanum" >&2
    echo "   PDF 생성을 건너뜁니다." >&2
    return 1
  fi
  return 0
}

check_command pandoc "https://pandoc.org/installing.html"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CSL_FILE="$SCRIPT_DIR/apa.csl"
BIB_FILE="$(dirname "$INPUT_MD")/references.bib"

if [[ ! -f "$INPUT_MD" ]]; then
  echo "❌ 입력 파일 '$INPUT_MD' 를 찾을 수 없습니다." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# ── Step 1: md → tex ────────────────────────────────────────
echo "📝 Step 1: Markdown → LaTeX"
pandoc "$INPUT_MD" \
  --from=markdown \
  --to=latex \
  --standalone \
  --pdf-engine=xelatex \
  $([ -f "$BIB_FILE" ] && echo "--bibliography=$BIB_FILE" || true) \
  $([ -f "$CSL_FILE" ] && echo "--csl=$CSL_FILE" || true) \
  --output="$OUTPUT_DIR/${BASENAME}.tex"
echo "   ✓ ${BASENAME}.tex"

# ── Step 2: tex → pdf (xelatex) ─────────────────────────────
echo "📄 Step 2: LaTeX → PDF"
if check_command xelatex "sudo apt install texlive-xetex (Ubuntu) 또는 MacTeX (macOS)" 2>/dev/null && \
   check_font "NanumMyeongjo" 2>/dev/null; then
  pandoc "$INPUT_MD" \
    --from=markdown \
    --to=pdf \
    --pdf-engine=xelatex \
    $([ -f "$BIB_FILE" ] && echo "--bibliography=$BIB_FILE" || true) \
    $([ -f "$CSL_FILE" ] && echo "--csl=$CSL_FILE" || true) \
    --output="$OUTPUT_DIR/${BASENAME}.pdf"
  echo "   ✓ ${BASENAME}.pdf"
else
  echo "   ⚠️  PDF 건너뜀 (xelatex 또는 NanumMyeongjo 없음)"
fi

# ── Step 3: md → html ───────────────────────────────────────
echo "🌐 Step 3: Markdown → HTML"
pandoc "$INPUT_MD" \
  --from=markdown \
  --to=html5 \
  --standalone \
  --embed-resources \
  --metadata title="연구계획서" \
  $([ -f "$BIB_FILE" ] && echo "--bibliography=$BIB_FILE" || true) \
  $([ -f "$CSL_FILE" ] && echo "--csl=$CSL_FILE" || true) \
  --css="data:text/css,body{font-family:sans-serif;max-width:800px;margin:2rem auto;line-height:1.8;padding:0 1rem}h1,h2{border-bottom:1px solid #ddd;padding-bottom:.3em}" \
  --output="$OUTPUT_DIR/${BASENAME}.html"
echo "   ✓ ${BASENAME}.html"

echo ""
echo "✅ 변환 완료"
echo "   📄 PDF:  $OUTPUT_DIR/${BASENAME}.pdf"
echo "   🌐 HTML: $OUTPUT_DIR/${BASENAME}.html"
echo "   📝 TeX:  $OUTPUT_DIR/${BASENAME}.tex"
