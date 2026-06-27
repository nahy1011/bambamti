export default async function handler(req, res) {
  // 3. .env 파일은 GitHub에 올리지 않는다. (보안 점검용 주석)
  // 4. Vercel 배포 시에는 Project Settings의 Environment Variables에 GEMINI_API_KEY를 등록해야 한다.
  
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "POST 메서드만 허용됩니다." });
  }

  const { studentAlias, gradeSummary, learningTraits, teacherConcern } = req.body;

  if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
    return res.status(400).json({ success: false, error: "필수 데이터가 누락되었습니다." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다." });
  }

  const prompt = `당신은 교사를 돕는 "AI 학생 상담 전략 도우미"입니다. 
다음은 특정 학생에 대한 익명화된 정보와 교사의 고민입니다.
- 학생(가명): ${studentAlias}
- 성적 요약: ${gradeSummary}
- 학습 특성: ${learningTraits}
- 교사 고민: ${teacherConcern}

[응답 형식]
반드시 다음 형식으로 응답을 작성하세요:
1. 현재 상황 요약: 
2. 학생 데이터 기반 해석: 
3. 상담 접근 전략: 
4. 교사가 던질 수 있는 질문 3개: 
5. 피해야 할 말 또는 주의점: 
6. 다음 수업에서 해볼 수 있는 작은 지원: 

[프롬프트 원칙]
1. 학생을 단정적으로 판단하거나 진단하지 마세요.
2. "의지가 부족하다", "주의력 문제가 있다", "심리적 문제가 있다"처럼 단정하는 표현을 절대 피하세요.
3. 교사가 학생을 이해하고 긍정적으로 대화할 수 있도록 돕는 방향으로 응답하세요.
4. 응답 마지막에 반드시 "AI 상담 전략은 참고용입니다. 최종 판단과 실제 상담은 교사가 학생의 상황을 종합적으로 고려하여 진행해야 합니다."라는 안내 문구를 포함하세요.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      return res.status(500).json({ success: false, error: "Gemini API 호출에 실패했습니다." });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      return res.status(500).json({ success: false, error: "Gemini 응답을 처리할 수 없습니다." });
    }

    return res.status(200).json({ success: true, result: resultText });

  } catch (error) {
    console.error("Serverless Function Error:", error);
    return res.status(500).json({ success: false, error: "서버 내부 오류가 발생했습니다." });
  }
}
