"""
스모크 테스트 — 배포 전/후 핵심 시나리오가 정상 동작하는지 자동으로 확인한다.
실제 /api/chat 엔드포인트에 대표 질문들을 보내고, 알려진 실패 패턴(별표 노출,
표 마크다운 깨짐, 빈 응답, 타임아웃 등)이 있는지 자동으로 검사한다.

사용법:
    # 로컬 서버(기본 http://localhost:8000) 대상
    .venv/bin/python3 tests/smoke_test.py

    # 배포본 대상
    .venv/bin/python3 tests/smoke_test.py --url https://sqld-tutor.onrender.com

    # 동시 요청 5개로 부하 테스트까지 포함
    .venv/bin/python3 tests/smoke_test.py --concurrent 5
"""
import argparse
import concurrent.futures
import json
import re
import time
import uuid

import httpx

DEFAULT_URL = "http://localhost:8000"

# (설명, 보낼 메시지)
CASES = [
    ("일반 인사 — 캐주얼 대화로 라우팅", "안녕! 오늘 뭐 할까?"),
    ("2개 비교 — 볼드 금지 확인", "조인이랑 서브쿼리 차이가 뭐야?"),
    ("3개 비교 — explain 라우팅 확인", "기본키랑 외래키 차이, 그리고 후보키까지 설명해줘"),
    ("4개 비교 + 표 요청 — 표 마크다운 확인", "RANK, DENSE_RANK, ROW_NUMBER, DML, DDL, DCL, TCL 전부 표로 정리해줘"),
    ("문제 출제", "문제 줘"),
    ("SQL 실행", "SELECT * FROM EMP 실행해줘"),
    ("약점 분석 (데이터 없음)", "약점 분석해줘"),
    ("오답 복습 (데이터 없음)", "오답 복습할래"),
    ("영어 질문 — 그래도 한국어로 답해야 함", "What is a JOIN in SQL?"),
    ("빈 메시지 — 서버가 죽지 않아야 함", ""),
    ("아주 긴 메시지 — 검증 오류(422)든 정상 응답이든 서버가 안 죽어야 함", "조인 설명해줘 " * 400),
]


def check_response(text: str, is_concept: bool) -> list[str]:
    """응답 텍스트에서 알려진 실패 패턴을 찾아 문제점 목록으로 반환한다 (비어있으면 통과).
    is_concept=True(explain 노드 응답)면 볼드(**)가 의도된 디자인이므로 별표 검사를 건너뛴다.
    """
    problems = []
    if not text.strip():
        problems.append("응답이 비어있음")
        return problems
    if not is_concept:
        # 코드블록 안 곱셈(*)/COUNT(*) 등은 백엔드에서 \* 로 이스케이프되므로,
        # 이스케이프되지 않은 순수 * 문자만 마크다운 강조 위반으로 간주한다.
        bare_stars = re.findall(r"(?<!\\)\*", text)
        if bare_stars:
            problems.append(f"별표(*) {len(bare_stars)}개 발견 — 챗봇(볼드 금지) 경로인데 마크다운 강조 사용")
    if re.search(r"\|\s*\|\s*\|\s*-{2,}", text):
        problems.append("표 마크다운 깨짐 패턴 발견 (헤더 구분선이 표 중간에 재등장)")
    if "<br>" in text:
        problems.append("표 셀 안 <br> 태그 발견 (셀 병합 시도로 인한 렌더링 깨짐 가능성)")
    return problems


def parse_sse(resp_text: str) -> dict:
    """SSE 응답 바디를 파싱해 {content, is_concept, error} 형태로 반환한다.
    is_concept=True면 explain 노드(RAG 개념 설명) 응답이라 볼드(**)가 의도적으로 허용된다.
    """
    content = []
    is_concept = False
    error = None
    for line in resp_text.split("\n"):
        if not line.startswith("data: "):
            continue
        try:
            payload = json.loads(line[len("data: "):])
        except json.JSONDecodeError:
            continue
        ptype = payload.get("type")
        if ptype in ("token", "message"):
            content.append(payload.get("content", ""))
        elif ptype == "concept":
            content.append(payload.get("content", ""))
            is_concept = True
        elif ptype == "error":
            error = payload.get("content", "")
    return {"content": "".join(content), "is_concept": is_concept, "error": error}


