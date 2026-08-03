#!/usr/bin/env python3
"""마크다운 → PDF 변환 스크립트 (weasyprint + Noto Sans CJK KR)"""
import sys
import os
import re
import markdown
from weasyprint import HTML, CSS
from pathlib import Path

CSS_STYLE = """
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');

@font-face {
    font-family: 'NotoSansCJK';
    src: local('Noto Sans CJK KR'), local('NotoSansCJKkr-Regular');
    font-weight: 400;
}
@font-face {
    font-family: 'NotoSansCJK';
    src: local('Noto Sans CJK KR Bold'), local('NotoSansCJKkr-Bold');
    font-weight: 700;
}
@font-face {
    font-family: 'NotoMonoCJK';
    src: local('Noto Sans Mono CJK KR'), local('NotoSansMonoCJKkr-Regular');
}

@page {
    size: A4;
    margin: 2.2cm 2.4cm 2.2cm 2.4cm;
    @bottom-center {
        content: counter(page);
        font-family: 'NotoSansCJK', sans-serif;
        font-size: 9pt;
        color: #999;
    }
}

body {
    font-family: 'NotoSansCJK', 'Noto Sans KR', sans-serif;
    font-size: 10.5pt;
    line-height: 1.75;
    color: #1a1a1a;
    word-break: keep-all;
}

h1 {
    font-size: 18pt;
    font-weight: 700;
    color: #1a56db;
    margin-top: 0;
    margin-bottom: 8pt;
    padding-bottom: 6pt;
    border-bottom: 2px solid #1a56db;
}

h2 {
    font-size: 13pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 20pt;
    margin-bottom: 6pt;
    padding-bottom: 3pt;
    border-bottom: 1px solid #e2e8f0;
}

h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #334155;
    margin-top: 14pt;
    margin-bottom: 4pt;
}

p {
    margin: 4pt 0 6pt 0;
}

ul, ol {
    margin: 4pt 0 6pt 0;
    padding-left: 18pt;
}

li {
    margin-bottom: 3pt;
    line-height: 1.7;
}

code {
    font-family: 'NotoMonoCJK', 'Noto Sans Mono CJK KR', monospace;
    font-size: 9pt;
    background: #f1f5f9;
    color: #0f172a;
    padding: 1pt 4pt;
    border-radius: 3pt;
}

pre {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3px solid #1a56db;
    border-radius: 4pt;
    padding: 10pt 12pt;
    margin: 8pt 0;
    overflow-x: auto;
}

pre code {
    background: none;
    padding: 0;
    font-size: 9pt;
    line-height: 1.6;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0;
    font-size: 10pt;
}

th {
    background: #1a56db;
    color: white;
    font-weight: 700;
    padding: 6pt 10pt;
    text-align: left;
    font-size: 9.5pt;
}

td {
    padding: 5pt 10pt;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
}

tr:nth-child(even) td {
    background: #f8fafc;
}

blockquote {
    border-left: 3px solid #94a3b8;
    margin: 8pt 0;
    padding: 4pt 12pt;
    color: #475569;
    background: #f8fafc;
    border-radius: 0 4pt 4pt 0;
}

hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 14pt 0;
}

strong {
    font-weight: 700;
    color: #0f172a;
}

.page-title {
    text-align: center;
    margin-bottom: 24pt;
}
.page-title h1 {
    border: none;
    font-size: 20pt;
    color: #1a56db;
}
.page-title .subtitle {
    color: #64748b;
    font-size: 10pt;
}

a {
    color: #1a56db;
    text-decoration: none;
}
"""

def convert(md_path: Path, out_path: Path):
    text = md_path.read_text(encoding="utf-8")

    # 첫 번째 h1을 title 블록으로 감싸기
    title_match = re.match(r'^# (.+)\n', text)
    if title_match:
        title_text = title_match.group(1)
        rest = text[title_match.end():]
        # 날짜 줄 찾기
        date_match = re.match(r'\*\*[^*]+\*\*.*\n', rest)
        if date_match:
            date_line = date_match.group(0).strip()
            rest = rest[date_match.end():]
            header_html = f"""<div class="page-title">
<h1>{title_text}</h1>
<p class="subtitle">{date_line.replace('**', '')}</p>
</div>"""
        else:
            header_html = f"""<div class="page-title"><h1>{title_text}</h1></div>"""
        body_html = markdown.markdown(
            rest,
            extensions=["tables", "fenced_code", "nl2br", "sane_lists"]
        )
        html_body = header_html + body_html
    else:
        html_body = markdown.markdown(
            text,
            extensions=["tables", "fenced_code", "nl2br", "sane_lists"]
        )

    html_full = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>{md_path.stem}</title>
</head>
<body>
{html_body}
</body>
</html>"""

    HTML(string=html_full, base_url=str(md_path.parent)).write_pdf(
        str(out_path),
        stylesheets=[CSS(string=CSS_STYLE)]
    )
    print(f"  ✅ {out_path.name}")


def main():
    base = Path("/home/choeboeun0625/sqld-tutor/docs")
    out_dir = base / "pdf_output"
    out_dir.mkdir(exist_ok=True)

    targets = [
        (base / "week6"  / "tool_design.md",                "week6_tool_design.pdf"),
        (base / "week8"  / "adaptive_learning_design.md",   "week8_adaptive_learning_design.pdf"),
        (base / "week8"  / "dynamic_prompt_design.md",      "week8_dynamic_prompt_design.pdf"),
        (base / "week8"  / "gate2_demo_record.md",          "week8_gate2_demo_record.pdf"),
        (base / "week8"  / "scenario_test_report.md",       "week8_scenario_test_report.pdf"),
        (base / "week12" / "gate3_checklist.md",            "week12_gate3_checklist.pdf"),
        (base / "week12" / "usability_test_report.md",      "week12_usability_test_report.pdf"),
    ]

    print("PDF 변환 시작...")
    for md_path, pdf_name in targets:
        if not md_path.exists():
            print(f"  ⚠️  파일 없음: {md_path}")
            continue
        convert(md_path, out_dir / pdf_name)

    print(f"\n완료! 저장 위치: {out_dir}")

if __name__ == "__main__":
    main()
