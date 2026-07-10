# 카테고리 8: 집합 연산자 & 그룹 함수

> 출처: 2024개정판_SQLD_개념정리.pdf (58~65p)

---

## 1. 집합 연산자 (Set Operator)

- SELECT 문 결과를 하나의 집합으로 간주, 그 집합에 대한 합집합, 교집합, 차집합의 연산
- **두 집합의 각 컬럼의 순서와 데이터 타입이 상호 호환 가능해야**
- **전체 집합의 컬럼명과 데이터 타입은 첫 번째 집합에 의해 결정됨**
- 두 집합 사이에 집합 연산자 정의
- 두 개이상의 테이블에서 JOIN을 사용하지 않고, 연관된 데이터를 조회하는 방법

### 집합 연산자 사용 시 주의 사항
1. 두 집합의 컬럼 수가 일치해야
2. 두 집합의 컬럼 순서도 일치해야 (오류가 발생하지는 않음, 근데 의미X)
3. 두 집합의 각 컬럼의 데이터 타입이 상호 호환 가능해야
4. 각 컬럼의 사이즈는 달라도 됨
5. **개별 SELECT 문에 ORDER BY 불가 (GROUP BY는 가능)**
   - 아래 집합의 ORDER BY는 집합 연산자 전체 결과에 대한 ORDER BY로 적용됨

**1:1 관계 테이블 특성:**
- 1:1의 테이블관계라면 EXCEPT 결과는 항상 공집합이다.
- 1:1의 테이블관계라면 INTERSECT와 JOIN 연산의 결과는 같다. (JOIN은 중복 포함 가능하지만 1:1이면 동일)
- 1:1의 테이블관계라면 INTERSECT와 UNION의 결과는 같다.
- 1:1의 테이블관계라면 UNION ALL 수행 시 결과는 한 테이블의 전체건수에 2배가 된다. (UNION 수행 시 결과 건수는 같음)

---

## 2. 합집합 (UNION / UNION ALL)

### UNION
- 두 집합의 합집합 / UNION, UNION ALL로 표현
- **중복된 데이터는 한 번만 출력**
- 중복된 데이터를 제거하기 위해 내부적으로 정렬 수행
- 따라서 추가적인 연산을 하지 않게 하기 위해, 중복된 데이터가 없을 경우엔 UNION ALL을 사용하는 게 좋음

```sql
SELECT 배역명, 본명 FROM sweethome1
UNION
SELECT 배역명, 본명 FROM sweethome2;
-- 스윗홈 시즌1, 2 출연 배우 모두 조회 (중복은 한 번만)
```

### UNION ALL
- **중복된 데이터를 제거하지 않고 모든 행 반환**

```sql
SELECT 배역명, 본명 FROM sweethome1
UNION ALL
SELECT 배역명, 본명 FROM sweethome2;
-- 스윗홈 시즌1, 2 출연 배우 모두 조회 (중복 괜찮음)
```

---

## 3. 교집합 (INTERSECT) - '중복 제거임!'

- 두 집합의 공통으로 있는 행 출력

```sql
SELECT 배역명, 본명 FROM sweethome1
INTERSECT
SELECT 배역명, 본명 FROM sweethome2;
-- 스윗홈 시즌1,2에 모두 출연한 배우 조회
```

---

## 4. 차집합 (ORACLE: MINUS) / EXCEPT

- 두 집합 중 한 쪽 집합에만 존재하는 행 출력
- **(A - B)와 (B - A)는 다르니 집합의 순서에 주의**하자

```sql
SELECT 배역명, 본명 FROM sweethome1
MINUS
SELECT 배역명, 본명 FROM sweethome2;
-- 시즌 1에는 출연했으나 시즌 2에는 출연하지 않은 배우 조회
```

---

## 5. 그룹 함수

ANSI/ISO SQL 표준 데이터 분석을 위한 세 가지의 함수:
- **AGGREGATE FUNCTION**: 집계 함수
- **GROUP FUNCTION**: 그룹 함수
- **WINDOW FUNCTION**: 윈도우 함수

---

## 6. 집계 함수 정리 - 'NULL값 무시!'

| 함수 | 설명 |
|------|------|
| COUNT(*) | NULL 값 포함 전체 행의 수 (모든 데이터타입 사용 가능) |
| COUNT(칼럼) | NULL을 제외한 행의 수 |
| SUM(칼럼) | 총 합 출력, 숫자 컬럼만 사용 가능 |
| AVG(칼럼) | 평균 출력, 숫자 컬럼만 사용 가능. **NULL을 제외한 대상의 평균을 반환** |
| MIN(칼럼) | 최솟값 출력 (날짜, 숫자, 문자 컬럼 모두 사용 가능) |
| MAX(칼럼) | 최댓값 출력 (날짜, 숫자, 문자 컬럼 모두 사용 가능) |
| VARIANCE(칼럼) | 분산 반환 |
| STDDEV(칼럼) | 표준편차 (분산의 루트값) |

> **AVG 주의**: `AVG(SAL)` vs `SUM(SAL) / COUNT(EMPNO)` vs `AVG(NVL(SAL, 0))`
> - 전체 10명, 그 중 NULL값을 5명이 가졌다면 AVG()는 5명에 대한 평균을 계산하게 됨
> - 전체에 대한 평균을 구하고 싶다면 `SUM()/COUNT(NOT NULL 컬럼)`이나 `NVL(SAL, 0)`로 NULL값을 0으로 바꾼 후 구하면 됨

---

## 7. 그룹 함수 ★★★

별도의 그룹함수를 GROUP BY 절에 적지 않을 경우 소계나 총 합계가 따로 생성되지는 않는다.

