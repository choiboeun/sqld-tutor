import json

JSONL_PATH = "/home/choeboeun0625/sqld-tutor/backend/app/data/questions/questions_v0.1.jsonl"

questions = [
# ── 정규화 심화 q204~q209 ─────────────────────────────────────
{
  "id":"q204","subject":"데이터 모델링의 이해","main_category":"데이터 모델과 성능",
  "sub_category":"정규화","category":"데이터 모델링 기초","question_type":"A",
  "context":None,
  "question":"제1정규형(1NF)을 만족하기 위한 조건으로 올바른 것은?",
  "options":{"1":"기본키가 아닌 모든 속성이 기본키에 완전 함수 종속되어야 한다.",
             "2":"모든 속성값이 원자값(Atomic Value)이어야 한다.",
             "3":"이행적 함수 종속이 없어야 한다.",
             "4":"모든 결정자가 후보키이어야 한다."},
  "answer":2,
  "hint":"1NF = 더 이상 쪼갤 수 없는 값(원자값)만 허용",
  "explanation":"제1정규형(1NF)은 모든 속성값이 원자값(단일 값, 더 이상 분리 불가)이어야 한다. 예를 들어 하나의 셀에 여러 값(배열, 집합)이 있으면 1NF 위반이다. 완전 함수 종속은 2NF, 이행 종속 제거는 3NF, 결정자=후보키는 BCNF 조건이다.",
  "tags":["정규화","1NF","원자값","함수종속"],"difficulty":"하","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q205","subject":"데이터 모델링의 이해","main_category":"데이터 모델과 성능",
  "sub_category":"정규화","category":"데이터 모델링 기초","question_type":"A",
  "context":None,
  "question":"제2정규형(2NF)에 대한 설명으로 올바른 것은?",
  "options":{"1":"1NF를 만족하면서 기본키가 아닌 모든 속성이 기본키에 완전 함수 종속되어야 한다.",
             "2":"1NF를 만족하면서 이행적 함수 종속이 없어야 한다.",
             "3":"1NF를 만족하면서 모든 결정자가 후보키이어야 한다.",
             "4":"1NF를 만족하면서 다치 종속이 없어야 한다."},
  "answer":1,
  "hint":"2NF = 부분 함수 종속 제거. 복합 기본키일 때 일부 키에만 종속되는 속성 제거",
  "explanation":"2NF는 1NF를 만족하면서 기본키가 아닌 모든 속성이 기본키 전체에 완전 함수 종속되어야 한다. 부분 함수 종속(기본키의 일부에만 종속)이 있으면 2NF를 위반한다. 기본키가 단일 컬럼이면 부분 종속이 불가하여 자동으로 2NF를 만족한다.",
  "tags":["정규화","2NF","완전함수종속","부분종속"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q206","subject":"데이터 모델링의 이해","main_category":"데이터 모델과 성능",
  "sub_category":"정규화","category":"데이터 모델링 기초","question_type":"A",
  "context":None,
  "question":"BCNF(Boyce-Codd 정규형)와 제3정규형(3NF)의 차이에 대한 설명으로 올바른 것은?",
  "options":{"1":"3NF는 모든 결정자가 후보키이어야 하고, BCNF는 이행 종속이 없어야 한다.",
             "2":"BCNF는 모든 결정자가 후보키이어야 하며 3NF보다 더 강한 정규형이다.",
             "3":"3NF를 만족하면 항상 BCNF도 만족한다.",
             "4":"BCNF와 3NF는 동일한 조건을 요구한다."},
  "answer":2,
  "hint":"BCNF ⊃ 3NF (BCNF가 더 강하다)",
  "explanation":"3NF는 이행적 함수 종속이 없어야 한다. BCNF는 더 나아가 모든 결정자가 후보키이어야 한다는 조건을 추가한다. 3NF를 만족해도 BCNF를 위반할 수 있다(결정자가 후보키가 아닌 경우). BCNF를 만족하면 항상 3NF도 만족한다.",
  "tags":["정규화","3NF","BCNF","결정자","후보키"],"difficulty":"상","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q207","subject":"데이터 모델링의 이해","main_category":"데이터 모델과 성능",
  "sub_category":"정규화","category":"데이터 모델링 기초","question_type":"A",
  "context":None,
  "question":"정규화를 수행하는 주요 이유인 이상 현상(Anomaly)의 종류가 아닌 것은?",
  "options":{"1":"삽입 이상(Insertion Anomaly)","2":"삭제 이상(Deletion Anomaly)",
             "3":"갱신 이상(Update Anomaly)","4":"조회 이상(Selection Anomaly)"},
  "answer":4,
  "hint":"이상 현상은 3가지: 삽입, 삭제, 갱신",
  "explanation":"이상 현상(Anomaly)은 데이터 중복으로 인해 발생하며 삽입 이상, 삭제 이상, 갱신 이상의 3가지다. 조회 이상(Selection Anomaly)은 존재하지 않는 개념이다. 정규화는 이 이상 현상을 제거하기 위해 수행한다.",
  "tags":["정규화","이상현상","Anomaly"],"difficulty":"하","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q208","subject":"데이터 모델링의 이해","main_category":"데이터 모델과 성능",
  "sub_category":"반정규화","category":"데이터 모델링 기초","question_type":"A",
  "context":None,
  "question":"다음 중 반정규화(Denormalization) 기법이 아닌 것은?",
  "options":{"1":"테이블 병합(Table Merge)","2":"컬럼 중복(Column Duplication)",
             "3":"테이블 분할(Table Split)","4":"인덱스 제거(Index Removal)"},
  "answer":4,
  "hint":"반정규화는 데이터 중복을 허용하는 방향의 기법들",
  "explanation":"반정규화 기법에는 테이블 병합(조인 감소), 컬럼 중복(자주 참조되는 컬럼을 다른 테이블에 복사), 테이블 분할(수직/수평 분할), 파생 컬럼 추가 등이 있다. 인덱스 제거는 반정규화 기법이 아니라 성능 튜닝의 일종이다.",
  "tags":["반정규화","Denormalization","기법"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q209","subject":"데이터 모델링의 이해","main_category":"데이터 모델과 성능",
  "sub_category":"정규화","category":"데이터 모델링 기초","question_type":"A",
  "context":None,
  "question":"함수적 종속(Functional Dependency) A → B에 대한 설명으로 올바른 것은?",
  "options":{"1":"A의 값이 결정되면 여러 개의 B 값을 가질 수 있다.",
             "2":"A의 값이 결정되면 B의 값도 유일하게 결정된다.",
             "3":"A → B이고 B → A이면 A와 B는 완전 함수 종속 관계다.",
             "4":"A → B이고 B → C이면 A → C는 성립하지 않는다."},
  "answer":2,
  "hint":"A → B: A를 알면 B를 반드시 하나로 알 수 있다",
  "explanation":"A → B(A가 B를 함수적으로 결정)는 A의 값이 결정되면 B의 값도 유일하게 결정된다는 의미다. A → B이고 B → C이면 A → C(이행적 종속)가 성립한다. 이행적 종속은 3NF 위반의 원인이 된다.",
  "tags":["정규화","함수적종속","이행종속","3NF"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},

# ── DDL 심화 q210~q214 ───────────────────────────────────────
{
  "id":"q210","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"DDL","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"TRUNCATE, DELETE, DROP의 차이에 대한 설명으로 올바르지 않은 것은?",
  "options":{"1":"TRUNCATE는 DDL로 ROLLBACK이 불가능하지만 테이블 구조는 유지된다.",
             "2":"DELETE는 DML로 WHERE 조건으로 특정 행만 삭제할 수 있으며 ROLLBACK이 가능하다.",
             "3":"DROP은 DDL로 테이블 구조와 데이터를 모두 삭제한다.",
             "4":"TRUNCATE는 DELETE와 동일하게 DML로 분류되며 트리거가 실행된다."},
  "answer":4,
  "hint":"TRUNCATE는 DDL이라 ROLLBACK 불가, 트리거도 실행되지 않는다.",
  "explanation":"TRUNCATE는 DDL로 분류되어 실행 즉시 COMMIT되며 ROLLBACK이 불가능하고 트리거도 실행되지 않는다. DELETE는 DML로 행 단위 삭제, ROLLBACK 가능, 트리거 실행된다. DROP은 테이블 구조 포함 전체 삭제, ROLLBACK 불가.",
  "tags":["DDL","TRUNCATE","DELETE","DROP","차이"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q211","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"DDL","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"다음 중 테이블 제약조건(CONSTRAINT)의 종류가 아닌 것은?",
  "options":{"1":"PRIMARY KEY","2":"FOREIGN KEY","3":"CHECK","4":"INDEX"},
  "answer":4,
  "hint":"인덱스는 제약조건이 아니라 별도의 데이터베이스 객체다.",
  "explanation":"테이블 제약조건에는 PRIMARY KEY, UNIQUE, NOT NULL, CHECK, FOREIGN KEY가 있다. INDEX는 제약조건이 아니라 성능 향상을 위해 별도로 생성하는 데이터베이스 객체다. PRIMARY KEY 생성 시 자동으로 인덱스가 생성되지만 인덱스 자체는 제약조건이 아니다.",
  "tags":["DDL","CONSTRAINT","제약조건","INDEX"],"difficulty":"하","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q212","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"DDL","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"FOREIGN KEY ... ON DELETE SET NULL에 대한 설명으로 올바른 것은?",
  "options":{"1":"부모 테이블의 행이 삭제되면 자식 테이블의 관련 행도 함께 삭제된다.",
             "2":"부모 테이블의 행이 삭제되면 자식 테이블의 해당 FK 컬럼 값이 NULL로 변경된다.",
             "3":"부모 테이블의 행이 삭제되면 자식 테이블의 해당 FK 컬럼 값이 DEFAULT 값으로 변경된다.",
             "4":"자식 테이블이 참조하는 부모 행의 삭제를 거부한다."},
  "answer":2,
  "hint":"SET NULL = 부모가 사라지면 자식의 FK를 NULL로 설정",
  "explanation":"ON DELETE SET NULL은 부모 테이블의 행이 삭제될 때 이를 참조하는 자식 테이블의 FK 컬럼 값을 NULL로 변경한다. ON DELETE CASCADE는 자식 행도 함께 삭제, ON DELETE RESTRICT(기본값)는 삭제를 거부한다.",
  "tags":["DDL","FOREIGN KEY","ON DELETE SET NULL","ON DELETE CASCADE"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q213","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"DDL","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"ALTER TABLE에 대한 설명으로 올바르지 않은 것은?",
  "options":{"1":"기존 컬럼의 데이터 타입이나 크기를 변경할 수 있다.",
             "2":"데이터가 존재하는 컬럼의 데이터 타입은 항상 자유롭게 변경할 수 있다.",
             "3":"기존 컬럼에 DEFAULT 값을 추가하거나 변경할 수 있다.",
             "4":"테이블에 새로운 컬럼을 추가할 수 있다."},
  "answer":2,
  "hint":"기존 데이터가 있으면 타입 변환이 실패할 수 있다.",
  "explanation":"데이터가 존재하는 컬럼의 타입을 변경하려면 기존 데이터가 새 타입으로 변환 가능해야 한다. 예를 들어 문자 데이터가 있는 컬럼을 숫자 타입으로 변경하면 오류가 발생한다. 컬럼 크기 변경도 기존 데이터보다 작게 줄이면 오류가 날 수 있다.",
  "tags":["DDL","ALTER TABLE","컬럼수정","데이터타입"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q214","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"DDL","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"DEFAULT 값에 대한 설명으로 올바른 것은?",
  "options":{"1":"DEFAULT 값이 설정된 컬럼은 INSERT 시 반드시 명시해야 한다.",
             "2":"DEFAULT 값이 설정된 컬럼에 명시적으로 NULL을 INSERT하면 DEFAULT 값이 입력된다.",
             "3":"DEFAULT 값이 설정된 컬럼을 INSERT 시 생략하면 DEFAULT 값이 자동으로 입력된다.",
             "4":"DEFAULT 값은 문자형과 숫자형 컬럼에만 설정할 수 있다."},
  "answer":3,
  "hint":"생략하면 DEFAULT, 명시적으로 NULL을 넣으면 NULL",
  "explanation":"INSERT 시 DEFAULT 컬럼을 생략하면 DEFAULT 값이 자동으로 입력된다. 단, 명시적으로 NULL을 삽입하면 NULL이 입력되고 DEFAULT 값은 사용되지 않는다. DEFAULT 값은 문자, 숫자, 날짜 등 모든 타입에 설정할 수 있다.",
  "tags":["DDL","DEFAULT","INSERT","NULL"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},

# ── 트랩형 순수 B q215~q220 ──────────────────────────────────
{
  "id":"q215","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"집합연산자","category":"집합 연산자 & 그룹 함수","question_type":"A",
  "context":"[A: col=1,2,2,3] [B: col=2,3,4]",
  "question":"SELECT col FROM A UNION SELECT col FROM B의 결과 행 수는?",
  "options":{"1":"3","2":"4","3":"5","4":"7"},
  "answer":2,
  "hint":"UNION은 중복을 제거한다. A∪B의 고유값을 세어라.",
  "explanation":"A의 고유값: 1, 2, 3. B의 고유값: 2, 3, 4. UNION은 중복을 제거하므로 결과는 1, 2, 3, 4 → 4행. UNION ALL이면 A(4행)+B(3행)=7행이 반환된다. UNION과 UNION ALL의 차이를 반드시 구분해야 한다.",
  "tags":["집합연산자","UNION","UNION ALL","중복제거","트랩"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q216","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"NULL","category":"SELECT & WHERE","question_type":"A",
  "context":"[테이블 T: col = 1, 2, NULL]\nSELECT * FROM T WHERE col IN (1, NULL);",
  "question":"위 SQL의 실행 결과로 올바른 것은?",
  "options":{"1":"1, 2, NULL 모두 반환된다.",
             "2":"col=1만 반환된다.",
             "3":"col=1, NULL이 반환된다.",
             "4":"아무것도 반환되지 않는다."},
  "answer":2,
  "hint":"IN 목록에 NULL이 있어도 NULL 행은 반환되지 않는다.",
  "explanation":"IN (1, NULL)에서 NULL과의 = 비교는 항상 UNKNOWN이 되어 NULL 행은 반환되지 않는다. col=2는 IN 목록에 없으므로 반환되지 않는다. 결과적으로 col=1만 반환된다. NULL 값을 포함하려면 반드시 IS NULL 조건을 명시해야 한다.",
  "tags":["NULL","IN","WHERE","트랩"],"difficulty":"상","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q217","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"그룹 함수","category":"GROUP BY & ORDER BY","question_type":"A",
  "context":"[T: score = 10, 20, 30, 40, 50]\nSELECT AVG(score) FROM T HAVING AVG(score) > 25;",
  "question":"위 SQL의 실행 결과로 올바른 것은?",
  "options":{"1":"GROUP BY 절이 없으므로 문법 오류가 발생한다.",
             "2":"전체 평균인 30을 1개의 행으로 반환한다.",
             "3":"25보다 큰 개별 값(30, 40, 50)을 반환한다.",
             "4":"아무것도 반환하지 않는다."},
  "answer":2,
  "hint":"GROUP BY 없는 HAVING = 전체를 하나의 그룹으로 처리",
  "explanation":"GROUP BY 없이 HAVING을 사용하면 전체 테이블을 하나의 그룹으로 처리한다. 전체 평균 = (10+20+30+40+50)/5 = 30으로 HAVING 조건(>25)을 만족하므로 30을 반환한다. 개별 행을 필터링하는 것이 아니라 전체 집계 결과에 조건을 적용한다.",
  "tags":["HAVING","GROUP BY없이","집계","트랩"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q218","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"SELECT","category":"SELECT & WHERE","question_type":"A",
  "context":"SELECT EMPNO, SAL * 12 AS ANNUAL_SAL FROM EMP ORDER BY ANNUAL_SAL DESC;",
  "question":"위 SQL에서 ORDER BY 절에 대한 설명으로 올바른 것은?",
  "options":{"1":"ORDER BY에서 SELECT 절의 별칭을 사용할 수 없어 오류가 발생한다.",
             "2":"ORDER BY는 SELECT 실행 후 처리되므로 SELECT의 별칭 ANNUAL_SAL을 사용할 수 있다.",
             "3":"ORDER BY에서 별칭 사용 시 반드시 컬럼 번호(2)로 대신해야 한다.",
             "4":"ORDER BY는 WHERE보다 먼저 실행된다."},
  "answer":2,
  "hint":"SQL 실행 순서: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY",
  "explanation":"SQL 실행 순서에서 ORDER BY는 SELECT보다 나중에 실행되므로 SELECT에서 정의한 별칭을 ORDER BY에서 참조할 수 있다. WHERE, GROUP BY, HAVING에서는 SELECT 별칭을 사용할 수 없다(아직 SELECT가 실행되지 않았으므로).",
  "tags":["SELECT","ORDER BY","별칭","실행순서","트랩"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q219","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"SELECT","category":"SELECT & WHERE","question_type":"A",
  "context":None,
  "question":"SELECT DISTINCT DEPTNO FROM EMP와 SELECT DEPTNO FROM EMP GROUP BY DEPTNO의 차이에 대한 설명으로 올바른 것은?",
  "options":{"1":"DISTINCT는 중복을 제거하지 않지만 GROUP BY는 중복을 제거한다.",
             "2":"두 SQL은 동일한 결과를 반환하며 성능 차이도 없다.",
             "3":"두 SQL은 동일한 결과를 반환하지만, GROUP BY 버전에서는 집계 함수를 추가로 사용할 수 있다.",
             "4":"DISTINCT는 GROUP BY와 달리 NULL 값을 자동으로 제거한다."},
  "answer":3,
  "hint":"결과는 같지만 GROUP BY는 집계 함수 추가 사용 가능",
  "explanation":"두 SQL은 DEPTNO의 고유값 목록이라는 동일한 결과를 반환한다. 차이점은 GROUP BY 버전에서는 SUM, COUNT 등 집계 함수를 추가로 사용할 수 있다는 점이다. 두 방식 모두 NULL을 하나의 고유값으로 취급한다. 성능은 데이터와 옵티마이저에 따라 다를 수 있다.",
  "tags":["DISTINCT","GROUP BY","차이","집계함수"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q220","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"NULL","category":"함수","question_type":"A",
  "context":"[테이블 T: col = NULL, NULL, NULL]\nSELECT SUM(col), COUNT(*), COUNT(col), AVG(col) FROM T;",
  "question":"위 SQL의 실행 결과로 올바른 것은?",
  "options":{"1":"SUM=0, COUNT(*)=3, COUNT(col)=3, AVG=0",
             "2":"SUM=NULL, COUNT(*)=3, COUNT(col)=0, AVG=NULL",
             "3":"SUM=0, COUNT(*)=0, COUNT(col)=0, AVG=NULL",
             "4":"SUM=NULL, COUNT(*)=0, COUNT(col)=0, AVG=0"},
  "answer":2,
  "hint":"NULL은 집계에서 무시된다. 하지만 COUNT(*)는 예외.",
  "explanation":"SUM(col): 모두 NULL이므로 NULL 반환(0이 아님). COUNT(*): NULL 포함 전체 행 수 → 3. COUNT(col): NULL 제외 비NULL 값 수 → 0. AVG(col): 비NULL 값이 없으면 NULL 반환(0이 아님). SUM과 AVG는 값이 없을 때 NULL을 반환하는 것이 핵심 트랩이다.",
  "tags":["NULL","집계함수","SUM","COUNT","AVG","트랩"],"difficulty":"상","pass_rate":None,"created_at":"2026-06-16","verified":True
},
]

with open(JSONL_PATH, "a", encoding="utf-8") as f:
    for q in questions:
        f.write(json.dumps(q, ensure_ascii=False) + "\n")

total = sum(1 for _ in open(JSONL_PATH))
print(f"총 문제 수: {total}")
print(f"추가된 문제: {len(questions)}개 (q204~q220)")
