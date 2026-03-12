# TeamUp (InstantDB)

Dynamic Class Grouper — InstantDB + Vite + React

[InstantDB](https://instantdb.com) — client-side database with queries, transactions, auth, permissions, real-time.

## 설정

1. [InstantDB](https://instantdb.com)에서 앱 생성
2. 프로젝트 루트에서 실행:

```bash
npx instant-cli init
```

3. `.env`에 `VITE_INSTANT_APP_ID` 설정 (또는 init 시 자동 생성)
4. (선택) `.env`에 `VITE_ADMIN_EMAIL` 설정 — 관리자 이메일 (기본: admin@example.com)

## 스키마 푸시

```bash
npx instant-cli push schema
npx instant-cli push perms
```

## 실행

```bash
npm run dev
```

## 배포 (Vercel)

1. GitHub에 푸시
2. Vercel에서 프로젝트 연결
3. 환경 변수 `VITE_INSTANT_APP_ID` 추가
4. 배포

## 기능

- **관리자**: Magic Code 로그인 → 세션 생성 → 출석 확인 → Shuffle → 마스터 보드
- **학생**: Magic Code 로그인 → 4자리 코드 체크인 → My Team
- **마스터 보드**: `/master/:sessionId` (로그인 불필요)
