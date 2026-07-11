# Codex Thinkboard

[English](README.md)

[![CI](https://github.com/WachsenHaus/codex-thinkboard/actions/workflows/ci.yml/badge.svg)](https://github.com/WachsenHaus/codex-thinkboard/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/WachsenHaus/codex-thinkboard)](LICENSE)

> 막연한 생각을 ‘내가 원하는 것’과 ‘아직 알아야 할 것’이 연결된 살아 있는 보드로 바꿉니다.

Thinkboard는 생각을 구체화하는 오픈소스 Codex 플러그인입니다. 친근한 질문 핑퐁을 통해 원하는 결과, 중요한 미지, 확인된 단서, 아직 확인하지 않은 가정을 분리합니다.

**현재 상태:** 초기 알파. 대화 스킬과 보드 규약은 사용할 수 있으며, 로컬 인터랙티브 캔버스가 다음 마일스톤입니다.

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

- 현재 스킬은 사용자가 이미 선택한 Codex 환경 밖으로 별도 전송하지 않습니다.
- 앞으로의 로컬 보드 세션은 사용자가 통제하는 데이터 디렉터리에 저장합니다.
- 세션 파일은 기본적으로 Git에서 제외합니다.
- 첫 릴리스에는 텔레메트리, 계정, 협업, 호스팅 동기화를 넣지 않습니다.

민감한 내용을 다루기 전에 [PRIVACY.md](PRIVACY.md)를 읽어 주세요.

## 저장소 구조

```text
.agents/plugins/marketplace.json       저장소 마켓플레이스
plugins/codex-thinkboard/
  .codex-plugin/plugin.json            플러그인 manifest
  skills/thinkboard/SKILL.md            대화 프로토콜
  skills/thinkboard/references/         보드 데이터 규약
docs/PRODUCT.md                         제품·인터랙션 원칙
scripts/check.mjs                       무의존성 저장소 검사
```

## 로드맵

- [x] 공개 플러그인 및 마켓플레이스 골격
- [x] Thinkboard 대화 프로토콜
- [x] 보드 JSON 규약과 Markdown 폴백
- [ ] 세션 저장이 가능한 로컬 MCP 서버
- [ ] 심문등·빨간 실 인터랙션이 있는 React Flow 캔버스
- [ ] JSON 및 PNG 내보내기
- [ ] GitHub Pages 샘플 보드 데모
- [ ] 호스트가 지원하는 경우 선택적 Apps SDK 임베드 UI

핵심 질문 경험이 유용하다고 검증되기 전까지 협업, 계정, 자유 드로잉, 호스팅 동기화는 범위에서 제외합니다.

## 개발

Node.js 22 이상이 필요합니다.

```sh
npm ci
npm run check
```

검사는 플러그인 manifest, 마켓플레이스 항목, 스킬 frontmatter, 남은 scaffold 문구를 확인합니다. 릴리스 전에는 실제 Codex 클라이언트에서 설치와 동작을 함께 검증합니다.

## 기여

[CONTRIBUTING.md](CONTRIBUTING.md)에서 시작해 주세요. 열린 제품 토론은 GitHub Discussions, 재현 가능한 버그와 범위가 분명한 제안은 Issues를 사용합니다. 개인 정보, 프롬프트, 토큰, 로컬 경로를 지우지 않은 원본 세션을 첨부하지 마세요.

## 라이선스

[Apache-2.0](LICENSE)으로 배포합니다.
