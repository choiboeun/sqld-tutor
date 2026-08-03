import json

new_questions = [
    # q124 — RATIO_TO_REPORT (윈도우 함수, 중)
    {
        "id": "q124",
        "subject": "SQL 기본 및 활용",
        "main_category": "SQL 활용",
        "sub_category": "RATIO_TO_REPORT",
        "category": "윈도우 함수",
        "question_type": "C",
        "context": None,
        "question": "다음 중 RATIO_TO_REPORT 함수에 대한 설명으로 옳은 것은?",
        "options": {
            "1": "파티션 내 전체 합계 대비 현재 행의 비율을 0~1 사이 값으로 반환한다.",
            "2": "파티션 내 현재 행까지의 누적 합계를 반환한다.",
            "3": "파티션 내 현재 행의 상대적 순위를 0~1 사이 값으로 반환한다.",
            "4": "RATIO_TO_REPORT는 반드시 PARTITION BY 절과 함께 사용해야 한다."
        },
        "answer": 1,
        "hint": "RATIO_TO_REPORT = 현재 행 값 / 파티션 내 전체 합계.",
        "explanation": "RATIO_TO_REPORT(expr) OVER (partition)는 파티션 내 expr 합계 대비 현재 행 expr 값의 비율을 0~1 사이 소수로 반환한다. 2번은 SUM OVER (ROWS BETWEEN ...)의 설명이고, 3번은 PERCENT_RANK의 설명이다. PARTITION BY는 생략 가능하며 생략 시 전체를 하나의 파티션으로 처리한다.",
        "tags": ["RATIO_TO_REPORT", "윈도우함수", "비율"],
        "difficulty": "중",
        "pass_rate": None,
        "created_at": "2026-06-14",
        "verified": True
    },
    # q125 — PERCENT_RANK (윈도우 함수, 중)
    {
        "id": "q125",
        "subject": "SQL 기본 및 활용",
        "main_category": "SQL 활용",
        "sub_category": "PERCENT_RANK",
        "category": "윈도우 함수",
        "question_type": "C",
        "context": "다음은 성적 테이블의 데이터이다.\n\n| 이름 | 점수 |\n|------|-----:|\n| A    | 100  |\n| B    | 80   |\n| C    | 80   |\n| D    | 60   |\n\n```sql\nSELECT 이름, 점수,\n       PERCENT_RANK() OVER (ORDER BY 점수 DESC) AS PR\nFROM 성적;\n```",
        "question": "위 SQL에서 이름이 'A'인 행의 PR 값으로 옳은 것은?",
        "options": {
            "1": "0",
            "2": "0.25",
            "3": "0.33",
            "4": "1"
        },
        "answer": 1,
        "hint": "PERCENT_RANK = (RANK - 1) / (전체 행 수 - 1). 가장 높은 순위의 값은 항상 0이다.",
        "explanation": "PERCENT_RANK = (RANK - 1) / (N - 1). A의 점수 100이 가장 높으므로 RANK=1, PR=(1-1)/(4-1)=0이다. B와 C는 동점으로 RANK=2, PR=(2-1)/3=0.333이다. D는 RANK=4, PR=(4-1)/3=1이다.",
        "tags": ["PERCENT_RANK", "윈도우함수", "상대순위"],
        "difficulty": "중",
        "pass_rate": None,
        "created_at": "2026-06-14",
        "verified": True
    },
    # q126 — CUME_DIST (윈도우 함수, 상)
    {
        "id": "q126",
        "subject": "SQL 기본 및 활용",
        "main_category": "SQL 활용",
        "sub_category": "CUME_DIST",
        "category": "윈도우 함수",
        "question_type": "B",
        "context": None,
        "question": "다음 중 CUME_DIST와 PERCENT_RANK의 차이로 옳은 것은?",
        "options": {
            "1": "CUME_DIST는 0~1 사이 값을 반환하지만 PERCENT_RANK는 1~100 사이 값을 반환한다.",
            "2": "CUME_DIST는 현재 행 이하의 누적 비율을 반환하며 최솟값이 0보다 크고, PERCENT_RANK는 최솟값이 항상 0이다.",
            "3": "PERCENT_RANK는 동점자를 다른 순위로 처리하지만 CUME_DIST는 동점자에게 같은 값을 부여한다.",
            "4": "CUME_DIST와 PERCENT_RANK는 항상 동일한 결과를 반환한다."
        },
        "answer": 2,
        "hint": "CUME_DIST 최솟값은 1/N, PERCENT_RANK 최솟값은 0이다.",
        "explanation": "CUME_DIST = (현재 행 이하의 행 수) / (전체 행 수)이므로 최솟값은 1/N(0보다 큰 값)이다. PERCENT_RANK = (RANK-1)/(N-1)이므로 가장 높은 순위의 값은 항상 0이다. 두 함수 모두 0~1 사이 값을 반환하며, 동점자에게 같은 값을 부여한다.",
        "tags": ["CUME_DIST", "PERCENT_RANK", "윈도우함수", "누적분포"],
        "difficulty": "상",
        "pass_rate": None,
        "created_at": "2026-06-14",
        "verified": True
    },
    # q127 — REGEXP_SUBSTR (SQL 활용 기타, 중)
    {
        "id": "q127",
        "subject": "SQL 기본 및 활용",
        "main_category": "SQL 활용",
        "sub_category": "REGEXP_SUBSTR",
        "category": "SQL 활용 기타",
        "question_type": "C",
        "context": "```sql\nSELECT REGEXP_SUBSTR('hong@example.com', '[^@]+', 1, 1) AS RESULT\nFROM DUAL;\n```",
        "question": "위 SQL의 실행 결과로 옳은 것은?",
        "options": {
            "1": "hong",
            "2": "example.com",
            "3": "@example.com",
            "4": "hong@example.com"
        },
        "answer": 1,
        "hint": "[^@]+는 @ 문자가 아닌 문자가 1개 이상 연속된 부분을 의미한다.",
        "explanation": "REGEXP_SUBSTR(문자열, 패턴, 시작위치, 발생횟수)는 패턴에 맞는 부분 문자열을 반환한다. [^@]+는 '@'가 아닌 문자의 연속을 의미하므로 'hong@example.com'에서 첫 번째 매칭은 '@' 앞의 'hong'이다.",
        "tags": ["REGEXP_SUBSTR", "정규표현식", "문자함수"],
        "difficulty": "중",
        "pass_rate": None,
        "created_at": "2026-06-14",
        "verified": True
    },
    # q128 — REGEXP_INSTR (SQL 활용 기타, 중)
    {
        "id": "q128",
        "subject": "SQL 기본 및 활용",
        "main_category": "SQL 활용",
        "sub_category": "REGEXP_INSTR",
        "category": "SQL 활용 기타",
        "question_type": "C",
        "context": "```sql\nSELECT REGEXP_INSTR('ABC123DEF456', '[0-9]+', 1, 2) AS RESULT\nFROM DUAL;\n```",
        "question": "위 SQL의 실행 결과로 옳은 것은?",
        "options": {
            "1": "4",
            "2": "7",
            "3": "10",
            "4": "3"
        },
        "answer": 3,
        "hint": "REGEXP_INSTR의 네 번째 인수는 패턴의 발생 횟수(몇 번째 매칭)를 지정한다.",
        "explanation": "REGEXP_INSTR(문자열, 패턴, 시작위치, 발생횟수)는 패턴이 발생하는 시작 위치를 반환한다. [0-9]+는 숫자의 연속이다. 'ABC123DEF456'에서 첫 번째 숫자 그룹 '123'은 4번째 위치, 두 번째 숫자 그룹 '456'은 10번째 위치에서 시작한다. 발생횟수가 2이므로 결과는 10이다.",
        "tags": ["REGEXP_INSTR", "정규표현식", "위치반환"],
        "difficulty": "중",
        "pass_rate": None,
        "created_at": "2026-06-14",
        "verified": True
    },
    # q129 — REGEXP_COUNT (SQL 활용 기타, 중)
    {
        "id": "q129",
        "subject": "SQL 기본 및 활용",
        "main_category": "SQL 활용",
        "sub_category": "REGEXP_COUNT",
        "category": "SQL 활용 기타",
        "question_type": "C",
        "context": "```sql\nSELECT REGEXP_COUNT('banana', 'a') AS RESULT\nFROM DUAL;\n```",
        "question": "위 SQL의 실행 결과로 옳은 것은?",
        "options": {
            "1": "1",
            "2": "2",
            "3": "3",
            "4": "6"
        },
        "answer": 3,
        "hint": "'banana'에서 'a'가 몇 번 나오는지 세어보자.",
        "explanation": "REGEXP_COUNT(문자열, 패턴)는 문자열에서 패턴이 나타나는 횟수를 반환한다. 'banana'에서 'a'는 b**a**n**a**n**a** 세 번 등장하므로 결과는 3이다.",
        "tags": ["REGEXP_COUNT", "정규표현식", "횟수반환"],
        "difficulty": "중",
        "pass_rate": None,
        "created_at": "2026-06-14",
        "verified": True
    },
    # q130 — 분산 데이터베이스 투명성 (데이터 모델링 기초, 중)
    {
        "id": "q130",
        "subject": "데이터 모델링의 이해",
        "main_category": "데이터 모델링의 이해",
        "sub_category": "분산 데이터베이스",
        "category": "데이터 모델링 기초",
        "question_type": "C",
        "context": None,
        "question": "분산 데이터베이스의 투명성(Transparency)에 대한 설명으로 옳지 않은 것은?",
        "options": {
            "1": "위치 투명성 — 데이터가 어느 노드에 있는지 몰라도 동일한 방법으로 접근할 수 있다.",
            "2": "중복 투명성 — 동일 데이터가 여러 노드에 복제되어 있어도 하나의 데이터처럼 접근할 수 있다.",
            "3": "병행 투명성 — 여러 사용자가 동시에 접근해도 데이터 일관성이 유지된다.",
            "4": "장애 투명성 — 특정 노드에 장애가 발생하면 전체 시스템이 중단되어야 한다."
        },
        "answer": 4,
        "hint": "장애 투명성은 일부 노드의 장애에도 전체 시스템이 지속 운영됨을 의미한다.",
        "explanation": "장애 투명성은 일부 노드에 장애가 발생하더라도 시스템 전체가 중단되지 않고 서비스를 지속할 수 있는 특성이다. '장애 발생 시 전체 시스템이 중단되어야 한다'는 설명은 틀렸다. 분산 데이터베이스의 주요 투명성에는 위치, 중복(복제), 분할, 장애, 병행 투명성이 있다.",
        "tags": ["분산데이터베이스", "투명성", "위치투명성", "장애투명성"],
        "difficulty": "중",
        "pass_rate": None,
        "created_at": "2026-06-14",
        "verified": True
    },
    # q131 — SEQUENCE (관리 구문, 하)
    {
        "id": "q131",
        "subject": "SQL 기본 및 활용",
        "main_category": "SQL 기본",
        "sub_category": "SEQUENCE",
        "category": "관리 구문",
        "question_type": "A",
        "context": None,
        "question": "다음 중 SEQUENCE에 대한 설명으로 옳지 않은 것은?",
        "options": {
            "1": "NEXTVAL은 시퀀스에서 다음 값을 생성하여 반환한다.",
            "2": "CURRVAL은 현재 세션에서 NEXTVAL을 한 번도 호출하지 않아도 사용할 수 있다.",
            "3": "CYCLE 옵션을 지정하면 최댓값 도달 후 START WITH 값부터 다시 시작한다.",
            "4": "CACHE 옵션은 시퀀스 값을 미리 메모리에 할당하여 성능을 향상시킨다."
        },
        "answer": 2,
        "hint": "CURRVAL은 현재 세션에서 반드시 NEXTVAL을 먼저 호출한 후에만 사용 가능하다.",
        "explanation": "CURRVAL은 현재 세션에서 NEXTVAL을 최소 한 번 호출한 이후에만 사용할 수 있다. NEXTVAL 호출 없이 CURRVAL을 사용하면 오류가 발생한다. CYCLE 옵션은 최댓값 도달 후 START WITH 값으로 재시작하고, CACHE는 값을 미리 메모리에 할당해 성능을 높인다.",
        "tags": ["SEQUENCE", "NEXTVAL", "CURRVAL", "DDL"],
        "difficulty": "하",
        "pass_rate": None,
        "created_at": "2026-06-14",
        "verified": True
    },
    # q132 — SYNONYM (관리 구문, 하)
    {
        "id": "q132",
        "subject": "SQL 기본 및 활용",
        "main_category": "SQL 기본",
        "sub_category": "SYNONYM",
        "category": "관리 구문",
        "question_type": "A",
        "context": None,
        "question": "다음 중 SYNONYM(동의어)에 대한 설명으로 옳은 것은?",
        "options": {
            "1": "SYNONYM은 테이블의 데이터를 물리적으로 복사하여 별칭을 부여하는 객체다.",
            "2": "PUBLIC SYNONYM은 모든 사용자가 접근할 수 있으며 일반 사용자도 생성할 수 있다.",
            "3": "PRIVATE SYNONYM은 생성한 사용자만 사용할 수 있으며 다른 사용자와 공유되지 않는다.",
            "4": "SYNONYM을 삭제하면 원본 테이블의 데이터도 함께 삭제된다."
        },
        "answer": 3,
        "hint": "SYNONYM은 객체에 대한 별칭으로 데이터를 복사하지 않는다.",
        "explanation": "PRIVATE SYNONYM은 생성한 사용자 소유로 다른 사용자와 공유되지 않는다. SYNONYM은 테이블 등 객체에 대한 별칭으로 데이터를 복사하지 않는다. PUBLIC SYNONYM은 모든 사용자가 접근 가능하지만 DBA 권한이 있어야 생성할 수 있다. SYNONYM을 삭제해도 원본 객체에는 영향이 없다.",
        "tags": ["SYNONYM", "동의어", "PUBLIC", "PRIVATE", "DDL"],
        "difficulty": "하",
        "pass_rate": None,
        "created_at": "2026-06-14",
        "verified": True
    },
    # q133 — ROLE (관리 구문, 중)
    {
        "id": "q133",
        "subject": "SQL 기본 및 활용",
        "main_category": "SQL 기본",
        "sub_category": "ROLE",
        "category": "관리 구문",
        "question_type": "C",
        "context": None,
        "question": "다음 중 ROLE에 대한 설명으로 옳지 않은 것은?",
        "options": {
            "1": "ROLE은 여러 권한을 하나의 그룹으로 묶어 사용자에게 한 번에 부여할 수 있다.",
            "2": "사용자에게 ROLE을 부여하면 ROLE에 포함된 권한을 모두 갖게 된다.",
            "3": "ROLE을 삭제하면 해당 ROLE을 부여받은 사용자의 관련 권한도 자동으로 회수된다.",
            "4": "하나의 사용자는 하나의 ROLE만 부여받을 수 있다."
        },
        "answer": 4,
        "hint": "하나의 사용자에게 여러 ROLE을 부여할 수 있다.",
        "explanation": "하나의 사용자에게 여러 ROLE을 부여할 수 있고, 하나의 ROLE을 여러 사용자에게 부여할 수도 있다. ROLE은 권한 관리를 단순화하기 위한 그룹으로, ROLE을 삭제하면 해당 ROLE을 통해 부여된 권한이 자동으로 회수된다.",
        "tags": ["ROLE", "권한관리", "DCL", "GRANT"],
        "difficulty": "중",
        "pass_rate": None,
        "created_at": "2026-06-14",
        "verified": True
    },
    # q134 — ALTER TABLE 상세 (관리 구문, 중)
    {
        "id": "q134",
        "subject": "SQL 기본 및 활용",
        "main_category": "SQL 기본",
        "sub_category": "ALTER TABLE",
        "category": "관리 구문",
        "question_type": "C",
        "context": None,
        "question": "다음 중 ALTER TABLE 문에 대한 설명으로 옳지 않은 것은?",
        "options": {
            "1": "ADD 절로 기존 테이블에 새 컬럼을 추가할 수 있다.",
            "2": "MODIFY 절로 기존 컬럼의 데이터 타입이나 크기를 변경할 수 있다.",
            "3": "DROP COLUMN 절로 컬럼을 삭제하면 해당 컬럼의 데이터도 함께 삭제된다.",
            "4": "테이블에 데이터가 있어도 컬럼 크기를 현재보다 작게 줄일 수 있다."
        },
        "answer": 4,
        "hint": "데이터가 있는 컬럼의 크기를 줄이려면 기존 데이터가 새 크기 내에 들어와야 한다.",
        "explanation": "테이블에 데이터가 있는 경우 컬럼 크기를 현재 데이터보다 작게 줄이면 오류가 발생한다. 기존 데이터가 모두 새 크기 이내에 맞는 경우에만 크기 축소가 가능하다. ADD로 컬럼 추가, MODIFY로 타입/크기 변경, DROP COLUMN으로 컬럼과 데이터를 함께 삭제하는 것은 모두 올바른 설명이다.",
        "tags": ["ALTER TABLE", "ADD", "MODIFY", "DROP COLUMN", "DDL"],
        "difficulty": "중",
        "pass_rate": None,
        "created_at": "2026-06-14",
        "verified": True
    },
    # q135 — ON DELETE CASCADE / SET NULL (데이터 모델과 SQL, 중)
    {
        "id": "q135",
        "subject": "데이터 모델링의 이해",
        "main_category": "데이터 모델과 SQL",
        "sub_category": "참조 동작",
        "category": "데이터 모델과 SQL",
        "question_type": "C",
        "context": None,
        "question": "외래키의 참조 동작(Referential Action)에 대한 설명으로 옳은 것은?",
        "options": {
            "1": "ON DELETE CASCADE는 부모 행이 삭제될 때 자식 행의 외래키 값을 NULL로 변경한다.",
            "2": "ON DELETE SET NULL은 부모 행이 삭제될 때 해당 부모를 참조하는 자식 행도 자동으로 삭제한다.",
            "3": "ON DELETE CASCADE는 부모 행이 삭제될 때 해당 부모를 참조하는 자식 행도 자동으로 삭제한다.",
            "4": "참조 동작을 지정하지 않으면 기본적으로 ON DELETE CASCADE가 적용된다."
        },
        "answer": 3,
        "hint": "CASCADE는 '연쇄 삭제', SET NULL은 '자식 FK를 NULL로 설정'을 의미한다.",
        "explanation": "ON DELETE CASCADE는 부모 행 삭제 시 해당 부모를 참조하는 자식 행이 자동으로 함께 삭제된다. ON DELETE SET NULL은 부모 행 삭제 시 자식 행의 외래키 컬럼 값을 NULL로 변경한다. 참조 동작을 지정하지 않으면 기본적으로 RESTRICT(부모 삭제 불가)가 적용된다.",
        "tags": ["ON DELETE CASCADE", "ON DELETE SET NULL", "외래키", "참조동작"],
        "difficulty": "중",
        "pass_rate": None,
        "created_at": "2026-06-14",
        "verified": True
    },
]

path = "/home/choeboeun0625/sqld-tutor/backend/app/data/questions/questions_v0.1.jsonl"

with open(path, "a", encoding="utf-8") as f:
    for q in new_questions:
        f.write(json.dumps(q, ensure_ascii=False) + "\n")

print(f"✅ {len(new_questions)}개 문제 추가 완료")

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()
print(f"✅ 전체 문제 수: {len(lines)}개")

from collections import Counter
cats = Counter(json.loads(l)["category"] for l in lines)
for cat, cnt in sorted(cats.items()):
    print(f"  {cat}: {cnt}문제")
