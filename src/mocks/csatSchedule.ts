export type CsatPhaseType =
  | "entry"
  | "notice"
  | "exam"
  | "break"
  | "collect"
  | "end";

export interface CsatEvent {
  id: string;
  time: string;
  clockMin: number;
  period: string;
  title: string;
  type: CsatPhaseType;
  announcement: string;
  rowId: string;
  /** 실제 방송 음원 URL (있으면 TTS 대신 이 음원을 재생) */
  audioUrl?: string;
  /** 실제 방송 음원 파일 번호 (예: "001") */
  audioNo?: string;
}

/** 시간표 표의 한 행(교시/휴식/안내 띠/마무리)을 표현하는 데이터 */
export interface TimetableRow {
  id: string;
  kind: "banner" | "break" | "exam" | "footer";
  /** banner/break/footer 행의 표시 문구 */
  text?: string;
  /** exam 행의 교시 (병합 시작 행에만 지정) */
  period?: string;
  /** 교시 셀 병합 범위 */
  periodRowSpan?: number;
  area?: string;
  time?: string;
  duration?: string;
  questions?: string;
  note?: string;
  tone?: "primary" | "secondary" | "accent";
}

export type CsatVersionId = "legacy" | "reform";

export interface CsatVersionInfo {
  id: CsatVersionId;
  shortLabel: string;
  longLabel: string;
  description: string;
}

export interface CsatPreset {
  label: string;
  time: string;
}

export interface CsatSchedule {
  id: CsatVersionId;
  info: CsatVersionInfo;
  meta: {
    exam: string;
    title: string;
    range: string;
  };
  startMin: number;
  endMin: number;
  listeningEventId: string;
  events: CsatEvent[];
  timetableRows: TimetableRow[];
  presets: CsatPreset[];
}

/** 방송 시각이 곧 0시 기준 분(minute)으로 계산되므로 공통 시작 시각만 상수로 둔다. */
export const SIM_START_MIN = 485; // 08:05 감독관 입실

/** 3교시 영어 듣기평가 칸(사용자가 직접 음원을 첨부하는 칸)의 id */
export const LISTENING_EVENT_ID = "k3-listening";

export const SPEED_OPTIONS = [
  { value: 1, label: "1배속", desc: "기본 (실시간)" },
  { value: 1.1, label: "1.1배속", desc: "조금 빠르게" },
  { value: 1.2, label: "1.2배속", desc: "빠르게" },
  { value: 1.3, label: "1.3배속", desc: "더 빠르게" },
  { value: 1.4, label: "1.4배속", desc: "매우 빠르게" },
  { value: 1.5, label: "1.5배속", desc: "최대 속도" },
];

/**
 * 두 버전(2027년 전 / 2028년 이후)이 완전히 동일하게 흐르는 공통 구간.
 * 08:05 감독관 입실부터 4교시 한국사 종료(15:20)까지.
 * 1~3교시와 4교시 한국사까지는 두 버전의 시각이 같아 같은 안내를 재사용한다.
 */
