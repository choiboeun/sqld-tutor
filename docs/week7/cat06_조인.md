# 카테고리 6: 조인(JOIN)

> 출처: 2024개정판_SQLD_개념정리.pdf (43~50p)

---

## 1. 조인이란?

- 여러 테이블의 데이터를 동시에 출력하거나 참조할 때 사용한다.
- 여러 테이블을 연결하거나 결합하여 하나의 결과 집합으로 만드는 방법
- 여러 테이블에 나누어 있는 관련 데이터를 하나의 조합 결과로 모음
- **일반적인 경우 행들은 PK나 FK 값의 연관에 의해 조인이 성립된다.**
- 하지만 어떤 경우에는 PK, FK 관계가 없어도 논리적인 값들의 연관만으로도 조인이 성립된다.
- FROM 절에 여러 테이블이 나열되더라도 SQL에서 데이터를 처리할 때는 **단 2개의 집합 간에만 조인이 일어난다.**
  - 예로 FROM A, B, C 라면 A JOIN B가 먼저 실행되고 A JOIN B의 결과 집합과 남은 테이블 C와의 조인이 일어난다는 것
- **여러 테이블을 조인 시, SELECT 절에 적는 컬럼은 해당 컬럼이 어느 테이블에 존재하는 컬럼인지를 명시해야 한다.** (같은 이름의 컬럼이 다른 테이블에도 존재할 수 있기 때문에)
- **※ N개의 테이블 조인 시 최소 N-1개의 조인 조건 필요**

---

## 2. 조인의 종류

### ① 조건의 형태에 따른 구분
1. **EQUI JOIN**: 조인 조건이 동등(=) 조건일 경우
2. **NON EQUI JOIN**: 조인 조건이 동등 조건이 아닌 경우

### ② 조인 결과에 따른 구분
1. **INNER JOIN**: 두 테이블간 조인 조건이 일치하는 데이터만 출력
2. **OUTER JOIN**: 두 테이블간 조건이 일치하지 않는 데이터도 출력
   - 종류: LEFT / RIGHT / FULL OUTER JOIN

### ③ NATURAL JOIN
- 두 테이블에서 같은 이름을 가진 컬럼을 자동으로 찾아 조인

### ④ CROSS JOIN
- 두 테이블의 모든 조합을 생성하는 조인 (Cartesian Product 반환)

### ⑤ SELF JOIN
- 같은 테이블을 두 번 이상 참조하는 조인

---

## 3. EQUI JOIN (등가 조인)

- 등가(EQUI) JOIN은 2개의 테이블 간에 컬럼 값들이 서로 정확하게 일치하는 경우에 사용되는 방법으로 보통 PK ↔ FK 관계를 기반으로 한다.
- (반드시 PK ↔ FK의 관계로만 EQUI JOIN이 성립한다는 게 아님)

```sql
-- ORACLE: 조인 조건을 WHERE 절에
SELECT 테이블1.컬럼, 테이블2.컬럼, ...
FROM 테이블1, 테이블2
WHERE 테이블1.컬럼 = 테이블2.컬럼;

-- ANSI/ISO SQL: 조인 조건을 ON절에
SELECT 테이블1.컬럼, 테이블2.컬럼, ...
FROM 테이블1
INNER JOIN 테이블2
ON 테이블1.컬럼 = 테이블2.컬럼;
```

> **※ 데이터 필터링 조건도 WHERE 절에!**  
> **※ 만약 테이블에 대한 ALIAS를 적용했을 경우, 다른 SELECT, WHERE 등의 절에서도 본래 테이블명이 아닌 ALIAS를 사용해야만 한다.**

---

## 4. NON EQUI JOIN (비등가 조인)

- 비등가(NON EQUI) JOIN은 2개의 테이블 간에 컬럼 값들이 서로 정확하게 일치하지 않는 경우에 사용
- 즉, "=" 연산자가 아닌 다른(BETWEEN, <, <=, >, >= 등) 연산자들을 사용하여 조인을 수행하는 것
- 대부분 비등가 조인을 수행할 수 있으나, 때론 설계상의 이유로 수행이 불가능함

```sql
SELECT 테이블1.컬럼, 테이블2.컬럼, ...
FROM 테이블1, 테이블2
WHERE 테이블1.컬럼 BETWEEN 테이블2.컬럼 AND 테이블2.컬럼
```