def run_case(client: httpx.Client, base_url: str, name: str, message: str, timeout: float) -> dict:
    thread_id = f"guest_smoketest_{uuid.uuid4().hex[:8]}"
    t0 = time.time()
    result = {"name": name, "message": message[:40], "ok": False, "elapsed": 0.0, "problems": [], "preview": ""}
    try:
        resp = client.post(
            f"{base_url}/api/chat",
            json={"message": message, "thread_id": thread_id, "is_guest": True},
            timeout=timeout,
        )
        result["elapsed"] = time.time() - t0

        # 입력 검증으로 인한 4xx(예: 너무 긴 메시지)는 서버가 안전하게 거절한 것이므로 통과 처리
        if resp.status_code == 422:
            result["ok"] = True
            result["preview"] = "(입력 검증으로 정상 거절됨)"
            return result
        if resp.status_code != 200:
            result["problems"].append(f"HTTP {resp.status_code}")
            return result

        parsed = parse_sse(resp.text)
        if parsed["error"]:
            result["problems"].append(f"서버 에러 응답: {parsed['error']}")
            return result
        text = parsed["content"]
        result["problems"] = check_response(text, parsed["is_concept"])
        result["ok"] = not result["problems"]
        tag = "[explain]" if parsed["is_concept"] else "[chat]"
        result["preview"] = f"{tag} " + text[:75].replace("\n", " ")
    except httpx.TimeoutException:
        result["elapsed"] = time.time() - t0
        result["problems"].append(f"{timeout:.0f}초 내 응답 없음 (타임아웃)")
    except Exception as e:
        result["elapsed"] = time.time() - t0
        result["problems"].append(f"{type(e).__name__}: {e}")
    return result


def print_result(r: dict) -> None:
    status = "PASS" if r["ok"] else "FAIL"
    print(f"[{status}] ({r['elapsed']:.1f}s) {r['name']}")
    if r["ok"]:
        print(f"       └ {r['preview']}")
    else:
        for p in r["problems"]:
            print(f"       └ 문제: {p}")


def run_sequential(base_url: str, timeout: float) -> list[dict]:
    results = []
    with httpx.Client() as client:
        for name, message in CASES:
            r = run_case(client, base_url, name, message, timeout)
            print_result(r)
            results.append(r)
    return results


def run_concurrent(base_url: str, timeout: float, n: int) -> None:
    """같은 무거운 질문을 동시에 n개 쏴서 서버가 버티는지 확인 (부하 테스트)."""
    message = "RANK, DENSE_RANK, ROW_NUMBER, DML, DDL, DCL, TCL 전부 표로 정리해줘"
    print(f"\n=== 동시 요청 부하 테스트 (같은 질문 {n}개 동시 전송) ===")
    t0 = time.time()
    with httpx.Client() as client:
        with concurrent.futures.ThreadPoolExecutor(max_workers=n) as pool:
            futures = [
                pool.submit(run_case, client, base_url, f"동시요청 #{i+1}", message, timeout)
                for i in range(n)
            ]
            results = [f.result() for f in futures]
    total = time.time() - t0
    for r in results:
        print_result(r)
    passed = sum(1 for r in results if r["ok"])
    print(f"\n동시 요청 결과: {passed}/{n} 통과, 전체 소요 {total:.1f}s")


def main():
    parser = argparse.ArgumentParser(description="SQLD AI 튜터 스모크 테스트")
    parser.add_argument("--url", default=DEFAULT_URL, help="테스트 대상 서버 URL")
    parser.add_argument("--timeout", type=float, default=40.0, help="개별 요청 타임아웃(초)")
    parser.add_argument("--concurrent", type=int, default=0, help="지정 시 같은 질문을 N개 동시 전송하는 부하 테스트도 실행")
    args = parser.parse_args()

    print(f"대상 서버: {args.url}\n")
    results = run_sequential(args.url, args.timeout)

    if args.concurrent > 0:
        run_concurrent(args.url, args.timeout, args.concurrent)

    passed = sum(1 for r in results if r["ok"])
    print(f"\n=== 결과: {passed}/{len(results)} 통과 ===")
    if passed < len(results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
