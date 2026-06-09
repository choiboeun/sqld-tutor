export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-xl font-bold text-gray-800 mb-1">개인정보처리방침</h1>
        <p className="text-xs text-gray-400 mb-8">최종 수정일: 2026년 6월 9일</p>

        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-700 mb-3">1. 수집하는 개인정보 항목 및 수집 방법</h2>
          <p className="text-sm text-gray-600 mb-2">서비스 이용 시 아래 정보를 수집합니다.</p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">항목</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">수집 방법</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-3 py-2">이메일 주소</td>
                <td className="border border-gray-200 px-3 py-2">회원가입 시 직접 입력</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-3 py-2">학습 기록 (카테고리별 정답률, 풀이 수, 오답 목록)</td>
                <td className="border border-gray-200 px-3 py-2">서비스 이용 중 자동 수집</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">채팅 내역 (질문 및 AI 응답)</td>
                <td className="border border-gray-200 px-3 py-2">서비스 이용 중 자동 수집</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-3 py-2">이용 이벤트 (세션 시작, 기능 사용 시각)</td>
                <td className="border border-gray-200 px-3 py-2">서비스 이용 중 자동 수집</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-700 mb-3">2. 개인정보 수집 및 이용 목적</h2>
          <ul className="text-sm text-gray-600 space-y-1 list-disc ml-4">
            <li>회원 식별 및 서비스 제공</li>
            <li>개인 맞춤형 학습 경험 제공 (약점 분석, 난이도 조절)</li>
            <li>서비스 품질 개선 및 통계 분석</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-700 mb-3">3. 개인정보 보유 및 이용 기간</h2>
          <p className="text-sm text-gray-600">
            회원 탈퇴 시까지 보유합니다. 탈퇴 요청 시 30일 이내에 파기합니다.
            단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-700 mb-3">4. 개인정보의 제3자 제공</h2>
          <p className="text-sm text-gray-600 mb-2">
            서비스 운영을 위해 아래 업체에 개인정보 처리를 위탁합니다.
          </p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">업체</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">처리 내용</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">보유 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-3 py-2">Supabase (미국)</td>
                <td className="border border-gray-200 px-3 py-2">인증 및 데이터 저장</td>
                <td className="border border-gray-200 px-3 py-2">회원 탈퇴 시</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-3 py-2">Google (미국)</td>
                <td className="border border-gray-200 px-3 py-2">AI 응답 생성 (Gemini API)</td>
                <td className="border border-gray-200 px-3 py-2">처리 후 즉시 파기</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2">Anthropic (미국)</td>
                <td className="border border-gray-200 px-3 py-2">AI 응답 생성 (Claude API)</td>
                <td className="border border-gray-200 px-3 py-2">처리 후 즉시 파기</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-3 py-2">LangChain (미국)</td>
                <td className="border border-gray-200 px-3 py-2">AI 처리 흐름 로깅 (LangSmith)</td>
                <td className="border border-gray-200 px-3 py-2">30일</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-700 mb-3">5. 정보주체의 권리</h2>
          <p className="text-sm text-gray-600">
            이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.
            아래 이메일로 요청하시면 10일 이내에 처리합니다.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold text-gray-700 mb-3">6. 개인정보 보호 담당자</h2>
          <div className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
            <p>이메일: <a href="mailto:libresearch8@gmail.com" className="text-blue-600 hover:underline">libresearch8@gmail.com</a></p>
            <p className="mt-1 text-xs text-gray-400">문의 사항은 이메일로 연락해주세요. 영업일 기준 3일 이내 답변드립니다.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
