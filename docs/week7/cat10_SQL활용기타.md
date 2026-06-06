# 카테고리 10: SQL 활용 기타

> 출처: 2024개정판_SQLD_개념정리.pdf (79~86p)

---

## 1. 계층형 질의(Hierarchical Query) ★★

### 개념
- 계층형 데이터를 조회하기 위해 사용
- 계층형 데이터: 동일 테이블에 계층적으로 상/하위 데이터가 포함됨
- ex) 사원 테이블의 사원들 사이에 "하위 사원"과 "상위 사원(관리자)" 관계
- 엔터티를 순환관계 데이터 모델로 설계할 경우 계층형 데이터가 발생
- ex) 조직, 사원, 메뉴 등
- 하나의 테이블 내 각 행끼리 관계를 가질 때, 연결고리를 통해 행과 행 사이의 계층(depth)을 표현하는 기법
- **PRIOR의 위치에 따라 연결하는 데이터가 달라짐**

### 구문
```sql
SELECT 컬럼
FROM 테이블명
START WITH 시작조건           -- 시작점 지정하는 조건
CONNECT BY [NOCYCLE] PRIOR 연결조건;
-- → 시작점 기준으로 연결 데이터를 찾아가는 조건
```

- **START WITH**: 계층 구조 전개의 시작 위치 지정, 루트노드, 최상위 노드
  - **루트노드는 LEVEL 값으로 1을 가진다.**
- **CONNECT BY PRIOR**: 행을 이어나갈 조건
- **NOCYCLE**: A행 → B행, B행 → A행 같은 순환구조인 데이터는 무한 루프가 발생할 수 있어서 이를 방지하고자 할 때 사용

```sql
-- 부서 테이블에 대해 각 부서의 레벨을 출력
SELECT *, LEVEL
FROM DEPT
START WITH PDEPT IS NULL  -- PDEPT: 상위부서코드
CONNECT BY PRIOR DCODE = PDEPT;
```

### PRIOR 위치에 따른 방향

```
PRIOR 자식 = 부모 → [자식 → 부모] 자식에서 부모데이터로 순방향 전개
PRIOR 부모 = 자식 → [부모 → 자식] 부모에서 자식데이터로 역방향 전개
```

- **정리**: 사장실의 DCODE를 넘겨 다시 각 행들의 PDEPT와 비교해야 하므로 먼저 정해져야 하는 값의 방향에 PRIOR을 전달해야 한다.

### WHERE절 vs CONNECT BY 조건

- **CONNECT BY에 조건 전달**: 계층 구조 전체가 연산된 후 수행되는 게 아니라 연결하려는 행을 찾는 조건에 쓰인 것이다.
  - 그래서 최상위노드인 사장실 데이터도 같이 출력된다.
- **WHERE 절에 조건 전달**: WHERE 절은 START WITH …… CONNECT BY …… 계층형 질의절이 모두 연산된 다음에 수행된다.
  - 따라서 서울지사가 아닌 사장실 데이터가 출력에서 제외되었다.

---

## 2. 계층형 질의 가상 컬럼

| 가상 컬럼 | 설명 |
|-----------|------|
| LEVEL | 검색 항목 데이터의 깊이, 루프노드(최상위 계층): 1 |
| CONNECT_BY_ISLEAF | 리프노드(최하위 계층) 여부 - **해당 데이터가 리프노드라면 1, 아니면 0 반환** |

---

## 3. 계층형 질의 가상 함수

| 가상 함수 | 설명 |
|-----------|------|
| CONNECT_BY_ROOT 컬럼 | 최상위(루프토드) 계층의 컬럼값 표시 |
| SYS_CONNECT_BY_PATH(컬럼, 경로분리자) | 루트 데이터부터 현재 전개할 데이터까지 경로를 표시 |
| ORDER SIBLINGS BY 컬럼 | **형제 노드(동일 LEVEL) 사이에서 정렬 수행** |
| CONNECT_BY_ISCYCLE | 계층형 쿼리의 결과에서 순환이 발생했는가 - 자식 데이터와 조상 데이터가 같으면 1, 아니면 0 반환 |

---

## 4. PIVOT 절과 UNPIVOT 절

### 데이터의 구조

**1) Long Data (Tidy Data) - '통계 분석용'**
- 하나의 속성이 하나의 컬럼으로 정의되어 값들이 여러 행으로 쌓이는 구조
- 동일한 키 값이 여러 번 반복될 수 있음
- RDBMS의 데이터 설계 방식
- 다른 테이블과의 조인 연산이 가능
- 각 행이 관찰 단위를 나타내며, 각 열은 측정 변수 또는 속성을 나타냄

**2) Wide Data (Cross Table) - '단순 보고서 작성이나 데이터 요약용'**
- 행과 컬럼에 유의미한 정보 전달을 목적으로 작성하는 교차표
- 하나의 속성값이 여러 컬럼으로 분리되어 표현
- 데이터가 많아질수록 열의 수가 급격히 늘어나니 분석을 위해선 비효율
- 다른 테이블과의 조인 연산 불가능

### 데이터 구조 변경
- **PIVOT**: Long Data → Wide Data **'행 데이터를 열 데이터로'**
- **UNPIVOT**: Wide Data → Long Data **'열 데이터를 행 데이터로'**

### PIVOT 구문