```sql
-- 부서별 업무별 사원수와 급여 합 조회
SELECT DNAME, JOB, COUNT(*) "Total Empl", SUM(SAL) "Total Sal"
FROM EMP, DEPT
WHERE DEPT.DEPTNO = EMP.DEPTNO
GROUP BY DNAME, JOB;
```

---

## 8. ROLLUP 함수 ①

- ROLLUP 함수를 사용하면 그룹핑 하는 컬럼의 수가 N일 시 N + 1 Level의 Subtotal(소계)가 생성된다.
- **ROLLUP의 인수는 계층 구조라 인수 순서가 바뀌면 수행 결과도 바뀐다.**
- N개 컬럼 → 소계: L1(기본 GROUP BY), L2(첫번째 컬럼 별 소계), L3(GRAND TOTAL)

```sql
SELECT DNAME, JOB, COUNT(*) "Total Empl", SUM(SAL) "Total Sal"
FROM EMP, DEPT
WHERE DEPT.DEPTNO = EMP.DEPTNO
GROUP BY ROLLUP(DNAME, JOB)
ORDER BY DNAME, JOB;
```

**ROLLUP 결과 구조 (DNAME, JOB 2개 컬럼):**
- L1 – GROUP BY 수행 시 생성되는 표준 집계 (9건)
- L2 – DNAME 별 모든 JOB의 SUBTOTAL (3건)
- L3 – GRAND TOTAL (마지막 행, 1건)

**ROLLUP 함수에 결합 컬럼 사용:**
```sql
GROUP BY ROLLUP (DNAME, (JOB, MGR));
```
- ROLLUP 함수 사용 시 괄호로 묶은 JOB과 MGR의 경우 **하나의 집합 (JOB+MGR) 컬럼으로 간주**하여 괄호 내 각 컬럼별 집계를 구하지 않는다.

---

## 9. GROUPING 함수 ★★★

- 그룹 함수를 지원하기 위한 함수로 ROLLUP이나 CUBE에 의한 소계가 계산된 결과에는 GROUPING(컬럼) = 1이 표시되고,
- 그 외 결과에는 GROUPING(컬럼) = 0이 표시된다.

```sql
-- CASE WHEN으로 NULL값 다른 값으로 대체하기
SELECT CASE WHEN GROUPING(DNAME) = 1 THEN 'All Departments'
            ELSE DNAME END AS DNAME,
       CASE WHEN GROUPING(JOB) = 1 THEN 'All Jobs'
            ELSE JOB END AS JOB,
       COUNT(*) AS "Total Empl",
       SUM(SAL) AS "Total Sal"
FROM EMP, DEPT
WHERE DEPT.DEPTNO = EMP.DEPTNO
GROUP BY ROLLUP(DNAME, JOB);
```

---

## 10. CUBE 함수 ②

- 결합 가능한 모든 값에 대하여 다차원 집계 생성
- 즉 **그룹핑되는 컬럼이 가질 수 있는 모든 경우에 대해 소계를 생성**
- 따라서 ROLLUP에 비해 시스템에 많은 부담이 생기니 사용에 주의
- **ROLLUP과 달리 인수들간의 간 계층 구조가 아니라 평등한 관계라 인수의 순서가 바뀌어도 정렬 순서는 바뀔 수 있어도 데이터의 결과는 같다.**
- CUBE(DNAME, JOB)이나 CUBE(JOB, DNAME)이나 같은 결과 도출
- GROUP BY ROLLUP(DNAME, JOB)에서는 JOB별 소계는 생성되지 않았지만 CUBE에서는 JOB별 소계도 생성된다.
- 전체 총계도 물론 생성된다.
- ROLLUP과 마찬가지로 UNION ALL을 통해서 표현할 수 있으며, ROLLUP과는 달리 JOB 컬럼에 대한 소계가 추가되므로 인수가 2개일 경우 총 4개의 SELECT 문이 UNION되어야 한다.

---

## 11. GROUPING SETS 함수 ③

- CUBE와 마찬가지로 인수별로 평등한 관계를 가져 **컬럼의 나열 순서는 중요하지 않는다.**
- **ROLLUP과 CUBE와 달리 자동으로 총계가 출력되지 않는다.**
- 하지만 `GROUP BY GROUPING SETS (A, B, ())`나 `GROUP BY GROUPING SETS (A, B, NULL)`로 → A 소계, B 소계, 총계 이렇게 총계까지 출력되게 할 수 있다.

```sql
SELECT DNAME, JOB, COUNT(*) "Total Empl", SUM(SAL) "Total Sal"
FROM EMP, DEPT
WHERE DEPT.DEPTNO = EMP.DEPTNO
GROUP BY GROUPING SETS(DNAME, JOB);
```

**GROUPING SETS의 경우 인수로 받은 각 컬럼별 소계가 생성된다.**

---

## 12. ROLLUP / CUBE / GROUPING SETS 비교

| 표현식 | 출력값 | 순서 |
|--------|--------|------|
| ROLLUP(A, B) | A와 B별 소계 / A별 소계 / 총계 | X (계층 구조) |
| CUBE(A, B) | A와 B별 소계 / A별 소계 / B별 소계 / 총계 | O (평등 관계) |
| GROUPING SETS(A, B) | A별 소계 / B별 소계 | O (평등 관계) |

- 세 함수 모두 결과 정렬이 필요한 경우 ORDER BY절에 정렬 컬럼을 명시해야 한다.
- CUBE와 ROLLUP 함수 모두 GROUPING SETS 함수로 대체 가능하다.