const COMMON_EVENTS: CsatEvent[] = [
  {
    id: "supervisor-entry",
    time: "08:05",
    clockMin: 485,
    period: "입실",
    title: "감독관 입실 및 시험 준비 안내",
    type: "entry",
    rowId: "entry-banner",
    announcement:
      "수험생 여러분, 안녕하십니까. 잠시 후 감독관이 입실하여 시험 준비를 시작합니다. 수험생 여러분께서는 지정된 좌석에 착석해 주시기 바랍니다. 책상 위에는 수험표, 신분증, 컴퓨터용 사인펜, 흑색 연필, 지우개만 올려놓으시기 바랍니다. 휴대전화와 스마트워치 등 모든 전자기기는 전원을 끄고 가방 안에 넣어 지정된 장소에 보관해 주시기 바랍니다.",
    audioNo: "001",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/99ebdea3-1b62-41d1-b1df-59bdbfd0d080_001.mp3",
  },
  {
    id: "entry",
    time: "08:10",
    clockMin: 490,
    period: "입실",
    title: "시험 안내 방송",
    type: "notice",
    rowId: "entry-banner",
    announcement:
      "수험생 여러분, 안녕하십니까. 시험에 대한 안내 말씀을 드리겠습니다. 수험생 및 감독관 입실이 완료되었습니다. 답안지 작성 요령과 시험 진행 순서를 잘 듣고, 감독관의 안내에 따라 주시기 바랍니다.",
    audioNo: "002",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/fcafe8ed-e34c-4fd9-ae1e-c9eba627a4b4_002.mp3",
  },
  {
    id: "k1-prep",
    time: "08:25",
    clockMin: 505,
    period: "1교시",
    title: "제1교시 국어 예비령",
    type: "notice",
    rowId: "k1",
    announcement:
      "수험생 여러분께 알려드립니다. 이제 예비령을 울리겠습니다. 잠시 후 1교시 국어 영역 시험이 시작됩니다. 답안지에 성명, 수험번호, 지원 영역을 정확하게 기재하시고, 문제지 표지에서 문형과 시험 시간을 확인하시기 바랍니다.",
    audioNo: "003",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/6bc45a6f-0afb-4c6f-86fd-b8b9f370817d_003.mp3",
  },
  {
    id: "k1-ready",
    time: "08:35",
    clockMin: 515,
    period: "1교시",
    title: "제1교시 국어 준비령",
    type: "notice",
    rowId: "k1",
    announcement:
      "이제 준비령을 울리겠습니다. 잠시 후 1교시 국어 영역 시험이 시작됩니다. 문제지와 답안지를 확인하시고, 감독관의 안내가 있기 전까지 문제지 표지를 넘기지 말아 주시기 바랍니다.",
    audioNo: "004",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/bba120e7-66a3-4ff1-bb52-22fc71d2f663_004.mp3",
  },
  {
    id: "k1-start",
    time: "08:40",
    clockMin: 520,
    period: "1교시",
    title: "제1교시 국어 본령",
    type: "exam",
    rowId: "k1",
    announcement:
      "지금부터 1교시 국어 영역 시험을 시작하겠습니다. 시험 시간은 80분입니다. 답안지는 컴퓨터용 사인펜으로만 작성하시고, 답을 고칠 때에는 수정 테이프를 사용하시기 바랍니다. 시험 종료 10분 전부터는 퇴실할 수 없습니다.",
    audioNo: "005",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/f735e488-331a-49b5-bd00-4ab909f68d26_005.mp3",
  },
  {
    id: "k1-ten",
    time: "09:50",
    clockMin: 590,
    period: "1교시",
    title: "국어 영역 종료 10분 전",
    type: "notice",
    rowId: "k1",
    announcement:
      "수험생 여러분께 알려드립니다. 시험 종료 10분 전입니다. 아직 답안을 작성하지 못한 문항이 없는지 확인하시고, 답안지에 표기한 답이 정확한지 다시 한번 점검해 주시기 바랍니다.",
    audioNo: "006",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/567b8e7c-bfc2-467d-ba9d-68044791e8d5_006.mp3",
  },
  {
    id: "k1-end",
    time: "10:00",
    clockMin: 600,
    period: "1교시",
    title: "제1교시 종료 · 답안지 제출",
    type: "end",
    rowId: "break-1",
    announcement:
      "1교시 국어 영역 시험을 마치겠습니다. 필기구를 모두 내려놓으시고, 답안지를 펼친 상태로 책상 위에 놓아 주시기 바랍니다. 문제지는 책상 위에 그대로 두시고, 감독관의 지시에 따라 답안지를 제출해 주시기 바랍니다. 지금부터 20분간 휴식 시간입니다.",
    audioNo: "007",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/1f3b6654-a61f-401a-b436-170a3c1046e6_007.mp3",
  },
  {
    id: "k2-entry",
    time: "10:15",
    clockMin: 615,
    period: "2교시",
    title: "제2교시 입실 완료 및 감독관 안내",
    type: "notice",
    rowId: "k2",
    announcement:
      "수험생 여러분께 알려드립니다. 2교시 시험 준비를 위해 지정된 좌석에 착석해 주시기 바랍니다. 잠시 후 답안지를 배부하겠습니다.",
    audioNo: "008",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/2d28ee61-9090-4128-958a-96c35dd4cd4e_008.mp3",
  },
  {
    id: "k2-prep",
    time: "10:20",
    clockMin: 620,
    period: "2교시",
    title: "제2교시 수학 예비령",
    type: "notice",
    rowId: "k2",
    announcement:
      "이제 예비령을 울리겠습니다. 잠시 후 2교시 수학 영역 시험이 시작됩니다. 답안지에 성명과 수험번호, 지원 영역을 정확하게 기재하고, 선택한 과목의 문제지와 답안지가 맞는지 확인하시기 바랍니다.",
    audioNo: "009",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/2daf8cbe-a6fc-4dbc-abf8-6e5910d09c4f_009.mp3",
  },
  {
    id: "k2-ready",
    time: "10:25",
    clockMin: 625,
    period: "2교시",
    title: "제2교시 수학 준비령",
    type: "notice",
    rowId: "k2",
    announcement:
      "이제 준비령을 울리겠습니다. 잠시 후 2교시 수학 영역 시험이 시작됩니다. 문제지와 답안지를 확인하시고, 감독관의 안내가 있기 전까지 문제지 표지를 넘기지 말아 주시기 바랍니다.",
    audioNo: "010",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/4c0277c6-245d-4ef7-a42b-6425471823e6_010.mp3",
  },
  {
    id: "k2-start",
    time: "10:30",
    clockMin: 630,
    period: "2교시",
    title: "제2교시 수학 본령",
    type: "exam",
    rowId: "k2",
    announcement:
      "지금부터 2교시 수학 영역 시험을 시작하겠습니다. 시험 시간은 100분입니다. 수학 영역은 선택과목에 따라 문제지가 다르므로, 본인이 선택한 과목의 문제지와 답안지가 맞는지 다시 한번 확인하시기 바랍니다.",
    audioNo: "011",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/6b6eadfb-1c95-4b59-9d0c-40e7494f5081_011.mp3",
  },
  {
    id: "k2-ten",
    time: "12:00",
    clockMin: 720,
    period: "2교시",
    title: "수학 영역 종료 10분 전",
    type: "notice",
    rowId: "k2",
    announcement:
      "수험생 여러분께 알려드립니다. 시험 종료 10분 전입니다. 답안지 작성 상태를 다시 한번 확인하시기 바랍니다.",
    audioNo: "012",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/72d4409c-900c-46ae-9ec2-cd6b57e820bd_012.mp3",
  },
  {
    id: "k2-end",
    time: "12:10",
    clockMin: 730,
    period: "2교시",
    title: "제2교시 종료 · 점심시간",
    type: "end",
    rowId: "break-2",
    announcement:
      "2교시 수학 영역 시험을 마치겠습니다. 필기구를 내려놓으시고 답안지를 제출해 주시기 바랍니다. 지금부터 50분간 점심시간입니다. 3교시 시험 시작에 맞추어 13시까지 지정된 좌석에 착석해 주시기 바랍니다.",
    audioNo: "013",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/babcdcff-cf14-4ffc-aff5-da192d09b095_013.mp3",
  },
  {
    id: "k3-entry",
    time: "12:55",
    clockMin: 775,
    period: "3교시",
    title: "제3교시 입실 완료 및 감독관 안내",
    type: "notice",
    rowId: "k3",
    announcement:
      "점심시간이 끝났습니다. 수험생 여러분께서는 지정된 좌석에 착석해 주시기 바랍니다. 잠시 후 3교시 영어 영역 시험이 시작됩니다. 영어 영역 미선택자는 감독관의 안내에 따라 대기실로 이동해 주시기 바랍니다.",
    audioNo: "014",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/4f51549b-94fd-4829-bb81-d6deb6d66ffc_014.mp3",
  },
  {
    id: "k3-prep",
    time: "13:00",
    clockMin: 780,
    period: "3교시",
    title: "제3교시 영어 예비령",
    type: "notice",
    rowId: "k3",
    announcement:
      "이제 예비령을 울리겠습니다. 잠시 후 3교시 영어 영역 시험이 시작됩니다. 답안지에 성명과 수험번호를 기재하고, 문제지와 답안지의 인쇄 상태를 확인하시기 바랍니다.",
    audioNo: "015",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/4ad6d99a-5e0c-4fcb-8a65-2c34acc578e5_015.mp3",
  },
  {
    id: "k3-ready",
    time: "13:05",
    clockMin: 785,
    period: "3교시",
    title: "제3교시 영어 준비령",
    type: "notice",
    rowId: "k3",
    announcement:
      "이제 준비령을 울리겠습니다. 잠시 후 3교시 영어 영역 시험이 시작됩니다. 영어 영역은 듣기평가 안내 방송으로 시험이 시작되므로, 방송에 집중해 주시기 바랍니다.",
    audioNo: "016",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/02b16523-5466-46aa-a15d-19ef5a12a16a_016.mp3",
  },
  {
    id: "k3-listening",
    time: "13:07",
    clockMin: 787,
    period: "3교시",
    title: "제3교시 영어 듣기평가 방송",
    type: "exam",
    rowId: "k3",
    announcement:
      "지금부터 방송 시설 및 음질 상태를 점검한 후 영어 듣기평가 안내 방송을 시작하겠습니다. 첨부된 영어 듣기 음원은 방송이 끝날 때까지 끊기지 않고 이어서 재생됩니다. 수험생 여러분께서는 듣기평가 방송이 끝날 때까지 방송에 집중해 주시기 바랍니다. 듣기평가가 끝난 뒤에는 영어 영역 문제 풀이를 계속하시면 됩니다.",
  },
  {
    id: "k3-ten",
    time: "14:10",
    clockMin: 850,
    period: "3교시",
    title: "영어 영역 종료 10분 전",
    type: "notice",
    rowId: "k3",
    announcement:
      "수험생 여러분께 알려드립니다. 시험 종료 10분 전입니다. 답안지 작성 상태를 다시 한번 확인하시기 바랍니다.",
    audioNo: "017",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/00591e37-6b06-4a1b-90a6-a46f4f882d21_017.mp3",
  },
  {
    id: "k3-end",
    time: "14:20",
    clockMin: 860,
    period: "3교시",
    title: "제3교시 종료 · 휴식",
    type: "end",
    rowId: "break-3",
    announcement:
      "3교시 영어 영역 시험을 마치겠습니다. 답안지를 제출해 주시기 바랍니다. 지금부터 20분간 휴식 시간입니다. 다음 4교시는 한국사 영역 시험에 이어 탐구 영역 시험이 연이어 실시되므로, 화장실은 이번 휴식 시간에 이용하시기 바랍니다.",
    audioNo: "018",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/9b9b1a8a-e351-4ab1-a511-d5002a632eed_018.mp3",
  },
  {
    id: "k4-entry",
    time: "14:35",
    clockMin: 875,
    period: "4교시",
    title: "제4교시 감독관 입실 및 시험 준비 안내",
    type: "notice",
    rowId: "k4-korean",
    announcement:
      "휴식 시간이 끝나갑니다. 잠시 후 감독관이 입실하여 4교시 시험 준비를 시작합니다. 수험생 여러분께서는 지정된 좌석에 착석해 주시기 바랍니다.",
    audioNo: "019",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/2f7c5712-ba17-4d6d-bc70-c5633bb094ed_019.mp3",
  },
  {
    id: "k4-korean-prep",
    time: "14:40",
    clockMin: 880,
    period: "4교시",
    title: "제4교시 한국사 예비령",
    type: "notice",
    rowId: "k4-korean",
    announcement:
      "이제 예비령을 울리겠습니다. 잠시 후 한국사 영역 시험이 시작됩니다. 답안지에 성명과 수험번호를 정확하게 기재하고, 답안지의 인쇄 상태를 확인하시기 바랍니다.",
    audioNo: "020",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/f034fc0d-29e1-4061-b4f4-a2a1d12d2d38_020.mp3",
  },
  {
    id: "k4-korean-ready",
    time: "14:45",
    clockMin: 885,
    period: "4교시",
    title: "제4교시 한국사 준비령",
    type: "notice",
    rowId: "k4-korean",
    announcement:
      "이제 준비령을 울리겠습니다. 잠시 후 한국사 영역 시험이 시작됩니다. 문제지와 답안지를 확인하시고, 감독관의 안내가 있기 전까지 문제지 표지를 넘기지 말아 주시기 바랍니다.",
    audioNo: "021",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/80a0e9a5-5cd3-4b4c-9993-d95a962f62c1_021.mp3",
  },
  {
    id: "k4-korean-start",
    time: "14:50",
    clockMin: 890,
    period: "4교시",
    title: "한국사 영역 본령",
    type: "exam",
    rowId: "k4-korean",
    announcement:
      "지금부터 한국사 영역 시험을 시작하겠습니다. 시험 시간은 30분입니다. 한국사 영역은 필수 영역이므로 모든 수험생이 응시해야 합니다. 답안지는 컴퓨터용 사인펜으로 작성해 주시기 바랍니다.",
    audioNo: "022",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/496a8c13-477b-49d7-bb5d-b7deba7d0120_022.mp3",
  },
  {
    id: "k4-korean-ten",
    time: "15:15",
    clockMin: 915,
    period: "4교시",
    title: "한국사 영역 종료 5분 전",
    type: "notice",
    rowId: "k4-korean",
    announcement:
      "수험생 여러분께 알려드립니다. 한국사 영역 시험 종료 5분 전입니다. 답안지 작성을 마무리해 주시기 바랍니다.",
    audioNo: "023",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/0b08d154-f502-4721-92a3-896c506e4f53_023.mp3",
  },
  {
    id: "k4-korean-end",
    time: "15:20",
    clockMin: 920,
    period: "4교시",
    title: "한국사 영역 종료령",
    type: "end",
    rowId: "k4-korean",
    announcement:
      "한국사 영역 시험을 마치겠습니다. 필기구를 모두 내려놓으시고, 답안지를 펼친 상태로 책상 위에 놓아 주시기 바랍니다. 감독관의 지시에 따라 답안지를 제출해 주시기 바랍니다.",
    audioNo: "024",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/e936081b-a299-4f40-a94b-257aac5f5081_024.mp3",
  },
];

