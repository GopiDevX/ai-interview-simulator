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
    You are a Senior Technical Interviewer at ${questionPlan?.company || 'a top tech company'}. 
    You are currently conducting an interview for a ${questionPlan?.role || 'Software Engineering'} position.
    The interview is currently in the '${stage}' stage.
    Keep your responses concise, conversational, and realistic (1-3 sentences max).
    Do NOT break character. Speak directly to the candidate.
    If the candidate's answer was good, acknowledge it briefly. If it was poor, politely probe deeper or move on.
  `

  if (resumeText) {
    // Check if this is RAG-formatted context (contains section labels) or raw text
    const isRagFormatted = resumeText.includes('[From ') && resumeText.includes(' section')
    if (isRagFormatted) {
      systemInstruction += `\n\nRELEVANT SECTIONS FROM THE CANDIDATE'S RESUME (retrieved via semantic search for this question's context):\n"""\n${resumeText}\n"""\nIMPORTANT: These are the MOST RELEVANT sections of the candidate's resume for the current conversation topic. Use them to ask deeply personalized follow-up questions referencing specific projects, technologies, or achievements mentioned. Do NOT ask generic questions when specific context is available.`
    } else {
      systemInstruction += `\n\nCANDIDATE'S RESUME:\n"""\n${resumeText}\n"""\nIMPORTANT: Use the candidate's resume provided above to tailor your questions and responses to their actual past experience, projects, and skills where applicable.`
    }
  }

  // Inject company-specific intelligence from the curated dataset
  if (companyContext) {
    systemInstruction += `\n\n${companyContext}\nIMPORTANT: Use the company-specific interview data above to calibrate your questions to the EXACT difficulty level, focus areas, and interview style of this company. Ask questions that this company actually asks in real interviews. Adjust your expectations based on the company's hiring criteria.`
  }

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
