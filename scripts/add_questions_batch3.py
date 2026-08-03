import json

JSONL_PATH = "/home/choeboeun0625/sqld-tutor/backend/app/data/questions/questions_v0.1.jsonl"

questions = [
# ── PIVOT/UNPIVOT q182~q185 ───────────────────────────────────
{
  "id":"q182","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"PIVOT","category":"SQL 활용 기타","question_type":"A",
  "context":None,
  "question":"PIVOT에 대한 설명으로 올바른 것은?",
  "options":{"1":"행(Row) 데이터를 열(Column)로 변환하는 기능이다.",
             "2":"열(Column) 데이터를 행(Row)으로 변환하는 기능이다.",
             "3":"테이블을 수평으로 분할하는 기능이다.",
             "4":"집계 없이 데이터를 단순 전치(Transpose)하는 기능이다."},
  "answer":1,
  "hint":"PIVOT = 가로로 펼치기 (행→열), UNPIVOT = 세로로 쌓기 (열→행)",
  "explanation":"PIVOT은 행 데이터를 열로 변환한다. 예를 들어 여러 행으로 저장된 월별 데이터를 각 월이 하나의 컬럼이 되도록 변환한다. PIVOT은 반드시 집계 함수(SUM, COUNT 등)와 함께 사용한다. 반대로 UNPIVOT은 열을 행으로 변환한다.",
  "tags":["PIVOT","행열변환","SQL활용"],"difficulty":"하","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q183","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"PIVOT","category":"SQL 활용 기타","question_type":"A",
  "context":None,
  "question":"UNPIVOT에 대한 설명으로 올바른 것은?",
  "options":{"1":"행 데이터를 열로 변환한다.",
             "2":"열 데이터를 행으로 변환한다.",
             "3":"테이블에서 NULL 값이 있는 행을 제거한다.",
             "4":"테이블의 인덱스를 재구성한다."},
  "answer":2,
  "hint":"PIVOT의 반대 방향 변환",
  "explanation":"UNPIVOT은 여러 컬럼에 분산된 데이터를 행으로 변환한다. 예를 들어 [이름, 1월매출, 2월매출, 3월매출] 구조를 [이름, 월, 매출] 형태의 행 데이터로 변환한다. PIVOT으로 변환된 데이터를 원래대로 되돌릴 때도 사용한다.",
  "tags":["UNPIVOT","열행변환","SQL활용"],"difficulty":"하","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q184","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"PIVOT","category":"SQL 활용 기타","question_type":"A",
  "context":"SELECT * FROM (\n  SELECT JOB, SAL FROM EMP\n) PIVOT (\n  (  )(SAL) FOR JOB IN ('CLERK' AS CLERK, 'MANAGER' AS MGR)\n);",
  "question":"위 PIVOT SQL의 빈칸에 들어갈 수 없는 것은?",
  "options":{"1":"SUM","2":"AVG","3":"COUNT","4":"ORDER BY"},
  "answer":4,
  "hint":"PIVOT 괄호 안에는 반드시 집계 함수가 와야 한다.",
  "explanation":"PIVOT 절의 집계 자리에는 SUM, AVG, COUNT, MAX, MIN 등 집계 함수가 와야 한다. ORDER BY는 집계 함수가 아니며 PIVOT 절 내부에 사용할 수 없다.",
  "tags":["PIVOT","집계함수","SQL활용"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q185","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"PIVOT","category":"SQL 활용 기타","question_type":"A",
  "context":None,
  "question":"PIVOT 함수 없이 동일한 결과를 얻을 수 있는 방법으로 올바른 것은?",
  "options":{"1":"UNION ALL로 행을 합치는 방법",
             "2":"CASE WHEN과 GROUP BY를 조합하는 방법",
             "3":"CONNECT BY 계층형 쿼리를 사용하는 방법",
             "4":"DISTINCT와 ORDER BY를 조합하는 방법"},
  "answer":2,
  "hint":"CASE WHEN으로 열을 조건부로 분기하고 GROUP BY로 집계하면 동일 효과",
  "explanation":"PIVOT과 동일한 결과를 CASE WHEN + GROUP BY로 구현할 수 있다. 예: SELECT DEPTNO, SUM(CASE WHEN JOB='CLERK' THEN SAL END) AS CLERK, SUM(CASE WHEN JOB='MANAGER' THEN SAL END) AS MGR FROM EMP GROUP BY DEPTNO; 이 방식은 Oracle 이전 버전이나 PIVOT 미지원 DB에서 활용한다.",
  "tags":["PIVOT","CASE WHEN","GROUP BY","동치변환"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},

# ── MERGE q186~q189 ───────────────────────────────────────────
{
  "id":"q186","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"MERGE","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"MERGE 문에 대한 설명으로 올바르지 않은 것은?",
  "options":{"1":"ON 조건에 따라 INSERT, UPDATE, DELETE를 한 번에 처리할 수 있다.",
             "2":"MERGE의 ON 절은 소스와 타겟 테이블의 조인 조건을 정의한다.",
             "3":"WHEN MATCHED THEN 절은 ON 조건이 일치할 때 실행된다.",
             "4":"MERGE 문은 반드시 WHEN MATCHED와 WHEN NOT MATCHED 절을 모두 포함해야 한다."},
  "answer":4,
  "hint":"MERGE는 MATCHED 또는 NOT MATCHED 중 하나만 있어도 된다.",
  "explanation":"MERGE 문은 WHEN MATCHED와 WHEN NOT MATCHED 중 하나만 있어도 유효하다. 즉 일치하는 경우에만 UPDATE하거나, 일치하지 않는 경우에만 INSERT하는 등 필요한 절만 작성할 수 있다.",
  "tags":["MERGE","DML","관리구문"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q187","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"MERGE","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"MERGE 문에서 WHEN MATCHED THEN UPDATE SET이 실행되는 조건으로 올바른 것은?",
  "options":{"1":"소스 테이블에만 데이터가 있고 타겟 테이블에는 없을 때",
             "2":"타겟 테이블에만 데이터가 있고 소스 테이블에는 없을 때",
             "3":"ON 조건에서 소스와 타겟 테이블 간에 일치하는 행이 존재할 때",
             "4":"ON 조건에서 소스와 타겟 테이블 간에 일치하는 행이 없을 때"},
  "answer":3,
  "hint":"MATCHED = 조건이 맞는(일치하는) 행이 있을 때",
  "explanation":"WHEN MATCHED는 ON 절의 조건에서 소스와 타겟 테이블의 행이 일치할 때 실행된다. 일반적으로 THEN UPDATE SET으로 타겟 테이블의 해당 행을 갱신한다. 일치하지 않을 때는 WHEN NOT MATCHED THEN INSERT로 새 행을 삽입한다.",
  "tags":["MERGE","WHEN MATCHED","UPDATE"],"difficulty":"하","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q188","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"MERGE","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"MERGE 문에서 DELETE 기능에 대한 설명으로 올바른 것은?",
  "options":{"1":"MERGE에서는 DELETE를 사용할 수 없다.",
             "2":"WHEN MATCHED 절 내에서 UPDATE 뒤에 WHERE 조건으로 DELETE를 추가할 수 있다.",
             "3":"WHEN NOT MATCHED 절에서 DELETE로 소스에 없는 타겟 행을 삭제한다.",
             "4":"MERGE의 DELETE는 타겟 테이블 전체 행을 삭제한다."},
  "answer":2,
  "hint":"MERGE의 DELETE는 WHEN MATCHED 안에서 UPDATE 조건과 함께 사용",
  "explanation":"Oracle의 MERGE 문에서는 WHEN MATCHED THEN UPDATE SET ... DELETE WHERE ... 형태로 UPDATE와 함께 조건부 DELETE를 사용할 수 있다. DELETE는 UPDATE 후 해당 행이 추가 WHERE 조건을 만족할 때 삭제된다.",
  "tags":["MERGE","DELETE","WHEN MATCHED"],"difficulty":"상","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q189","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"MERGE","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"MERGE 문에서 WHEN NOT MATCHED THEN INSERT가 실행되는 조건으로 올바른 것은?",
  "options":{"1":"ON 조건에서 소스와 타겟 테이블이 일치하는 행이 있을 때",
             "2":"ON 조건에서 소스 테이블에는 있지만 타겟 테이블에는 없는 행일 때",
             "3":"타겟 테이블에만 있고 소스 테이블에는 없는 행일 때",
             "4":"소스와 타겟 모두에 해당 값이 없을 때"},
  "answer":2,
  "hint":"NOT MATCHED = 소스에는 있는데 타겟에 없어서 INSERT 필요",
  "explanation":"WHEN NOT MATCHED는 소스 테이블에는 행이 있지만 ON 조건으로 타겟 테이블에서 일치하는 행을 찾지 못했을 때 실행된다. 이 경우 THEN INSERT로 타겟 테이블에 새 행을 삽입한다.",
  "tags":["MERGE","WHEN NOT MATCHED","INSERT"],"difficulty":"하","pass_rate":None,"created_at":"2026-06-16","verified":True
},

# ── VIEW q190~q193 ────────────────────────────────────────────
{
  "id":"q190","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"VIEW","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"다음 중 VIEW에 대한 설명으로 올바르지 않은 것은?",
  "options":{"1":"VIEW는 실제 데이터를 저장하지 않는 가상 테이블이다.",
             "2":"VIEW를 통해 조회하면 실제 기본 테이블에서 데이터를 가져온다.",
             "3":"VIEW를 통한 INSERT/UPDATE는 모든 경우에 허용된다.",
             "4":"VIEW를 삭제(DROP)해도 기본 테이블의 데이터는 삭제되지 않는다."},
  "answer":3,
  "hint":"GROUP BY, DISTINCT, 집계 함수 등이 포함된 VIEW는 DML이 제한된다.",
  "explanation":"GROUP BY, DISTINCT, 집계 함수, UNION, 서브쿼리 등이 포함된 VIEW는 INSERT/UPDATE가 불가능하다. 기본 키가 없거나 여러 테이블 조인 시에도 DML이 제한될 수 있다. 모든 경우에 허용된다는 설명은 틀렸다.",
  "tags":["VIEW","DML제한","가상테이블"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q191","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"VIEW","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"VIEW를 통한 INSERT/UPDATE가 불가능한 경우로 올바른 것은?",
  "options":{"1":"VIEW에 WHERE 절이 포함된 경우",
             "2":"VIEW가 단일 테이블 기반으로 생성된 경우",
             "3":"VIEW에 GROUP BY 또는 집계 함수가 포함된 경우",
             "4":"VIEW에 ORDER BY 절이 포함된 경우"},
  "answer":3,
  "hint":"집계 결과는 여러 원본 행을 대표하므로 개별 행 수정이 불가",
  "explanation":"GROUP BY나 집계 함수가 포함된 VIEW는 여러 행을 하나로 집계하므로 어느 원본 행을 수정해야 할지 특정할 수 없어 INSERT/UPDATE/DELETE가 불가능하다. WHERE 절은 단순 필터이므로 DML에 영향을 주지 않는다.",
  "tags":["VIEW","DML제한","GROUP BY","집계함수"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q192","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"VIEW","category":"관리 구문","question_type":"A",
  "context":"CREATE VIEW v AS\nSELECT * FROM EMP WHERE DEPTNO = 10\nWITH CHECK OPTION;",
  "question":"위 VIEW에 대한 설명으로 올바른 것은?",
  "options":{"1":"이 VIEW를 통해 DEPTNO=20인 행을 INSERT하면 오류가 발생한다.",
             "2":"이 VIEW를 통한 모든 INSERT/UPDATE를 금지한다.",
             "3":"이 VIEW의 WHERE 조건 자체를 변경하는 것을 방지한다.",
             "4":"기본 테이블(EMP)의 구조가 변경되면 자동으로 VIEW도 수정된다."},
  "answer":1,
  "hint":"WITH CHECK OPTION = VIEW의 WHERE 조건을 위반하는 DML 차단",
  "explanation":"WITH CHECK OPTION은 VIEW를 통한 INSERT/UPDATE 시 VIEW의 WHERE 조건(DEPTNO=10)을 만족하지 않는 데이터를 거부한다. DEPTNO=20인 행을 INSERT하면 WHERE DEPTNO=10 조건을 위반하므로 오류가 발생한다.",
  "tags":["VIEW","WITH CHECK OPTION","DML제한"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q193","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"VIEW","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"MATERIALIZED VIEW(구체화된 뷰)와 일반 VIEW의 가장 큰 차이점으로 올바른 것은?",
  "options":{"1":"MATERIALIZED VIEW는 일반 VIEW보다 생성 문법이 더 복잡하다.",
             "2":"MATERIALIZED VIEW는 쿼리 결과를 실제 물리적으로 저장하여 조회 성능을 향상시킨다.",
             "3":"MATERIALIZED VIEW는 기본 테이블이 변경되면 항상 즉시 자동 갱신된다.",
             "4":"MATERIALIZED VIEW는 일반 VIEW와 달리 인덱스를 생성할 수 없다."},
  "answer":2,
  "hint":"MATERIALIZED = 물질화된, 실제로 저장된",
  "explanation":"MATERIALIZED VIEW는 뷰 정의 쿼리의 결과를 실제 테이블처럼 물리적으로 저장한다. 조회 시 매번 쿼리를 실행하지 않고 저장된 데이터를 읽으므로 성능이 향상된다. 갱신 방법(즉시/지연)은 설정에 따라 다르며, 인덱스 생성도 가능하다.",
  "tags":["VIEW","MATERIALIZED VIEW","성능","물리저장"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},

# ── 트랜잭션 심화 q194~q198 ───────────────────────────────────
{
  "id":"q194","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"트랜잭션","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"트랜잭션의 ACID 특성 중 '원자성(Atomicity)'에 대한 설명으로 올바른 것은?",
  "options":{"1":"트랜잭션 실행 결과는 데이터베이스에 영구적으로 반영되어야 한다.",
             "2":"트랜잭션은 전부 성공하거나 전부 실패해야 하며 부분 실행 상태가 남으면 안 된다.",
             "3":"동시에 실행되는 트랜잭션들이 서로 영향을 주지 않아야 한다.",
             "4":"트랜잭션 전후에 데이터베이스는 일관성 있는 상태를 유지해야 한다."},
  "answer":2,
  "hint":"원자 = 더 이상 쪼갤 수 없다 = All or Nothing",
  "explanation":"원자성(Atomicity)은 트랜잭션의 모든 연산이 전부 성공(COMMIT)하거나 전부 실패(ROLLBACK)해야 한다는 성질이다. 영구성=지속성(Durability), 격리성(Isolation), 일관성(Consistency)은 각각 다른 특성이다.",
  "tags":["트랜잭션","ACID","원자성","Atomicity"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q195","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"트랜잭션","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"다음 중 트랜잭션에 대한 설명으로 올바르지 않은 것은?",
  "options":{"1":"DDL(CREATE, ALTER, DROP) 문은 실행 전후에 암묵적 COMMIT이 발생한다.",
             "2":"ROLLBACK은 마지막 COMMIT 이후의 DML 변경사항을 모두 취소한다.",
             "3":"SAVEPOINT를 사용하면 특정 시점까지만 롤백할 수 있다.",
             "4":"ROLLBACK은 DDL 문의 변경사항도 취소할 수 있다."},
  "answer":4,
  "hint":"DDL은 실행 즉시 자동 COMMIT되어 ROLLBACK이 불가능하다.",
  "explanation":"DDL(CREATE, ALTER, DROP, TRUNCATE 등)은 실행 전후에 암묵적으로 COMMIT되므로 ROLLBACK으로 취소할 수 없다. ROLLBACK은 마지막 COMMIT 이후의 DML(INSERT, UPDATE, DELETE) 변경사항만 취소한다.",
  "tags":["트랜잭션","ROLLBACK","DDL","암묵적COMMIT"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q196","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"트랜잭션","category":"관리 구문","question_type":"A",
  "context":"INSERT INTO T VALUES(1);\nSAVEPOINT S1;\nINSERT INTO T VALUES(2);\nSAVEPOINT S2;\nINSERT INTO T VALUES(3);\nROLLBACK TO S1;\nINSERT INTO T VALUES(4);\nCOMMIT;\nSELECT * FROM T;",
  "question":"위 SQL 실행 후 SELECT 결과로 올바른 것은?",
  "options":{"1":"1, 2, 3, 4","2":"1, 4","3":"1, 2, 4","4":"4"},
  "answer":2,
  "hint":"ROLLBACK TO S1은 S1 이후의 모든 변경(2,3 INSERT)을 취소한다.",
  "explanation":"ROLLBACK TO S1 실행 시 S1 이후에 수행된 INSERT(2), SAVEPOINT S2, INSERT(3)이 모두 취소된다. 이후 INSERT(4)를 실행하고 COMMIT하면 최종 결과는 1, 4가 된다. ROLLBACK TO SAVEPOINT는 해당 SAVEPOINT 이후의 변경만 취소한다.",
  "tags":["트랜잭션","SAVEPOINT","ROLLBACK TO","결과추적"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q197","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"트랜잭션","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"트랜잭션의 격리성(Isolation)과 관련된 문제 중, 한 트랜잭션이 같은 데이터를 두 번 읽을 때 다른 트랜잭션의 COMMIT으로 인해 두 번째 읽기에서 다른 값이 조회되는 현상은?",
  "options":{"1":"Dirty Read","2":"Non-Repeatable Read","3":"Phantom Read","4":"Lost Update"},
  "answer":2,
  "hint":"반복 읽기 불가 = 같은 데이터를 두 번 읽었는데 다른 값",
  "explanation":"Non-Repeatable Read(반복 불가 읽기)는 같은 트랜잭션 내에서 동일한 행을 두 번 읽었는데, 중간에 다른 트랜잭션이 COMMIT하여 두 번째 읽기 결과가 달라지는 현상이다. Dirty Read는 COMMIT 전 데이터 읽기, Phantom Read는 행 수 자체가 달라지는 현상이다.",
  "tags":["트랜잭션","격리성","Non-Repeatable Read","Dirty Read"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q198","subject":"SQL 기본 및 활용","main_category":"SQL 기본",
  "sub_category":"트랜잭션","category":"관리 구문","question_type":"A",
  "context":None,
  "question":"COMMIT 이후 ROLLBACK을 수행하면 어떻게 되는가?",
  "options":{"1":"COMMIT 이전 상태로 모든 데이터가 복구된다.",
             "2":"COMMIT된 데이터는 롤백되지 않으며, COMMIT 이후 추가 변경이 없으면 아무 변화도 없다.",
             "3":"오류가 발생하여 트랜잭션이 강제 종료된다.",
             "4":"가장 마지막 SAVEPOINT로 자동 롤백된다."},
  "answer":2,
  "hint":"COMMIT은 영구 반영 — 이후 ROLLBACK은 새 트랜잭션 시작점부터 취소",
  "explanation":"COMMIT 이후의 ROLLBACK은 COMMIT 이전 데이터를 되돌릴 수 없다. ROLLBACK은 현재 트랜잭션(마지막 COMMIT 이후)의 변경사항만 취소한다. COMMIT 이후 아무 DML도 없었다면 ROLLBACK은 아무 효과가 없다.",
  "tags":["트랜잭션","COMMIT","ROLLBACK","영구반영"],"difficulty":"하","pass_rate":None,"created_at":"2026-06-16","verified":True
},

# ── 인덱스 q199~q203 ──────────────────────────────────────────
{
  "id":"q199","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"인덱스","category":"데이터 모델과 SQL","question_type":"A",
  "context":None,
  "question":"인덱스에 대한 설명으로 올바르지 않은 것은?",
  "options":{"1":"인덱스는 검색 성능을 향상시키기 위한 데이터 구조다.",
             "2":"인덱스가 많을수록 SELECT 성능과 INSERT/UPDATE/DELETE 성능이 모두 향상된다.",
             "3":"기본키(PRIMARY KEY) 컬럼에는 자동으로 인덱스가 생성된다.",
             "4":"인덱스는 WHERE 절에서 자주 사용되는 컬럼에 생성하는 것이 효과적이다."},
  "answer":2,
  "hint":"인덱스는 검색엔 유리하지만 DML 시 인덱스도 함께 갱신해야 한다.",
  "explanation":"인덱스는 SELECT 성능을 향상시키지만, INSERT/UPDATE/DELETE 시에는 인덱스도 함께 갱신해야 하므로 DML 성능이 오히려 저하될 수 있다. 인덱스가 많을수록 DML 성능 저하가 심해진다.",
  "tags":["인덱스","성능","DML","SELECT"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q200","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"인덱스","category":"데이터 모델과 SQL","question_type":"A",
  "context":None,
  "question":"B-Tree 인덱스에 대한 설명으로 올바른 것은?",
  "options":{"1":"범위 검색(BETWEEN, >, <)보다 등호(=) 검색에서만 효율적이다.",
             "2":"카디널리티가 낮은(중복값이 많은) 컬럼에 생성할 때 가장 효과적이다.",
             "3":"등호 검색과 범위 검색 모두에서 효율적이며 카디널리티가 높은 컬럼에 유리하다.",
             "4":"B-Tree 인덱스는 NULL 값도 인덱스 리프 노드에 저장한다."},
  "answer":3,
  "hint":"B-Tree = 가장 일반적인 인덱스. 높은 카디널리티(고유값 많음)에 효과적",
  "explanation":"B-Tree 인덱스는 = 검색과 BETWEEN, >, < 등 범위 검색 모두에서 효율적이다. 카디널리티(고유값 수)가 높을수록 인덱스 효과가 크다. 성별처럼 카디널리티가 낮은 컬럼에는 비트맵 인덱스가 적합하다. Oracle B-Tree 인덱스는 기본적으로 NULL 값을 저장하지 않는다.",
  "tags":["인덱스","B-Tree","카디널리티","범위검색"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q201","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"인덱스","category":"데이터 모델과 SQL","question_type":"A",
  "context":None,
  "question":"인덱스 스캔 방식에 대한 설명으로 올바르지 않은 것은?",
  "options":{"1":"Index Range Scan: 특정 범위의 인덱스를 스캔한다.",
             "2":"Index Full Scan: 인덱스를 처음부터 끝까지 순서대로 스캔한다.",
             "3":"Index Unique Scan: 유일한 값을 검색할 때 사용하며 최대 1건을 반환한다.",
             "4":"Index Skip Scan: 복합 인덱스에서 반드시 선두 컬럼 조건이 있어야만 사용 가능하다."},
  "answer":4,
  "hint":"Skip Scan은 선두 컬럼 조건 없이도 활용할 수 있는 스캔 방식이다.",
  "explanation":"Index Skip Scan은 복합 인덱스에서 선두 컬럼의 조건이 없어도 옵티마이저가 선두 컬럼의 고유 값별로 건너뛰며 스캔하는 방식이다. 선두 컬럼의 카디널리티가 낮을 때 효과적이다.",
  "tags":["인덱스","Skip Scan","스캔방식","복합인덱스"],"difficulty":"상","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q202","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"인덱스","category":"데이터 모델과 SQL","question_type":"A",
  "context":None,
  "question":"일반 B-Tree 인덱스가 아닌 함수 기반 인덱스(Function-Based Index)가 필요한 경우는?",
  "options":{"1":"WHERE col = 'VALUE'",
             "2":"WHERE col BETWEEN 1 AND 100",
             "3":"WHERE UPPER(col) = 'VALUE'",
             "4":"WHERE col IS NOT NULL"},
  "answer":3,
  "hint":"컬럼에 함수를 적용하면 일반 인덱스를 사용할 수 없다.",
  "explanation":"WHERE UPPER(col) = 'VALUE'처럼 컬럼에 함수를 적용하면 일반 B-Tree 인덱스는 사용되지 않는다. 이 경우 UPPER(col)을 대상으로 하는 함수 기반 인덱스(FBI)를 생성해야 인덱스를 활용할 수 있다.",
  "tags":["인덱스","함수기반인덱스","FBI","성능"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
{
  "id":"q203","subject":"SQL 기본 및 활용","main_category":"SQL 활용",
  "sub_category":"인덱스","category":"데이터 모델과 SQL","question_type":"A",
  "context":"CREATE INDEX idx ON T(A, B, C);",
  "question":"위 복합 인덱스를 가장 효율적으로 활용하는 WHERE 절은?",
  "options":{"1":"WHERE B = 1 AND C = 2",
             "2":"WHERE A = 1 AND C = 2",
             "3":"WHERE A = 1 AND B = 2",
             "4":"WHERE C = 2"},
  "answer":3,
  "hint":"복합 인덱스는 선두 컬럼부터 연속으로 사용해야 효과적이다.",
  "explanation":"복합 인덱스 (A, B, C)는 선두 컬럼(A)부터 순서대로 사용할 때 가장 효율적이다. A와 B 모두 조건에 포함된 ③이 가장 효율적이다. A 없이 B, C만 사용하거나, A와 C만 사용하는 경우(B를 건너뜀)는 인덱스 활용도가 떨어진다.",
  "tags":["인덱스","복합인덱스","선두컬럼","효율"],"difficulty":"중","pass_rate":None,"created_at":"2026-06-16","verified":True
},
]

with open(JSONL_PATH, "a", encoding="utf-8") as f:
    for q in questions:
        f.write(json.dumps(q, ensure_ascii=False) + "\n")

total = sum(1 for _ in open(JSONL_PATH))
print(f"총 문제 수: {total}")
print(f"추가된 문제: {len(questions)}개 (q182~q203)")
