# Thinkboard 개선 백로그

작성 기준: 2026-07-12의 `0.2.0` 구현을 읽기 전용으로 점검했다. 아이디어보다 현재 코드에서 확인되는 기능 신뢰성과 성능 병목을 먼저 적는다.

## 결론

가장 먼저 개선할 것은 새 보드 기능이 아니라 **화면이 최신 상태라는 신뢰성**이다. 그 다음은 드래그 중 반복 계산과 상시 폴링을 줄이는 것이다.

권장 순서:

1. 여러 MCP 프로세스에서도 보드 변경 이벤트가 웹 소유 프로세스에 전달되게 한다.
2. 웹에 실제 연결 상태와 마지막 갱신 시각을 표시한다.
3. SSE가 정상일 때 1.5초 폴링을 멈추고, 실패할 때만 폴링으로 복구한다.
4. 캔버스 렌더 중 보드 재계산과 `localStorage` 읽기를 제거한다.
5. 보드 revision을 추가해 오래된 전체 보드가 새 변경을 덮어쓰지 못하게 한다.

## 기능 개선

### UI1. 모바일 집중 보기와 선택 관계 강조 — 완료

상태: **완료 (2026-07-12)**

- 모바일 inspector는 기본 68px 바텀시트로 접히고 카드 선택 시 자동 확장된다.
- 시트 확장 후 선택 카드를 축소된 캔버스 중앙에 다시 맞춘다.
- 선택 카드의 직접 이웃과 관계만 선명하게 유지하고 나머지는 흐리게 표시한다.
- 해결됨 버튼은 모바일 캔버스 toolbar로, 확대·축소·맞춤 컨트롤은 카드와 겹치지 않는 상단 안전 영역으로 이동했다.

### F1. 프로세스 간 변경 알림 보장 — P0

상태: **완료 (2026-07-12)**

기존 구현의 `eventClients`는 각 MCP 프로세스의 메모리에 따로 존재했다. 보드 파일을 갱신한 프로세스가 웹 서버 소유자가 아니면 그 프로세스의 `broadcastBoardChanged()`는 실제 브라우저에 연결된 SSE client를 알 수 없었다.

- 근거: 당시 `server.mjs`에 함께 있던 웹 이벤트와 MCP 갱신 책임은 현재 `web-host.mjs`와 `protocol.mjs`로 분리됐다.
- 제안: 웹 서버 소유 프로세스가 `board.json` 변경을 감시해 SSE를 발행한다. 파일 교체 방식 저장이므로 파일 감시 이벤트 후 최신 전체 보드를 다시 읽는 방식이면 충분하다.
- 완료 조건: standby MCP에 update 요청을 보내도 owner 웹의 SSE가 500ms 안에 발생한다.
- 테스트: 기존 owner/standby 통합 테스트에 “standby update → owner SSE 수신 → `/api/board` 일치” 시나리오를 추가한다.

### F2. 실제 연결 상태와 마지막 갱신 표시 — P0

상태: **완료 (2026-07-12)**

기존 헤더는 SSE 연결 여부와 관계없이 항상 초록 점과 `로컬 연결`을 표시했다. EventSource의 `open/error`도 추적하지 않고, 서버가 보내는 `updatedAt`도 버렸다.

- 근거: `useGearBoard.ts`는 board 이벤트에서 query invalidation만 수행하고, `CompoBoardCanvas.tsx`는 고정된 `status-dot`을 렌더링한다.
- 제안: `connecting | live | fallback | offline` 상태와 `lastSyncedAt`을 Gear에서 제공한다. `offline`은 빨강, 폴링 복구 중은 노랑, SSE 정상은 초록처럼 텍스트와 함께 구분한다.
- 완료 조건: 서버 중단, 자동 재연결, 최신 데이터 수신이 헤더 상태와 시각에 정확히 반영된다.

### F3. stale update 덮어쓰기 방지 — P0

MCP update는 전체 보드를 교체하며 revision 조건이 없다. 두 Codex 작업이 같은 보드를 읽은 뒤 순서대로 저장하면, 늦게 저장한 오래된 사본이 먼저 저장된 카드나 관계를 조용히 지울 수 있다.

- 근거: `thinkboard_update_board`가 전체 `board`만 받고 `saveBoard()`가 무조건 rename한다.
- 제안: 보드에 단조 증가 `revision`을 두고 update 입력에 `expectedRevision`을 요구한다. 불일치 시 현재 보드를 돌려주고 Codex가 다시 읽고 병합하게 한다.
- 완료 조건: 같은 revision에서 출발한 두 update 중 두 번째가 명시적 conflict로 거절되고 데이터가 보존된다.

