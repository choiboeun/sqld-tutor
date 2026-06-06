# 카테고리 4: 함수

> 출처: 2024개정판_SQLD_개념정리.pdf (32~36p)

---

## 1. 함수란?

입력값을 받아 처리하고, 결과(출력값)를 반환한다.

### 단일행 함수 (Single-Row Functions)
- 하나의 입력 값에 대해 하나의 결과를 반환하는 함수 (1:1 관계)
- 각 행들에 대해 개별적으로 작용하여 데이터 값들을 조작하고, 각각의 행에 대한 조작 결과를 반환한다는 뜻
- 주로 데이터 변환이나 조작에 사용
- 보통 SELECT, WHERE, ORDER BY절에서 사용된다.
- 함수 중첩 가능 (ex. `UPPER(CONCAT(first_name, ' ', last_name))`)

### 복수행(다중행) 함수 (Multi-Row Functions)
- **여러 행의 데이터를 하나의 결괏값으로 반환**하는 함수
- 주로 합계, 평균, 개수, 최대/최소 값 등을 계산하는 데 사용
- 이런 집계를 목적으로 하는 함수들이 GROUP BY와 잘 어울려져 사용됨
- 보통 SELECT, HAVING 절에서 사용 (ORDER BY 절에서도 사용 가능)

---

## 2. 숫자형 함수 (단일행 함수)

| 함수 | 기능 | 예시 | 출력 |
|------|------|------|------|
| ABS(x) | x의 절대값 반환 | ABS(-1) | 1 |
| SIGN(x) | x가 양수면 1, 음수면 -1 반환 | SIGN(100) | 1 (SIGN(0)은 0반환) |
| CEIL(x) | x보다 크거나 같은 최소 정수 반환 | CEIL(5.3) / CEIL(-5.3) | 6 / -5 (SQL Server: CEILING) |
| FLOOR(x) | x보다 작거나 같은 최대 정수 반환 | FLOOR(1.8) / FLOOR(-1.8) | 1 / -2 |
| MOD(x, y) | x를 y로 나눈 나머지 반환 | MOD(9, 2) | 1 |
| ROUND(x, d) | x를 소수점 d자리까지 반올림 | ROUND(2.718, 2) / ROUND(272, -1) | 2.72 / 270 (d자리 생략 = 0자리 반올림, d < 0이면 정수 자리에서 반올림) |
| POWER(x, n) | x를 n 제곱한 값 반환 | POWER(3, 2) | 9 |
| SQRT(x) | x의 제곱근 값 반환 | SQRT(100) | 10 |
| TRUNCATE(x, d) | x를 지정한 소수점 d자리까지 잘라서 버림 | TRUNCATE(1234.5678, 2) / TRUNCATE(1234.5678, -2) | 1234.56 / 1200 (d자리 생략과 같은 값 반환, d < 0이면 정수 자리에서 자름) |

---

## 3. 문자열 함수 (ORACLE) - 단일행 함수

| 함수 | 기능 | 예시 | 출력 |
|------|------|------|------|
| LOWER(s) | 소문자로 변환 | LOWER('Ab') | ab |
| UPPER(s) | 대문자로 변환 | UPPER('aB') | AB |
| ASCII(s) | ASCII 코드 번호로 변환 | ASCII('A') | 65 |
| CHR(ascii_no) | ASCII 번호를 문자나 숫자로 | CHR(65) | A |
| CONCAT(s1, s2) | 문자열 결합 | CONCAT('A', 'B') | AB |
| SUBSTR(s, m, n) | m위치에서 n개의 문자열 추출 | SUBSTR('ABCDE', 2, 3) | BCD (n 생략 시 끝까지 추출) |
| INSTR(s, sub_s, m, n) | 찾는 문자열 위치 반환 (m: 시작 위치, n: n번째 발견된) | INSTR('banana', 'a') | 2 |
| LENGTH(s) | 길이 반환 | LENGTH('AB CD') | 5 |
| LTRIM(s, remove_s) | 특정 문자열을 왼쪽에서 삭제 | LTRIM('#A#B#C#', '#') | A#B#C# (삭제할 문자열 생략 시 공백 삭제) |
| TRIM([leading\|both\|trailing] FROM s) | 특정 문자열을 왼/양/오른쪽에서 삭제 | TRIM(BOTH '#' FROM '#A#B#C#') | A#B#C (삭제할 문자열 생략 시 공백 삭제) |
| RTRIM(s, remove_s) | 특정 문자열을 오른쪽에서 삭제 | RTRIM('#A#B#C#', '#') | #A#B#C |
| LPAD(s, n, pad_s) | 왼쪽에 특정 문자열을 추가하여 총 n길이의 문자열 리턴 | LPAD('abc', 5, '0') | 00abc |
| RPAD(s, n, pad_s) | 오른쪽에 특정 문자열을 추가하여 총 n길이의 문자열 리턴 | RPAD('abc', 5, '0') | Abc00 |
| REPLACE(s, old_s, new_s) | 문자열 s에서 old_s를 new_s로 대체 | REPLACE('ABBAC', 'AB', 'ab') | abBAC (3번째 인수 생략 or 빈문자열 전달 시 old_s 삭제) |
| TRANSLATE(s, old_s, new_s) | 글자를 1대1로 치환 | TRANSLATE('ABBAC', 'AB', 'ab') | abbaC (3번째 인수가 필수며 빈문자열 전달 시 NULL 반환, A는 a로 B는 b로 매칭되는 글자끼리 각각 치환됨) |

