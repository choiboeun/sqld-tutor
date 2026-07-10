# 카테고리 7: 서브쿼리 & Top N

> 출처: 2024개정판_SQLD_개념정리.pdf (51~58p, 75~78p)

---

## 1. 서브쿼리란?

- 하나의 SQL문에 포함되어 있는 또 다른 SQL문
- 서브쿼리는 메인쿼리를 보조하는 하위 쿼리다.
- 서브쿼리는 다양한 위치에서 사용될 수 있다.

### 서브쿼리 사용 시 주의 사항
1. **괄호로 감싸서 사용**
2. 단일행 또는 복수행 비교 연산자와 함께 사용 가능
   - 단일행 비교 연산자는 서브쿼리의 결과가 반드시 1건 이하여야 하며
   - 복수행 비교 연산자는 서브쿼리의 결과 건수와 상관없음
3. **서브쿼리엔 ORDER BY 사용 불가. (ORDER BY 절에서 사용은 가능)**
   - ORDER BY 절은 SELECT 절에서 오직 한 개만 올 수 있음.
   - ORDER BY는 메인쿼리의 마지막 문장에 위치해야 함
   - 예외: TOP-N 분석

### 서브쿼리가 위치할 수 있는 곳
- SELECT, FROM, WHERE, HAVING, ORDER BY 절 **[GROUP BY 불가]**
- 기타 DML: INSERT 문의 VALUES 절, UPDATE 문의 SET 절

---

## 2. 동작 방식에 따른 서브쿼리 분류

| 종류 | 설명 |
|------|------|
| 연관 서브쿼리 (Correlated Subquery) | 서브쿼리가 메인쿼리의 컬럼을 가짐 |
| 비연관 서브쿼리 (Un-Correlated Subquery) | 서브쿼리가 메인쿼리의 컬럼을 가지지 않음 |

- **연관 서브쿼리**: 일반적으로 메인쿼리가 먼저 수행되어 읽은 데이터를 서브쿼리에서 조건이 맞는지 확인할 때 사용
- **비연관 서브쿼리**: 메인쿼리에 서브쿼리가 실행된 결괏값을 제공하기 위한 목적으로 주로 사용

> ※ 즉, 메인쿼리의 결과가 서브쿼리로 제공될 수도 있고, 서브쿼리의 결과가 메인쿼리로 제공될 수 있음 → 실행 순서는 상황에 따라 다르다는 것

---

## 3. 반환되는 데이터 형태에 따른 서브쿼리 분류

### 단행 서브쿼리 (Single Row Subquery)
- 서브쿼리의 실행 결과가 항상 1건 이하
- 단일행 비교 연산자와 함께 사용 (=, <, <=, >, >=, <>)
- 다중행 비교 연산자도 사용 가능

```sql
-- 평균 봉급보다 높은 봉급을 가진 직원의 사번, 이름, 봉급 출력
SELECT EMPNO, ENAME, SAL
FROM EMP
WHERE SAL > (SELECT AVG(SAL) FROM EMP);
```

### 다중행 서브쿼리 (Multi Row Subquery)
- 서브쿼리의 실행 결과로 여러 행이 반환

**다중행 비교 연산자:**
| 연산자 | 설명 |
|--------|------|
| IN | 결과에 값이 포함되는지 확인 |
| ANY | 결과 중 하나라도 조건을 만족하는지 |
| ALL | 모든 값이 조건을 만족하는지 |
| EXISTS | 결과가 존재하는지 여부를 확인 |

**ANY/ALL 정리:**
| 연산자 | 설명 | 비교 |
|--------|------|------|
| > ANY | 최솟값 반환 | > ANY(10, 200): 최솟값(10)보다 큰 행들 반환 |
| < ANY | 최댓값 반환 | < ANY(10, 200): 최댓값(200)보다 작은 행들 반환 |
| > ALL | 최댓값 반환 | > ALL(10, 200): 최댓값(200)보다 큰 행들 반환 |
| < ALL | 최솟값 반환 | < ALL(10, 200): 최솟값(10)보다 작은 행들 반환 |