### F4. 작업별 보드 선택 — P1

현재 모든 MCP 프로세스가 하나의 `board.json`을 공유한다. 서로 다른 Codex 작업에서 Thinkboard를 쓰면 마지막 작업이 이전 사례를 교체한다. 제품 문서에도 다중 보드 선택은 미해결로 남아 있다.

- 근거: 서버의 고정 `boardPath = .../board.json`
- 제안: 먼저 최근 보드 목록과 명시적 `boardId` 선택만 추가한다. 계정·클라우드 동기화나 협업으로 확장하지 않는다.
- 완료 조건: 두 Codex 작업이 서로 다른 보드를 열고 갱신해도 상태가 섞이지 않는다.

### F5. 현재 질문을 실제로 spotlight — P1

스킬은 가장 영향이 큰 질문 하나를 고르지만 보드 모델에는 현재 집중 카드가 없다. 웹의 `SPOTLIGHT`는 사용자가 클릭한 카드 설명일 뿐, Codex가 지금 묻는 질문과 연결되지 않는다.

- 제안: `focusCardId` 하나만 보드 메타데이터로 추가하거나, 별도 메타 파일에 저장한다. 활성 질문 카드와 그 목표 경로를 강조한다.
- 완료 조건: Codex가 질문을 바꾸면 웹에서 해당 unknown과 연결된 want가 바로 구분된다.

### F6. 레이아웃 저장 실패와 신규 카드 겹침 처리 — P1

상태: **부분 완료 (2026-07-12)** — 손상된 저장값과 저장 실패 처리는 완료, 신규 카드 겹침 방지는 남음

`loadLayout()`은 저장소 오류를 삼키지만 `saveLayout()`은 예외를 처리하지 않는다. 브라우저 저장소가 차단되거나 quota가 차면 드래그 종료 이벤트에서 오류가 날 수 있다. 또한 저장된 카드 위치와 새 카드의 기본 위치가 겹칠 수 있다.

- 근거: `serviceBoard.ts`의 `loadLayout`, `saveLayout`, `createNodes`
- 제안: 저장 실패는 비치명 상태로 처리하고, 저장 위치를 배치한 뒤 새 카드의 기본 슬롯이 이미 점유됐는지 검사한다.
- 완료 조건: localStorage가 throw해도 캔버스가 유지되고, 새 카드가 기존 카드와 동일 좌표로 생성되지 않는다.

### F7. 제외 카드와 숨은 관계의 의미 명확화 — P2

`resolved`만 접어두고 `rejected`는 활성 카드와 같은 강도로 남는다. 또한 활성 카드를 선택하면 화면에서 숨긴 resolved 카드와의 관계도 inspector에 나타날 수 있어, 캔버스와 설명 패널의 범위가 다르게 느껴진다.

- 제안: `제외됨`도 기본 비활성 접기에 포함할지 제품 결정을 확정한다. 숨은 카드 관계를 inspector에 보일 때는 `숨긴 해결 카드와 연결됨`이라고 명시한다.

### F8. 키보드·스크린 리더 탐색 완성 — P2

제품 문서는 카드와 관계의 키보드 탐색, 자연어 관계 설명, 과도하지 않은 실시간 알림을 요구하지만 현재 이를 검증하는 UI 테스트가 없다.

- 제안: 카드 focus 순서, Enter/Space 선택, inspector 제목 연결, 갱신 상태의 절제된 `aria-live`, 색 외 상태 라벨을 테스트한다.

## 성능 개선

### PERF1. SSE 우선, 폴링은 장애 복구 전용 — P0

상태: **완료 (2026-07-12)**

기존 구현은 SSE 연결 여부와 무관하게 모든 탭이 1.5초마다 `/api/board`를 요청했다. 탭 하나당 분당 약 40회 파일 read, JSON parse, 서버 검증, 클라이언트 Zod parse가 발생했다.

- 근거: `useGearBoard.ts`의 `refetchInterval: 1500`
- 제안: SSE 정상 시 interval을 끄고, `error` 또는 heartbeat 만료 때만 1.5초 폴링을 켠다. 재연결 후 즉시 한 번 전체 fetch하고 다시 폴링을 끈다.
- 선행 조건: F1의 프로세스 간 이벤트 신뢰성을 먼저 확보한다.
- 완료 조건: 유휴 상태 5분 동안 정상 SSE 탭의 `/api/board` 요청은 최초 및 복구 검사용 소수 요청에 그친다.

