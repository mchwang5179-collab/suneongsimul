export interface CsatPhrase {
  /** 시행 학년도 */
  year: number;
  /** 필적확인란 문구 */
  phrase: string;
  /** 시인 */
  poet: string;
  /** 작품명 */
  work: string;
}

/**
 * 역대 대학수학능력시험(2006~2025학년도) 필적확인란 문구.
 * 수험생이 답안지에 직접 옮겨 적는 문구로, 매년 다른 시 구절이 출제되어 왔다.
 */
export const CSAT_PHRASES: CsatPhrase[] = [
  {
    year: 2025,
    phrase: "초록 물결이 톡톡 튀는 젊음처럼",
    poet: "안규례",
    work: "아침 산책",
  },
  {
    year: 2024,
    phrase: "저 넓은 세상에서 큰 꿈을 펼쳐라",
    poet: "곽이영",
    work: "하나뿐인 예쁜 딸아",
  },
  {
    year: 2023,
    phrase: "가장 넓은 길은 언제나 내 마음속에",
    poet: "양광모",
    work: "가장 넓은 길",
  },
  {
    year: 2022,
    phrase: "나의 꿈은 맑은 바람이 되어서",
    poet: "한용운",
    work: "나의 꿈",
  },
  {
    year: 2021,
    phrase: "넓은 하늘로의 비상을 꿈꾸며",
    poet: "이해인",
    work: "작은 노래 2",
  },
  {
    year: 2020,
    phrase: "많고 많은 사람 중에 그대 한 사람",
    poet: "나태주",
    work: "들길을 걸으며",
  },
  {
    year: 2019,
    phrase: "너무나 맑고 초롱한 그 중 하나 별이여",
    poet: "박두진",
    work: "별밭에 누워",
  },
  {
    year: 2018,
    phrase: "그대만큼 사랑스러운 사람을 본 일이 없다",
    poet: "김남조",
    work: "편지",
  },
  {
    year: 2017,
    phrase: "큰 바다 넓은 하늘을 우리는 가졌노라",
    poet: "김영랑",
    work: "바다로 가자",
  },
  {
    year: 2016,
    phrase: "흙에서 자란 내 마음 파아란 하늘빛",
    poet: "정지용",
    work: "향수",
  },
  {
    year: 2015,
    phrase: "넓음과 깊음을 가슴에 채우며",
    poet: "주요한",
    work: "청년이여 노래하라",
  },
  {
    year: 2014,
    phrase: "햇살도 둥글둥글하게 뭉치는 맑은 날",
    poet: "문태준",
    work: "돌의 배",
  },
  {
    year: 2013,
    phrase: "꽃초롱 불 밝히듯 눈을 밝힐까",
    poet: "박정만",
    work: "작은 연가",
  },
  {
    year: 2012,
    phrase: "맑은 햇빛으로 반짝반짝 물들이며",
    poet: "정한모",
    work: "가을에",
  },
  {
    year: 2011,
    phrase: "진실로 내가 그대를 사랑하는 까닭은",
    poet: "황동규",
    work: "즐거운 편지",
  },
  {
    year: 2010,
    phrase: "날마다 새로우며, 깊어지며, 넓어진다",
    poet: "정채봉",
    work: "첫 마음",
  },
  {
    year: 2009,
    phrase: "맑은 강물처럼 조용하고 은근하며",
    poet: "유안진",
    work: "지란지교를 꿈꾸며",
  },
  {
    year: 2008,
    phrase: "이 많은 별빛이 내린 언덕 위에",
    poet: "윤동주",
    work: "별 헤는 밤",
  },
  {
    year: 2007,
    phrase: "손금에 맑은 강물이 흐르고",
    poet: "윤동주",
    work: "소년",
  },
  {
    year: 2006,
    phrase: "넓은 벌 동쪽 끝으로 옛이야기",
    poet: "정지용",
    work: "향수",
  },
];