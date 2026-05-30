# 스킬 등록 방법

Claude Code는 `~/.claude/skills/` 디렉토리를 읽어 사용 가능한 스킬 목록을 구성한다.
실제 파일은 그 아래 두 단계의 심링크 체인으로 연결된다.

---

## 심링크 체인 구조

```
~/.claude/skills/<name>        ← Claude Code가 읽는 위치
    └── symlink
~/.skills/<name>/              ← 중간 집합 레이어 (모든 스킬의 단일 진입점)
    └── symlink
~/dev/<repo>/skills/<name>/    ← 실제 파일 (SKILL.md 등)
```

`~/.skills/`는 여러 스킬 저장소(`cyanluna.skills`, `community.skills` 등)를 하나의 네임스페이스로 묶는 중간 레이어다.

---

## 케이스별 등록 방법

### Case 1 — 이 저장소(cyanluna.skills)에 새 스킬 추가

```bash
SKILL=my-skill
REPO=~/dev/cyanluna.skills

# 1. 스킬 디렉토리 생성 + SKILL.md 작성
mkdir -p "$REPO/$SKILL"
# ... SKILL.md 작성 ...

# 2. ~/.skills/ 에 심링크
ln -s "$REPO/$SKILL" ~/.skills/$SKILL

# 3. ~/.claude/skills/ 에 심링크
ln -s ~/.skills/$SKILL/ ~/.claude/skills/$SKILL
```

### Case 2 — community.skills 스킬 등록 (예: everything-claude-code)

```bash
SKILL=product-lens
SRC=~/dev/community.skills/everything-claude-code/skills/$SKILL

# 1. ~/.skills/ 에 심링크
ln -s "$SRC" ~/.skills/$SKILL

# 2. ~/.claude/skills/ 에 심링크
ln -s ~/.skills/$SKILL/ ~/.claude/skills/$SKILL
```

### Case 3 — 외부 저장소 스킬 등록 (임의 경로)

```bash
SKILL=some-skill
SRC=/path/to/repo/skills/$SKILL

ln -s "$SRC" ~/.skills/$SKILL
ln -s ~/.skills/$SKILL/ ~/.claude/skills/$SKILL
```

---

## 등록 확인

```bash
# 체인 전체가 정상 resolve되는지 확인
SKILL=my-skill
resolved=$(readlink -f ~/.claude/skills/$SKILL)
echo "$resolved"
ls "$resolved/SKILL.md"
```

정상이면:
```
/Users/cyanluna-pro16/dev/<repo>/skills/my-skill
/Users/cyanluna-pro16/dev/<repo>/skills/my-skill/SKILL.md
```

---

## 세션 반영

스킬은 세션 시작 시 1회 로드된다. **등록 후 새 세션을 열어야 `system-reminder`에 나타난다.**

세션 재시작 없이 즉시 사용하려면 파일을 직접 지정한다:
```
~/.skills/my-skill/SKILL.md 를 읽고 그 지침대로 실행해줘
```

---

## 디렉토리 요약

| 경로 | 역할 |
|------|------|
| `~/.claude/skills/` | Claude Code가 읽는 스킬 목록 (심링크만) |
| `~/.skills/` | 모든 스킬 저장소의 단일 진입점 (심링크만) |
| `~/dev/cyanluna.skills/` | 이 저장소 — 직접 만든 스킬 원본 |
| `~/dev/community.skills/` | 외부 스킬 저장소 모음 |
