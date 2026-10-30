/**
 * 개발용 시드. `pnpm --filter @haru/api db:seed`
 *
 * 시드 호스트(@seed.haru.local)가 가진 데이터만 지우고 다시 만든다. 다른 데이터(e2e 등)는 건드리지 않는다.
 * 시각은 모두 실행 시점 기준 상대값이다. 시간이 지나면 경계 데이터(isNew 14일, 마감 임박 7일)가 어긋나므로 다시 실행한다.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  type ClassCategory,
  type ClassDifficulty,
  PrismaClient,
  type SessionStatus,
} from '../src/generated/prisma/client';

const SEED_EMAIL_DOMAIN = '@seed.haru.local';
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const KST_OFFSET = 9 * HOUR;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL이 없습니다');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const now = new Date();
const fromNow = (ms: number) => new Date(now.getTime() + ms);

/** 오늘(KST)로부터 dayOffset일 뒤, KST hh:mm 시각을 UTC Date로 */
function kst(dayOffset: number, hour: number, minute = 0): Date {
  const kstNow = new Date(now.getTime() + KST_OFFSET);
  const utcMidnightOfKstDate = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() + dayOffset);
  return new Date(utcMidnightOfKstDate + (hour * 60 + minute) * MINUTE - KST_OFFSET);
}

interface SessionSeed {
  startsAt: Date;
  durationMinutes?: number;
  capacity?: number;
  reserved?: number;
  status?: SessionStatus;
}

interface ClassSeed {
  title: string;
  summary: string;
  category: ClassCategory;
  difficulty?: ClassDifficulty;
  tags: string[];
  neighborhood: string;
  location: string;
  locationNote: string;
  price: number;
  durationMinutes: number;
  /** 이미지 장수 (0~6) */
  imageCount: number;
  /** 생성 시각: 지금으로부터 며칠 전 (소수 가능) */
  ageDays: number;
  sessions: SessionSeed[];
  /** 커리큘럼을 offset 역순으로 저장 (응답 정렬 확인용) */
  shuffledCurriculum?: boolean;
}

const DIFFICULTIES: ClassDifficulty[] = ['INTRO', 'BEGINNER', 'INTERMEDIATE'];