/**
 * 2028학년도 이후(2028 수능) 새 시간표: 탐구 영역을 사회·직업탐구 / 과학탐구로
 * 분리해 시행하고, 5교시가 17:35~18:05로 운영된다.
 */
const REFORM_EVENTS: CsatEvent[] = [
  {
    id: "k4-explore-prep",
    time: "15:30",
    clockMin: 930,
    period: "4교시",
    title: "사회·직업탐구 준비령",
    type: "notice",
    rowId: "k4-social",
    announcement:
      "이제 준비령을 울리겠습니다. 잠시 후 사회·직업탐구 영역 시험이 시작됩니다. 본인이 선택한 과목의 문제지와 답안지가 맞는지 확인하시기 바랍니다.",
    audioNo: "025",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/2f6e20dd-ee7a-4b21-95b2-08229ce0fb4f_025.mp3",
  },
  {
    id: "k4-social-start",
    time: "15:35",
    clockMin: 935,
    period: "4교시",
    title: "사회·직업탐구 본령",
    type: "exam",
    rowId: "k4-social",
    announcement:
      "지금부터 사회·직업탐구 영역 시험을 시작하겠습니다. 시험 시간은 30분이며, 답안지 정리 시간을 포함하여 40분이 배정되어 있습니다. 본인이 선택한 과목의 문제지와 답안지가 맞는지 확인하시기 바랍니다.",
    audioNo: "026",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/0ca59157-a152-4f0a-b277-47b5a00e00ad_026.mp3",
  },
  {
    id: "k4-social-ten",
    time: "16:10",
    clockMin: 970,
    period: "4교시",
    title: "사회·직업탐구 종료 5분 전",
    type: "notice",
    rowId: "k4-social",
    announcement:
      "수험생 여러분께 알려드립니다. 사회·직업탐구 영역 시험 종료 5분 전입니다. 답안지 작성을 마무리해 주시기 바랍니다.",
    audioNo: "027",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/c5354e62-2060-4079-9012-9bcedc63530e_027.mp3",
  },
  {
    id: "k4-collect2",
    time: "16:15",
    clockMin: 975,
    period: "4교시",
    title: "사회·직업탐구 종료령 · 과학탐구 배부",
    type: "collect",
    rowId: "k4-collect2",
    announcement:
      "사회·직업탐구 영역 시험을 마치겠습니다. 답안지를 제출해 주시기 바랍니다. 잠시 후 과학탐구 영역 문답지를 배부하겠습니다. 사회·과학탐구 영역에 모두 응시하는 수험생께서는 과학탐구 문답지를 받아 성명과 수험번호를 기재해 주시기 바랍니다. 회수 및 배부 시간은 15분입니다.",
    audioNo: "028",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/128317bc-3108-4637-9509-e44fcde23b9d_028.mp3",
  },
  {
    id: "k4-sci-start",
    time: "16:30",
    clockMin: 990,
    period: "4교시",
    title: "과학탐구 본령",
    type: "exam",
    rowId: "k4-sci",
    announcement:
      "지금부터 과학탐구 영역 시험을 시작하겠습니다. 시험 시간은 30분이며, 답안지 정리 시간을 포함하여 40분이 배정되어 있습니다. 본인이 선택한 과목의 문제지와 답안지가 맞는지 확인하시기 바랍니다.",
    audioNo: "029",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/25304de9-3a1f-441c-acd7-aada437380c6_029.mp3",
  },
  {
    id: "k4-sci-ten",
    time: "17:05",
    clockMin: 1025,
    period: "4교시",
    title: "과학탐구 종료 5분 전",
    type: "notice",
    rowId: "k4-sci",
    announcement:
      "수험생 여러분께 알려드립니다. 과학탐구 영역 시험 종료 5분 전입니다. 아직 답안을 작성하지 못한 문항이 없는지 확인하시고, 답안지에 표기한 답이 정확한지 점검해 주시기 바랍니다.",
    audioNo: "030",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/a29e2ba2-9e2d-40a8-a4a0-953b3450cb49_030.mp3",
  },
  {
    id: "k4-end",
    time: "17:10",
    clockMin: 1030,
    period: "4교시",
    title: "제4교시 종료",
    type: "end",
    rowId: "break-4",
    announcement:
      "과학탐구 영역 시험을 마치겠습니다. 필기구를 내려놓으시고 답안지를 제출해 주시기 바랍니다. 이상으로 4교시 시험이 모두 끝났습니다. 잠시 후 15분간 휴식 시간이 있고, 이어서 5교시 제2외국어·한문 시험이 실시됩니다. 오랜 시간 시험에 임하신 수험생 여러분, 수고하셨습니다.",
    audioNo: "031",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/0da924b9-8731-40cc-9464-d643b8da30c3_031.mp3",
  },
  {
    id: "k5-entry",
    time: "17:25",
    clockMin: 1045,
    period: "5교시",
    title: "제5교시 입실 완료 안내",
    type: "notice",
    rowId: "k5",
    announcement:
      "수험생 여러분께 알려드립니다. 5교시 제2외국어·한문 영역 시험에 응시하는 수험생께서는 지정된 좌석에 착석해 주시기 바랍니다. 잠시 후 답안지를 배부하겠습니다.",
  },
  {
    id: "k5-start",
    time: "17:35",
    clockMin: 1055,
    period: "5교시",
    title: "제5교시 제2외국어·한문 본령",
    type: "exam",
    rowId: "k5",
    announcement:
      "지금부터 5교시 제2외국어·한문 영역 시험을 시작하겠습니다. 시험 시간은 30분입니다. 본인이 선택한 과목의 문제지와 답안지가 맞는지 확인하시기 바랍니다. 제2외국어·한문 영역은 듣기평가를 실시하지 않습니다.",
  },
  {
    id: "k5-end",
    time: "18:05",
    clockMin: 1085,
    period: "5교시",
    title: "제5교시 종료 · 수능 종료",
    type: "end",
    rowId: "k5",
    announcement:
      "제2외국어·한문 영역 시험을 마치겠습니다. 답안지를 제출해 주시기 바랍니다. 이상으로 2028학년도 대학수학능력시험의 모든 시험이 끝났습니다. 오랜 시간 시험에 임하신 수험생 여러분, 수고하셨습니다.",
  },
];

