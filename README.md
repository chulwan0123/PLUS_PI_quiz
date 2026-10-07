# PLUS 파이 OX 퀴즈

베이비페어 현장 LG StanbyME 2 세로 화면을 위한 PLUS 파이 홍보 퀴즈입니다.

- 운영: https://plus-pi-quiz.vercel.app/
- 기술: React 19.2.0, Vite 6.4.2, Supabase Auth/Postgres/Storage
- 화면: 홈 → 무작위 2문항 → 경품 팝업 → 레벨·정답·해설 → 앱 설치 QR
- 캔버스: 9:16. 가로 브라우저에서는 회색 배경 중앙에 배치합니다.

## 현재 운영 콘텐츠

2026-10-07 검증 기준 정식 문제 5개가 활성 상태이며, 모든 활성 문항의 힌트는 꺼져 있고 힌트 문구·이미지 연결은 비어 있습니다. `문제테스트`는 비활성화해 출제에서 제외했습니다. 관리자에 미사용 기록은 남아 있습니다.

운영 문항은 Supabase 데이터입니다. 이 콘텐츠 정리는 관리자에서 반영했으며 소스 변경이나 재배포가 필요하지 않았습니다. 저장소의 초기 SQL과 기본 5문항은 운영 DB의 모든 변경 이력을 재현하는 백업이 아닙니다.

## 실행과 빌드

Node.js와 npm이 설치된 환경에서:

```sh
npm ci
npm run dev
npm run build
npm run test:sites
```

Supabase 연결은 `.env.example`을 참고해 `.env.local`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 설정합니다. `VITE_SUPABASE_ANON_KEY`도 대체 키로 지원합니다. 실제 환경변수 파일과 비밀 키는 커밋하지 않습니다.

연결 정보가 없거나 활성 문제 조회가 실패하거나 2개 미만이면 코드의 기본 5문항으로 동작합니다. 관리자 사용에는 Supabase 마이그레이션 적용, Google OAuth 설정, `/admin` 리디렉션 허용이 필요합니다. 인증된 `@hanwha.plus` 계정의 데이터·Storage 권한은 RLS로 제한합니다.

## 화면과 소스

| 경로/파일 | 역할 |
|---|---|
| `/` · `src/App.jsx` | 홈, 문제 선택·채점·진행률·힌트 지원 |
| `src/ResultScreen.jsx` | 6개 레벨, MP4 캐릭터, 해설, 앱 설치 QR |
| `src/RewardDialog.jsx` | 경품 팝업, 10초 카운트다운, 파티클 |
| `/admin` · `src/AdminPage.jsx` | Google 로그인, 문제·활성 여부·힌트 관리 |
| `/suri-review` · `src/SuriVideoReview.jsx` | 6개 영상 크롭 검수; 현재 운영에서도 접근 가능 |
| `src/SuriMascot.jsx`, `src/styles.css` | SVG 캐릭터와 디자인·애니메이션 |
| `supabase/migrations/` | 문제 스키마, RLS, Storage, 초기 데이터 |
| `worker/`, `scripts/`, `tests/` | Sites 정적 호스팅·SPA fallback·패키징 |

문제별 선택 후 700ms에 자동 진행합니다. 마지막 답변은 진행률을 650ms 동안 100%로 채웁니다. 0개 정답은 파이 첫걸음, 1개는 첫걸음/새싹/탐험가 중 무작위, 2개는 계산왕/자산박사/마스터 중 무작위입니다. 0~1개는 캔디, 2개는 타포린백을 안내합니다.

앱 설치 QR은 `https://link-pluspi.hanwhalife.com/amw5zes`를 목적지로 사용하는 정적 SVG입니다. 방문자가 휴대폰으로 화면을 스캔하는 방식입니다. 풀이 결과 저장, 중복 참여 제한, 분석 이벤트, 오디오는 구현하지 않았습니다.

## 배포와 검증

Vercel은 `npm run build` 후 `dist/client`를 배포합니다. Sites 패키징은 `dist/server/index.js`와 `dist/.openai/hosting.json`도 생성합니다. 기존 자동 테스트 4개는 배포 worker와 산출물을 검증하며 퀴즈·관리자 전체 회귀 테스트는 아닙니다.

- [현재 화면 검증](design-qa.md)
- [운영 검증·콘텐츠 정리·한계](docs/production-verification.md)
- [과거 5문항 검수 기록](docs/archive/design-qa-legacy.md)
- [작업 지침 및 제품 결정](AGENTS.md)
