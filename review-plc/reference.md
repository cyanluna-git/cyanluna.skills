# PLC (CODESYS ST) 리뷰 관점 가이드 & 출력 포맷

## 대상 플랫폼

- **IDE**: CODESYS V3.5
- **언어**: Structured Text (ST)
- **프레임워크**: Edwards Infrastructure Library V2.0
- **아키텍처**: Core → Infrastructure → Application 3-Layer

---

## 리뷰 관점 (10개)

각 관점에서 diff를 분석하고, 발견 사항을 아래 태그로 분류합니다.

### 1. Naming Convention `[Naming]`

프로젝트 네이밍 규칙 준수 여부를 검증합니다.

- **Function Block**: `C` 접두사 + PascalCase (예: `CInletManager`, `CWaterSystem`)
- **Interface**: `I` 접두사 + PascalCase (예: `IUnifyBaseModule`, `IWaterSystem`)
- **Struct**: `T` 접두사 + PascalCase (예: `TConfigInletManager`, `TMonitoringWaterSystem`)
  - Config 구조체: `TConfig{ModuleName}`
  - Control 구조체: `TControl{ModuleName}`
  - Monitoring 구조체: `TMonitoring{ModuleName}`
- **Enum**: `E` 접두사 + PascalCase (예: `EControlMode`, `EWaterState`)
- **인스턴스 변수**: `_` 접두사 + camelCase (예: `_cfg`, `_monitoring`, `_control`)
- **리소스 변수 접두사**:
  - `ai` - Analogue Input
  - `ao` - Analogue Output
  - `di` - Digital Input
  - `do` - Digital Output
  - `vlv` - Valve
  - `alm` - Alarm (ALARM 우선순위)
  - `wrn` - Warning (WARNING 우선순위)
  - `flt` - Fault
- **SFC 요소**: `st` 접두사 (Step), `t` 접두사 (Transition)

### 2. Module Architecture `[Architecture]`

Infrastructure 아키텍처 패턴 준수 여부를 검증합니다.

- `CUnifyBaseModule` 상속 여부
- `IUnifyBaseModule` 인터페이스 구현 여부
- 모듈 생명주기 단계 완성도:
  1. Types 정의 (TConfig, TControl, TMonitoring)
  2. Interface 정의
  3. Class 구현 (EXTENDS + IMPLEMENTS)
  4. Resource 등록 (InitializeModule에서)
  5. MessageBroker 등록
  6. Factory 등록
  7. Config Helper 함수
- Service Provider 패턴 사용
- Memory Provider 패턴 사용

### 3. State Machine `[StateMachine]`

시퀀스 로직과 상태 머신의 안전성을 검증합니다.

- **데드락 검출**:
  - 도달 불가능한 상태 (missing incoming transition)
  - 탈출 불가능한 상태 (missing outgoing transition)
  - 순환 의존성 (circular waiting conditions)
- **CSFCEngine 패턴**:
  - Step 번호 고유성
  - Transition 조건 완전성 (모든 상태에서 빠져나갈 수 있는가?)
  - `SetCondPtr(ADR(...))` 사용 시 포인터 유효성
- **상태 전이 조건**:
  - 상호 배타적 전이 조건 검증
  - 비결정적 전이 가능성 (동시에 여러 전이 조건 만족)
- **타이머 안전성**:
  - TON/TOF 타이머 리셋 누락
  - 타이머 조건과 상태 전이의 일관성

### 4. Memory Management `[Memory]`

메모리 관리 패턴의 정확성을 검증합니다.

- **TAddress 구조체**:
  - MonitoringOffset, ControlOffset, ExternalOffset 올바른 할당
  - `AutoAssignOffsets()` 호출 전 `MakeListAsArray()` 호출 여부
- **크기 계산**:
  - `GetMonitoringSize()`: `(SIZEOF(TMonitoring...) + 1) / 2` 공식 사용
  - `GetControlSize()`: `(SIZEOF(TControl...) + 1) / 2` 공식 사용
