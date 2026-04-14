# PLC 코드 리뷰를 위한 아키텍처 가이드

이 문서는 Edwards Unify Plasma 프로젝트의 CODESYS ST 코드 리뷰 시 참조하는 통합 가이드입니다.

---

## 1. 시스템 아키텍처

### 3-Layer 구조

```
Application (UnifyPackage)
    ├── Module들 (CInletManager, CPlasmaSequencer, CWaterSystem 등)
    ├── Factory (CUnifyModuleFactory)
    └── Orchestrator (CSystemOrchestrator)

Infrastructure (Edwards.Infrastructure)
    ├── IO: CAnalogueInput, CAnalogueOutput, CDigitalInput, CDigitalOutput
    ├── Alerts: CDigitalAlert, CThresholdAlert
    ├── Valves: CValve, CGenericValve, CFeedbackValve
    └── Managers: CIOManager, CAlertManager, CValveManager, CModuleManager, CResourceManager

Core (Edwards.Infrastructure.Core)
    ├── Interfaces: IMemoryProvider, IElement, IBaseModule
    ├── Collections: LinkedList, LinkedListIterator
    └── SFC: CSFCEngine, CStep, CTransition
```

### 핵심 디자인 패턴

| 패턴 | 구현 | 용도 |
|------|------|------|
| Service Provider | `CUnifyServiceProvider` | 모든 매니저 접근 중앙 허브 |
| Message Broker | `CMessageBroker` | 모듈 간 통신 (인터페이스 쿼리) |
| Factory | `IUnifyModuleFactory` | 모듈 생성 및 등록 |
| Template Method | `CUnifyBaseModule` | 모듈 공통 실행 패턴 |
| Strategy | Normal/IntCtrl/External | 운영 모드 (실제/시뮬레이션/외부) |
| Observer | MemoryProvider | 모니터링/제어 데이터 공유 |

---

## 2. 네이밍 규칙

### 타입 접두사

| 대상 | 접두사 | 예시 |
|------|--------|------|
| Function Block | `C` | `CInletManager`, `CWaterSystem` |
| Interface | `I` | `IUnifyBaseModule`, `IWaterSystem` |
| Struct (TYPE) | `T` | `TConfigInletManager`, `TMonitoringWaterSystem` |
| Enum | `E` | `EControlMode`, `EWaterState` |

### Struct 카테고리별 규칙

```
TConfig{ModuleName}      — 설정 구조체 (예: TConfigInletManager)
TControl{ModuleName}     — 제어 명령 구조체 (예: TControlInletManager)
TMonitoring{ModuleName}  — 상태 모니터링 구조체 (예: TMonitoringInletManager)
TInfo{ModuleName}        — 추가 정보 구조체 (예: TInfoPlasmaSequencer)
```

### 인스턴스/변수 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 로컬/멤버 변수 | `_` 접두사 + camelCase | `_cfg`, `_monitoring`, `_control`, `_monitoringSize` |
| SFC Step | `st` 접두사 | `stIdle`, `stAutoRunning`, `stManualStopped` |
| SFC Transition | `t` 접두사 | `tIdle_To_AutoStopped` |
| Transition Flag | `_` 접두사 + From_To_To | `_Idle_To_AutoStopped` |

### 리소스 변수 접두사

| 접두사 | 의미 | Infrastructure 클래스 |
|--------|------|----------------------|
| `ai` | Analogue Input | `CAnalogueInput` |
| `ao` | Analogue Output | `CAnalogueOutput` |
| `di` | Digital Input | `CDigitalInput` |
| `do` | Digital Output | `CDigitalOutput` |
| `vlv` | Valve | `CValve`, `CGenericValve` |
| `alm` | Alarm (ALARM 우선순위) | `CThresholdAlert`, `CDigitalAlert` |
| `wrn` | Warning (WARNING 우선순위) | `CThresholdAlert`, `CDigitalAlert` |
| `flt` | Fault | 내장 (`ai.fltSensorFault`, `vlv.fltOpenFault`) |

---

## 3. 모듈 생명주기

### 필수 구현 순서 (9단계)

