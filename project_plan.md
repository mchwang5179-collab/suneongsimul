# 수능 안내방송 시뮬레이터

## 1. Project Description
- 2028학년도 대학수학능력시험 시행 시간표를 기준으로, 실제 시험장에서 흘러나오는 안내방송을 그대로 재현하는 웹 시뮬레이터.
- 대상 사용자: 수험생, 학부모, 교사, 감독관, 방송 담당자 등 수능 진행 순서를 정확히 알고 싶은 사람.
- 핵심 가치: 시간표에 맞춰 08:10 입실 완료부터 17:10 과학탐구 종료까지 실제 진행 순서와 정확한 안내 멘트를 시계처럼 자동 재생하고, 화면 자막 + 음성 안내(TTS)로 전달.

## 2. Page Structure
- `/` - 수능 안내방송 시뮬레이터 (메인 화면, 승인된 회원/운영자만 접근)
- `/auth` - 로그인 / 회원가입 (가입비 계좌이체 안내 포함)
- `/pending` - 승인 대기 화면 (입금 안내 + 승인 상태 확인)
- `/inquiry` - 문의하기 (문의 작성 + 내 문의 내역/운영자 답변 확인, 로그인한 회원 누구나)
- `/admin` - 운영자 관리 (회원 관리 + 문의 관리)

## 3. Core Features
- [x] 2028학년도 수능 시간표 시각화 (교시/영역/시험시간/문항수/비고)
- [x] 시뮬레이션 시계 (08:10 ~ 17:10) 자동 진행
- [x] 진행 순서에 맞춘 안내방송 멘트 자동 재생 (자막 + 음성)
- [x] 재생/일시정지, 다음 안내로 건너뛰기, 처음부터 다시 시작
- [x] 재생 속도 조절 (실시간 ~ 600배속)
- [x] 음성 안내 끄기/켜기, 방송 알림음
- [x] 방송 기록(로그) 및 다시 듣기
- [x] 진행 중인 단계 시간표 하이라이트
- [x] 2027년 전 시행 / 2028년 이후 시행 수능 시간표 2버전 클릭 전환
- [x] 특정 시각 지정 이동 기능 및 주요 시각 바로가기
- [x] 회원가입 / 로그인 (SaaS Supabase Auth)
- [x] 가입비 5,000원 계좌이체 안내 (케이뱅크 100-105-356887, 예금주 황명철)
- [x] 가입 승인제 (입금자명 = 가입 이름) 및 운영자 승인/거절
- [x] 가입 후 1년 이용, 기간 만료 시 계정 유지(이용 중단)
- [x] 만료 후 재가입(연장) — 가입비 재입금 + 재가입 신청 → 운영자 재승인 시 1년 연장
- [x] 운영자 회원 관리 (승인/재승인/거절/영구삭제)
- [x] 문의 작성 및 내 문의 내역 확인 (답변 대기/완료)
- [x] 운영자 문의 관리 (답변 등록/수정, 문의 삭제)
- [x] 기출 영어듣기 음원 내장 (2023~2025학년도 6·9월 모의고사 및 수능, 학년도 기준 표기 + 시행 연도 병기)
- [x] 직접 파일 업로드는 운영자 전용, 일반 회원은 안내 문구로 대체 (13:07 직접 재생 안내)
- [x] 운영자가 올린 파일을 공용 음원으로 등록(모든 회원 사용)하거나 개인용으로만 사용 선택
- [x] 재가입(연장) 신청 시 운영자 계정 이메일로 자동 알림 (Resend 이메일)
- [x] 회원 화면에 내 이용 만료일(D-day) 상시 표시 + 만료 30일 전부터 임박 안내 배너