/**
 * 2027년 전 시행(옛 시간표): 4교시는 한국사(30분) → 사회·과학·직업탐구
 * (제1선택 30분 → 제2선택 30분) 순으로 구성되고 16:37에 끝나며, 5교시는 17:05~17:45로 운영된다.
 */
const LEGACY_EVENTS: CsatEvent[] = [
  {
    id: "k4-explore-prep",
    time: "15:30",
    clockMin: 930,
    period: "4교시",
    title: "사회·과학·직업탐구 준비령",
    type: "notice",
    rowId: "k4-explore1",
    announcement:
      "이제 준비령을 울리겠습니다. 잠시 후 사회·과학·직업탐구 영역 시험이 시작됩니다. 본인이 선택한 과목의 문제지와 답안지가 맞는지 확인하시기 바랍니다.",
    audioNo: "025",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/2f6e20dd-ee7a-4b21-95b2-08229ce0fb4f_025.mp3",
  },
  {
    id: "k4-explore-start",
    time: "15:35",
    clockMin: 935,
    period: "4교시",
    title: "사회·과학·직업탐구 제1선택 본령",
    type: "exam",
    rowId: "k4-explore1",
    announcement:
      "지금부터 사회·과학·직업탐구 영역 제1선택 시험을 시작하겠습니다. 시험 시간은 30분입니다. 본인이 선택한 과목의 문제지와 답안지가 맞는지 확인하시기 바랍니다.",
    audioNo: "026",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/0ca59157-a152-4f0a-b277-47b5a00e00ad_026.mp3",
  },
  {
    id: "k4-explore1-ten",
    time: "16:00",
    clockMin: 960,
    period: "4교시",
    title: "탐구 영역 제1선택 종료 5분 전",
    type: "notice",
    rowId: "k4-explore1",
    announcement:
      "수험생 여러분께 알려드립니다. 제1선택 시험 종료 5분 전입니다. 답안지 작성을 마무리해 주시기 바랍니다.",
    audioNo: "027",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/c5354e62-2060-4079-9012-9bcedc63530e_027.mp3",
  },
  {
    id: "k4-explore1-end",
    time: "16:05",
    clockMin: 965,
    period: "4교시",
    title: "탐구 영역 제1선택 종료령",
    type: "end",
    rowId: "k4-explore1",
    announcement:
      "제1선택 시험을 마치겠습니다. 필기구를 내려놓으시고 답안지를 제출해 주시기 바랍니다.",
    audioNo: "028",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/128317bc-3108-4637-9509-e44fcde23b9d_028.mp3",
  },
  {
    id: "k4-explore2-start",
    time: "16:07",
    clockMin: 967,
    period: "4교시",
    title: "탐구 영역 제2선택 본령",
    type: "exam",
    rowId: "k4-explore2",
    announcement:
      "지금부터 사회·과학·직업탐구 영역 제2선택 시험을 시작하겠습니다. 시험 시간은 30분입니다. 본인이 선택한 제2선택 과목의 문제지와 답안지가 맞는지 확인하시기 바랍니다.",
    audioNo: "029",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/25304de9-3a1f-441c-acd7-aada437380c6_029.mp3",
  },
  {
    id: "k4-explore2-ten",
    time: "16:32",
    clockMin: 992,
    period: "4교시",
    title: "탐구 영역 제2선택 종료 5분 전",
    type: "notice",
    rowId: "k4-explore2",
    announcement:
      "수험생 여러분께 알려드립니다. 제2선택 시험 종료 5분 전입니다. 아직 답안을 작성하지 못한 문항이 없는지 확인하고, 답안지 작성 상태를 다시 한번 점검해 주시기 바랍니다.",
    audioNo: "030",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/a29e2ba2-9e2d-40a8-a4a0-953b3450cb49_030.mp3",
  },
  {
    id: "k4-end",
    time: "16:37",
    clockMin: 997,
    period: "4교시",
    title: "탐구 영역 제2선택 종료 · 제4교시 종료",
    type: "end",
    rowId: "break-4",
    announcement:
      "탐구 영역 시험을 마치겠습니다. 필기구를 내려놓으시고 답안지를 제출해 주시기 바랍니다. 이상으로 4교시 시험이 모두 끝났습니다. 잠시 후 18분간 휴식 시간이 있고, 이어서 5교시 제2외국어·한문 시험이 실시됩니다. 오랜 시간 시험에 임하신 수험생 여러분, 수고하셨습니다.",
    audioNo: "031",
    audioUrl:
      "https://storage.helloreaddy.io/project_files/4ed65baa-696f-488c-91eb-9af3dd21f7fe/0da924b9-8731-40cc-9464-d643b8da30c3_031.mp3",
  },
  {
    id: "k5-entry",
    time: "16:55",
    clockMin: 1015,
    period: "5교시",
    title: "제5교시 입실 완료 안내",
    type: "notice",
    rowId: "k5",
    announcement:
      "수험생 여러분께 알려드립니다. 5교시 제2외국어·한문 영역 시험에 응시하는 수험생께서는 지정된 좌석에 착석해 주시기 바랍니다. 잠시 후 답안지를 배부하겠습니다.",
  },
  {
    id: "k5-start",
    time: "17:05",
    clockMin: 1025,
    period: "5교시",
    title: "제5교시 제2외국어·한문 본령",
    type: "exam",
    rowId: "k5",
    announcement:
      "지금부터 5교시 제2외국어·한문 영역 시험을 시작하겠습니다. 시험 시간은 40분입니다. 본인이 선택한 과목의 문제지와 답안지가 맞는지 확인하시기 바랍니다. 제2외국어·한문 영역은 듣기평가를 실시하지 않습니다.",
  },
  {
    id: "k5-end",
    time: "17:45",
    clockMin: 1065,
    period: "5교시",
    title: "제5교시 종료 · 수능 종료",
    type: "end",
    rowId: "k5",
    announcement:
      "제2외국어·한문 영역 시험을 마치겠습니다. 답안지를 제출해 주시기 바랍니다. 이상으로 오늘의 대학수학능력시험 모든 시험이 끝났습니다. 오랜 시간 시험에 임하신 수험생 여러분, 수고하셨습니다.",
  },
];