```
1. Types 정의
   └── TConfig{Module}, TControl{Module}, TMonitoring{Module}, 관련 Enum

2. Interface 정의
   └── I{Module} EXTENDS IUnifyBaseModule + 모듈 고유 메서드

3. Class 구현
   └── C{Module} EXTENDS CUnifyBaseModule IMPLEMENTS I{Module}

4. 필수 메서드 구현
   ├── SetConfigure(cfg)      — 설정 전파
   ├── InitializeModule(base) — 리소스 등록
   ├── IsReady()              — 준비 상태 확인
   ├── ProcessControlData()   — 제어 데이터 읽기
   ├── ProcessMonitoringData()— 모니터링 데이터 쓰기
   ├── GetMonitoringSize()    — 모니터링 크기
   ├── GetControlSize()       — 제어 크기
   └── Execute()              — THIS^() 호출

5. Function Block Body
   └── IF IsReady() THEN ... END_IF 패턴

6. MessageBroker 등록
   └── CMessageBroker에 변수/쿼리/프로퍼티 추가

7. Factory 등록
   └── CUnifyModuleFactory.CreateAndRegisterModules()에 추가

8. Config Helper 함수
   └── Make{Module}Config() 팩토리 함수 (선택)

9. 테스트
```

### 자동 초기화 흐름 (ServiceProvider.AutoInitializeAllModules)

```
1단계: Factory.CreateAndRegisterModules()  — 모듈 생성 & ModuleManager에 등록
2단계: ModuleManager.MakeListAsArray()     — 연결 리스트 → 배열 변환
3단계: InitializeAllUnifyModules()         — 각 모듈의 InitializeModule() 호출
4단계: ResourceManager.MakeListAsArray()   — 모든 리소스 배열화
5단계: ResourceManager.InitializeAllResources(memProv) — MemProvider 초기화
6단계: ResourceManager.AutoAssignOffsets() — Modbus 주소 자동 할당
7단계: MessageBroker.RegisterAllModules()  — 인터페이스 쿼리 & 바인딩
8단계: GetTotal...Size()                   — 총 메모리 크기 계산
```

---

## 4. 표준 실행 패턴

### Function Block Body (매 스캔 사이클 실행)

```pascal
// ---- BODY #1 ----
IF IsReady() THEN
    ProcessControlData();       // 1. HMI/SCADA 명령 읽기
    StateMachine();             // 2. 상태 머신 실행 (모듈별 로직)
    ControlAlerts();            // 3. 알림 업데이트
    ProcessMonitoringData();    // 4. 상태 데이터 쓰기
    _monitoring.common.InService := TRUE;
ELSE
    _monitoring.common.InService := FALSE;
END_IF
```

### IsReady() 패턴

```pascal
METHOD IsReady : BOOL
    _monitoring.common.Ready := _monitoring.common.Configured AND _monitoring.common.Initialized;
    IsReady := _monitoring.common.Ready;
END_METHOD
```

### ProcessControlData() 패턴

```pascal
METHOD ProcessControlData : BOOL
    IF _base.MemProvider <> 0 AND _address.ControlOffset > 0 THEN
        _base.MemProvider.ReadControlData(
            offset := _address.ControlOffset,
            pData := ADR(_control),
            size := GetControlSize()
        );
    END_IF
END_METHOD
```

### ProcessMonitoringData() 패턴

```pascal
METHOD ProcessMonitoringData
    IF _base.MemProvider <> 0 AND _address.MonitoringOffset > 0 THEN
        _base.MemProvider.WriteMonitoringData(
            offset := _address.MonitoringOffset,
            pData := ADR(_monitoring),
            size := _monitoringSize
        );
    END_IF
END_METHOD
```

### 크기 계산 공식

```pascal
GetMonitoringSize := (SIZEOF(TMonitoring{Module}) + 1) / 2;  // WORD 단위
GetControlSize := (SIZEOF(TControl{Module}) + 1) / 2;
```

---

## 5. 리소스 등록 규칙

### InitializeModule()에서 등록 순서