// [제목, 요약, 카테고리, 태그, 동네, 주소, 찾아오는 길, 가격, 분]
type Topic = [string, string, ClassCategory, string[], string, string, string, number, number];
const topics: Topic[] = [
  ['핸드드립 커피 입문', '원두 고르기부터 추출까지 한 번에', 'COOKING', ['커피', '입문'], '연남동', '서울 마포구 연남로 12 2층', '홍대입구역 3번 출구 7분', 35000, 120],
  ['도자기 물레 체험', '나만의 머그컵을 빚어요', 'CRAFT', ['도자기', '커플', '선물'], '익선동', '서울 종로구 수표로28길 5', '종로3가역 4번 출구 3분', 55000, 150],
  ['천연 비누 만들기', '피부 타입에 맞는 비누 레시피', 'SCENT', ['비누', '선물'], '성수동', '서울 성동구 연무장길 41 3층', '성수역 3번 출구 5분', 30000, 90],
  ['가죽 카드지갑 공방', '손바느질로 완성하는 카드지갑', 'CRAFT', ['가죽', '선물'], '이태원동', '서울 용산구 이태원로 200', '이태원역 1번 출구 4분', 48000, 180],
  ['수채화 원데이', '물 번짐으로 그리는 꽃 그림', 'DRAWING', ['수채화', '입문'], '연희동', '서울 서대문구 연희로 88', '연희동 버스정류장 2분', 40000, 120],
  ['캔들 & 디퓨저', '향 블렌딩으로 나만의 캔들', 'SCENT', ['캔들', '향'], '정자동', '경기 성남시 분당구 정자일로 10', '정자역 2번 출구 6분', 38000, 90],
  ['플라워 꽃다발', '계절 꽃으로 만드는 핸드타이드', 'FLOWER', ['꽃다발', '선물'], '신사동', '서울 강남구 도산대로 15 1층', '신사역 8번 출구 5분', 62000, 120],
  ['베이킹: 스콘', '버터 향 가득한 스콘 6개', 'COOKING', ['베이킹', '디저트'], '잠실동', '서울 송파구 올림픽로 35', '잠실역 7번 출구 8분', 45000, 150],
  ['라탄 바구니', '라탄으로 엮는 작은 바구니', 'CRAFT', ['라탄', '인테리어'], '불광동', '서울 은평구 불광로 21', '불광역 2번 출구 3분', 42000, 180],
  ['캘리그라피 기초', '붓펜으로 쓰는 감성 손글씨', 'DRAWING', ['손글씨', '입문'], '봉천동', '서울 관악구 봉천로 400', '서울대입구역 4번 출구 5분', 28000, 90],
  ['칵테일 클래스', '홈텐딩 기본 칵테일 3종', 'COOKING', ['칵테일', '저녁'], '합정동', '서울 마포구 양화로 45 B1', '합정역 7번 출구 2분', 58000, 120],
  ['자개 키링', '전통 자개로 만드는 키링', 'CRAFT', ['자개', '전통'], '을지로', '서울 중구 을지로 150 4층', '을지로3가역 1번 출구 1분', 33000, 90],
  ['유화 풍경화', '나이프로 그리는 풍경화', 'DRAWING', ['유화'], '우동', '부산 해운대구 해운대로 600', '해운대역 5번 출구 10분', 65000, 180],
  ['한식 반찬 쿠킹', '일주일 반찬 4가지', 'COOKING', ['한식', '요리'], '사당동', '서울 동작구 동작대로 1', '사당역 10번 출구 4분', 52000, 150],
  ['은반지 공방', '두드려 만드는 실버 링', 'CRAFT', ['반지', '커플', '선물'], '서촌', '서울 종로구 자하문로 30', '경복궁역 2번 출구 5분', 70000, 180],
  ['마크라메 월행잉', '매듭으로 만드는 벽걸이', 'CRAFT', ['마크라메', '인테리어'], '동성로', '대구 중구 동성로 50', '중앙로역 3번 출구 4분', 36000, 120],
  ['드로잉 북 만들기', '실 제본으로 만드는 노트', 'DRAWING', ['제본', '드로잉'], '성북동', '서울 성북구 성북로 77', '한성대입구역 6번 출구 12분', 32000, 120],
  ['티 블렌딩', '찻잎을 섞어 나만의 차', 'SCENT', ['차', '향'], '애월읍', '제주 제주시 애월읍 애월해안로 100', '애월 버스정류장 3분', 39000, 90],
  ['플라워 센터피스', '식탁 위에 올리는 꽃 장식', 'FLOWER', ['센터피스', '인테리어'], '자양동', '서울 광진구 자양로 99', '건대입구역 5번 출구 6분', 58000, 120],
  ['테라리움', '유리병 속 작은 숲', 'FLOWER', ['식물', '인테리어'], '송도동', '인천 연수구 컨벤시아대로 80', '센트럴파크역 4번 출구 5분', 41000, 90],
  ['파스타 쿠킹', '생면 반죽부터 소스까지', 'COOKING', ['파스타', '요리'], '한남동', '서울 용산구 한남대로 20길 8', '한남역 1번 출구 9분', 68000, 180],
  ['향수 만들기', '탑·미들·베이스 노트로 조향', 'SCENT', ['향수', '향', '선물'], '망원동', '서울 마포구 망원로 60', '망원역 2번 출구 6분', 54000, 120],
];

// 앞쪽 8개는 최근 14일 이내(신규), 나머지는 15~90일 전
const topicAge = (i: number) => (i < 8 ? 1 + i * 1.5 : 15 + (i - 8) * 5);

const openSessions = (i: number): SessionSeed[] => [
  { startsAt: kst(1 + (i % 5), 10 + (i % 4)), capacity: 6 + (i % 5), reserved: i % 3 },
  { startsAt: kst(8 + (i % 6), 14), capacity: 8, reserved: 0 },
  { startsAt: kst(15 + (i % 7), 19, 30), capacity: 10, reserved: 2 },
];

const edge = (overrides: Partial<ClassSeed> & Pick<ClassSeed, 'title' | 'summary' | 'sessions'>): ClassSeed => ({
  category: 'CRAFT',
  tags: ['엣지'],
  neighborhood: '망원동',
  location: '서울 마포구 포은로 1',
  locationNote: '망원역 1번 출구 3분',
  price: 30000,
  durationMinutes: 60,
  imageCount: 2,
  ageDays: 30,
  ...overrides,
});

