# Codex Thinkboard

[English](README.md)

[![CI](https://github.com/WachsenHaus/codex-thinkboard/actions/workflows/ci.yml/badge.svg)](https://github.com/WachsenHaus/codex-thinkboard/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/WachsenHaus/codex-thinkboard)](LICENSE)

> 막연한 생각을 ‘내가 원하는 것’과 ‘아직 알아야 할 것’이 연결된 살아 있는 보드로 바꿉니다.

Thinkboard는 생각을 구체화하는 오픈소스 Codex 플러그인입니다. 친근한 질문 핑퐁을 통해 원하는 결과, 중요한 미지, 확인된 단서, 아직 확인하지 않은 가정을 분리합니다.

**현재 상태:** 초기 알파. 대화 스킬, 로컬 MCP 세션 저장, React Flow 인터랙티브 캔버스가 하나의 얇은 엔드투엔드 흐름으로 동작합니다.

## 평범한 마인드맵과 다른 점

일반 마인드맵은 주제를 정리합니다. Thinkboard는 결정을 정리합니다.

- `want`는 성공했을 때 무엇이 달라지는지 나타냅니다.
- `unknown`은 어떤 원하는 결과를 막거나 바꿀 때만 남깁니다.
- `evidence`는 사용자가 실제로 확인한 사실과 단서입니다.
- `assumption`은 AI의 해석을 사실처럼 굳히지 않게 합니다.

가장 중요한 규칙은 하나입니다. **모든 활성 미지는 그것이 막거나 바꾸거나 해결할 원하는 결과에 연결되어야 합니다.**

## 사용 경험

Thinkboard는 ‘안내된 외부화’ 흐름을 따릅니다.

1. Codex가 막연한 출발점을 짧게 되비춥니다.
2. 가장 영향이 큰 질문 하나를 묻습니다.
3. 보드가 눈에 보이게 바뀝니다.
4. 사용자가 잘못된 해석을 직접 고칩니다.
5. 모순은 비난이 아니라 다음 질문이 됩니다.
6. 구체적인 결과, 우선순위가 붙은 미지, 다음 행동으로 끝냅니다.

로컬 캔버스는 AI가 정리한 주제 보기로 시작합니다. 각 카드에는 `문제`, `아이디어`, `결정`, `실행` 단계를 붙일 수 있으며, 같은 보드를 관계 그래프나 시간순 타임라인으로도 볼 수 있습니다. 사용자가 고친 주제는 이후 AI 재분류보다 우선합니다.

목표 비율은 대화형 안내 60%, 보드 직접 조작 30%, 탐정 보드 연출 10%입니다. 자세한 철학은 [제품 원칙](docs/PRODUCT.md)에 있습니다.

## 설치

이 GitHub 저장소를 Codex 플러그인 마켓플레이스로 추가합니다.

```sh
codex plugin marketplace add WachsenHaus/codex-thinkboard
codex plugin add codex-thinkboard@codex-thinkboard
```

설치 후 새 Codex 작업을 시작하고 스킬을 명시적으로 호출합니다.

```text
$thinkboard 이 기능을 정말 만들어야 하는지 생각을 정리해줘.
```

`thinkboard`, `씽크보드 시작`, “내가 뭘 원하는지 모르겠어” 같은 자연어도 트리거 설명에 포함되어 있지만, 명시 호출이 가장 확실합니다.

## 로컬 우선 프라이버시

Thinkboard 보드에는 개인적인 목표, 불확실성, 덜 다듬어진 생각이 담길 수 있으므로 로컬 우선으로 설계합니다.

- 스킬과 로컬 MCP는 사용자가 이미 선택한 Codex 환경 밖으로 보드를 별도 전송하지 않습니다.
- 보드 세션은 기본적으로 `~/.codex/thinkboard/board.json`에 저장합니다.
- 세션 파일은 기본적으로 Git에서 제외합니다.
- 첫 릴리스에는 텔레메트리, 계정, 협업, 호스팅 동기화를 넣지 않습니다.

민감한 내용을 다루기 전에 [PRIVACY.md](PRIVACY.md)를 읽어 주세요.

## 저장소 구조

```text
.agents/plugins/marketplace.json       저장소 마켓플레이스
plugins/codex-thinkboard/
  .codex-plugin/plugin.json            플러그인 manifest
  .mcp.json                             로컬 MCP 실행 설정
  mcp/board.mjs                         보드 검증·원자 저장
  mcp/protocol.mjs                      MCP 도구·JSON-RPC 처리
  mcp/web-host.mjs                      loopback HTTP·SSE·포트 인계
  mcp/server.mjs                        프로세스 조립·수명주기
  skills/thinkboard/SKILL.md            대화 프로토콜
  skills/thinkboard/references/         보드 데이터 규약
  web/src/features/board/               보드 API·상태·서비스·UI
  web/dist/                             생성된 정적 빌드
docs/PRODUCT.md                         제품·인터랙션 원칙
scripts/check.mjs                       구조·수기 코드 1,000줄 제한 검사
```

## 로드맵

- [x] 공개 플러그인 및 마켓플레이스 골격
- [x] Thinkboard 대화 프로토콜
- [x] 보드 JSON 규약과 Markdown 폴백
- [x] 세션 저장이 가능한 로컬 MCP 서버
- [x] 심문등·빨간 실 인터랙션이 있는 React Flow 캔버스
- [x] AI 주제 묶음, 사고 단계 배지, 타임라인 보기
- [ ] JSON 및 PNG 내보내기
- [ ] GitHub Pages 샘플 보드 데모
- [ ] 호스트가 지원하는 경우 선택적 Apps SDK 임베드 UI

핵심 질문 경험이 유용하다고 검증되기 전까지 협업, 계정, 자유 드로잉, 호스팅 동기화는 범위에서 제외합니다.

## 개발

Node.js 22 이상이 필요합니다.

로컬 캔버스의 기본 주소는 `http://127.0.0.1:43127`입니다. Codex가 번들 MCP를 시작하면 같은 프로세스가 캔버스도 제공합니다.
해당 포트를 사용할 수 없을 때만 `.env`의 `THINKBOARD_WEB_PORT`를 바꾸면
됩니다. Thinkboard는 Vite의 흔한 기본 포트 `5173`을 사용하지 않습니다.

```sh
npm ci
npm run check
npm start
```

`npm run check`는 웹 빌드, 보드 로직 테스트, MCP·HTTP 통합 테스트, 플러그인 구조 검사를 실행합니다. `npm start`는 개발 중 MCP와 로컬 캔버스를 직접 실행합니다. 릴리스 전에는 실제 Codex 클라이언트에서 설치와 동작을 함께 검증합니다.

실시간 Codex 대화, 빠른 선택 질문, 관계 자동 관리와 CLI 공동 사용의 개발 기준은 [Thinkboard 실시간 대화 개발 문서](docs/REALTIME_CONVERSATION.md)에 정리되어 있습니다.

## 기여

[CONTRIBUTING.md](CONTRIBUTING.md)에서 시작해 주세요. 열린 제품 토론은 GitHub Discussions, 재현 가능한 버그와 범위가 분명한 제안은 Issues를 사용합니다. 개인 정보, 프롬프트, 토큰, 로컬 경로를 지우지 않은 원본 세션을 첨부하지 마세요.

## 라이선스

[Apache-2.0](LICENSE)으로 배포합니다.