```pascal
METHOD InitializeModule : BOOL
    VAR_INPUT
        base : IUnifyServiceProvider;
    END_VAR

    _base := base;

    // 1. IO 등록 (순서: AI → DI/DO from valves → standalone DI/DO → AO)
    _base.IoManager.AppendIO(aiPressure);
    _base.IoManager.AppendIO(vlvMain.diOpenLimit);
    _base.IoManager.AppendIO(vlvMain.diCloseLimit);
    _base.IoManager.AppendIO(vlvMain.doOpen);

    // 2. Valve 등록
    _base.ValveManager.AppendValve(vlvMain);

    // 3. Alert 등록 (valve faults → sensor faults → threshold alerts → digital alerts)
    _base.AlertManager.AppendAlert(vlvMain.fltOpenFault);
    _base.AlertManager.AppendAlert(vlvMain.fltCloseFault);
    _base.AlertManager.AppendAlert(aiPressure.fltSensorFault);
    _base.AlertManager.AppendAlert(almPressureHiHi);
    _base.AlertManager.AppendAlert(wrnPressureHi);

    _monitoring.common.Initialized := TRUE;
END_METHOD
```

### 흔한 실수

- 리소스를 선언했지만 등록하지 않음 → 주소 미할당 → 데이터 교환 불가
- Valve의 내부 IO (`diOpenLimit`, `diCloseLimit`, `doOpen`)를 IoManager에 등록하지 않음
- Sensor fault alert (`ai.fltSensorFault`)를 AlertManager에 등록하지 않음
- Valve fault alert (`vlv.fltOpenFault`, `vlv.fltCloseFault`)를 AlertManager에 등록하지 않음

---

## 6. 상태 머신 (CSFCEngine)

### 구조

```pascal
VAR
    SFCEngine : Infra.Core.CSFCEngine;
    stIdle : Infra.Core.CStep;
    stRunning : Infra.Core.CStep;
    tIdle_To_Running : Infra.Core.CTransition;
    _Idle_To_Running : BOOL;  // 전이 조건 플래그
END_VAR
```

### 초기화 패턴

```pascal
METHOD InitializeSFCEngine
    // Step 번호 설정 (고유해야 함)
    stIdle.SetNum(1);
    stRunning.SetNum(2);

    // Engine에 Step 추가
    SFCEngine.AddStep(stIdle);
    SFCEngine.AddStep(stRunning);

    // Transition 설정
    tIdle_To_Running.SetFromStep(stIdle);
    tIdle_To_Running.SetToStep(stRunning);
    tIdle_To_Running.SetCondPtr(ADR(_Idle_To_Running));
    SFCEngine.AddTrans(tIdle_To_Running);
END_METHOD
```

### 실행 패턴

```pascal
METHOD StateMachine
    TransitionCondition();   // 전이 조건 업데이트
    SFCEngine.Execute();     // 엔진 실행
    ExecuteAllAction();      // 상태별 액션 실행
END_METHOD
```

### 데드락 검증 포인트

1. **도달 불가 상태**: 어떤 전이로도 진입할 수 없는 Step
2. **탈출 불가 상태**: 어떤 전이로도 빠져나갈 수 없는 Step
3. **상호 배타 전이**: 같은 Step에서 나가는 여러 전이가 동시에 TRUE일 가능성
4. **순환 대기**: 상태 A → B → A가 특정 조건에서 무한 반복
5. **초기 상태**: FB_Init에서 InitializeSFCEngine() 호출 여부

---

## 7. 설정 관리 (SetConfigure)

### 표준 패턴

```pascal
METHOD SetConfigure
    VAR_INPUT
        cfg : TConfig{Module};
    END_VAR

    _cfg := cfg;

    // Infrastructure 요소 설정
    aiPressure.SetConfigure(Infra.MakeAIConfig(
        name := CONCAT(_cfg.name, '.aiPressure'),
        unit := 'bar',
        minScaled := 0.0,
        maxScaled := 10.0
    ));

    vlvMain.SetConfigure(Infra.MakeGenericValveConfig(
        Fitted := TRUE,
        name := CONCAT(_cfg.name, '.vlvMain'),
        valveType := EValveType.FailClose,
        alertPriority := EAlertPriority.ALARM
    ));

    almPressureHiHi.SetConfigure(Infra.MakeThresholdAlertConfig(
        name := CONCAT(_cfg.name, '.almPressureHiHi'),
        latched := TRUE,
        priority := EAlertPriority.ALARM,
        delaytime := _cfg.delayTime,
        compareType := ECompareType.GreaterThan,
        setpoint := _cfg.spPressureHiHi
    ));

    // Alert 바인딩
    aiPressure.BindThresholdAlerts(
        criHi := Infra.Core.NULL,
        HiHi := almPressureHiHi,
        Hi := wrnPressureHi,
        Lo := wrnPressureLo,
        LoLo := almPressureLoLo
    );

    // 크기 계산
    _monitoringSize := (SIZEOF(TMonitoring{Module}) + 1) / 2;
    _monitoring.common.Configured := TRUE;
END_METHOD
```