- **MemProvider 안전성**:
  - `_base.MemProvider <> 0` 체크 후 사용
  - `_address.MonitoringOffset > 0` 체크 후 사용
- **포인터 사용**:
  - `ADR()` 사용 시 대상 변수 수명 주기
  - 동적 할당 없이 정적 메모리 사용 권장

### 5. Resource Registration `[Registration]`

리소스 등록 완전성을 검증합니다.

- **IO 등록** (`InitializeModule` 내):
  - 모든 `CAnalogueInput` → `_base.IoManager.AppendIO()`
  - 모든 `CAnalogueOutput` → `_base.IoManager.AppendIO()`
  - 모든 `CDigitalInput` → `_base.IoManager.AppendIO()`
  - 모든 `CDigitalOutput` → `_base.IoManager.AppendIO()`
  - 밸브 내부 IO: `vlv.diOpenLimit`, `vlv.diCloseLimit`, `vlv.doOpen`
- **밸브 등록**: `_base.ValveManager.AppendValve()`
- **알림 등록**: `_base.AlertManager.AppendAlert()`
  - Threshold 알림
  - Digital 알림
  - 센서 fault: `ai.fltSensorFault`
  - 밸브 fault: `vlv.fltOpenFault`, `vlv.fltCloseFault`
- **등록 순서**: IO → Valve → Alert → Module (순서 중요)
- **누락 검출**: 선언된 리소스 vs 등록된 리소스 비교

### 6. Execution Pattern `[Execution]`

표준 실행 패턴 준수 여부를 검증합니다.

- **Function Block Body 패턴**:
  ```
  IF IsReady() THEN
      ProcessControlData();
      StateMachine();        // 또는 모듈별 로직
      ControlAlerts();
      ProcessMonitoringData();
      _monitoring.common.InService := TRUE;
  ELSE
      _monitoring.common.InService := FALSE;
  END_IF
  ```
- **Execute() 메서드**: `THIS^()` 호출
- **IsReady() 구현**: `Configured AND Initialized` 체크
- **ProcessControlData()**: MemProvider 읽기 패턴
- **ProcessMonitoringData()**: MemProvider 쓰기 패턴

### 7. Configuration `[Config]`

설정 관리 패턴을 검증합니다.

- **TConfig 구조체 분리**: 설정값이 별도 TYPE으로 분리되어 있는가
- **SetConfigure() 메서드**:
  - 모든 하위 Infrastructure 요소에 대한 설정 전파
  - `MakeAIConfig()`, `MakeGenericValveConfig()` 등 Helper 사용
  - `BindThresholdAlerts()` 호출
  - `_monitoringSize` 계산
  - `_monitoring.common.Configured := TRUE` 설정
- **Config Helper 함수**: `Make{Element}Config()` 팩토리 함수 존재 여부
- **설정값 유효성**: 범위 검증, 기본값 처리

### 8. Valve Command `[Valve]`

밸브 제어 패턴의 안전성을 검증합니다.

- **cmdExist 핸드셰이크**: 명령 → cmdExist 확인 → 명령 해제 패턴
- **밸브 타입별 처리**:
  - CValve: 단순 DO 출력
  - CGenericValve: Open/Close limit + 타이머 기반 fault 감지
  - CFeedbackValve: 피드백 기반 제어
- **모드 전환 안전성**:
  - Manual → Auto 전환 시 밸브 상태 처리
  - Auto → Manual 전환 시 출력 유지/리셋 정책
- **Fail-safe**: FailClose/FailOpen 설정과 실제 동작 일치

### 9. Alert Safety `[Alert]`

알림/경보 시스템의 안전성을 검증합니다.

- **우선순위 일관성**: ALARM vs WARNING 적절한 분류
- **Latched 알림**: latched 설정 시 리셋 메커니즘 존재 여부
- **지연 시간**: delayTime 설정의 적절성
- **Threshold 알림**:
  - CompareType (GreaterThan/LessThan) 정확성
  - Setpoint 값의 합리성 (HiHi > Hi > Lo > LoLo)
  - Hysteresis 설정
