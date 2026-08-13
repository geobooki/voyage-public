# Voyage

여행 전·중·후를 한 곳에서 관리하는 여행 기록 웹앱의 MVP입니다.

## 실행

```bash
npm install
npm run dev
```

Supabase를 연결하려면 `.env.example`을 `.env.local`로 복사하고 URL과 anon key를 입력한 뒤 Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다. 이미 RLS를 켠 프로젝트라면 이어서 `supabase/rls.sql`도 반드시 실행해야 합니다. 화면을 바로 확인하려면 이어서 `supabase/seed.sql`을 실행합니다. 현재 화면은 연결 전에도 데모 데이터로 동작합니다.

## Supabase / Vercel

Vercel 프로젝트의 Environment Variables에 아래 값을 Development, Preview, Production 범위로 등록합니다.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

배포 전 Supabase SQL Editor에서 `supabase/schema.sql`, `supabase/rls.sql`과 필요 시 `supabase/seed.sql`을 실행합니다. `rls.sql`은 기존 데이터나 정책을 삭제하지 않고, 없는 MVP용 공개 정책만 추가합니다. `rls.sql`은 Auth가 없는 MVP용 공개 정책입니다. 실제 사용자 데이터 서비스로 전환할 때는 Supabase Auth와 `auth.uid()` 기반 정책으로 교체해야 합니다. 값이 없는 환경에서는 API가 `503`을 반환하고 앱은 localStorage 데모 모드로 유지됩니다. 민감한 service role key나 외부 지도·날씨 key는 브라우저 코드에 넣지 않습니다.

## 현재 라우트

- `/` Overview dashboard
- `/trips` 여행 목록
- `/trips/new` 여행 생성
- `/trips/[tripId]` 여행 단계 선택
- `/trips/[tripId]/before` 여행 전 준비
- `/trips/[tripId]/before/preparation` 준비할 일 체크리스트
- `/trips/[tripId]/before/budget` 예상 경비·환전 계획
- `/trips/[tripId]/before/reservations` 예약 정보
- `/trips/[tripId]/during` 여행 중 일정·지출
- `/trips/[tripId]/during/schedule` 날짜별 Board 일정
- `/trips/[tripId]/during/map` 저장 장소 지도
- `/trips/[tripId]/during/souvenirs` 기념품 위시리스트
- `/trips/[tripId]/during/weather` 일정별 날씨
- `/trips/[tripId]/after` 여행 후 통계·후기
- `/map` Travel Archive 세계지도

새로 추가하는 checklist, 장소, 일정, 예약, 예산, 기념품, 환전, 후기, 지출, 여행자 항목은 브라우저에서 UUID를 생성해 localStorage와 Supabase에서 같은 식별자를 사용합니다. 따라서 Supabase 연결 후에도 후속 수정·삭제와 장소-지출 연결이 유지됩니다.

모바일에서는 하단 내비게이션, 데스크톱에서는 좌측 사이드 내비게이션을 제공합니다. Supabase 환경변수가 없으면 localStorage 기반 데모 모드로 동작합니다.