### Config Helper 함수들

| Helper | 생성 타입 | 주요 파라미터 |
|--------|----------|--------------|
| `MakeAIConfig()` | `TConfigAI` | name, unit, minScaled, maxScaled, sensorType |
| `MakeAOConfig()` | `TConfigAO` | name, scaling |
| `MakeDiConfig()` | `TConfigDI` | name, invert, debounce |
| `MakeDoConfig()` | `TConfigDO` | name, invert |
| `MakeGenericValveConfig()` | `TConfigGenericValve` | Fitted, name, valveType, alertPriority, timings |
| `MakeValveConfig()` | `TConfigValve` | name, valveType |
| `MakeThresholdAlertConfig()` | `TConfigThresholdAlert` | name, latched, priority, delaytime, compareType, setpoint, hysteresis |
| `MakeDigitalAlertConfig()` | `TConfigDigitalAlert` | name, latched, priority, delaytime |

---

## 8. 밸브 제어 메커니즘

### 밸브 타입

| 타입 | 클래스 | IO 구성 | 용도 |
|------|--------|---------|------|
| 단순 밸브 | `CValve` | DO 1개 | On/Off 제어 |
| 피드백 밸브 | `CGenericValve` | DO + DI(Open) + DI(Close) | 위치 확인 필요 |
| 다이버트 밸브 | `CDivertValve` | DO 2개 + DI 2개 | 양방향 전환 |

### 명령 핸드셰이크 (cmdExist 패턴)

```
HMI → PLC:  TControlValve.cmdOpen := TRUE
PLC 처리:   명령 수신 → 밸브 동작 시작
PLC → HMI:  TMonitoringValve.cmdExist := TRUE
HMI → PLC:  TControlValve.cmdOpen := FALSE  (핸드셰이크 확인)
PLC → HMI:  TMonitoringValve.cmdExist := FALSE
```

### Fail-safe 타입

| 타입 | 동작 | 사용처 |
|------|------|--------|
| `FailClose` | 전원 차단 시 닫힘 | 가스 밸브, 인렛 밸브 |
| `FailOpen` | 전원 차단 시 열림 | 배기 밸브 |
| `FailInPlace` | 현재 위치 유지 | 조절 밸브 |

### Fault 감지

- **Open Fault**: 열림 명령 후 제한시간 내 diOpenLimit 미감지
- **Close Fault**: 닫힘 명령 후 제한시간 내 diCloseLimit 미감지
- 자동 생성: `vlv.fltOpenFault`, `vlv.fltCloseFault` (AlertManager에 등록 필수)

---

## 9. 메모리 주소 할당

### 3종 메모리 영역

| 영역 | 용도 | 방향 | 시작 주소 |
|------|------|------|-----------|
| Monitoring | 상태 데이터 | PLC → HMI (읽기 전용) | 1 |
| Control | 제어 명령 | HMI → PLC (쓰기 전용) | 1 |
| External | 시뮬레이션/강제값 | 양방향 | 501 |

### 자동 할당 순서

```
Monitoring: [IO] → [Valve] → [Alert] → [Module]
Control:    [Valve] → [Module]
External:   [IO]
```

### 주소 검증 패턴

```pascal
// 읽기 전 반드시 체크
IF _base.MemProvider <> 0 AND _address.ControlOffset > 0 THEN
    _base.MemProvider.ReadControlData(...);
END_IF

// 쓰기 전 반드시 체크
IF _base.MemProvider <> 0 AND _address.MonitoringOffset > 0 THEN
    _base.MemProvider.WriteMonitoringData(...);
END_IF
```