const REFORM_TIMETABLE: TimetableRow[] = [
  {
    id: "entry-banner",
    kind: "banner",
    text: "감독관 입실 08:05 · 수험생 및 감독관 입실 완료 08:10",
  },
  {
    id: "k1",
    kind: "exam",
    period: "1교시",
    area: "국어",
    time: "08:40 ~ 10:00",
    duration: "80분",
    questions: "45",
  },
  { id: "break-1", kind: "break", text: "휴식 10:00 ~ 10:20 (20분)" },
  {
    id: "k2",
    kind: "exam",
    period: "2교시",
    area: "수학",
    time: "10:30 ~ 12:10",
    duration: "100분",
    questions: "30",
  },
  { id: "break-2", kind: "break", text: "중식 12:10 ~ 13:00 (50분)" },
  {
    id: "k3",
    kind: "exam",
    period: "3교시",
    area: "영어",
    time: "13:10 ~ 14:20",
    duration: "70분",
    questions: "45",
  },
  { id: "break-3", kind: "break", text: "휴식 14:20 ~ 14:40 (20분)" },
  {
    id: "k4-korean",
    kind: "exam",
    period: "4교시",
    periodRowSpan: 4,
    area: "한국사 시험",
    time: "14:50 ~ 15:20",
    duration: "30분",
    questions: "20",
    note: "필수영역",
  },
  {
    id: "k4-social",
    kind: "exam",
    area: "사회·직업탐구 시험",
    time: "15:35 ~ 16:15",
    duration: "30분 → 40분",
    questions: "25",
    note: "—",
  },
  {
    id: "k4-collect2",
    kind: "exam",
    area: "사회·직업탐구 문답지 회수\n과학탐구 문답지 배부",
    time: "16:15 ~ 16:30",
    duration: "15분",
    questions: "—",
    note: "문답지 회수 및 배부시간 15분\n사회·과학탐구에 모두 응시",
  },
  {
    id: "k4-sci",
    kind: "exam",
    area: "과학탐구 시험",
    time: "16:30 ~ 17:10",
    duration: "30분 → 40분",
    questions: "25",
    note: "—",
  },
  { id: "break-4", kind: "break", text: "휴식 17:10 ~ 17:25 (15분)" },
  {
    id: "k5",
    kind: "exam",
    period: "5교시",
    area: "제2외국어 / 한문",
    time: "17:35 ~ 18:05",
    duration: "20분 → 30분",
    questions: "20",
    note: "듣기평가는 실시하지 않음",
  },
  {
    id: "footer",
    kind: "footer",
    tone: "accent",
    text: "시험 종료 시간 오후 5시 45분 → 6시 5분 (1시간 20분)",
  },
];