**SQL SERVER 대응:**
- SUBSTR → SUBSTRING
- LENGTH → LEN
- INSTR → CHARINDEX

---

## 4. 날짜형 함수 (ORACLE) - 단일행 함수

| 함수 | 기능 | 예시 | 출력 |
|------|------|------|------|
| SYSDATE | 현재 날짜와 시간 반환 | SYSDATE | 2024/11/11 23:30:45 |
| CURRENT_DATE | 현재 날짜 반환 | CURRENT_DATE | 2024/11/11 |
| CURRENT_TIMESTAMP | 현재 타임스탬프 반환 | CURRENT_TIMESTAMP | 2024/11/11 23:30:45 +09:00 |
| EXTRACT(year\|month\|day from d) | 날짜 d에서 년/월/일 추출 | EXTRACT(DAY from SYSDATE) | 11 |
| ADD_MONTHS(d, n) | 날짜 d에서 n개월 후 날짜 반환 (n < 0이면 n개월 전) | ADD_MONTHS(SYSDATE, 2) | 2025/01/11 |
| TO_NUMBER(TO_CHAR(d, 'YYYY')) | 날짜 d에서 년/월/일 추출 | TO_NUMBER(TO_CHAR(SYSDATE, 'YYYY')) | 2024 |
| MONTHS_BETWEEN(d1, d2) | d1과 d2의 개월 차이 반환 | MONTHS_BETWEEN(SYSDATE, HIREDATE) | 17.9 |
| LAST_DAY(d) | 주어진 월의 마지막 날 반환 | LAST_DAY(SYSDATE) | 2024/11/31 |
| NEXT_DAY(d, n) | 날짜 d 이후 지정된 요일의 첫 날짜 반환 (n: 1(일), 2(월), …, 7(토)) | NEXT_DAY(SYSDATE, 1) | 2024/11/17 |

> ※ DBMS마다 날짜 출력 형식은 다르다.

**SQL SERVER 대응:**
- SYSDATE → GETDATE()
- EXTRACT(year\|month\|day from d) → DATEPART(year\|month\|day, d) 또는 YEAR(d) / MONTH(d) / DAY(d) 단축 함수 사용 가능
- ADD_MONTHS(d, n) → DATEADD(year\|month\|day, d, n) 월 분만이 아니라 모든 날짜 단위 연산이 가능하다
- MONTHS_BETWEEN(d1, d2) → DATEDIFF(year\|month\|day, d1, d2)

---

## 5. 변환 함수 - 단일행 함수

**ORACLE 함수:**

| 함수 | 기능 | 예시 | 출력 |
|------|------|------|------|
| TO_NUMBER(문자) | 숫자형으로 변환 후 반환 | TO_NUMBER('100') | 100 |
| TO_CHAR(대상, 포맷) | 날짜를 주어진 포맷 형태로 변환 / 숫자를 주어진 포맷 형태로 변환 (0과 9는 자릿수를 표현) | TO_CHAR(SYSDATE, 'DD.MM.YYYY') / TO_CHAR(1250, '9,999') | 10.11.2024 / 1,250 |
| TO_DATE(문자, 포맷) | 문자를 포맷 형태에 맞게 날짜로 변환 (문자와 포맷 스타일이 일치해야 함) | TO_DATE('2024.10.31', 'YYYY.MM.DD') | (날짜형으로 반환됨) |

**SQL SERVER 함수:**

| 함수 | 기능 | 예시 | 출력 |
|------|------|------|------|
| FORMAT(날짜, 포맷) | 날짜의 포맷 변환 | FORMAT(GETDATE(), 'YYYY') | 2024 |
| CAST(대상 AS 데이터타입) | 대상을 주어진 데이터타입으로 변환 (ORACLE에서도 동일) | CAST(123.45 AS INT) | 123 |
| CONVERT(데이터타입, 대상, [스타일]) | 대상을 주어진 데이터타입으로 변환 | CONVERT(INT, 123.45) | 123 |

