# 카테고리 9: 윈도우 함수

> 출처: 2024개정판_SQLD_개념정리.pdf (66~74p)

---

## 1. 윈도우 함수란?

- 집계 함수는 보통 그룹별로 집계된 결과를 반환할 때, 원본 데이터의 개별 행 정보는 포함되지 않는다. (각 그룹별 한 행씩 요약해서 출력하는 형태)
- **윈도우 함수는 조인이나 서브쿼리를 쓰지 않고 행과 행간을 비교, 연산하는 것을 가능하게 해준다.**
- **그룹별 하나의 결과를 반환하는 집계함수와 다르게 데이터의 각 행을 그대로 유지하면서 그룹 내 연산을 수행할 수 있게 해준다.**
- **GROUP BY 없이 그룹 연산을 가능하게 해준다.**

---

## 2. 윈도우 함수 구문

```sql
SELECT [컬럼],
       윈도우함수([컬럼]) OVER ([PARTITION BY 컬럼]
                               [ORDER BY 컬럼 ASC|DESC]
                               [ROWS|RANGE BETWEEN A AND B]) AS result
FROM 데이블명;
```

- **윈도우 함수**: 집계 함수나 순위 함수 등
- **PARTITION BY 절**: 그룹연산을 수행할 특정 그룹 (=GROUP BY 컬럼)
- **ORDER BY 절**:
  - 순위함수의 경우 필수 (정렬컬럼과 순서에 따라 순위가 변하니까)
  - 집계함수는 누적값 출력 시 사용
- **ROWS | RANGE BETWEEN A AND B절** (SQL Server는 지원X): 연산 범위 설정
  - ORDER BY 절 필수

> ※ PARTITION BY, ORDER BY, ROWS | … 순서 그대로 전달해야 오류X

---

## 3. 일반 집계 함수 with 윈도우 함수

집계함수결과와 각 컬럼별 행 정보는 동시 출력 불가:
```sql
-- 오류! 집계함수결과와 각 컬럼별 행 정보는 동시 출력 불가
SELECT EMPNO, ENAME, SAL, SUM(SAL) AS TOTAL FROM EMP;

-- 해결법1. 서브쿼리
SELECT EMPNO, ENAME, SAL,
       (SELECT SUM(SAL) FROM EMP) AS TOTAL
FROM EMP;

-- 해결법2. 윈도우함수
SELECT EMPNO, ENAME, SAL,
       SUM(SAL) OVER() AS TOTAL
FROM EMP;
```

**SUM, AVG, MIN, MAX, COUNT 예시:**
```sql
-- 출판사별 책들의 가격 관련 집계함수 결과를 구해보자
SELECT book_name, writer, publisher, price,
       집계함수(price) OVER (PARTITION BY publisher ORDER BY price) AS 컬럼별칭
FROM BOOKSHELF;
```

- **ORDER BY를 명시하지 않을 경우엔 합이 누적으로 계산되지 않음** (SUM, AVG, COUNT)
- **MIN(), MAX()의 경우 ORDER BY 영향 X**

---

## 4. 윈도우 함수의 연산 범위

집계 연산 시 행의 범위 설정 가능!

### ROWS, RANGE
1. **ROWS**: 값이 같더라도 각 행씩 연산
2. **RANGE**: 값이 같으면 하나의 RANGE로 묶어서 동시 연산 (DEFAULT)

### BETWEEN A AND B
**A: 시작점 정의**
- `CURRENT ROW`: 현재행부터
- `UNBOUNDED PRECEDING`: 처음부터 (DEFAULT)
- `N PRECEDING`: N 이전부터

**B: 마지막 시점 정의**
- `CURRENT ROW`: 현재까지 (DEFAULT)
- `UNBOUNDED FOLLOWING`: 마지막까지
- `N FOLLOWING`: N 이후까지

### ROWS vs RANGE 차이
1. **RANGE**: 값이 같으면 같은 범위로 취급하여 동시 연산
   ```sql
   SELECT EMPNO, ENAME, SAL,
          SUM(SAL) OVER(ORDER BY SAL) AS TOTAL_SAL
   FROM EMP;
   -- SAL이 같은 WARD(1250), MARTIN(1250)은 같은 값이니 함께 연산됨
   ```
2. **ROWS**: 각 행 별로 연산
   ```sql
   SELECT EMPNO, ENAME, SAL,
          SUM(SAL) OVER(ORDER BY SAL ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS TOTAL_SAL
   FROM EMP;
   -- WARD와 MARTIN이 같은 SAL 값이지만 각 행별로 계산
   ```

---

## 5. 순위 함수 ★★

### ① ROW_NUMBER()
- 1위부터 순차적으로 순위 부여
- 동일한 값이어도 서로 다른 순위 부여 (중복 없음)

### ② RANK()
- 동일한 값에 같은 순위 부여, **그 다음 순위는 건너뜀**
- ex) 공동 3위가 2명이면 다음 순위는 5위

### ③ DENSE_RANK()
- 동일한 값에 같은 순위 부여, **그 다음 순위 건너뜀X**
- ex) 공동 3위가 2명이어도 다음 순위는 4위

```sql
SELECT 이름, 부서, 급여,
       ROW_NUMBER() OVER(PARTITION BY 부서 ORDER BY 급여 desc) AS row_no,
       RANK() OVER(PARTITION BY 부서 ORDER BY 급여 desc) AS rank_no,
       DENSE_RANK() OVER(PARTITION BY 부서 ORDER BY 급여 desc) AS dense_rank_no
FROM EMPLOYEES;
```

- PARTITION 절을 명시하지 않는다면 전체 데이터에 대한 순위 연산