const LEGACY_TIMETABLE: TimetableRow[] = [
  {
    id: "entry-banner",
    kind: "banner",
    text: "감독관 입실 08:05 · 수험생 및 감독관 입실 완료 08:10",
  },
  {
    id: "k1",
    kind: "exam",
    period: "1교시",
    area: "국어",
    time: "08:40 ~ 10:00",
    duration: "80분",
    questions: "45",
  },
  { id: "break-1", kind: "break", text: "휴식 10:00 ~ 10:20 (20분)" },
  {
    id: "k2",
    kind: "exam",
    period: "2교시",
    area: "수학",
    time: "10:30 ~ 12:10",
    duration: "100분",
    questions: "30",
    note: "단답형 30% 포함",
  },
  { id: "break-2", kind: "break", text: "중식 12:10 ~ 13:00 (50분)" },
  {
    id: "k3",
    kind: "exam",
    period: "3교시",
    area: "영어",
    time: "13:10 ~ 14:20",
    duration: "70분",
    questions: "45",
    note: "듣기평가 17문항 포함\n13:10부터 25분 이내",
  },
  { id: "break-3", kind: "break", text: "휴식 14:20 ~ 14:40 (20분)" },
  {
    id: "k4-korean",
    kind: "exam",
    period: "4교시",
    periodRowSpan: 3,
    area: "한국사 시험",
    time: "14:50 ~ 15:20",
    duration: "30분",
    questions: "20",
    note: "필수영역",
  },
  {
    id: "k4-explore1",
    kind: "exam",
    area: "사회·과학·직업탐구 시험\n(제1선택)",
    time: "15:35 ~ 16:05",
    duration: "30분",
    questions: "—",
    note: "제1선택 과목 시험",
  },
  {
    id: "k4-explore2",
    kind: "exam",
    area: "사회·과학·직업탐구 시험\n(제2선택)",
    time: "16:07 ~ 16:37",
    duration: "30분",
    questions: "—",
    note: "제2선택 과목 시험",
  },
  { id: "break-4", kind: "break", text: "휴식 16:37 ~ 16:55 (18분)" },
  {
    id: "k5",
    kind: "exam",
    period: "5교시",
    area: "제2외국어 / 한문",
    time: "17:05 ~ 17:45",
    duration: "40분",
    questions: "30",
    note: "듣기평가는 실시하지 않음",
  },
  {
    id: "footer",
    kind: "footer",
    tone: "accent",
    text: "시험 종료 시간 오후 5시 45분",
  },
];

