# 서버의 URL fetch와 SSRF 위험

## Decisions

- URL→Markdown 변환 서버(`lib/convert.ts`)는 사용자가 입력한 URL을 http(s) 스킴 여부만
  확인하고 그대로 fetch한다. 사설·루프백·클라우드 메타데이터 주소를 차단하는 로직은
  추가하지 않는다.

## Boundaries

- 이 결정은 `docs/specs/url-to-markdown-llm-export/`의 현재 범위(로컬/학습용 배포)에
  한정된다. 이 서비스를 인터넷에 공개 배포하거나 사설 네트워크에서 실행하는 시나리오가
  생기면 이 결정을 다시 검토해야 한다.

## Why

로컬 학습용 템플릿 범위에서는 보안 하드닝이 스펙 밖(CLAUDE.md 검증 예산)이며, 스펙의
"남은 리스크" 섹션도 이 항목을 다루지 않았다. 배포 범위는 코드만으로 판단할 수 없는
제품 맥락이라 사람 검토(human-review)를 거쳐 사용자에게 명시적으로 확인받았고, 현재
범위 그대로 위험을 수용하기로 승인받았다(2026-08-20).

## Reconsider when

- 이 서비스를 로컬 환경 밖(공개 인터넷, 사설 네트워크 내부)에 배포하기로 결정할 때.
- `lib/convert.ts`의 fetch 대상 URL을 확장하거나 재사용하는 새 기능을 추가할 때.

## Still-rejected alternatives

- 사설/루프백/링크-로컬 IP 대역 차단 — 이번 범위에서는 불필요한 하드닝으로 보류;
  배포 범위가 넓어지면 재고.

## Evidence worth preserving

- `POST /api/convert {"url":"http://localhost:3000"}` → `{"error":"본문을 추출하지
  못했습니다."}` (네트워크 실패가 아닌 추출 실패 응답 — 서버가 루프백 주소에 실제로
  접속해 200 응답을 받았음을 의미).