예시: 사원의 급여에 따른 급여 등급 조회 (SALGRADE 테이블의 LOSAL~HISAL 범위)
```sql
SELECT E.ENAME 사원명, E.SAL 급여, S.GRADE 급여등급
FROM EMP E, SALGRADE S
WHERE E.SAL BETWEEN S.LOSAL AND S.HISAL;
```

---

## 5. 3개 이상의 테이블 조인

- 관계 잘 파악해서 모든 테이블이 연결되도록 조인 조건 명시
- 3개의 테이블 조인이면 최소 2개의 조인 조건 필요

```sql
-- ORACLE
SELECT P.PLAYER_NAME, P.POSITION, T.REGION_NAME, T.TEAM_NAME, S.STADIUM_NAME
FROM PLAYER P, TEAM T, STADIUM S
WHERE P.TEAM_ID = T.TEAM_ID
AND T.STADIUM_ID = S.STADIUM_ID;

-- ANSI/ISO SQL
SELECT P.PLAYER_NAME, P.POSITION, T.REGION_NAME, T.TEAM_NAME, S.STADIUM_NAME
FROM PLAYER P
INNER JOIN TEAM T ON P.TEAM_ID = T.TEAM_ID
INNER JOIN STADIUM S ON T.STADIUM_ID = S.STADIUM_ID;
```

---

## 6. SELF JOIN

- 동일 테이블 사이의 조인
- FROM 절에 동일 테이블이 2번 이상 나타나게 되니 식별을 위해 **반드시 테이블 ALIAS를 사용해야 한다.**

```sql
SELECT E1.EMP_ID, E1.NAME, E1.MGR_ID,
       E2.EMP_ID, E2.NAME
FROM EMPLOYEES E1, EMPLOYEES E2
WHERE E1.MGR_ID = E2.EMP_ID
```

---

## 7. 표준 조인 (STANDARD JOIN)

ANSI 표준으로 작성되는 INNER/CROSS/NATURAL/OUTER JOIN

### ① INNER JOIN

- 내부 JOIN이라고 하며 JOIN 조건이 일치하는 행만 반환
- ORACLE 조인의 기본
- ANSI 표준에서는 USING 조건절이나 ON 조건절이 필수

```sql
-- ORACLE
SELECT EMP.DEPTNO, EMPNO, ENAME, DNAME
FROM EMP, DEPT
WHERE EMP.DEPTNO = DEPT.DEPTNO;

-- ANSI
SELECT EMP.DEPTNO, EMPNO, ENAME, DNAME
FROM EMP INNER JOIN DEPT  -- JOIN으로 생략 가능
ON EMP.DEPTNO = DEPT.DEPTNO;
```

### ② ON 조건절 (괄호 씌우는 건 옵션)

- 조인할 양 컬럼의 컬럼명이 서로 달라도 사용 가능
- 같은 컬럼명을 가진 테이블과의 조인 시, 테이블 출처 명확하게
- **ANSI: ON 조건절: JOIN 조건 명시, WHERE 조건절: 일반 조건 명시**

### ③ USING 조건절 (괄호 필수)

- 조인할 **양 컬럼의 컬럼명이 같을 경우** 사용
- **ALIAS 사용 불가, 출처 테이블 명시 불가** (DEPT.DEPTNO → DEPTNO)
- USING 절의 기준 컬럼은 식별자를 가질 수 X
- SQL Server에서는 지원X
- SELECT *을 하면, USING 조건절의 기준 컬럼이 1번째 출력 컬럼이 된다.

```sql
SELECT EMP.ENAME, DEPTNO, DEPT.DNAME
FROM EMP JOIN DEPT
USING (DEPTNO)
```

### ④ NATURAL JOIN

- 두 테이블 간의 동일한 이름을 갖는 모든 컬럼들에 대해 EQUI JOIN 수행한다.
- **JOIN에 사용되는 컬럼들이 동일한 이름, 같은 데이터형, 같은 데이터 성격(도메인)이어야 한다.**
- NATURAL JOIN이 명시되면, 추가로 USING 절, ON 절, WHERE 절에서 JOIN 조건을 정의할 수 없다.
- SQL Server에서는 지원X
- **JOIN에 사용된 컬럼들은 ALIAS나 테이블명(접두사) 사용 불가**
- **여러 개의 컬럼명이 동일한 경우, 동일한 이름을 가진 모든 컬럼의 값이 같아야 JOIN된다.**
- NATURAL JOIN은 JOIN에 사용된 같은 이름의 칼럼을 하나로 처리
- **JOIN되는 컬럼이 NULL 값을 가지면 일치한다고 볼 수 없다.**
- SELECT *을 하면, NATURAL JOIN의 기준 컬럼이 1번째 출력 컬럼이 된다.

