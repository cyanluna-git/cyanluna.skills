#!/usr/bin/env bash
# setup-latex.sh — BasicTeX + 한국어 XeLaTeX 환경 설치
# Usage: bash setup-latex.sh
#
# 설치 항목:
#   - BasicTeX (~100MB) via Homebrew
#   - collection-xetex, kotex, nanum (tlmgr)
#   - 폰트 캐시 갱신

set -euo pipefail

echo "Research Proposal Harness — LaTeX 환경 설치"
echo ""

# ── 1. xelatex 설치 확인 ─────────────────────────────────────
if command -v xelatex &>/dev/null; then
  echo "✓ xelatex 이미 설치됨: $(xelatex --version | head -1)"
  XELATEX_INSTALLED=true
else
  XELATEX_INSTALLED=false
  if ! command -v brew &>/dev/null; then
    echo "❌ Homebrew가 없습니다."
    echo "   먼저 https://brew.sh 에서 Homebrew를 설치해 주세요."
    exit 1
  fi

  echo "📥 BasicTeX 설치 중... (~100MB)"
  brew install --cask basictex

  # macOS PATH 갱신 (BasicTeX bin 경로 반영)
  eval "$(/usr/libexec/path_helper)"

  if ! command -v xelatex &>/dev/null; then
    echo ""
    echo "⚠️  PATH를 갱신해야 합니다. 아래 명령을 실행 후 다시 시도하세요:"
    echo "   eval \"\$(/usr/libexec/path_helper)\""
    echo "   또는 터미널을 새로 열어 주세요."
    exit 1
  fi
  echo "✓ BasicTeX 설치 완료: $(xelatex --version | head -1)"
fi

# ── 2. tlmgr 패키지 설치 ─────────────────────────────────────
echo ""
echo "📦 한국어 XeLaTeX 패키지 설치 중..."

sudo tlmgr update --self --quiet
sudo tlmgr install collection-xetex kotex nanum --quiet

echo "✓ collection-xetex, kotex, nanum 설치 완료"

# ── 3. 폰트 캐시 갱신 ───────────────────────────────────────
echo ""
echo "🔤 폰트 캐시 갱신 중..."
fc-cache -f 2>/dev/null || true

NANUM_COUNT=$(fc-list 2>/dev/null | grep -i nanum | wc -l | tr -d ' ')
if [[ "$NANUM_COUNT" -gt 0 ]]; then
  echo "✓ NanumMyeongjo 등 Nanum 폰트 ${NANUM_COUNT}개 감지됨"
else
  echo "⚠️  Nanum 폰트가 감지되지 않습니다."
  echo "   convert.sh 실행 시 XeLaTeX이 TeX 트리에서 자동 탐색합니다."
fi

# ── 완료 ────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 설치 완료"
echo ""
echo "이제 convert.sh를 실행하면 PDF가 직접 생성됩니다:"
echo "   bash convert.sh proposal_draft.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