- **단일행 비교 연산자 사용 불가**

### 다중컬럼 서브쿼리 (Multi Column Subquery) - SQL Server 지원 X
- 서브쿼리의 실행 결과로 여러 개의 컬럼이 반환
- 메인쿼리의 비교 컬럼이 2개 이상인 경우
- 대소 비교 전달 불가 (두 값을 동시에 묶어서 대소비교할 수 없으니)

```sql
-- 부서별 최대 급여자들의 정보 출력
SELECT EMPNO, ENAME, SAL, DEPTNO
FROM EMP
WHERE (DEPTNO, SAL) IN (SELECT DEPTNO, MAX(SAL) FROM EMP GROUP BY DEPTNO);
```

---

## 4. 위치에 따른 서브쿼리 분류

| 종류 | 설명 |
|------|------|
| 스칼라 서브쿼리 (Scalar Subquery) | 단일 행·단일 열(하나의 값)을 반환하며, SELECT·WHERE·HAVING·ORDER BY 절 등 값이 오는 자리 어디에나 사용 가능 |
| 인라인 뷰 (Inline View) | FROM 절에 위치하며 하나의 테이블처럼 사용된다. 뷰(View)처럼, 쿼리 내에서 일시적으로 생성된 결과를 테이블처럼 사용할 수 있게 해준다. 즉, 쿼리를 실행할 때만 존재하며 데이터베이스에 저장되지 않는다. |
| 중첩 서브쿼리 (Nested Subquery) | WHERE 절이나 HAVING 절과 같은 조건절에서 쓰이는 서브쿼리 |

### 스칼라 서브쿼리 (Scalar Subquery)
- 단일 행, 단일 열(하나의 값)을 반환하는 서브쿼리
- SELECT 절에서 가장 많이 사용하지만 WHERE, HAVING, ORDER BY 절 등 값이 오는 자리 어디에나 사용 가능
- 서브쿼리가 단일행, 단일열을 반환
- **서브쿼리의 결과를 하나의 열처럼 사용**하기 위해 사용
- **메인 쿼리의 각 행에 대해 하나의 단일값(예술가 이름)을 반환**했다.
- 스칼라 서브쿼리는 OUTER JOIN 연산을 사용한 결과와 같다.
- 매칭되는 데이터가 없는 경우 해당 컬럼에 대한 값은 NULL로 표현된다. (생략되는 게 아님)!!!

### 인라인 뷰 (Inline View) = 동적 뷰(Dynamic View)
- 서브쿼리를 FROM 절에 작성하여 일시적인 테이블처럼 사용하는 것
- 서브쿼리로 원하는 내용만 추출해서 새로운 테이블을 만드는 개념
- 다른 테이블과 조인 시 **반드시 테이블 별칭을 명시**해야 함
- **FROM 절에 정의를 하니 중첩 서브쿼리와 다르게 서브쿼리의 결과를 메인 쿼리의 어느 절에서도 사용할 수 있음**
- 인라인뷰의 결과와 메인쿼리 테이블과 조인할 목적으로 주로 사용
- 모든 연산자 사용 가능
- 데이터베이스에 해당 정보를 저장하지 않음 – '일회성'임
- **인라인뷰에서 집계함수를 사용하고 해당 결괏값을 메인쿼리의 조건절인 WHERE 절에 사용해야 한다면 별칭을 무조건 정해주어야 한다.** (WHERE 절에는 집계함수를 사용할 수 없으니까)

**스칼라 서브쿼리 vs 인라인 뷰 차이:**
- 스칼라 서브쿼리는 단일 값을 반환해야 하므로 하나의 컬럼만 선택할 수 있으며, 메인쿼리의 각 행마다 독립적으로 실행된다.
- 인라인 뷰는 테이블 형태의 결과를 반환해야 하므로 메인 쿼리에서 필요한 컬럼들이 서브쿼리 안에 포함되어야 한다.

