#!/usr/bin/env bash
# install.sh — research-proposal-harness 스킬 설치
# Usage:
#   unzip research-proposal-harness.skill -d /tmp/rph && bash /tmp/rph/research-proposal-harness/install.sh
#   또는 .skill 파일과 같은 디렉터리에서: bash install.sh

set -euo pipefail

SKILL_NAME="research-proposal-harness"
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_HOME="${SKILLS_HOME:-$HOME/.skills}"
CLAUDE_SKILLS="${CLAUDE_SKILLS:-$HOME/.claude/skills}"

echo "🔧 Installing $SKILL_NAME..."

# ~/.skills 디렉터리 확인
mkdir -p "$SKILLS_HOME" "$CLAUDE_SKILLS"

# 이미 설치된 경우 확인
if [ -e "$SKILLS_HOME/$SKILL_NAME" ]; then
  echo "⚠️  $SKILLS_HOME/$SKILL_NAME 이미 존재합니다."
  read -r -p "   덮어쓰시겠습니까? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { echo "취소됨."; exit 0; }
  rm -rf "$SKILLS_HOME/$SKILL_NAME"
fi

# ~/.skills/<name> 심링크 생성
ln -s "$SKILL_DIR" "$SKILLS_HOME/$SKILL_NAME"
echo "   ✓ ~/.skills/$SKILL_NAME → $SKILL_DIR"

# ~/.claude/skills/<name> 심링크 생성
if [ -e "$CLAUDE_SKILLS/$SKILL_NAME" ]; then
  rm -f "$CLAUDE_SKILLS/$SKILL_NAME"
fi
ln -s "$SKILLS_HOME/$SKILL_NAME" "$CLAUDE_SKILLS/$SKILL_NAME"
echo "   ✓ ~/.claude/skills/$SKILL_NAME → ~/.skills/$SKILL_NAME"

echo ""
echo "✅ $SKILL_NAME 설치 완료"
echo "   Claude Code에서 '/research-proposal-harness' 로 사용하세요."
echo ""
echo "📄 PDF 직접 생성을 위한 LaTeX 환경 설치 (선택):"
echo "   bash $SKILLS_HOME/$SKILL_NAME/templates/setup-latex.sh"
echo "   → BasicTeX + kotex + nanum 설치 (~100MB, macOS 전용)"
echo "   설치 전에는 Overleaf ZIP으로 자동 대체됩니다."
