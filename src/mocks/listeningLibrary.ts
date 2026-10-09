/**
 * 수능·모의평가 영어 듣기 평가 기출 음원 목록.
 * 파일 이름은 시행 연도 기준이므로, 대입을 결정하는 학년도 기준으로 바꿔 표기한다.
 * (예: 2022년 시행 → 2023학년도 시험)
 */
export interface ListeningTrack {
  id: string;
  /** 학년도 (대입 기준 연도) */
  gradeYear: number;
  /** 실제 시행 연도 */
  adminYear: number;
  /** 정식 시험명 */
  examType: string;
  /** 목록 배지용 축약명 */
  shortType: string;
  /** 화면에 표시할 전체 라벨 */
  label: string;
  /** 음원 주소 */
  url: string;
}

export const LISTENING_TRACKS: ListeningTrack[] = [
  {
    id: "2025-csat",
    gradeYear: 2025,
    adminYear: 2024,
    examType: "대학수학능력시험",
    shortType: "수능",
    label: "2025학년도 대학수학능력시험 영어듣기 (2024년 시행)",
    url: "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/652fbfab-a77c-42f8-a919-38dd33ab4bcd_2024--.mp3",
  },
  {
    id: "2025-sep",
    gradeYear: 2025,
    adminYear: 2024,
    examType: "9월 모의고사",
    shortType: "9월",
    label: "2025학년도 9월 모의고사 영어듣기 (2024년 시행)",
    url: "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/b30db801-b391-48a2-882f-b9dcbe7fba2f_2024-9--.mp3",
  },
  {
    id: "2025-jun",
    gradeYear: 2025,
    adminYear: 2024,
    examType: "6월 모의고사",
    shortType: "6월",
    label: "2025학년도 6월 모의고사 영어듣기 (2024년 시행)",
    url: "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/9ceaad8b-52e0-43ee-84e7-813577b95026_2024-6--.mp3",
  },
  {
    id: "2024-csat",
    gradeYear: 2024,
    adminYear: 2023,
    examType: "대학수학능력시험",
    shortType: "수능",
    label: "2024학년도 대학수학능력시험 영어듣기 (2023년 시행)",
    url: "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/95612b65-3707-44e1-8dec-cb43a577de3e_2023--.mp3",
  },
  {
    id: "2024-sep",
    gradeYear: 2024,
    adminYear: 2023,
    examType: "9월 모의고사",
    shortType: "9월",
    label: "2024학년도 9월 모의고사 영어듣기 (2023년 시행)",
    url: "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/5bd7e45d-3270-4687-81ae-1a9280f68c25_2023-9--.mp3",
  },
  {
    id: "2024-jun",
    gradeYear: 2024,
    adminYear: 2023,
    examType: "6월 모의고사",
    shortType: "6월",
    label: "2024학년도 6월 모의고사 영어듣기 (2023년 시행)",
    url: "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/eee42848-398b-4bbb-bade-f79f990d50ec_2023-6--.mp3",
  },
  {
    id: "2023-csat",
    gradeYear: 2023,
    adminYear: 2022,
    examType: "대학수학능력시험",
    shortType: "수능",
    label: "2023학년도 대학수학능력시험 영어듣기 (2022년 시행)",
    url: "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/d3454429-06ee-49d3-9bc7-07029d43578b_2022--.mp3",
  },
  {
    id: "2023-sep",
    gradeYear: 2023,
    adminYear: 2022,
    examType: "9월 모의고사",
    shortType: "9월",
    label: "2023학년도 9월 모의고사 영어듣기 (2022년 시행)",
    url: "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/c8430ee8-edb4-4dcf-abfc-bc48aa7cef09_2022-9--.mp3",
  },
  {
    id: "2023-jun",
    gradeYear: 2023,
    adminYear: 2022,
    examType: "6월 모의고사",
    shortType: "6월",
    label: "2023학년도 6월 모의고사 영어듣기 (2022년 시행)",
    url: "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/7a30736b-d7b3-47e3-ab2b-b034283c6d37_2022-6--.mp3",
  },
];