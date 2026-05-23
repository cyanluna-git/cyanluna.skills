#!/usr/bin/env bash
# convert.sh — proposal_draft.md → PDF (xelatex) + HTML
#              xelatex 없을 시 Overleaf ZIP으로 자동 전환
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
BIB_ARGS=()
CSL_ARGS=()
[[ -f "$BIB_FILE" ]] && BIB_ARGS=(--bibliography "$BIB_FILE")
[[ -f "$CSL_FILE" ]] && CSL_ARGS=(--csl "$CSL_FILE")

mkdir -p "$OUTPUT_DIR"

# ── Step 1: md → tex ─────────────────────────────────────────
echo "📝 Step 1: Markdown → LaTeX"

pandoc "$INPUT_MD" \
  --from=markdown \
  --to=latex \
  --standalone \
  --pdf-engine=xelatex \
  --citeproc \
  "${BIB_ARGS[@]}" \
  "${CSL_ARGS[@]}" \
  --output="$OUTPUT_DIR/${BASENAME}.tex"

# XeLaTeX 컴파일러 매직 커멘트 (Overleaf 자동 감지용)
MAGIC="% !TEX program = xelatex"
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "1s|^|${MAGIC}\n|" "$OUTPUT_DIR/${BASENAME}.tex"
else
  sed -i "1s|^|${MAGIC}\n|" "$OUTPUT_DIR/${BASENAME}.tex"
fi
echo "   ✓ ${BASENAME}.tex"

# ── Step 2: PDF 생성 (xelatex 있으면 직접, 없으면 Overleaf ZIP) ──
if command -v xelatex &>/dev/null; then
  # ── 2a: 직접 PDF 컴파일 ────────────────────────────────────
  echo "📄 Step 2: LaTeX → PDF (xelatex)"
  pandoc "$INPUT_MD" \
    --from=markdown \
    --to=pdf \
    --pdf-engine=xelatex \
    --citeproc \
    "${BIB_ARGS[@]}" \
    "${CSL_ARGS[@]}" \
    --output="$OUTPUT_DIR/${BASENAME}.pdf"
  echo "   ✓ ${BASENAME}.pdf"
  PDF_OUTPUT="$OUTPUT_DIR/${BASENAME}.pdf"
  ZIP_OUTPUT=""
else
  # ── 2b: Overleaf ZIP 폴백 ──────────────────────────────────
  echo "📦 Step 2: Overleaf ZIP 패키징 (xelatex 미설치)"
  ZIP_FILE="$OUTPUT_DIR/${BASENAME}_overleaf.zip"
  ZIP_SOURCES=("$OUTPUT_DIR/${BASENAME}.tex")
  [[ -f "$BIB_FILE" ]] && ZIP_SOURCES+=("$BIB_FILE")
  zip -j "$ZIP_FILE" "${ZIP_SOURCES[@]}"
  echo "   ✓ $(basename "$ZIP_FILE")"
  PDF_OUTPUT=""
  ZIP_OUTPUT="$ZIP_FILE"
fi

# ── Step 3: md → html (로컬 미리보기) ───────────────────────
echo "🌐 Step 3: Markdown → HTML 미리보기"
pandoc "$INPUT_MD" \
  --from=markdown \
  --to=html5 \
  --standalone \
  --embed-resources \
  --citeproc \
  "${BIB_ARGS[@]}" \
  "${CSL_ARGS[@]}" \
  --css="data:text/css,body{font-family:'Apple SD Gothic Neo',sans-serif;max-width:820px;margin:2rem auto;line-height:1.9;padding:0 1.5rem;color:#222}h1,h2,h3{border-bottom:1px solid #e0e0e0;padding-bottom:.3em}h1{font-size:1.6rem}h2{font-size:1.3rem}p{text-indent:1em}" \
  --output="$OUTPUT_DIR/${BASENAME}.html"
echo "   ✓ ${BASENAME}.html"

# ── 완료 안내 ────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 변환 완료"
echo ""
if [[ -n "$PDF_OUTPUT" ]]; then
  echo "   📄 PDF:          $PDF_OUTPUT"
else
  echo "   📦 Overleaf ZIP: $ZIP_OUTPUT"
  echo ""
  echo "   PDF를 직접 생성하려면:"
  echo "   bash $(dirname "$0")/setup-latex.sh"
  echo "   → BasicTeX + kotex + nanum 설치 (~100MB)"
fi
echo "   🌐 HTML 미리보기: $OUTPUT_DIR/${BASENAME}.html"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