### 수동 주소 할당 금지

```pascal
// ❌ 절대 하지 말 것
_address.MonitoringOffset := 100;

// ✅ AutoAssignOffsets()가 자동 할당
```

---

## 10. MessageBroker 패턴

### 목적

모듈 간 직접 참조 없이 인터페이스를 통한 느슨한 결합

### 등록 패턴

```pascal
// CMessageBroker.RegisterAllModules()
FOR i := 1 TO moduleCount DO
    module := moduleManager.GetModule(i);
    IF _waterSystem = 0 AND_THEN __QUERYINTERFACE(module, _waterSystem) THEN
        ;
    ELSIF _inletManager = 0 AND_THEN __QUERYINTERFACE(module, _inletManager) THEN
        ;
    END_IF
END_FOR
```

### 사용 패턴

```pascal
// 다른 모듈에서 MessageBroker를 통해 접근
IF _base.MsgBroker.WaterSystem <> 0 THEN
    // WaterSystem의 상태를 참조
END_IF
```

### 검증 포인트

- 새 모듈 추가 시 MessageBroker에 변수/쿼리/프로퍼티 등록 여부
- `__QUERYINTERFACE` 호출 시 올바른 인터페이스 타입 지정
- 프로퍼티 반환값이 올바른 변수를 참조하는지

---

## 11. 모듈 목록 (현재 프로젝트)

| 모듈 | 클래스 | 역할 |
|------|--------|------|
| Inlet Manager | `CInletManager` | 인렛 밸브 제어, 압력 모니터링 |
| Oxidizer CDA | `COxidizerCDAControl` | CDA 산화제 제어 |
| Oxidizer O2 | `COxidizerO2Control` | O2 산화제 제어 |
| Plasma Sequencer | `CPlasmaSequencer` | 플라즈마 점화/소화 시퀀스 |
| Power Modulation | `CPowerModulization` | 전력 레벨 제어 (Level0~6) |
| Torch N2 | `CTorchN2Controller` | 토치 N2 유량 제어 |
| Water Pump | `CWaterPump` | 냉각수 펌프 제어 |
| Water System | `CWaterSystem` | 수계 통합 제어 (Strategy 패턴) |
| Water Tank | `CWaterTank` | 수위 모니터링 |
| N2 Purge | `CN2PurgeController` | N2 퍼지 제어 |
| PCW Controller | `CPCWController` | 냉각수 유량 제어 |
| Power Supply Unit | `CPowerSupplyUnit` | PSU 전압/전류 모니터링 |
| System Orchestrator | `CSystemOrchestrator` | 시스템 전체 시퀀스 조정 |
| TMS Controller | `CTMSController` | 온도 관리 시스템 |
| Temp Control | `CTempControlElement` | PID 온도 제어 |

---

## 12. 흔한 리뷰 이슈

### 안전 관련 (Must-fix)

1. **시퀀스 데드락**: Step에서 빠져나갈 수 없는 경우 (물리 장비 정지 불가)
2. **MemProvider 미체크**: `_base.MemProvider <> 0` 없이 메모리 접근 → 런타임 오류
3. **리소스 미등록**: 선언된 IO/Valve/Alert가 Manager에 미등록 → 주소 없음 → 통신 불가
4. **크기 계산 오류**: `GetMonitoringSize()` 잘못 → 메모리 침범 → 데이터 corruption
5. **밸브 Fail-safe 불일치**: FailClose 밸브에 FailOpen 동작 → 가스 누출 위험
6. **알림 우선순위 오류**: ALARM이어야 할 것이 WARNING → 안전 시스템 미동작

### 코드 품질 (Nice-to-have)

1. **네이밍 불일치**: `C`/`T`/`E` 접두사 미사용
2. **하드코딩**: 매직 넘버, 인라인 문자열 (Config 분리 필요)
3. **코드 중복**: 여러 모듈에서 동일 로직 반복
4. **Properties 사용**: 프로젝트 규칙상 Properties 지양, Method(Get/Set) 선호
5. **SFC 잔재**: ST로 전환되지 않은 SFC 로직
