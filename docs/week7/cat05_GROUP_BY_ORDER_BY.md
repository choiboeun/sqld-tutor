# 카테고리 5: GROUP BY & ORDER BY

> 출처: 2024개정판_SQLD_개념정리.pdf (39~42p)

---

## 1. GROUP BY 절

### 개념
- 데이터들을 작은 그룹으로 분류하여 소그룹에 대한 항목별 통계 정보를 얻을 때 사용
- ex) 각 팀별 선수들의 평균 신장, 카테고리별 총 매출, 부서별 사원 수 등
- 각 행을 특정 조건에 따라 그룹으로 분리하여 계산하도록 함
- **그룹 관련 조건은 WHERE 절에서 사용 불가, HAVING 절에서 사용**
- SELECT 절에 집계함수를 사용해서 그룹별 연산 결과를 표현하도록 함
- **별칭(ALIAS) 사용 불가능**
  - 별칭은 SELECT 절에서 정의되어 SELECT 구문이 실행될 때 만들어지는 이름이라 SELECT 이전에 실행되는 단계인 GROUP BY나 WHERE 절에서는 사용이 불가능하다.
- 성능 저하를 막기 위해 그룹 연산에서 필요없는 데이터는 미리 WHERE 절을 통해 제외해두자.
- 여러 컬럼을 기준으로 그룹화하는 것도 가능

### 주의사항
- **GROUP BY로 그룹화를 한 이후에는 그룹화 기준이 아닌 컬럼을 SELECT 절에 사용할 수 없다.**

```sql
-- 오류 예시
SELECT POSITION, COUNT(*) 인원수, HEIGHT
FROM PLAYER
GROUP BY POSITION
```
- 이렇게 작성하면 포지션별로 묶어 각 포지션별 인원수와 키를 출력하라는 건데, 이 때 각 포지션별 키는 단 하나의 값이 아니라 여러 값이 존재한다.
- 그룹으로 묶인 상태라 그룹별 하나의 행을 반환해야 하는데 키 값은 여러 개니 에러가 날 수밖에 없다.

```sql
-- 올바른 예시: 집계 함수 사용
SELECT POSITION, COUNT(*) 인원수, ROUND(AVG(HEIGHT),2) 평균키
FROM PLAYER
GROUP BY POSITION
```
- **그룹화되지 않은 컬럼을 사용하고 싶다면 집계 함수를 통해 각 그룹에서 해당 컬럼을 요약해야 한다.**

---

## 2. HAVING 절

### 개념
- 그룹화된 결과에 대한 조건을 적용할 때 사용하는 절
- HAVING 절이 GROUP BY 절 앞에 위치해도 되나, 논리적 실행 순서에 맞게 GROUP BY 뒤에 쓰는 것을 권장
- **HAVING 절이 SELECT 절보다 먼저 수행되니 SELECT절에서 선언된 ALIAS사용 불가**

### GROUP BY + HAVING 특성 정리
- GROUP BY 절을 통해 소그룹별 기분을 정한 후, SELECT 절에 집계 함수를 사용한다.
- 집계 함수의 통계 정보는 NULL 값을 가진 행을 제외하고 수행한다.
- **ALIAS 명을 사용할 수 없다.**
- **집계 함수는 WHERE 절에는 올 수 없다.**
- WHERE 절은 전체 데이터를 GROUP으로 나누기 전에 행들을 미리 제거한다.
- HAVING 절은 GROUP BY 절의 기준 항목이나 소그룹의 집계 함수를 이용한 조건을 표시할 수 있다.
- GROUP BY 절에 의한 소그룹별로 만들어진 집계 데이터 중, HAVING절에서 제한조건을 두어 조건을 만족하는 내용만 출력한다.
- HAVING 절은 일반적으로 GROUP BY 뒤에 위치한다.

### GROUP BY 없이 HAVING만 사용

- GROUP BY 없이 HAVING만 쓰면 **전체 테이블을 하나의 그룹**으로 처리
- SELECT 절에 집계 함수를 쓰면 전체 집계 결과 1행만 반환 (조건 만족 시), 아니면 0행(공집합)

```sql
-- GROUP BY 없는 HAVING: 전체 테이블이 하나의 그룹
SELECT COUNT(*) AS 전체건수
FROM EMP
HAVING COUNT(*) > 5;
-- EMP 전체 행 수가 5 초과이면 1행 반환, 아니면 0행(공집합)
```

### 예시

```sql
-- 부서별 평균 급여 3000 이상인 경우만 출력
SELECT department, AVG(salary) AS average_salary
FROM EMPLOYEE
GROUP BY department
HAVING AVG(salary) > 3000
ORDER BY average_salary DESC;
```

```sql
-- 특정 팀('K03', 'K09')에 속한 선수들의 팀별 총 인원 수 조회
-- 단, 각 팀의 평균 연봉(SALARY)이 25000을 초과하는 경우만
SELECT TEAM_ID ID, COUNT(*) 인원수
FROM PLAYER
WHERE TEAM_ID IN ('K03', 'K09')
GROUP BY TEAM_ID
HAVING AVG(SALARY) > 25000;
```

---

## 3. WHERE절 vs HAVING절

> **ORDER BY 절** 내용은 SELECT문 구조와 함께 [cat03_SELECT_WHERE.md](cat03_SELECT_WHERE.md) 8번 섹션에 정리되어 있음.

| 구분 | WHERE절 | HAVING절 |
|------|---------|----------|
| 적용 시점 | GROUP BY 이전 | GROUP BY 이후 |
| 집계함수 사용 | 불가 | 가능 |
| 행 필터링 | 개별 행 필터링 | 그룹화된 결과 필터링 |
| ALIAS 사용 | 불가 | 불가 |