> 일반적인 데이터 형식 변환에는 CAST를 사용할 수 있지만, 날짜 및 시간 변환 시 특정 형식을 요구하는 경우에는 CONVERT를 사용하는 것이 좋다.

---

## 6. 집계 함수 (복수행/다중행 함수) - **NULL 값은 0으로 계산되는 것이 아니라 무시된다!!**

| 함수 | 기능 | 예시 |
|------|------|------|
| COUNT(*) | NULL 값 포함 전체 행의 수 반환 | SELECT COUNT(*) FROM EMP; |
| COUNT(칼럼) | 행의 수 반환 (NULL 제외) | SELECT COUNT(BOOK_NAME) FROM BOOK_LIST; |
| SUM(칼럼) | 총 합 반환 | SELECT SUM(SAL) FROM EMP; |
| AVG(칼럼) | 평균 반환 | SELECT AVG(SAL) FROM EMP; |
| MIN(칼럼) | 최솟값 반환 | SELECT MIN(SAL) FROM EMP; |
| MAX(칼럼) | 최댓값 반환 | SELECT MAX(SAL) FROM EMP; |
| STDDEV(칼럼) | 표준편차 반환 | SELECT STDDEV(SAL) FROM EMP; |
| VARIANCE(칼럼) | 분산 반환 | SELECT VARIANCE(SAL) FROM EMP; |

- MAX(), MIN()은 날짜형 데이터에도 사용이 가능하다. (ex. MAX(ORDER_DATE): 가장 최근 주문 날짜 반환)

**SQL SERVER:**
- STDDEV → STDEV
- VARIANCE() → VAR()

---

## 7. NULL 관련 함수 및 기타 함수 (ORACLE) ★★

| 함수 | 기능 |
|------|------|
| NVL(a, b) | a가 NULL이면 b 반환, NULL이 아니면 a 반환 |
| NVL2(a, b, c) | a가 NULL이면 c로 반환, NULL이 아니면 b 반환 |
| NULLIF(a, b) | a = b 면 NULL 반환, a ≠ b 면 a 반환 |
| ISNULL(a, b) (#SQL SERVER 함수임) | a가 NULL이면 b 반환, NULL이 아니면 a 반환 |
| COALESCE(a, b, c, ……) | 인수들 중 가장 처음으로 NULL이 아닌 값 반환, 인수들이 모두 NULL이면 NULL반환 |
| DECODE(대상, 값1, 리턴1, 값2, 리턴2, …, ELSE 값) | 대상 = 값1이면 리턴1 반환, 대상 = 값2이면 리턴2 반환, …, 그 외에는 ELSE 값 반환 (ELSE 값 생략 시 NULL 반환) |

---

## 8. CASE 표현

- 일반 프로그램의 IF-THEN-ELSE-END 로직과 같음
- ORACLE의 DECODE() 함수와 같은 기능을 가짐

### ① SIMPLE_CASE_EXPRESSION: 특정 값과의 일치 평가

```sql
CASE expression
    WHEN value1 THEN result1
    WHEN value2 THEN result2
    ELSE default_result
END
```

예시:
```sql
SELECT
    CASE JOB
        WHEN 'Manager' THEN 'Management'
        WHEN 'Developer' THEN 'Engineering'
        WHEN 'Sales' THEN 'Sales Department'
        ELSE 'General'
    END AS DEPARTMENT
FROM EMPLOYEES;
```

### ② SEARCHED_CASE_EXPRESSION: 개별 조건 평가

```sql
CASE
    WHEN condition1 THEN result1
    WHEN condition2 THEN result2
    ELSE default_result
END
```

예시:
```sql
SELECT
    CASE
        WHEN PRICE > 50000 THEN 'High'
        WHEN PRICE > 30000 THEN 'Medium'
        ELSE 'Low'
    END AS Quality
FROM PRODUCTS;
```

---

## 9. 합성 연산자

컬럼과 문자 또는 다른 컬럼을 연결시킨다. 문자 표현식의 결과에 의해 새로운 컬럼을 생성한다.

```sql
-- (1) || (Oracle)
SELECT FIRST_NAME || ' ' || LAST_NAME AS FULL_NAME
FROM EMPLOYEES;

-- (2) + (SQL Server)
SELECT FIRST_NAME + ' ' + LAST_NAME AS FULL_NAME
FROM EMPLOYEES;

-- (3) CONCAT
SELECT CONCAT('Hello, ', 'World!') AS greeting;
```
