const { GoogleGenAI } = require('@google/genai')
const mockAiService = require('./mockAiService')

const getGeminiClient = () => {
  return process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null
}

const generateQuestionPlan = (role, company) => {
  // We can reuse the mock question plan for structure, or generate one with Gemini.
  // For safety and speed in the MVP, we'll reuse the mock structure.
  return mockAiService.generateQuestionPlan(role, company)
}

const evaluateAnswer = (question, answer) => {
  // Reusing mock evaluation for speed, but could be upgraded to Gemini
  return mockAiService.evaluateAnswer(question, answer)
}

const evaluateCode = (question, code, language) => {
  // Reusing mock evaluation for speed
  return mockAiService.evaluateCode(question, code, language)
}

const getInterviewerResponse = async (stage, questionIndex, questionPlan, candidateMessage) => {
  const ai = getGeminiClient()
  if (!ai) return mockAiService.getInterviewerResponse(stage, questionIndex, questionPlan, candidateMessage)

  const systemInstruction = `
    You are a Senior Technical Interviewer at ${questionPlan?.company || 'a top tech company'}. 
    You are currently conducting an interview for a ${questionPlan?.role || 'Software Engineering'} position.
    The interview is currently in the '${stage}' stage.
    Keep your responses concise, conversational, and realistic (1-3 sentences max).
    Do NOT break character. Speak directly to the candidate.
    If the candidate's answer was good, acknowledge it briefly. If it was poor, politely probe deeper or move on.
  `

  let prompt = `The candidate just said: "${candidateMessage}".\n\n`
  
  if (stage === 'intro') {
    prompt += `Acknowledge their introduction and ask the first background question: ${questionPlan?.backgroundQuestions?.[0]?.question || 'Can you walk me through your most impactful project?'}`
  } else if (stage === 'background') {
    const q = questionPlan?.backgroundQuestions?.[questionIndex] || { question: "Let's move on to some technical questions." }
    prompt += `Respond to their answer and then ask: ${q.question}`
  } else if (stage === 'technical') {
    const q = questionPlan?.technicalQuestions?.[questionIndex] || { question: "Let's shift to some behavioral questions." }
    prompt += `Acknowledge their technical answer and ask: ${q.question}`
  } else if (stage === 'behavioral') {
    const q = questionPlan?.behavioralQuestions?.[questionIndex] || { question: "Great. Let's move to a coding exercise now." }
    prompt += `Acknowledge their behavioral answer and ask: ${q.question}`
  } else if (stage === 'coding') {
    prompt += `Encourage them on the coding exercise.`
  } else {
    prompt += `Ask a relevant follow up question.`
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    })
    return response.text
  } catch (error) {
    console.error('Gemini API Error:', error)
    return mockAiService.getInterviewerResponse(stage, questionIndex, questionPlan, candidateMessage)
  }
}

const generateReport = async (transcript, sessionData) => {
  const ai = getGeminiClient()
  if (!ai) return mockAiService.generateReport(transcript, sessionData)

  const systemInstruction = `
    You are an expert technical interviewer evaluating a candidate for a ${sessionData.role} role at ${sessionData.company}.
    You will be provided with a transcript of the interview.
    Generate a highly accurate, constructive JSON report of their performance.
    IMPORTANT: You MUST return valid JSON adhering EXACTLY to the following schema:
    {
      "type": "object",
      "properties": {
        "overallScore": { "type": "number", "description": "Score from 0 to 100" },
        "hiringSuggestion": { "type": "string", "enum": ["Strong Hire", "Hire", "Borderline", "No Hire"] },
        "summary": { "type": "string", "description": "A 2-3 sentence overall summary" },
        "scores": {
          "type": "object",
          "properties": {
            "communication": { "type": "number", "description": "0-100" },
            "technicalKnowledge": { "type": "number", "description": "0-100" },
            "problemSolving": { "type": "number", "description": "0-100" },
            "behavioralSkills": { "type": "number", "description": "0-100" }
          },
          "required": ["communication", "technicalKnowledge", "problemSolving", "behavioralSkills"]
        },
        "strengths": { "type": "array", "items": { "type": "string" }, "minItems": 2 },
        "improvements": { "type": "array", "items": { "type": "string" }, "minItems": 2 },
        "detailedFeedback": {
          "type": "object",
          "properties": {
            "communication": { "type": "string" },
            "technical": { "type": "string" },
            "behavioral": { "type": "string" }
          },
          "required": ["communication", "technical", "behavioral"]
        },
        "recommendedResources": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "topic": { "type": "string" },
              "resource": { "type": "string" }
            }
          }
        }
      },
      "required": ["overallScore", "hiringSuggestion", "summary", "scores", "strengths", "improvements", "detailedFeedback", "recommendedResources"]
    }
  `

  const transcriptText = transcript.map(t => `${t.role.toUpperCase()}: ${t.content}`).join('\n')
  const prompt = `Please evaluate the following interview transcript:\n\n${transcriptText}\n\nCandidate also scored ${sessionData.codeScore || 0}/10 on the coding round.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    })
    
    return JSON.parse(response.text)
  } catch (error) {
    console.error('Gemini Report Error:', error)
    return mockAiService.generateReport(transcript, sessionData)
  }
}

module.exports = {
  generateQuestionPlan,
  evaluateAnswer,
  evaluateCode,
  getInterviewerResponse,
  generateReport
}