### ⑤ CROSS JOIN

- E.F.CODD 박사가 언급한 일반 집합 연산자의 PRODUCT 개념
- **테이블 간 JOIN 조건이 없는 경우 생길 수 있는 모든 데이터의 조합** → (CARTESIAN PRODUCT, 카타시안 곱을 출력)
- 양쪽 테이블의 데이터 수끼리 곱한 만큼의 데이터 조합 발생 (M * N)
- ORACLE: FROM t1, t2 + WHERE 절에 조건 명시하지 않을 시 발생
- ANSI: t1 CROSS JOIN t2 + on으로 조인 조건 명시 X
- NATURAL JOIN의 경우 WHERE 절에서 JOIN 조건을 추가할 수 없지만, CROSS JOIN은 추가할 수 있다.
- 하지만, 이 경우 CROSS JOIN이 아니라 INNER JOIN과 같은 결과를 얻으니 CROSS JOIN 사용의 의미가 없어지므로 권고하지 않는다.

---

## 8. OUTER JOIN

- INNER JOIN과 대비되는 조인 방식
- JOIN 조건에서 동일한 값이 없는 행도 반환할 때 사용
- 기준이 되는 테이블의 방향에 따라 LEFT, RIGHT, FULL OUTER 조인
- OUTER는 생략 가능 (LEFT OUTER JOIN → LEFT JOIN)

### 1) LEFT OUTER JOIN

- **왼쪽 테이블을 기준으로 오른쪽 테이블이 더해지는 형태**
- 왼쪽 테이블의 모든 행 데이터가 반환되며, 오른쪽 테이블은 왼쪽테이블과 결합 기준 컬럼값과 일치하는 행만 반환
- 오른쪽 테이블에서 일치하는 값이 없으면, 해당 부분이 NULL로 채워짐

```sql
-- ANSI (표준 조인)
SELECT b.Book_id, b.Book_name, b.Writer, b.Publisher_id, p.Publisher_name
FROM BOOK_LIST b
LEFT JOIN PUBLISHER p
ON b.Publisher_id = p.Publisher_id;

-- ORACLE 표준: (+)를 오른쪽에 붙임
SELECT b.Book_id, b.Book_name, b.Writer, b.Publisher_id, p.Publisher_name
FROM BOOK_LIST b, PUBLISHER p
WHERE b.Publisher_id = p.Publisher_id(+);
```

### 2) RIGHT OUTER JOIN

- **오른쪽 테이블을 기준으로 왼쪽 테이블이 더해지는 형태**
- 오른쪽 테이블의 모든 행 데이터가 반환되며, 왼쪽 테이블은 오른쪽테이블과 결합 기준 컬럼값과 일치하는 행만 반환
- 왼쪽 테이블에서 일치하는 값이 없으면, 해당 부분이 NULL로 채워짐

```sql
-- ANSI
FROM BOOK_LIST b
RIGHT JOIN PUBLISHER p
ON b.Publisher_id = p.Publisher_id;

-- ORACLE: (+)를 왼쪽에 붙임
WHERE (+)b.Publisher_id = p.Publisher_id;
```

### 3) FULL OUTER JOIN

- **두 테이블의 모든 데이터가 결합**
- 즉, 두 테이블이 가지고 있는 모든 행이 반환된다.
- 기준 컬럼의 값이 일치하지 않는 경우 해당 부분은 NULL로 채워진다.
- 오라클 표준에서는 직접적으로 지원하지 않으나, UNION을 통해 구현이 가능하다.
- = LEFT OUTER JOIN의 결과 UNION RIGHT OUTER JOIN의 결과
- **UNION: 중복 데이터는 하나만 반환**

```sql
-- ANSI
FROM BOOK_LIST b
FULL JOIN PUBLISHER p
ON b.Publisher_id = p.Publisher_id;

-- ORACLE: UNION 이용
SELECT ... FROM BOOK_LIST b, PUBLISHER p WHERE b.Publisher_id = p.Publisher_id(+)
UNION
SELECT ... FROM BOOK_LIST b, PUBLISHER p WHERE b.Publisher_id(+) = p.Publisher_id;
```