- **센서 fault와 알림 연동**: `BindThresholdAlerts()` 올바른 바인딩

### 10. Testing `[Testing]`

테스트 가능성과 테스트 코드를 검증합니다.

- **시뮬레이션 모드**: IntCtrl/External 모드 지원 여부
- **인터페이스 기반 설계**: 테스트 더블 주입 가능성
- **상태 관찰**: Monitoring 구조체를 통한 상태 확인 가능성
- **경계값 테스트**: 스케일링, setpoint 경계에서의 동작
- **단위 테스트 존재 여부**: 핵심 로직에 대한 테스트 코드

---

## 분류 기준

### "머지 전 확인 필요" (Must-fix)

다음 중 하나에 해당:
- **안전 위험**: 시퀀스 데드락, 밸브 제어 오류, 알림 누락
- **메모리 오류**: 잘못된 크기 계산, offset 충돌, MemProvider 미체크
- **아키텍처 위반**: 리소스 미등록, 표준 패턴 미준수
- **데이터 정합성**: 상태 머신 불일치, 설정 전파 누락

### "개선 권장" (Nice-to-have)

다음 중 하나에 해당:
- 네이밍 규칙 불일치 (기능 동작에 영향 없음)
- 코드 중복/리팩토링 기회
- 테스트 보강 필요
- 성능 개선 기회
- 문서화 부족

## 최종 판정 기준

| 판정 | 조건 |
|------|------|
| **APPROVED** | "머지 전 확인 필요" 항목 없음 |
| **APPROVED with suggestions** | "머지 전 확인 필요" 항목 없고, "개선 권장" 항목 있음 |
| **CHANGES REQUESTED** | "머지 전 확인 필요" 항목 1개 이상 |

---

## 출력 포맷

```markdown
## PR #{id} PLC Code Review: {title}

**Repo**: {workspace}/{repo}
**Branch**: {source} → {target}
**Author**: {author}
**Date**: {date}
**Domain**: PLC / CODESYS ST

---

### 변경 요약

{이 PR이 무엇을 하는지 2-3문장으로 요약}

---

### 머지 전 확인 필요

| # | 유형 | 파일 | 내용 |
|---|------|------|------|
| 1 | [StateMachine] | `CMyModule.st:142` | 설명 |
| 2 | [Memory] | `CMyModule.st:89` | 설명 |

{각 항목에 대한 상세 설명과 수정 제안}

---

### 개선 권장

| # | 유형 | 파일 | 내용 |
|---|------|------|------|
| 1 | [Naming] | `CMyModule.st:15` | 설명 |
| 2 | [Testing] | 전체 | 설명 |

{각 항목에 대한 상세 설명과 수정 제안}

---

### 잘 된 부분

- {칭찬할 만한 구현 결정이나 패턴 준수}
- {안전한 시퀀스 설계나 적절한 알림 구성}

---

### 최종 판정

**APPROVED / APPROVED with suggestions / CHANGES REQUESTED**

{판정 이유 1-2문장}
```

---

## 리뷰 작성 원칙

1. **PLC 안전성 최우선**: 시퀀스 데드락, 밸브 오동작, 메모리 침범은 물리적 장비 손상으로 이어질 수 있으므로 최우선 검토합니다.
2. **Infrastructure 패턴 준수**: V2.0 아키텍처 패턴을 기준으로 일관성을 검증합니다.
3. **구체적으로**: 파일명과 라인 번호를 명시합니다.
4. **근거 제시**: 왜 문제인지, 어떤 상황에서 문제가 발생하는지 설명합니다.
5. **대안 제시**: 표준 패턴 코드 예시와 함께 수정 방법을 제안합니다.
6. **균형 유지**: 문제점뿐 아니라 잘 된 부분도 언급합니다.