### PERF2. 드래그 렌더 경로의 반복 계산 제거 — P0

상태: **완료 (2026-07-12)**

`CompoBoardCanvas`는 렌더마다 resolved filter, 카드 탐색, 관계 filter를 다시 수행한다. 더 큰 문제는 `useNodesState(createNodes(...))`와 `useEdgesState(createEdges(...))`의 인수가 매 렌더마다 먼저 계산되므로, 초기값이 다시 쓰이지 않아도 depth 계산과 배열 생성이 반복된다는 점이다. `loadLayout()`도 렌더마다 동기적으로 localStorage를 읽고 JSON을 파싱한다. 노드 드래그처럼 렌더가 잦은 경로에서 불필요한 작업이다.

- 근거: `CompoBoardCanvas.tsx`의 `visibleBoard`, `savedLayout`, `useNodesState`, `useEdgesState`, `selectedRelationships`
- 제안: 보드/언어/layoutMode/showResolved 변경 때만 projection을 만들고, localStorage는 같은 시점에 한 번 읽는다. 카드 id map과 adjacency map을 함께 만들어 inspector 조회를 O(1)+degree로 바꾼다.
- 완료 조건: 노드 드래그 중 `createNodes`, `createEdges`, `loadLayout` 호출 횟수가 증가하지 않는다.

### PERF3. 큰 보드 렌더 예산 설정 — P1

각 관계는 그림자 path, 본 path, DOM label을 만들고 MiniMap도 전체 노드를 다시 그린다. 모바일에서는 MiniMap을 CSS로 숨길 뿐 컴포넌트는 계속 mount된다. 카드가 누적되면 edge 수가 렌더 비용을 지배할 가능성이 높다.

- 제안: 실제 보드 크기 기준선을 측정한 뒤 `onlyRenderVisibleElements`, 모바일 MiniMap 미마운트, 일정 edge 수 이상에서 label 축약/선 애니메이션 중지를 적용한다.
- 벤치마크: 20/50/100 cards, 30/100/250 edges에서 초기 표시, drag frame, board update 시간을 측정한다.
- 완료 조건: 지원 상한에서 드래그와 확대/이동이 체감상 끊기지 않고, 갱신 후 500ms 목표를 지킨다.

### PERF4. 중복 검증 제거 — P2

update 경로에서 `validateBoard()`를 호출한 값을 `saveBoard()`에 전달하고, `saveBoard()`가 같은 데이터를 다시 검증한다. 작은 보드에서는 영향이 미미하지만 전체 보드 교체 비용과 함께 선형으로 증가한다.

- 제안: validation 책임을 `saveBoard()` 한 곳에만 둔다. 입력 JSON Schema는 카드와 관계 필드를 완전하게 기술해 모델의 잘못된 호출도 앞단에서 줄인다.

### PERF5. 번들 크기는 관찰만 — P2

현재 production JS는 **476.15 kB, gzip 147.90 kB**다. 단일 로컬 화면이고 초기 build가 빠르므로 지금 당장 코드 분할을 우선할 근거는 약하다. React Flow를 유지한 채 기능 신뢰성과 런타임 비용을 먼저 개선한다.

## 검증 기준선

2026-07-12 실행 결과:

- `npm run check`: 통과
- TypeScript: 통과
- Vitest: 2 files, 11 tests 통과
- MCP 통합 테스트: 4 tests 통과
- production build: JS 479.52 kB, gzip 149.03 kB

현재 테스트가 보장하지 않는 핵심 영역:

- standby 프로세스가 저장했을 때 owner SSE에 이벤트가 오는지
- SSE 연결 상태가 UI에 정확히 반영되는지
- 동시에 갱신할 때 stale board를 거절하는지
- drag 종료 시 마지막 좌표가 저장되는지
- localStorage 실패 후에도 UI가 유지되는지
- 50개 이상 카드에서 렌더·갱신 시간이 어떤지

## 첫 번째 구현 묶음

한 번에 크게 바꾸지 않고 다음 세 묶음으로 진행한다.

1. **동기화 신뢰성:** F1 + F2 + PERF1과 관련 통합 테스트 — 완료
2. **캔버스 체감 성능:** PERF2 완료, F6 저장 안정성 완료·신규 카드 겹침 방지 남음
3. **동시 작업 안전성:** F3, 이후 실제 필요가 확인되면 F4

`focusCardId`, 접근성 강화, 큰 보드 최적화는 위 세 묶음 뒤에 실제 사용 피드백과 측정값으로 순서를 다시 정한다.