// 마감 임박 경계: 같은 시작 시각 2건은 sessionId 오름차순 확인용
const sameStart = kst(2, 19);

const NEIGHBORHOODS: Record<ClassCategory, [string, string, string]> = {
  CRAFT: ['익선동', '서울 종로구 수표로28길 5', '종로3가역 4번 출구 3분'],
  COOKING: ['잠실동', '서울 송파구 올림픽로 35', '잠실역 7번 출구 8분'],
  DRAWING: ['연희동', '서울 서대문구 연희로 88', '연희동 버스정류장 2분'],
  FLOWER: ['신사동', '서울 강남구 도산대로 15 1층', '신사역 8번 출구 5분'],
  SCENT: ['성수동', '서울 성동구 연무장길 41 3층', '성수역 3번 출구 5분'],
};

const closing = (name: string, category: ClassCategory, summary: string, sessions: SessionSeed[]): ClassSeed => {
  const [neighborhood, location, locationNote] = NEIGHBORHOODS[category];
  return edge({
    title: `[마감 임박] ${name}`,
    summary,
    category,
    tags: ['마감임박', '엣지'],
    neighborhood,
    location,
    locationNote,
    imageCount: 3,
    ageDays: 10,
    sessions,
  });
};

const classes: ClassSeed[] = [
  ...topics.map(([title, summary, category, tags, neighborhood, location, locationNote, price, durationMinutes], i): ClassSeed => ({
    title,
    summary,
    category,
    difficulty: DIFFICULTIES[i % 3],
    tags,
    neighborhood,
    location,
    locationNote,
    price,
    durationMinutes,
    imageCount: 1 + (i % 5),
    ageDays: topicAge(i),
    shuffledCurriculum: i % 2 === 1,
    sessions: openSessions(i).map((s) => ({ ...s, durationMinutes })),
  })),

  // ---- 엣지 케이스 ----
  edge({
    title: '[엣지] 지난 회차만 있는 클래스',
    summary: '목록 nextSessionAt·maxCapacity = null, 상세 sessions = []',
    sessions: [{ startsAt: kst(-3, 10) }, { startsAt: fromNow(-2 * HOUR) }],
  }),
  edge({
    title: '[엣지] CLOSED 회차만 있는 클래스',
    summary: '목록 nextSessionAt·maxCapacity = null, 상세 sessions = []',
    category: 'DRAWING',
    sessions: [
      { startsAt: kst(2, 10), status: 'CLOSED' },
      { startsAt: kst(4, 10), status: 'CLOSED' },
    ],
  }),
  edge({
    title: '[엣지] 모든 회차 매진',
    summary: '목록 nextSessionAt·maxCapacity = null, 상세는 SOLD_OUT, 마감 임박에도 없음',
    category: 'COOKING',
    sessions: [
      { startsAt: kst(1, 11), capacity: 4, reserved: 4 },
      { startsAt: kst(3, 11), capacity: 6, reserved: 6 },
    ],
  }),
  edge({
    title: '[엣지] 회차 섞임 (지난·CLOSED·매진·열림)',
    summary: 'nextSessionAt은 매진을 건너뛴 열린 회차, maxCapacity는 예약 가능한 회차 중 최대(12), 마감 임박 1/5 포함',
    category: 'FLOWER',
    sessions: [
      { startsAt: kst(-1, 10), capacity: 30 },
      { startsAt: kst(1, 9), status: 'CLOSED', capacity: 20 },
      { startsAt: kst(1, 10), capacity: 15, reserved: 15 },
      { startsAt: kst(2, 10), capacity: 5, reserved: 4 },
      { startsAt: kst(5, 10), capacity: 12 },
    ],
  }),
  edge({ title: '[엣지] 회차 없는 클래스', summary: '아직 회차가 열리지 않았어요', category: 'SCENT', sessions: [] }),
  edge({
    title: '[엣지] 이미지 없는 클래스',
    summary: 'images = [], thumbnailUrl = null',
    price: 0,
    imageCount: 0,
    sessions: [{ startsAt: kst(2, 15) }],
  }),
  edge({
    title: '[엣지] 이미지 6장(최대)',
    summary: 'images 6장, 갤러리 최대치 확인',
    category: 'FLOWER',
    imageCount: 6,
    sessions: [{ startsAt: kst(9, 15) }],
  }),
  edge({
    title:
      '[엣지] 아주 긴 제목: 주말 아침 한강이 내려다보이는 작업실에서 천천히 배우는 핸드드립 커피와 홈카페 디저트 페어링 원데이 클래스 Supercalifragilisticexpialidocious_no_space_long_word',
    summary: '제목 줄바꿈·말줄임 확인용. 요약도 길게 써서 두 줄 이상이 되는지 확인합니다. 요약도 길게 써서 두 줄 이상이 되는지 확인합니다.',
    category: 'COOKING',
    tags: ['엣지', '아주긴태그이름이에요아주긴태그이름이에요', '커피', '디저트', '주말', '한강뷰'],
    neighborhood: '여의도동',
    location: '서울특별시 영등포구 여의도동 여의나루로 아주긴주소빌딩 12층 1203호',
    locationNote: '여의나루역 2번 출구에서 한강공원 방향으로 나와 첫 번째 횡단보도를 건너 오른쪽 건물 12층',
    price: 1_250_000,
    durationMinutes: 480,
    sessions: [{ startsAt: kst(6, 9), durationMinutes: 480 }],
  }),
  edge({
    title: '[엣지] KST 자정 근처 회차',
    summary: '23:30 KST 시작(UTC로는 같은 날 14:30), 00:30 KST 시작(UTC로는 전날 15:30)',
    category: 'DRAWING',
    sessions: [{ startsAt: kst(1, 23, 30) }, { startsAt: kst(3, 0, 30) }],
  }),
  edge({
    title: '[엣지] 신규 경계: 14일 전 + 1시간',
    summary: 'isNew = true (14일 이내)',
    ageDays: 14 - 1 / 24,
    sessions: [{ startsAt: kst(10, 11) }],
  }),
  edge({
    title: '[엣지] 신규 경계: 14일 전 - 1시간',
    summary: 'isNew = false (14일 초과)',
    ageDays: 14 + 1 / 24,
    sessions: [{ startsAt: kst(10, 13) }],
  }),
  // ---- 마감 임박 (클래스당 가장 이른 1건만 나오므로, 포함돼야 하는 경계값은 각자 다른 클래스에 둔다) ----
  // 포함 예상 10건: 아래 9개 클래스 + '[엣지] 회차 섞임'(1/5). 카테고리마다 2건씩.
  closing('잔여 2석', 'CRAFT', '잔여 2/8 → 포함', [{ startsAt: kst(1, 14), capacity: 8, reserved: 6 }]),
  closing('30% 경계 3/10', 'COOKING', '잔여 3/10 = 30% → 포함', [{ startsAt: kst(1, 16), capacity: 10, reserved: 7 }]),
  closing('27% 3/11', 'DRAWING', '잔여 3/11 = 27% → 포함', [{ startsAt: kst(2, 11), capacity: 11, reserved: 8 }]),
  closing('잔여 1석', 'SCENT', '잔여 1/4 → 포함', [{ startsAt: kst(3, 10), capacity: 4, reserved: 3 }]),
  closing('30% 경계 6/20', 'FLOWER', '잔여 6/20 = 30% → 포함', [{ startsAt: kst(3, 12), capacity: 20, reserved: 14 }]),
  closing('같은 시작 시각 X', 'SCENT', '같은 시각 2건 → sessionId 오름차순', [{ startsAt: sameStart, capacity: 6, reserved: 5 }]),
  closing('같은 시작 시각 Y', 'COOKING', '같은 시각 2건 → sessionId 오름차순', [{ startsAt: sameStart, capacity: 8, reserved: 7 }]),
  closing('7일 안쪽', 'DRAWING', '6일 23시간 뒤 2/8 → 포함 (7일 경계 안)', [
    { startsAt: fromNow(7 * DAY - HOUR), capacity: 8, reserved: 6 },
  ]),
  closing('여러 회차', 'CRAFT', '조건 충족 회차 3개 → 가장 이른 1건(4일 뒤 11:00 KST)만', [
    { startsAt: kst(1, 8), capacity: 5, reserved: 4, status: 'CLOSED' }, // 더 이르지만 CLOSED → 제외
    { startsAt: kst(4, 11), capacity: 6, reserved: 5 }, // 대표 1건
    { startsAt: kst(5, 15), capacity: 10, reserved: 7 },
    { startsAt: kst(6, 10), capacity: 8, reserved: 6 },
  ]),
  // 아래 회차는 모두 조건 밖 → 이 클래스는 마감 임박에 나오면 안 된다
  closing('제외 모음', 'FLOWER', '3/9(33%)·4/12(33%)·매진·CLOSED·7일 밖 → 모두 제외', [
    { startsAt: kst(1, 18), capacity: 9, reserved: 6 },
    { startsAt: kst(3, 14), capacity: 12, reserved: 8 },
    { startsAt: kst(2, 13), capacity: 6, reserved: 6 },
    { startsAt: kst(2, 15), capacity: 5, reserved: 4, status: 'CLOSED' },
    { startsAt: fromNow(7 * DAY + 2 * HOUR), capacity: 8, reserved: 6 },
  ]),
];