```sql
SELECT *
FROM (
    SELECT E.JOB, D.DNAME
    FROM EMP E
    JOIN DEPT D
    ON E.DEPTNO = D.DEPTNO
)
PIVOT (
    COUNT(*) FOR DNAME IN (
        'ACCOUNTING' AS ACCOUNTING,
        'RESEARCH' AS RESEARCH,
        'SALES' AS SALES
    )
);
```

### UNPIVOT 구문

```sql
SELECT JOB, DEPARTMENT, EMP_COUNT
FROM PIVOT_TABLE
UNPIVOT (
    EMP_COUNT FOR DEPARTMENT IN (
        ACCOUNTING AS 'ACCOUNTING',
        RESEARCH AS 'RESEARCH',
        SALES AS 'SALES')
);
```

---

## 5. 정규 표현식

### 개념
- 문자열의 공통된 규칙을 보다 일반화하여 표현하는 방법 (공통적으로 가지고 있는 패턴을 표현하는 방법)
- 정규 표현식 사용 가능한 문자함수 제공 (오라클: regexp_replace, regexp_substr, regexp_instr, …)
- 특정 패턴을 가진 문자열을 검색, 매칭, 또는 수정할 때 사용하는 매우 강력한 도구
- 텍스트 데이터 안에서 특정 규칙을 정의해, 이를 만족하는 문자열을 찾아내는 데 유용

### 정규 표현식의 종류

**기본 연산자:**
| 연산자 | 영문 | 설명 |
|--------|------|------|
| . | dot | 모든 한 글자 (제외: newline) |
| \| | or | 대체 문자를 구분 |
| \ | backslash | 다음 문자를 일반 문자로 취급 |

**앵커:**
| 앵커 | 설명 |
|------|------|
| ^ | 시작되는 글자 |
| $ | 마지막 글자 |

**수량사:**
| 연산자 | 설명 |
|--------|------|
| ? | 0회 또는 1회 일치 |
| * | 0회 이상 일치 |
| + | 1회 이상 일치 |
| {m} | m회 일치 |
| {m,} | 최소 m회 일치 |
| {,m} | 최대 m회 일치 |
| {m,n} | 최소 m회 일치, 최대 n회 일치 |

**문자 리스트:**
| 연산자 | 설명 |
|--------|------|
| [char…] | 문자 리스트 중 한 문자와 일치 |
| [^char…] | 문자 리스트에 포함되지 않은 한 문자와 일치 |

**POSIX 클래스:**
| 연산자 | 설명 | 동일 |
|--------|------|------|
| [:digit:] | 숫자 | [0-9] |
| [:lower:] | 소문자 | [a-z] |
| [:upper:] | 대문자 | [A-Z] |
| [:alpha:] | 영문자 | [a-zA-Z] |
| [:alnum:] | 영문자와 숫자 | [0-9a-zA-Z] |
| \d | 숫자 | [[:digit:]] |
| \D | 숫자가 아닌 모든 문자 | [^[:digit:]] |
| \w | 숫자와 영문자(underbar 포함) | [[:alnum:]_] |
| \W | 숫자와 영문자(underbar 포함)가 아닌 문자 | [^[:alnum:]_] |
| \s | 공백 문자 | [[:space:]] |
| \S | 공백이 아닌 문자 | [^[:space:]] |

### 정규 표현식 함수 ★★

#### ① REGEXP_LIKE 조건
: source_char가 패턴과 일치하면 true, 일치하지 않으면 false를 반환

```sql
REGEXP_LIKE(source_char, pattern [, match_param])
```
- source_char: 검색 문자열
- pattern: 검색 패턴
- match_param: 일치 옵션 (기본값: c)
  - i: 대소문자 무시
  - c: 대소문자 구분
  - n: dot(.)를 개행(줄바꿈) 문자와 일치
  - m: 다중 행 모드 (앵커(^,$)에 영향)
  - x: 검색 패턴의 공백 문자를 무시

#### ② REGEXP_REPLACE 함수
: source_char에서 일치한 패턴을 replace_string으로 변경한 문자 값을 반환

```sql
REGEXP_REPLACE(source_char, pattern[, replace_string[, position [, occurrence [, match_param]]]])
```
- source_char: 검색 문자열
- pattern: 검색 패턴
- replace_string: 변경 문자열
- position: 검색 시작 위치 (기본값: 1)
- occurrence: 패턴 일치 횟수 (기본값: 1)
- match_param: 일치 옵션

#### ③ REGEXP_SUBSTR 함수
: source_char에서 일치한 pattern을 반환

```sql
REGEXP_SUBSTR(source_char, pattern, [, position[, occurrence [, match_param [, subexpr]]]])
```

#### ④ REGEXP_INSTR 함수
: source_char에서 일치한 pattern의 시작 위치를 정수로 반환

```sql
REGEXP_INSTR(source_char, pattern [, position [, occurrence [, return_opt [, match_param [, subexpr]]]]])
```
- return_opt: 반환 옵션 (0은 시작위치, 1은 다음위치, 기본값은 0)
- subexpr: 서브표현식 (0은 전체패턴, 1이상은 서브 표현식, 기본값은 0)

#### ⑤ REGEXP_COUNT 함수
: source_char에서 일치한 pattern의 횟수를 반환

```sql
REGEXP_COUNT(source_char, pattern [, position [, match_param]])
```