## 4. Data Model Design
- Supabase 테이블 `profiles`: id(auth.users FK), email, name, phone, role(member/admin), status(pending/approved/rejected/expired/renew_pending), created_at, approved_at, expires_at, memo
- RLS: 본인 또는 운영자만 조회, 운영자만 수정/삭제, 회원가입 트리거로 프로필 자동 생성
- 만료 판정: status=approved 이면서 expires_at이 과거이면 '기간 만료'로 표시(계정은 삭제하지 않음)
- 재가입 신청: 만료 회원이 재가입을 신청하면 status=renew_pending 으로 전환(회원은 본인 프로필을 직접 수정할 수 없어 `request-renewal` 엣지 함수가 대행). 전환 후 운영자(role=admin) 계정의 이메일로 알림 메일을 발송
- 운영자 재승인 시 status=approved, expires_at=+1년, 재가입 대기 거절 시 status=approved(기간 만료 상태로 복귀)
- 가입 트리거: `god2086@naver.com` 은 자동으로 role=admin, status=approved 처리
- Supabase 테이블 `inquiries`: id, user_id(auth.users FK), name, email, title, content, status(pending/answered), answer, answered_at, created_at
- RLS: 본인 또는 운영자만 조회, 본인만 작성, 운영자만 답변(수정), 본인 또는 운영자 삭제
- 운영자 판별용 `public.is_admin()` (SECURITY DEFINER) 함수 사용
- Supabase 테이블 `shared_listening_tracks`: id, label, url, storage_path, created_by(auth.users FK), created_at
- Supabase Storage 버킷 `listening-audio`(public)에 공용 음원 파일 보관
- RLS: 공용 음원 목록은 로그인 회원 누구나 조회, 등록/삭제는 운영자만 (테이블·Storage 모두 `public.is_admin()`)
- 안내방송 대본/시간표(2버전)는 프로젝트 내 정적 데이터 파일로 관리
- 기출 영어듣기 음원 목록(9종, 2023~2025학년도)은 프로젝트 내 정적 데이터 파일로 관리
  - 파일 이름은 시행 연도 기준이므로 혼동이 없도록 학년도 기준으로 표기하고 "(시행연도 시행)"을 병기
  - 선택한 내장 음원은 브라우저에 기억되어 새로고침 후에도 유지
  - "다른 파일 직접 올리기" 업로드는 운영자(isAdmin)에게만 노출
  - 운영자가 파일을 올리면 "공용 음원으로 등록" / "개인용으로만 사용" 중 선택
  - 공용 음원으로 등록하면 모든 회원 목록 맨 위 "공용 음원(운영자 등록)" 그룹에 노출되고, 운영자는 삭제 가능
  - 일반 회원에게는 다른 음원 사용 시 본인 준비 음원을 13:07에 직접 재생하라는 안내 문구 노출

## 5. Backend / Third-party Integration Plan
- Backend: SaaS Supabase (Auth + Postgres + Edge Functions)
- Edge Functions: `register-member`(가입 자동확인, 이메일 인증 없음), `admin-manage-members`(회원 영구삭제), `request-renewal`(만료 회원 재가입 신청 + 운영자 이메일 알림)
- 운영자 알림 이메일: Resend (엣지 함수 시크릿 `RESEND_API_KEY`, `RESEND_FROM_DOMAIN` 필요 · 발신 주소는 `noreply@${RESEND_FROM_DOMAIN}`로 런타임 생성). 이메일 발송이 실패해도 재가입 신청은 정상 접수됨
- 만료 임박 안내 기준: 만료 30일 전(`EXPIRY_WARNING_DAYS`)부터 회원 화면 상단에 경고 배너, 그 외 기간은 이용 만료일·D-day를 조용한 배너로 상시 표시
- 이메일 인증 없이 가입 → 운영자 승인만 되면 즉시 이용 가능
- 음성 안내: 브라우저 내장 음성 합성(Web Speech API) 사용
- Shopify / Stripe: 사용하지 않음

## 6. Development Phase Plan

### Phase 1: 수능 안내방송 시뮬레이터 (핵심 기능 전체)
- Goal: 시간표 기반으로 방송이 자동 진행되는 단일 화면 완성
- Deliverable: 방송 현황 패널, 시험 시간표, 진행 컨트롤, 방송 기록

### Phase 2: 수능 시간표 2버전 (완료)
- Goal: 2027년 전 / 2028년 이후 시간표를 클릭으로 전환
- Deliverable: 버전 전환 스위치, 4·5교시 분기 로직

### Phase 3: 회원 시스템 (완료)
- Goal: 가입비 입금 기반 승인제 회원 관리 및 1년 이용/만료 후 재가입(연장)
- Deliverable: 로그인/회원가입(이메일 인증 없음), 승인 대기, 운영자 회원 관리, 만료 시 재가입 신청·재승인

### Phase 4: 문의 시스템 (완료)
- Goal: 회원이 문의를 남기고 운영자가 답변·관리
- Deliverable: 문의 페이지(작성/내역), 운영자 문의 관리 탭(답변/삭제)