// 마지막 두 개는 createdAt이 ms까지 같다 (동률 정렬 확인용)
const TIE_TITLES = ['[엣지] createdAt 동률 A', '[엣지] createdAt 동률 B'];
for (const title of TIE_TITLES) {
  classes.push(
    edge({ title, summary: 'createdAt이 같아 id 내림차순으로 정렬돼야 해요', ageDays: 20, sessions: [{ startsAt: kst(4, 13) }] }),
  );
}

function curriculumOf(seed: ClassSeed) {
  const items = [
    { offsetMinutes: 0, title: '인사와 재료 소개' },
    { offsetMinutes: Math.round(seed.durationMinutes * 0.2), title: '기본 기법 익히기' },
    { offsetMinutes: Math.round(seed.durationMinutes * 0.5), title: '나만의 작품 만들기' },
    { offsetMinutes: seed.durationMinutes - 15, title: '완성과 마무리' },
  ];
  return seed.shuffledCurriculum ? items.reverse() : items;
}

async function main() {
  const seedHosts = { email: { endsWith: SEED_EMAIL_DOMAIN } };
  await prisma.class.deleteMany({ where: { host: seedHosts } });
  await prisma.user.deleteMany({ where: seedHosts });

  const hosts = await Promise.all(
    ['하루공방', '연남 작업실', '성수 스튜디오'].map((name, i) =>
      prisma.user.create({ data: { name, email: `host${i + 1}${SEED_EMAIL_DOMAIN}` } }),
    ),
  );

  const tieAt = new Date(now.getTime() - 20 * DAY);

  for (const [i, seed] of classes.entries()) {
    const createdAt = TIE_TITLES.includes(seed.title) ? tieAt : new Date(now.getTime() - seed.ageDays * DAY);
    await prisma.class.create({
      data: {
        hostId: hosts[i % hosts.length].id,
        title: seed.title,
        summary: seed.summary,
        description: `${seed.summary}\n\n처음이어도 괜찮아요. 강사가 단계마다 옆에서 도와드려요.\n시작 10분 전까지 도착해 주세요.`,
        category: seed.category,
        difficulty: seed.difficulty ?? 'INTRO',
        tags: seed.tags,
        neighborhood: seed.neighborhood,
        location: seed.location,
        locationNote: seed.locationNote,
        price: seed.price,
        durationMinutes: seed.durationMinutes,
        images: Array.from({ length: seed.imageCount }, (_, k) => `https://picsum.photos/seed/haru-${i + 1}-${k + 1}/960/640`),
        learnings: ['재료와 도구 다루는 법', '기본 기법과 응용', '집에서 이어서 해 보는 팁'],
        curriculum: curriculumOf(seed),
        inclusions: '재료비 포함 · 완성품은 가져가요 · 앞치마 제공',
        createdAt,
        sessions: {
          create: seed.sessions.map((s) => ({
            startsAt: s.startsAt,
            endsAt: new Date(s.startsAt.getTime() + (s.durationMinutes ?? seed.durationMinutes) * MINUTE),
            capacity: s.capacity ?? 8,
            reserved: s.reserved ?? 0,
            status: s.status ?? 'OPEN',
          })),
        },
      },
    });
  }

  const byCategory = classes.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.category]: (acc[c.category] ?? 0) + 1 }), {});
  console.log(`시드 완료: 호스트 ${hosts.length}명, 클래스 ${classes.length}개`, byCategory);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
