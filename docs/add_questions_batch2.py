import json

JSONL_PATH = "/home/choeboeun0625/sqld-tutor/backend/app/data/questions/questions_v0.1.jsonl"

questions = [
# ── JOIN q162~q168 ────────────────────────────────────────────
{
  "id":"q162","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"조인","category":"조인","question_type":"A",
  "context":None,
  "question":"다음 중 NATURAL JOIN에 대한 설명으로 올바르지 않은 것은?",
  "options":{"1":"두 테이블에서 이름이 같은 모든 컬럼을 기준으로 자동으로 조인된다.",
             "2":"NATURAL JOIN에서는 ON 절이나 USING 절을 함께 사용할 수 없다.",
             "3":"NATURAL JOIN 결과에서 조인 기준 컬럼은 한 번만 표시된다.",
             "4":"NATURAL JOIN에서 조인 기준 컬럼 앞에 반드시 테이블 별칭을 붙여야 한다."},
  "answer":4,
  "hint":"NATURAL JOIN에서 조인 컬럼에 테이블명/별칭을 붙이면 오류가 발생한다.",
  "explanation":"NATURAL JOIN에서는 조인 기준이 되는 컬럼에 테이블명이나 별칭을 붙일 수 없다. 붙이면 오류가 발생한다. USING 절도 마찬가지로 명시된 컬럼 앞에 테이블명을 붙이면 오류다.",
  "tags":["조인","NATURAL JOIN","USING"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q163","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"조인","category":"조인","question_type":"A",
  "context":None,
  "question":"JOIN ... USING(컬럼명)에 대한 설명으로 올바르지 않은 것은?",
  "options":{"1":"USING 절에 명시된 컬럼은 두 테이블에 동일한 이름으로 존재해야 한다.",
             "2":"USING 절에 명시된 컬럼은 SELECT 시 테이블 별칭 없이 사용해야 한다.",
             "3":"ON 절과 달리 USING 절을 사용하면 조인 컬럼이 결과에 한 번만 표시된다.",
             "4":"USING 절은 INNER JOIN에서만 사용할 수 있고 OUTER JOIN에서는 사용할 수 없다."},
  "answer":4,
  "hint":"USING 절은 INNER, OUTER 조인 모두에서 사용 가능하다.",
  "explanation":"USING 절은 INNER JOIN뿐 아니라 LEFT/RIGHT/FULL OUTER JOIN에서도 사용할 수 있다. 단, USING 절에 명시된 컬럼은 SELECT 절과 WHERE 절에서 테이블 별칭 없이 사용해야 한다.",
  "tags":["조인","USING","OUTER JOIN"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q164","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"조인","category":"조인","question_type":"A",
  "context":"[테이블 A: id=1,2,3] [테이블 B: id=2,3,4]\nSELECT A.id, B.id FROM A LEFT OUTER JOIN B ON A.id = B.id;",
  "question":"위 SQL 실행 결과에서 NULL이 발생하는 위치로 올바른 것은?",
  "options":{"1":"A.id에 NULL이 발생한다.",
             "2":"B.id에 NULL이 발생한다.",
             "3":"A.id와 B.id 모두에 NULL이 발생한다.",
             "4":"NULL이 발생하지 않는다."},
  "answer":2,
  "hint":"LEFT OUTER JOIN은 왼쪽 테이블의 모든 행을 유지한다.",
  "explanation":"LEFT OUTER JOIN은 왼쪽(A) 테이블의 모든 행을 유지한다. A.id=1은 B에 없으므로 B.id 컬럼이 NULL이 된다. A.id=2,3은 B와 매칭되고, B.id=4는 A에 없지만 LEFT JOIN이므로 포함되지 않는다.",
  "tags":["조인","LEFT OUTER JOIN","NULL"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q165","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"조인","category":"조인","question_type":"A",
  "context":"Oracle SQL: SELECT * FROM EMP E, DEPT D WHERE E.DEPTNO = D.DEPTNO(+);",
  "question":"위 Oracle OUTER JOIN에서 (+) 위치에 대한 설명으로 올바른 것은?",
  "options":{"1":"EMP 테이블의 모든 행이 결과에 포함된다 (EMP LEFT OUTER JOIN DEPT).",
             "2":"DEPT 테이블의 모든 행이 결과에 포함된다 (EMP RIGHT OUTER JOIN DEPT).",
             "3":"두 테이블 모두의 행이 포함된다 (FULL OUTER JOIN).",
             "4":"(+)는 NOT NULL 제약조건을 의미하므로 INNER JOIN과 동일하다."},
  "answer":1,
  "hint":"(+)가 붙은 쪽이 NULL을 받는 쪽 = 해당 테이블이 외부(OUTER)측",
  "explanation":"Oracle (+)에서 (+)가 붙은 테이블이 OUTER 측(NULL이 채워지는 쪽)이다. D.DEPTNO(+)는 DEPT가 OUTER이므로 EMP의 모든 행이 유지되는 LEFT OUTER JOIN이다. E.DEPTNO(+)라면 DEPT의 모든 행이 유지되는 RIGHT OUTER JOIN이 된다.",
  "tags":["조인","Oracle","OUTER JOIN","(+)"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q166","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"조인","category":"조인","question_type":"A",
  "context":None,
  "question":"SELF JOIN을 사용해야 하는 상황으로 가장 적절한 것은?",
  "options":{"1":"두 개의 서로 다른 테이블에서 동일한 컬럼명으로 조인할 때",
             "2":"한 테이블 내에서 같은 테이블을 두 번 참조하여 행 간의 관계를 조회할 때",
             "3":"NULL 값을 포함한 행을 제거하고 조인할 때",
             "4":"두 테이블의 모든 행 조합을 구할 때"},
  "answer":2,
  "hint":"사원-관리자 관계처럼 한 테이블이 자기 자신을 참조할 때",
  "explanation":"SELF JOIN은 하나의 테이블을 마치 두 개의 테이블처럼 사용하여 같은 테이블 내 행 간의 관계를 조회할 때 사용한다. 대표적인 예가 사원 테이블에서 사원과 그 상관의 정보를 같이 조회하는 경우다.",
  "tags":["조인","SELF JOIN"],"difficulty":"하","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q167","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"조인","category":"조인","question_type":"A",
  "context":"[SQL1] SELECT * FROM A LEFT OUTER JOIN B ON A.id=B.id AND B.type='X';\n[SQL2] SELECT * FROM A LEFT OUTER JOIN B ON A.id=B.id WHERE B.type='X';",
  "question":"두 SQL의 결과 차이에 대한 설명으로 올바른 것은?",
  "options":{"1":"SQL1과 SQL2는 항상 동일한 결과를 반환한다.",
             "2":"SQL1은 A의 모든 행을 유지하며 B.type='X' 조건은 ON에서만 적용되지만, SQL2는 WHERE로 인해 B와 매칭되지 않는 A 행(B컬럼이 NULL인 행)이 제거된다.",
             "3":"SQL2는 A의 모든 행을 유지하고 SQL1이 오히려 행을 더 제거한다.",
             "4":"OUTER JOIN에서 WHERE 절 조건은 ON 절보다 먼저 실행된다."},
  "answer":2,
  "hint":"OUTER JOIN에서 ON 조건은 조인 시 적용, WHERE 조건은 조인 후 전체 결과에 적용",
  "explanation":"LEFT OUTER JOIN에서 ON 절의 추가 조건은 조인 과정에서만 적용되어 A의 모든 행이 유지된다(B 매칭 없는 행은 B쪽이 NULL). 반면 WHERE 절 조건은 조인 완료 후 적용되므로 B.type이 NULL인 행(B에 매칭 없는 A 행)이 제거되어 사실상 INNER JOIN처럼 동작한다.",
  "tags":["조인","OUTER JOIN","ON","WHERE","트랩"],"difficulty":"상","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q168","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"조인","category":"조인","question_type":"A",
  "context":None,
  "question":"INNER JOIN에서 조인 테이블 순서에 대한 설명으로 올바른 것은?",
  "options":{"1":"FROM 절에 먼저 나온 테이블이 항상 드라이빙 테이블이 된다.",
             "2":"INNER JOIN에서는 테이블 순서를 바꿔도 결과 집합이 동일하다.",
             "3":"LEFT OUTER JOIN에서도 테이블 순서를 바꿔도 결과가 동일하다.",
             "4":"옵티마이저는 항상 FROM 절에 작성된 순서대로 조인을 수행한다."},
  "answer":2,
  "hint":"INNER JOIN은 교환법칙이 성립한다.",
  "explanation":"INNER JOIN은 교환법칙이 성립하므로 테이블 순서를 바꿔도 결과 집합은 동일하다. 단, 실행 계획(드라이빙 테이블 선택)은 옵티마이저가 비용 기반으로 결정하며 작성 순서와 다를 수 있다. OUTER JOIN은 방향성이 있으므로 순서를 바꾸면 결과가 달라진다.",
  "tags":["조인","INNER JOIN","테이블순서","교환법칙"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},

# ── NULL/CASE WHEN q169~q174 ──────────────────────────────────
{
  "id":"q169","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"함수","category":"함수","question_type":"A",
  "context":None,
  "question":"NULLIF(A, B)에 대한 설명으로 올바른 것은?",
  "options":{"1":"A가 NULL이면 B를 반환하고, A가 NULL이 아니면 A를 반환한다.",
             "2":"A와 B가 같으면 NULL을 반환하고, 다르면 A를 반환한다.",
             "3":"A와 B가 같으면 0을 반환하고, 다르면 A를 반환한다.",
             "4":"A가 NULL이거나 B가 NULL이면 NULL을 반환하고, 아니면 A+B를 반환한다."},
  "answer":2,
  "hint":"NVL과 반대 방향 — NULL을 반환하는 함수",
  "explanation":"NULLIF(A, B)는 A와 B가 같으면 NULL을 반환하고, 다르면 A를 반환한다. 주로 분모가 0이 되는 상황을 피하기 위해 NULLIF(컬럼, 0)처럼 사용하여 0일 때 NULL로 바꿔 0으로 나누기 오류를 방지한다.",
  "tags":["함수","NULLIF","NULL처리"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q170","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"함수","category":"함수","question_type":"A",
  "context":None,
  "question":"COALESCE(A, B, C)에 대한 설명으로 올바른 것은?",
  "options":{"1":"A, B, C 중 NULL이 아닌 값들의 평균을 반환한다.",
             "2":"A, B, C 중 가장 큰 값을 반환한다.",
             "3":"A, B, C를 순서대로 평가하여 처음으로 NULL이 아닌 값을 반환한다.",
             "4":"A, B, C 모두 NULL인 경우 0을 반환한다."},
  "answer":3,
  "hint":"COALESCE = '합치다, 연결하다' — 첫 번째 비NULL 값을 선택",
  "explanation":"COALESCE(A, B, C)는 인자를 왼쪽부터 순서대로 평가하여 처음으로 NULL이 아닌 값을 반환한다. 모두 NULL이면 NULL을 반환한다(0이 아님). NVL(A, B)는 두 인자만 받는 반면 COALESCE는 여러 인자를 받을 수 있다.",
  "tags":["함수","COALESCE","NULL처리"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q171","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"함수","category":"함수","question_type":"A",
  "context":None,
  "question":"NVL(A, B)와 NVL2(A, B, C)의 차이에 대한 설명으로 올바른 것은?",
  "options":{"1":"NVL(A,B): A가 NULL이면 A 반환, 아니면 B 반환 / NVL2(A,B,C): A가 NULL이면 B 반환",
             "2":"NVL(A,B): A가 NULL이면 B, 아니면 A 반환 / NVL2(A,B,C): A가 NULL이 아니면 B, NULL이면 C 반환",
             "3":"NVL과 NVL2는 동일한 기능이며 인수 개수만 다르다.",
             "4":"NVL2(A,B,C): A가 NULL이면 B+C를 반환하고 NULL이 아니면 B를 반환한다."},
  "answer":2,
  "hint":"NVL2는 NULL/비NULL 두 경우 모두에 다른 값을 지정할 수 있다.",
  "explanation":"NVL(A,B)는 A가 NULL이면 B, 아니면 A를 반환한다. NVL2(A,B,C)는 A가 NULL이 아니면 B, NULL이면 C를 반환한다. NVL2는 CASE WHEN A IS NULL THEN C ELSE B END와 동일하다.",
  "tags":["함수","NVL","NVL2","NULL처리"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q172","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"함수","category":"함수","question_type":"A",
  "context":"[SQL1] SELECT DECODE(col, NULL, 'Y', 'N') FROM t;\n[SQL2] SELECT CASE col WHEN NULL THEN 'Y' ELSE 'N' END FROM t;",
  "question":"두 SQL의 결과 차이에 대한 설명으로 올바른 것은?",
  "options":{"1":"SQL1과 SQL2는 col이 NULL일 때 모두 'Y'를 반환한다.",
             "2":"SQL1은 col이 NULL이면 'Y'를 반환하지만, SQL2의 simple CASE는 NULL과 = 비교가 불가하여 항상 'N'을 반환한다.",
             "3":"SQL2는 col이 NULL이면 'Y'를 반환하지만, SQL1의 DECODE는 NULL을 처리할 수 없다.",
             "4":"두 SQL 모두 col이 NULL일 때 'N'을 반환한다."},
  "answer":2,
  "hint":"DECODE는 NULL=NULL을 TRUE로 처리하지만, simple CASE WHEN은 = 연산자를 사용해 NULL 비교가 UNKNOWN이 된다.",
  "explanation":"DECODE(col, NULL, 'Y', 'N')에서 DECODE는 NULL과 NULL을 동등 비교할 수 있어 col이 NULL이면 'Y'를 반환한다. 반면 simple CASE col WHEN NULL은 내부적으로 col = NULL을 수행하는데, NULL과의 = 비교는 항상 UNKNOWN이므로 ELSE가 실행되어 항상 'N'을 반환한다.",
  "tags":["함수","DECODE","CASE","NULL비교","트랩"],"difficulty":"상","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q173","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"함수","category":"함수","question_type":"A",
  "context":"[테이블 T: COL1 = 1, NULL, NULL, 2, NULL]",
  "question":"아래 집계 함수 결과로 올바른 것은?\nSELECT COUNT(*), COUNT(COL1), COUNT(DISTINCT COL1) FROM T;",
  "options":{"1":"COUNT(*)=3, COUNT(COL1)=2, COUNT(DISTINCT COL1)=2",
             "2":"COUNT(*)=5, COUNT(COL1)=2, COUNT(DISTINCT COL1)=2",
             "3":"COUNT(*)=5, COUNT(COL1)=5, COUNT(DISTINCT COL1)=2",
             "4":"COUNT(*)=2, COUNT(COL1)=2, COUNT(DISTINCT COL1)=2"},
  "answer":2,
  "hint":"COUNT(*)는 NULL 포함 전체 행, COUNT(컬럼)은 NULL 제외",
  "explanation":"COUNT(*)는 NULL 여부와 관계없이 전체 행 수 5를 반환한다. COUNT(COL1)은 NULL을 제외한 비NULL 값(1, 2)의 개수 2를 반환한다. COUNT(DISTINCT COL1)은 중복 제거 후 비NULL 고유값(1, 2)의 개수 2를 반환한다.",
  "tags":["함수","COUNT","NULL","DISTINCT"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q174","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"함수","category":"함수","question_type":"A",
  "context":"[테이블 A: col=1,2,3] [테이블 B: col=1,NULL]\nSELECT * FROM A WHERE col NOT IN (SELECT col FROM B);",
  "question":"위 SQL의 실행 결과로 올바른 것은?",
  "options":{"1":"col=2, col=3이 반환된다.",
             "2":"col=1, col=2, col=3 모두 반환된다.",
             "3":"아무 행도 반환되지 않는다.",
             "4":"col=1만 반환된다."},
  "answer":3,
  "hint":"NOT IN 서브쿼리에 NULL이 포함되면 모든 비교가 UNKNOWN이 되어 결과가 공집합이 된다.",
  "explanation":"NOT IN 서브쿼리 결과에 NULL이 포함되면 col NOT IN (1, NULL)은 각 행에 대해 col<>1 AND col<>NULL로 해석된다. NULL과의 <> 비교는 UNKNOWN이고 UNKNOWN AND ...도 TRUE가 될 수 없으므로 어떤 행도 반환되지 않는다. 이는 SQLD에서 자주 출제되는 트랩이다.",
  "tags":["함수","NOT IN","NULL","트랩"],"difficulty":"상","pass_rate":None,"created_at":"2026-06-16","verified":True
},

# ── 서브쿼리 심화 q175~q181 ──────────────────────────────────
{
  "id":"q175","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"서브쿼리","category":"서브쿼리 & Top N","question_type":"A",
  "context":None,
  "question":"EXISTS와 IN 서브쿼리의 동작 방식 차이에 대한 설명으로 올바른 것은?",
  "options":{"1":"EXISTS는 서브쿼리 결과를 모두 가져온 후 비교하고, IN은 조건이 맞는 즉시 TRUE를 반환한다.",
             "2":"IN은 서브쿼리 결과를 모두 가져온 후 비교하고, EXISTS는 조건을 만족하는 행을 찾으면 즉시 TRUE를 반환한다.",
             "3":"EXISTS와 IN은 NULL 처리 방식이 동일하다.",
             "4":"IN은 서브쿼리에서만 사용 가능하고, EXISTS는 리터럴 값과도 사용할 수 있다."},
  "answer":2,
  "hint":"EXISTS = 존재 여부만 확인, IN = 결과 목록과 비교",
  "explanation":"IN은 서브쿼리 결과 목록을 모두 가져온 후 메인 쿼리의 각 행과 비교한다. EXISTS는 서브쿼리를 실행하다가 조건을 만족하는 첫 번째 행을 찾는 순간 TRUE를 반환하고 더 이상 실행하지 않는다. 서브쿼리 결과가 클수록 EXISTS가 유리할 수 있다.",
  "tags":["서브쿼리","EXISTS","IN","성능"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q176","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"서브쿼리","category":"서브쿼리 & Top N","question_type":"A",
  "context":"[A: col=1,2,3] [B: col=1,NULL]\n[SQL1] SELECT * FROM A WHERE col NOT IN (SELECT col FROM B);\n[SQL2] SELECT * FROM A WHERE NOT EXISTS (SELECT 1 FROM B WHERE A.col=B.col);",
  "question":"두 SQL의 결과 차이에 대한 설명으로 올바른 것은?",
  "options":{"1":"SQL1과 SQL2 모두 아무 행도 반환하지 않는다.",
             "2":"SQL1은 아무 행도 반환하지 않고, SQL2는 col=2, col=3을 반환한다.",
             "3":"SQL1과 SQL2 모두 col=2, col=3을 반환한다.",
             "4":"SQL1은 col=2, col=3을 반환하고, SQL2는 아무 행도 반환하지 않는다."},
  "answer":2,
  "hint":"NOT IN은 NULL에 취약하지만 NOT EXISTS는 NULL에 영향받지 않는다.",
  "explanation":"SQL1(NOT IN): 서브쿼리에 NULL이 있으면 모든 비교가 UNKNOWN이 되어 아무 행도 반환되지 않는다. SQL2(NOT EXISTS): 상관 서브쿼리가 행 단위로 B.col=A.col AND B.col IS NOT NULL을 확인하므로 NULL이 있어도 정상적으로 A.col=2, A.col=3이 반환된다.",
  "tags":["서브쿼리","NOT IN","NOT EXISTS","NULL","트랩"],"difficulty":"상","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q177","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"서브쿼리","category":"서브쿼리 & Top N","question_type":"A",
  "context":None,
  "question":"스칼라 서브쿼리(Scalar Subquery)에 대한 설명으로 올바르지 않은 것은?",
  "options":{"1":"SELECT 절에 사용되며 반드시 단일 행, 단일 컬럼 값을 반환해야 한다.",
             "2":"스칼라 서브쿼리가 2개 이상의 행을 반환하면 오류가 발생한다.",
             "3":"스칼라 서브쿼리가 아무 행도 반환하지 않으면 0을 반환한다.",
             "4":"스칼라 서브쿼리는 메인 쿼리의 각 행마다 한 번씩 실행될 수 있다."},
  "answer":3,
  "hint":"결과가 없을 때 기본값은 0이 아니라 NULL이다.",
  "explanation":"스칼라 서브쿼리가 아무 행도 반환하지 않으면 NULL을 반환한다(0이 아님). 스칼라 서브쿼리는 단일 행, 단일 컬럼을 반환해야 하며 여러 행을 반환하면 오류가 발생한다.",
  "tags":["서브쿼리","스칼라서브쿼리","NULL","반환값"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q178","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"서브쿼리","category":"서브쿼리 & Top N","question_type":"A",
  "context":None,
  "question":"인라인 뷰(Inline View)에 대한 설명으로 올바른 것은?",
  "options":{"1":"CREATE VIEW로 미리 생성한 후에만 사용할 수 있다.",
             "2":"FROM 절에 서브쿼리로 작성하며 임시 가상 테이블처럼 동작한다.",
             "3":"WHERE 절에만 사용할 수 있다.",
             "4":"인라인 뷰는 데이터베이스에 영구적으로 저장된다."},
  "answer":2,
  "hint":"인라인(Inline) = SQL 내부에 바로 작성, 뷰처럼 동작",
  "explanation":"인라인 뷰는 FROM 절에 서브쿼리를 직접 작성하여 임시 테이블처럼 사용하는 방식이다. CREATE VIEW와 달리 데이터베이스에 저장되지 않고 해당 SQL 실행 동안만 존재한다. Top-N 쿼리 등에서 자주 활용된다.",
  "tags":["서브쿼리","인라인뷰","FROM절"],"difficulty":"하","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q179","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"서브쿼리","category":"서브쿼리 & Top N","question_type":"A",
  "context":None,
  "question":"상관 서브쿼리(Correlated Subquery)와 비상관 서브쿼리의 차이에 대한 설명으로 올바른 것은?",
  "options":{"1":"상관 서브쿼리는 메인 쿼리보다 먼저 한 번만 실행되고, 비상관 서브쿼리는 각 행마다 실행된다.",
             "2":"비상관 서브쿼리는 메인 쿼리와 독립적으로 한 번만 실행되고, 상관 서브쿼리는 메인 쿼리의 각 행마다 실행된다.",
             "3":"상관 서브쿼리와 비상관 서브쿼리는 항상 동일한 결과를 반환한다.",
             "4":"상관 서브쿼리는 FROM 절에서만 사용할 수 있다."},
  "answer":2,
  "hint":"상관(Correlated) = 메인 쿼리와 연관(참조)되어 행마다 재실행",
  "explanation":"비상관 서브쿼리는 메인 쿼리를 참조하지 않아 독립적으로 한 번만 실행된다. 상관 서브쿼리는 메인 쿼리의 컬럼을 참조하므로 메인 쿼리의 각 행마다 한 번씩 실행된다. EXISTS 서브쿼리는 대표적인 상관 서브쿼리다.",
  "tags":["서브쿼리","상관서브쿼리","비상관서브쿼리"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q180","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"서브쿼리","category":"서브쿼리 & Top N","question_type":"A",
  "context":"[테이블 B: val=10, 20, 30]",
  "question":"WHERE col > ALL (SELECT val FROM B)와 WHERE col > ANY (SELECT val FROM B)의 차이로 올바른 것은?",
  "options":{"1":"ALL: col > 10이어야 한다 / ANY: col > 30이어야 한다",
             "2":"ALL: col > 30이어야 한다 / ANY: col > 10이어야 한다",
             "3":"ALL과 ANY는 동일한 결과를 반환한다.",
             "4":"ALL: B의 모든 값과 같아야 한다 / ANY: B의 하나라도 같으면 된다"},
  "answer":2,
  "hint":"ALL = 모든 값 조건 만족(가장 엄격), ANY = 하나라도 만족(가장 관대)",
  "explanation":"> ALL (10,20,30)은 모든 값보다 커야 하므로 col > 30. > ANY (10,20,30)은 하나라도 크면 되므로 col > 10(최솟값보다만 크면 됨). ALL은 MAX와, ANY는 MIN과 유사한 개념이다.",
  "tags":["서브쿼리","ALL","ANY","비교연산자"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q181","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"서브쿼리","category":"서브쿼리 & Top N","question_type":"A",
  "context":None,
  "question":"서브쿼리에 대한 설명으로 올바르지 않은 것은?",
  "options":{"1":"서브쿼리는 SELECT, FROM, WHERE, HAVING 절에서 사용할 수 있다.",
             "2":"단일 행 서브쿼리 결과가 여러 행이면 단일 행 연산자(=, >, <) 사용 시 오류가 발생한다.",
             "3":"서브쿼리 안에서는 일반적으로 ORDER BY를 사용할 수 없다.",
             "4":"서브쿼리는 항상 메인 쿼리보다 먼저 실행된다."},
  "answer":4,
  "hint":"상관 서브쿼리는 메인 쿼리와 교대로 실행된다.",
  "explanation":"비상관 서브쿼리는 메인 쿼리보다 먼저 실행되지만, 상관 서브쿼리는 메인 쿼리의 각 행마다 실행되므로 '항상 먼저 실행'이라는 설명은 틀렸다. 또한 서브쿼리 안에서 ORDER BY는 일반적으로 허용되지 않는다(Top-N용 ROWNUM/FETCH 구문 제외).",
  "tags":["서브쿼리","실행순서","ORDER BY"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
]

with open(JSONL_PATH, "a", encoding="utf-8") as f:
    for q in questions:
        f.write(json.dumps(q, ensure_ascii=False) + "\n")

total = sum(1 for _ in open(JSONL_PATH))
print(f"총 문제 수: {total}")
print(f"추가된 문제: {len(questions)}개 (q162~q181)")
