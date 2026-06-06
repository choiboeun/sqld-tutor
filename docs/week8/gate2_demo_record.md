# Gate 2 시연 기록 — 8주차

**시연일:** 2026-06-05  
**방식:** CLI 터미널 2개 (student_A / student_B)  
**명령어:** `python3 -m app.main_cli [thread_id]`

---

## 항목 1 — 5턴 이상 멀티턴 대화에서 학생 약점이 추적되고 다음 출제에 반영됨

**세션:** student_A

| 턴 | 입력 | 출력 요약 | 포인트 |
|----|------|-----------|--------|
| 1 | 약점 분석해줘 | 아직 풀이 데이터가 없습니다 | 초기 상태 확인 |
| 2 | 조인 문제 줘 | [조인 / 난이도: 중] LEFT OUTER JOIN 문제 출제 | |
| 3 | 4 (오답) | 오답 채점 메시지 + 조인 개념 자동 설명 | **적응형 라우터 작동** — 정답률 0% → explain 자동 유도 |
| 4 | 나 이해했어 | 잘하셨습니다! 다음 문제로... | "이해했어" 자연스럽게 처리 |
| 5 | 조인 문제 줘 | [조인 / 난이도: 상] INNER JOIN 문제 출제 | |
| 6 | 4 (오답) | 오답 채점 메시지만 출력 | **반복 방지 작동** — 같은 카테고리 설명 재실행 안 함 |
| 7 | 약점 분석해줘 | 조인: 0% (2문제) — 취약 카테고리 집중 복습 권장 | **약점 추적 완료** |

**결과:** ✅ 7턴 동안 조인 정답률 0%가 정확히 기록되고 취약 카테고리로 분류됨

---

## 항목 2 — 두 thread_id로 격리된 세션이 유지됨

| 세션 | 입력 | 출력 |
|------|------|------|
| student_A | 2문제 풀이 완료 (조인 0%) | 총 2문제, 조인 취약 |
| student_B | 약점 분석해줘 | **아직 풀이 데이터가 없습니다** |

**결과:** ✅ student_A가 2문제를 풀었음에도 student_B는 완전히 독립된 초기 상태 유지

---

## 항목 3 — SQL 실행 도구가 실제 SQLite에서 작동함

**세션:** student_A

**입력:**
```sql
SELECT E.ENAME, D.DNAME FROM EMP E JOIN DEPT D ON E.DEPTNO = D.DEPTNO
```

**출력:**
```
+--------+------------+
| ENAME  | DNAME      |
+--------+------------+
| SMITH  | RESEARCH   |
| ALLEN  | SALES      |
| WARD   | SALES      |
| JONES  | RESEARCH   |
| MARTIN | SALES      |
| BLAKE  | SALES      |
| CLARK  | ACCOUNTING |
| KING   | ACCOUNTING |
| TURNER | SALES      |
| JAMES  | SALES      |
| FORD   | RESEARCH   |
| MILLER | ACCOUNTING |
+--------+------------+
총 12건
```

**결과:** ✅ EMP × DEPT JOIN 쿼리가 실제 SQLite DB에서 실행되어 12건 반환

---

## 항목 4 — 도구 호출 실패 시 우회 라우팅이 작동함

**세션:** student_A

**입력:**
```sql
SELECT * FROM NONEXISTENT_TABLE
```

**출력:**
```
SQL 오류: no such table: NONEXISTENT_TABLE

사용 가능한 테이블:
• EMP   (EMPNO, ENAME, JOB, MGR, HIREDATE, SAL, COMM, DEPTNO)
• DEPT  (DEPTNO, DNAME, LOC)
• SALGRADE (GRADE, LOSAL, HISAL)
```

**결과:** ✅ 존재하지 않는 테이블 쿼리에도 시스템 크래시 없이 에러 메시지 + 사용 가능 테이블 안내 반환

---

## 시연 시 나레이션 포인트

**턴 3 vs 턴 6 차이 설명 필요:**
> "첫 번째 오답(턴 3)에서는 조인 개념 설명이 자동으로 나왔습니다.
> 두 번째 오답(턴 6)에서는 이미 설명한 카테고리이므로 같은 설명이 반복되지 않습니다."

---

## 최종 결과

| 항목 | 결과 |
|------|------|
| 5턴+ 멀티턴 약점 추적 | ✅ |
| thread_id 격리 세션 | ✅ |
| SQL SQLite 실행 | ✅ |
| 도구 실패 우회 라우팅 | ✅ |

**Gate 2 통과 조건 충족**