### 중첩 서브쿼리 (Nested Subquery)
- WHERE 절이나 HAVING 절과 같은 조건절에서 사용되는 서브쿼리로,
- 메인쿼리의 데이터를 필터링하거나 비교할 때 사용
- 반환 데이터의 형태가 여러 가지 (단일, 다중, 다중컬럼, 연관/비연관)

---

## 5. EXISTS와 NOT EXISTS

### EXISTS와 서브쿼리
- WHERE문에 EXISTS는 서브쿼리 테이블의 결과물과 겹치는 데이터만 메인쿼리에 출력

### NOT EXISTS와 서브쿼리
- WHERE문에 NOT EXISTS는 서브쿼리 테이블의 결과물을 제외한 나머지를 메인쿼리에 출력
- 메인쿼리에서 서브쿼리의 결과물이랑 겹치는 애들은 제외 (차집합)

---

## 6. 상호연관 서브쿼리 (반환종류: 상호연관 서브쿼리)

- 메인쿼리와 서브쿼리의 비교 수행
- 서브쿼리 내에 메인쿼리의 컬럼이 사용됨
- 비교할 집단이나 조건은 서브쿼리에 명시 (메인쿼리절엔 서브쿼리 컬럼이 정의되어 있지 않으니 오류 발생)

**상호 연관 서브쿼리의 연산 순서:**
1. 메인쿼리의 테이블 READ
2. 메인쿼리의 WHERE 절 확인
3. 서브쿼리 테이블 READ
4. 서브쿼리 WHERE 절 확인
5. E1.DEPTNO와 서브쿼리의 DEPTNO와 비교
6. 위 조건에 성립하는 행들의 그룹연산 결과 확인 (AVG(SAL))
7. 해당 결과를 메인쿼리에 전달해 해당 조건을 만족하는 행만 추출

> ※ 상호연관 서브쿼리 사용 시 GROUP BY 생략 가능

---

## 7. HAVING절에서 서브쿼리

- 그룹함수와 함께 사용될 때, 그룹핑된 결과에 대해 부가 조건을 걸기 위해 사용

---

## 8. UPDATE문의 SET절에서 서브쿼리

- 서브쿼리를 사용한 변경 작업을 할 때, **서브쿼리 결과가 NULL을 반환하면 해당 컬럼 결과가 NULL이 될 수 있기 때문에 주의**

---

## 9. TOP N 쿼리

- 페이징 처리를 효과적으로 수행하기 위해 사용
- **전체 결과에서 데이터의 상위 N개 행을 추출**
- ex) 성적 상위자 3명

### ① ROWNUM (Oracle)

- 출력된 데이터를 기준으로 행 번호가 부여
- 따라서 ORDER BY나 WHERE절로 데이터를 제한할 경우, 또 다른 순서가 그 때 그때 부여됨
- **절대적인 행 번호가 아닌 가상의 번호라 특정 행을 지정할 수 없음**
- ROWNUM은 쿼리 결과에 순차적인 번호를 할당하며, WHERE 절에서 이를 제한할 수 있음
- **첫번째 행이 증가한 이후 할당되므로 '>' 연산 사용 불가**
  - `WHERE ROWNUM > 1`: 오류는 안 뜨나 아무 행도 반환하지 않음
  - 원인: 쿼리가 FROM 절에서 데이터를 읽어오면 (아직 ROWNUM 부여X), 그 후 ROWNUM은 각 행이 하나씩 조회될 때마다 부여된다. 첫 번째 행이 조회될 때 ROWNUM=1이 되는데, ROWNUM > 1 조건을 만족하지 않으므로 제외된다. 그 다음 행(두번째 행)이 또 ROWNUM=1로 시작해서 다시 ROWNUM > 1 조건을 만족하지 않는다. 결국 모든 행이 조건을 통과하지 못하게 되어 아무 결과도 반환 안함.
  - **ROWNUM은 각 행을 하나씩 읽어오면서 부여되기 때문에 WHERE절에서 ROWNUM에 대한 조건을 걸 때 ROWNUM = 1 값이 무조건 포함이 되어야만 한다.**
  - **ROWNUM >= 1은 전체 데이터를 반환하는 것과 동일한 결과를 준다.**
  - **`ROWNUM = N (N > 1)`: '=' 연산자 단독 사용 불가** (`ROWNUM = 1`은 유효하며 첫 번째 행 한 개만 반환)

