let GoogleGenAI
try {
  GoogleGenAI = require('@google/genai').GoogleGenAI
} catch {
  GoogleGenAI = null
}
const mockAiService = require('./mockAiService')

const getGeminiClient = () => {
  return (process.env.GEMINI_API_KEY && GoogleGenAI) ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null
}

const generateQuestionPlan = (role, company, companyProfile = null) => {
  // Use company-specific questions from the knowledge base when available
  const basePlan = mockAiService.generateQuestionPlan(role, company)
  
  if (companyProfile && companyProfile.commonQuestions) {
    // Enhance the plan with real company-specific questions
    const companyTechnical = companyProfile.commonQuestions
      .filter(q => q.category === 'technical')
      .map(q => ({ question: q.question, difficulty: q.difficulty }))
    const companyBehavioral = companyProfile.commonQuestions
      .filter(q => q.category === 'behavioral')
      .map(q => ({ question: q.question, difficulty: q.difficulty }))
    const companyCoding = companyProfile.commonQuestions
      .filter(q => q.category === 'coding')
      .map(q => ({ question: q.question, difficulty: q.difficulty }))

    // Merge: company-specific questions first, then generic fallbacks
    if (companyTechnical.length > 0) {
      basePlan.technicalQuestions = [...companyTechnical, ...(basePlan.technicalQuestions || [])].slice(0, 5)
    }
    if (companyBehavioral.length > 0) {
      basePlan.behavioralQuestions = [...companyBehavioral, ...(basePlan.behavioralQuestions || [])].slice(0, 5)
    }
    if (companyCoding.length > 0) {
      basePlan.codingQuestions = companyCoding
    }
    
    basePlan.companyName = companyProfile.name
    basePlan.difficulty = companyProfile.typicalDifficulty
    console.log(`[RAG] Enhanced question plan with ${companyTechnical.length} technical + ${companyBehavioral.length} behavioral questions from ${companyProfile.name} dataset`)
  }

  return basePlan
}

const evaluateAnswer = (question, answer) => {
  // Reusing mock evaluation for speed, but could be upgraded to Gemini
  return mockAiService.evaluateAnswer(question, answer)
}

const evaluateCode = (question, code, language) => {
  // Reusing mock evaluation for speed
  return mockAiService.evaluateCode(question, code, language)
}

const getInterviewerResponse = async (stage, questionIndex, questionPlan, candidateMessage, resumeText, companyContext = '') => {
  const ai = getGeminiClient()
  if (!ai) return mockAiService.getInterviewerResponse(stage, questionIndex, questionPlan, candidateMessage)

  let systemInstruction = `
    You are a Lead IT Talent Acquisition Partner & Senior Technical HR Interviewer at ${questionPlan?.company || 'a top-tier enterprise technology company'}.
    You are conducting an official interview for a ${questionPlan?.role || 'Software Engineering'} candidate.
    Current interview stage: '${stage}'.

    CORE HR INTERVIEWING PRINCIPLES:
    1. Tone: Warm, articulate, perceptive, highly professional, and encouraging yet rigorous.
    2. Conversational Realism: Speak directly to the candidate as a real human HR interviewer across a table (1-3 sentences max).
    3. Active Affirmation: Start by briefly acknowledging their specific points (e.g. "I appreciate you walking me through that database index design", "That's a great example of handling sprint pressure").
    4. STAR Framework: For behavioral/experience questions, evaluate if they demonstrated Situation, Task, Action, and Result with quantifiable impact.
    5. Follow-ups: If their answer was too generic or brief, politely ask for the specific technical action THEY personally took.
    6. Never break character. Never state "As an AI".
  `

  if (resumeText) {
    // Check if this is RAG-formatted context (contains section labels) or raw text
    const isRagFormatted = resumeText.includes('[From ') && resumeText.includes(' section')
    if (isRagFormatted) {
      systemInstruction += `\n\nRELEVANT SECTIONS FROM THE CANDIDATE'S RESUME (retrieved via semantic search):\n"""\n${resumeText}\n"""\nIMPORTANT: Use these specific projects, metrics, and tools mentioned to ask tailored follow-up questions.`
    } else {
      systemInstruction += `\n\nCANDIDATE'S RESUME:\n"""\n${resumeText}\n"""\nIMPORTANT: Tailor your questions and feedback to their stated achievements, tools, and roles.`
    }
  }

  // Inject company-specific intelligence from the curated dataset
  if (companyContext) {
    systemInstruction += `\n\n${companyContext}\nIMPORTANT: Use the company-specific rubric to calibrate your questions to this company's culture and hiring bar.`
  }

  let prompt = `The candidate just answered: "${candidateMessage}".\n\n`
  
  if (stage === 'intro') {
    prompt += `Welcome them warmly to the interview, acknowledge their background, and transition smoothly to ask the first project question: "${questionPlan?.backgroundQuestions?.[0]?.question || 'Can you walk me through the most technically challenging project you have led, and your specific role in it?'}"`
  } else if (stage === 'background') {
    const q = questionPlan?.backgroundQuestions?.[questionIndex] || { question: "Let's transition into your technical core competencies." }
    prompt += `Acknowledge their response with a natural recruiter observation, and then ask: "${q.question}"`
  } else if (stage === 'technical') {
    const q = questionPlan?.technicalQuestions?.[questionIndex] || { question: "Thank you for that technical breakdown. Let's move into situational and teamwork scenarios." }
    prompt += `Provide a concise professional reaction to their technical reasoning, and ask: "${q.question}"`
  } else if (stage === 'behavioral') {
    const q = questionPlan?.behavioralQuestions?.[questionIndex] || { question: "Excellent insight. Next, we will transition into our practical coding and problem-solving evaluation." }
    prompt += `Acknowledge their behavioral STAR answer and ask: "${q.question}"`
  } else if (stage === 'coding') {
    prompt += `Encourage them warmly as they transition into the live coding challenge.`
  } else {
    prompt += `Provide a polite, thoughtful HR follow-up question.`
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
