# 그린나래 독서실 좌석 예약 — 앱 시스템

알림톡을 폐기하고 **키오스크 + 사용자 앱 + Supabase** 로 만든 좌석 예약 생태계.
빌드 도구 없음 — **HTML 파일을 드래그해서 배포**한다 (dorm-ops 방식).

```
greennarae-app/
├─ kiosk.html            키오스크 앱 (독서실 입구 화면: QR 스캔→예약/퇴실)
├─ app.html             사용자 앱/PWA (학생 폰: 로그인·내 QR·현황·알림)
├─ manifest.webmanifest  PWA 설정
├─ sw.js                서비스워커 (웹푸시 수신 — Phase 2)
├─ icon.svg             앱 아이콘
└─ supabase/setup.sql   데이터베이스 스키마 + 서버 로직(RPC)
```

## 어떻게 도나 (생태계)
```
 [학생 폰: app.html]                         [독서실: kiosk.html]
  로그인/가입 → 내 QR(60초 회전) ── 스캔 ───▶ QR 확인 → 좌석 선택 → 예약
  퇴실 30분 전 푸시 ◀───────┐                 입실/퇴실
  내 예약 현황              │                       │
        └─────────┬────────┴───────────────────────┘
                  ▼   [ Supabase : DB + RPC ]
          회원·예약·QR토큰·푸시  /  예약은 반드시 키오스크에서(원격 불가)
```
- **예약은 키오스크 앞에서 QR을 찍어야만** 된다 → 직접 와야 예약 = 유령자리·독점 방지.
- 앱은 **열쇠(QR)+알림+현황**, 키오스크는 **예약 창구**. Supabase가 둘을 잇는다.

---

## 처음 설정 (한 번만)

### 1) Supabase 만들기
[supabase.com](https://supabase.com) 가입 → **New project** (Region: **Northeast Asia (Seoul)**, DB 비밀번호 메모).
왼쪽 **SQL Editor → New query** 에 `supabase/setup.sql` 전체를 붙여넣고 **Run**.
`Success. No rows returned` 이면 성공. (다시 실행해도 데이터 안 지워짐)

### 2) 열쇠 두 개 넣기
**Project Settings → API** 에서 복사:
- **Project URL** `https://xxxx.supabase.co`
- **anon public** 키 `eyJ...` (⚠️ service_role 키는 절대 사용 금지)

`kiosk.html` 과 `app.html` **상단 두 줄**에 각각 붙여넣는다.
```js
const SUPABASE_URL = "https://xxxx.supabase.co";
const SUPABASE_KEY = "eyJ...";
```

### 3) 로그인 방식 설정 (중요)
앱은 **학번 + 비밀번호**로 가입·로그인한다(이름·학번·비밀번호만 수집).
내부적으로 학번을 `학번@greennarae.local` 형태의 이메일로 바꿔 Supabase Auth에 저장하므로,
**Authentication → Providers → Email 에서 "Confirm email"(이메일 확인)을 반드시 OFF** 로 둬야 한다.
(합성 이메일이라 받은편지함이 없어 확인 링크를 누를 수 없다 → 켜두면 가입이 막힌다)
- 비밀번호는 6자 이상. 분실 시 이메일 재설정이 없으니 **관리자가 초기화**하거나 재가입한다(파일럿 기준).

### 4) 배포 — 각각 드래그
[app.netlify.com/drop](https://app.netlify.com/drop) 에 **폴더째** 끌어다 놓으면 주소가 나옵니다.
- 학생용: `.../app.html` 주소를 학생들에게 공유 → 폰에서 **공유 → 홈 화면에 추가**
- 키오스크용: 같은 사이트의 `.../kiosk.html` 을 독서실 PC에서 전체화면으로

> 참고: `app.html`은 QR 그리기용으로 cdnjs의 qrcode 라이브러리 1개를 씁니다(폰은 온라인이라 무방). 완전 자립을 원하면 나중에 인라인할 수 있습니다. `kiosk.html`은 외부 스크립트 0.

### 5) ★ 키오스크 탈옥(장난) 방지 — 독서실 PC 잠금
브라우저 전체화면(F11)만으론 부족합니다. **윈도우 내장 잠금**을 씁니다:
- **설정 ▸ 계정 ▸ 키오스크(할당된 액세스)** → 전용 계정 + **Edge 키오스크 모드**로 `kiosk.html` 주소만 실행
  → 작업표시줄·시작·Win키·Alt+Tab·바탕화면 **원천 차단**, 무동작 시 자동 리셋
- **비관리자(표준) 전용 계정 + 자동 로그인**
- **★ 물리 키보드 없이 터치 + USB QR 리더기만** 연결 → 탈출 단축키가 물리적으로 불가
- (Home 에디션엔 할당된 액세스가 없음 → Pro 업그레이드 또는 Chrome `--kiosk` + 키보드 필터)

### 6) QR 리더기
**USB 바코드/QR 스캐너(키보드=HID 방식)** 를 키오스크 PC에 연결. 스캔하면 코드가 자동 입력되어 `kiosk.html`이 받습니다(별도 설정 불필요).

---

## 지금까지(Phase 1) 되는 것 ✅
- 회원가입/로그인, 프로필(학번·이름·동의)
- **내 QR 60초 회전**(도용 방지) · 내 예약 현황
- 키오스크: **QR 스캔 → 신원확인 → 좌석 예약 / 퇴실**, 현황 실시간, 시간 만료 자동 반환
- 한 사람 한 자리, 점검중 좌석 차단, 이용시간 30/60/90/120분

## 로드맵
- **Phase 2 — 웹푸시(퇴실 30분 전 등)**: Supabase **Edge Function**(web-push + VAPID) + `pg_cron` 스케줄러. `app.html`의 알림 버튼은 `VAPID_PUBLIC` 키가 채워지면 활성.
- **Phase 3 — 관리자·부가**: 관리자 화면(강제퇴실·점검·통계), 미사용 좌석 신고 UI, 연장 버튼(키오스크), 오프라인 캐시.

## 결정/입력이 필요한 것 (사용자)
1. **Supabase 프로젝트 생성** + URL/KEY (1~4단계) — 이게 있어야 실제로 돕니다
2. **로그인 방식** — 학번+비밀번호(합성 이메일 방식). Auth의 이메일 확인은 반드시 OFF. 카카오 로그인 등 원하면 알려주세요
3. **아이콘** — 지금은 SVG. 스토어/고해상도용 PNG는 나중에
4. **푸시(Phase 2)** — 진행 시 VAPID 키 발급 + Edge Function 배포 안내

## 개발 메모
- 키오스크 예약 생성은 **RPC(SECURITY DEFINER)** 로만 — anon 키오스크는 QR 토큰을 제출할 뿐, 로직은 서버(Postgres)에서 검증.
- 회전 QR: 앱이 `mint_qr()` 로 60초 토큰 발급 → 키오스크가 `verify_qr(token)` 로 확인. 캡처해도 60초 후 무효.
- 문의: 그린나래 · 031-379-0174