**올바른 사용법 (상위 3명 조회):**
```sql
SELECT ENAME, SAL
FROM (SELECT ENAME, SAL FROM EMP ORDER BY SAL DESC)
WHERE ROWNUM <= 3;
```
- 서브쿼리를 사용하여(인라인 뷰) 미리 내림차순으로 정렬을 해둔다.
- 즉 행별 ROWNUM이 결정되기 전에 미리 데이터 정렬을 해 둔 다음에 ROWNUM을 적용시키는 것이다.

**상위 n ~ m까지의 행을 뽑고 싶다면 (인라인뷰 2겹):**
```sql
SELECT ENAME, SAL
FROM (SELECT ROWNUM AS RN, A.*
      FROM (SELECT ENAME, SAL FROM EMP ORDER BY SAL DESC) A) B
WHERE RN BETWEEN 4 AND 6
ORDER BY SAL DESC;
```
- 인라인 뷰 결과에 ROWNUM을 미리 부여함으로써 해결

### ② RANK 이용한 TOP N

```sql
-- RANK를 이용해 원하는 순위 급여자 뽑기
SELECT ENAME, SAL
FROM (SELECT ENAME, SAL, RANK() OVER(ORDER BY SAL DESC) AS RN FROM EMP) A
WHERE RN BETWEEN 4 AND 6
ORDER BY SAL DESC;
```

### ③ FETCH (Oracle 12c 이상, SQL Server 사용 가능)

- 출력될 행의 수를 제한하는 절
- ORDER BY 절 뒤에 사용 (내부 파싱 순서도 ORDER BY 뒤)

```sql
SELECT
FROM WHERE
GROUP BY HAVING
ORDER BY
OFFSET N { ROW | ROWS }
FETCH { FIRST | NEXT } N { ROW | ROWS } ONLY
```

- **OFFSET N { ROW | ROWS }**: 결과 집합에서 처음 N개의 행을 건너뛰고 그 다음 행부터 반환을 시작 (N: 건너뛸 행의 수, ROW/ROWS: 행의 수에 다른 구분 - 한 행[단수]/여러 행[복수], 구분하지 않아도 된다)
- **FETCH { FIRST | NEXT } N { ROW | ROWS } ONLY**: OFFSET 절에 의해 건너뛴 행들 이후에 가져올 행의 개수를 지정
  - FIRST: OFFSET 사용하지 않았을 때, 처음부터 N 행 출력하라는 뜻
  - NEXT: OFFSET 사용했을 경우 OFFSET에서 제외한 행 다음부터 N행을 출력하라는 뜻
  - ONLY: 결과 제한을 의미하며 필수로 포함되어야 함
  - **FETCH FIRST, FETCH NEXT는 결과 동일함.**

```sql
-- 급여자 top 5
SELECT EMPNO, ENAME, JOB, SAL
FROM EMP
ORDER BY SAL DESC
FETCH FIRST 5 ROWS ONLY;

-- 급여자 top 4,5,6 정보 출력
SELECT EMPNO, ENAME, JOB, SAL
FROM EMP
ORDER BY SAL DESC
OFFSET 3 ROW
FETCH FIRST 3 ROW ONLY;
```

### ④ TOP N (SQL Server)

- SQL Server에서 상위 N개의 행 추출하는 문법
- 서브쿼리 사용 없이 하나의 쿼리로 정렬된 순서대로 상위 N개의 데이터를 추출 가능
- **WITH TIES를 사용해 동순위까지 함께 출력이 가능함**

```sql
SELECT TOP N 컬럼1, 컬럼2, ...
FROM 테이블명
ORDER BY 정렬컬럼명 ASC|DESC;

-- TOP 2 급여자 (동순위도 출력)
SELECT TOP 2 WITH TIES ENAME, SAL
FROM EMP
ORDER BY SAL DESC;
```