### 특정 값에 대한 순위 알고 싶을 때
```sql
SELECT RANK(값) WITHIN GROUP(ORDER BY 컬럼);
```
- 여기서 RANK()는 윈도우 함수가 아닌 **일반함수**
- 특정값에 대한 순위를 반환한다.
- 정렬 기준에 따라 순위가 바뀌니 정렬 컬럼 명시 필수

---

## 6. 행 순서 관련 함수

### ① LAG와 LEAD (SQL Server는 지원X)
- **LAG**: 이전 행의 값 가져오기
- **LEAD**: 이후 행의 값 가져오기
- ORDER BY 절 필수

```sql
SELECT LAG / LEAD(컬럼,         -- 가져올 값의 컬럼
                  [N]            -- 몇 번째 값을 가져올지(DEFAULT: 1)
                  OVER([PARTITION BY 컬럼]   -- 행의 이동 그룹
                  ORDER BY 컬럼 [ASC|DESC]); -- 정렬컬럼
```

```sql
SELECT ENAME, HIREDATE, SAL,
       LAG(SAL) OVER(ORDER BY HIREDATE) AS 바로직전상사급여
FROM EMP;
```

- 그룹별 바로 직전상사의 급여를 가져오는 쿼리였다면 각 그룹별 첫 시작행은 NULL
- NULL 값을 없애고 싶다면 `LAG(SAL, N, NULL 대체값)`에서 3번째 인수로 대체값을 써주면 됨

### ② FIRST_VALUE, LAST_VALUE (SQL Server는 지원X)
- **정해진 범위에서 정렬 순서대로 처음 값, 마지막 값 출력**
- 순서와 범위 정의에 따라 최솟값 / 최댓값 반환 가능
- PARTITION BY, ORDER BY 절 생략 가능

```sql
SELECT ENAME, DEPTNO, SAL,
       FIRST_VALUE(SAL) OVER(PARTITION BY DEPTNO ORDER BY SAL) AS MIN,
       FIRST_VALUE(SAL) OVER(PARTITION BY DEPTNO ORDER BY SAL DESC) AS MAX
FROM EMP;
```

**LAST_VALUE 주의:**
- LAST_VALUE()는 마지막 값을 가져오는 함수. 윈도우 함수의 연산 범위 default값이 첫 행부터 현재 행이니 현재 행이 마지막이 됨
- MAX의 경우 오름차순으로 정렬했을 때 현재 행부터 마지막 행까지에서 마지막 값을 가져오는 것으로 구할 수 있다.
- MIN은 LAST_VALUE()시 마지막 값을 가져오게 되므로 정렬을 내림차순으로 해 마지막 값을 가장 작게 만들어 구하면 됨

---

## 7. NTILE(N) (SQL Server는 지원X)

- **행을 특정 컬럼 순서에 따라 정해진 수(N)만큼의 그룹으로 나누기 위한 함수**
- ORDER BY 필수
- 그룹별 번호가 반환됨
- PARTITION BY를 통해 특정 그룹을 원하는 수의 그룹만큼 분리 가능
- 총 행의 수가 나눠 떨어지지 않으면, 앞 그룹의 크기가 더 크게 분리됨 (ex. 14명을 3 그룹으로 분리 → 그룹별로 5, 5, 4씩 나눠짐)

```sql
SELECT NTILE(N) OVER([PARTITION BY 컬럼] ORDER BY 컬럼 ASC|DESC)
FROM 테이블명;
```

---

## 8. 비율 관련 함수 (SQL Server는 지원X) ★★

### ① RATIO_TO_REPORT

- **파티션 내 전체 SUM(컬럼)값에 한 행별 컬럼 값의 비율**
- 각 컬럼값(결괏값): 0 < 결과 <= 1
- (PARTITION BY 명시하지 않는다면 데이터 전체 총계에서의 해당 컬럼 값의 비율)
- ORDER BY 사용 불가

```sql
SELECT 컬럼,
       RATIO_TO_REPORT(컬럼) OVER([PARTITION BY컬럼])
FROM 테이블명;
```

### ② PERCENT_RANK

- 파티션별 윈도우에서 제일 먼저 나오는 것을 0(상위0%), 제일 늦게 나오는 것을 1로 하여, **값이 아닌 행의 순서별 백분율을 구한다.**
- 즉 PERCENTILE(분수위)를 출력한다는 것
- 0 <= 결과 값 <= 1
- ORDER BY 필수
- 계산: **(순위 - 1) / (총 행 개수 - 1)**

```sql
SELECT 컬럼,
       PERCENT_RANK() OVER([PARTITION BY 컬럼] ORDER BY 컬럼 ASC|DESC)
FROM 테이블명;
```

### ③ CUME_DIST - '각 행의 수에 대한 누적비율'

- **파티션별 윈도우의 전체건수에서 현재 행보다 작거나 같은 건수에 대한 누적백분율을 구함**
- ORDER BY 필수
- ORDER BY를 통해 누적비율을 구하는 순서 정할 수 있음
- 0 < 결과 값 <= 1
- ex) 한 파티션의 행이 3개면 첫 번째 행은 1/3 = 0.33
- 디폴트 범위가 RANGE라 같은 값을 가진 행을 같이 연산한다는 것을 잊지 말자. 다르게 연산하길 원한다면 rows로 바꾸거나 ORDER BY에 컬럼을 하나 더 추가해서 다르게 취급하게 하면 된다.

```sql
SELECT DEPTNO, ENAME, SAL,
       CUME_DIST() OVER (PARTITION BY DEPTNO ORDER BY SAL DESC) as PR
FROM EMP;
```