export const CSAT_VERSION_LIST: CsatVersionInfo[] = [
  {
    id: "legacy",
    shortLabel: "2027년 전",
    longLabel: "2027년 전 시행",
    description: "한국사 → 탐구 제1·제2선택 / 5교시 17:05~17:45",
  },
  {
    id: "reform",
    shortLabel: "2028년 이후",
    longLabel: "2028년 이후 시행",
    description: "탐구 영역 분리 시행 / 5교시 17:35~18:05",
  },
];

export const CSAT_SCHEDULES: Record<CsatVersionId, CsatSchedule> = {
  reform: {
    id: "reform",
    info: CSAT_VERSION_LIST[1],
    meta: {
      exam: "2028학년도 대학수학능력시험",
      title: "수능 안내방송 시뮬레이터",
      range: "08:05 감독관 입실 ~ 18:05 5교시 종료",
    },
    startMin: SIM_START_MIN,
    endMin: 1085,
    listeningEventId: LISTENING_EVENT_ID,
    events: [...COMMON_EVENTS, ...REFORM_EVENTS],
    timetableRows: REFORM_TIMETABLE,
    presets: [
      { label: "1교시", time: "08:40" },
      { label: "2교시", time: "10:30" },
      { label: "3교시 듣기", time: "13:07" },
      { label: "4교시", time: "14:50" },
      { label: "5교시", time: "17:35" },
    ],
  },
  legacy: {
    id: "legacy",
    info: CSAT_VERSION_LIST[0],
    meta: {
      exam: "2027학년도 이전 시행 대학수학능력시험",
      title: "수능 안내방송 시뮬레이터",
      range: "08:05 감독관 입실 ~ 17:45 5교시 종료",
    },
    startMin: SIM_START_MIN,
    endMin: 1065,
    listeningEventId: LISTENING_EVENT_ID,
    events: [...COMMON_EVENTS, ...LEGACY_EVENTS],
    timetableRows: LEGACY_TIMETABLE,
    presets: [
      { label: "1교시", time: "08:40" },
      { label: "2교시", time: "10:30" },
      { label: "3교시 듣기", time: "13:07" },
      { label: "4교시", time: "14:50" },
      { label: "5교시", time: "17:05" },
    ],
  },
};

export const DEFAULT_CSAT_VERSION: CsatVersionId = "reform";

export const PHASE_ICON: Record<CsatPhaseType, string> = {
  entry: "ri-door-open-line",
  notice: "ri-megaphone-line",
  exam: "ri-pencil-line",
  break: "ri-cup-line",
  collect: "ri-file-transfer-line",
  end: "ri-flag-2-line",
};

export const PHASE_LABEL: Record<CsatPhaseType, string> = {
  entry: "입실 안내",
  notice: "시험 안내",
  exam: "시험 실시",
  break: "휴식 시간",
  collect: "문답지 회수·배부",
  end: "시험 종료",
};