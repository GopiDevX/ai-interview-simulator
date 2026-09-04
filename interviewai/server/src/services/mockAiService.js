/**
 * Mock AI Service — Simulates Claude API responses for MVP
 * Generates realistic interview questions, evaluations, and reports
 * without requiring any external API keys.
 */

// ── QUESTION BANK ────────────────────────────────────────────────────────────

const backgroundQuestions = {
  general: [
    "I can see you've had some interesting experiences. Can you walk me through your most impactful project and what your specific contribution was?",
    "Looking at your background, what has been your proudest technical achievement so far, and what made it challenging?",
    "I notice you've worked with several technologies. Can you describe a situation where you had to learn a new technology quickly to meet a deadline?"
  ]
}

const technicalQuestions = {
  'Frontend Developer': [
    "Can you explain the difference between React's useMemo and useCallback hooks, and when you'd use each?",
    "How would you optimize a React application that's experiencing slow renders? Walk me through your debugging process.",
    "Explain the concept of code splitting in a React app and how you'd implement it.",
    "What's your approach to managing global state in a large React application? Compare Redux, Zustand, and Context API.",
    "How does the browser's event loop work, and how does this affect async operations in JavaScript?"
  ],
  'Backend Developer': [
    "Explain the difference between SQL and NoSQL databases and when you'd choose one over the other.",
    "How would you design a rate-limiting system for a public API? Walk me through your approach.",
    "What are the key principles of RESTful API design, and what common mistakes do developers make?",
    "How do you handle database transactions and ensure data consistency in a distributed system?",
    "Explain how you'd implement authentication and authorization in a Node.js application."
  ],
  'Full Stack Developer': [
    "Describe your approach to designing a scalable web application from scratch. What considerations do you prioritize?",
    "How would you implement real-time features in a web application? Compare WebSockets, Server-Sent Events, and polling.",
    "Explain how you'd set up a CI/CD pipeline for a full-stack application.",
    "How do you approach API versioning, and what strategies do you use to maintain backward compatibility?",
    "Walk me through how you'd debug a performance issue that only appears in production."
  ],
  'Data Engineer': [
    "Explain the difference between batch processing and stream processing. When would you use each?",
    "How would you design a data pipeline that ingests millions of records per day?",
    "What are the key differences between a data lake and a data warehouse?",
    "How do you ensure data quality and handle corrupt or missing data in your pipelines?",
    "Explain the CAP theorem and how it affects your database design decisions."
  ],
  'DevOps Engineer': [
    "How would you implement a zero-downtime deployment strategy for a production application?",
    "Explain the key differences between Docker and Kubernetes, and when you'd use each.",
    "How do you approach monitoring and alerting for a microservices architecture?",
    "Walk me through how you'd investigate a sudden spike in server CPU usage in production.",
    "What's your approach to secrets management in a cloud environment?"
  ]
}

const behavioralQuestions = [
  "Tell me about a time when you had a disagreement with a teammate about a technical decision. How did you resolve it?",
  "Describe a situation where you had to deliver a project under a very tight deadline. What was your approach?",
  "Tell me about a time you made a significant mistake in your work. How did you handle it and what did you learn?",
  "Can you describe a time when you had to explain a complex technical concept to a non-technical stakeholder?",
  "Tell me about a project where you took initiative to improve something beyond what was asked of you."
]

const codingQuestions = [
  {
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]." }
    ],
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Only one valid answer exists."],
    difficulty: "Easy",
    solution: "Use a hash map to store each number and its index. For each number, check if target - number exists in the map."
  },
  {
    title: "Valid Parentheses",
    description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets, and open brackets are closed in the correct order.",
    examples: [
      { input: 's = "()"', output: "true", explanation: "The brackets are properly matched." },
      { input: 's = "()[]{}"', output: "true", explanation: "All three pairs are properly matched." },
      { input: 's = "(]"', output: "false", explanation: "The brackets don't match." }
    ],
    constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
    difficulty: "Easy",
    solution: "Use a stack to track opening brackets. For each closing bracket, check if it matches the top of the stack."
  },
  {
    title: "Maximum Subarray",
    description: "Given an integer array `nums`, find the subarray with the largest sum and return its sum. A subarray is a contiguous part of the array.",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum = 6." },
      { input: "nums = [1]", output: "1", explanation: "The only element is the answer." }
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    difficulty: "Medium",
    solution: "Use Kadane's algorithm: track the current subarray sum and reset to 0 when it goes negative."
  },
  {
    title: "Reverse Linked List",
    description: "Given the `head` of a singly linked list, reverse the list and return the reversed list. Each node has a `val` and `next` property.",
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]", explanation: "The list is fully reversed." },
      { input: "head = [1,2]", output: "[2,1]", explanation: "Two element list reversed." }
    ],
    constraints: ["The number of nodes in the list is in range [0, 5000].", "-5000 <= Node.val <= 5000"],
    difficulty: "Easy",
    solution: "Iteratively or recursively reverse the pointers. Track prev, curr, and next nodes."
  }
]

// ── EVALUATION RESPONSES ─────────────────────────────────────────────────────

const evaluationFeedback = {
  excellent: [
    "Excellent response! You demonstrated a deep understanding of the concept with clear, structured reasoning and real-world context.",
    "Outstanding answer. You not only covered the fundamentals but also addressed edge cases and trade-offs, which shows senior-level thinking.",
    "Very impressive. Your answer was comprehensive, accurate, and well-articulated with practical examples from your experience."
  ],
  good: [
    "Good answer. You covered the main points clearly. To strengthen this further, consider discussing specific trade-offs or performance implications.",
    "Solid response. You demonstrated good understanding of the core concepts. Adding more concrete examples from your experience would make this even stronger.",
    "Nice answer. The explanation was clear and mostly complete. A deeper dive into the underlying mechanisms would elevate this to an excellent response."
  ],
  average: [
    "Reasonable attempt. You touched on the key concepts but the explanation lacked depth. Try to structure your answers with specific examples and trade-offs.",
    "You covered the basics, but the answer could benefit from more technical specificity. Consider discussing the 'why' behind your approach, not just the 'what'.",
    "Partial credit here. You identified the right direction but missed some important aspects. Review the topic to strengthen your understanding."
  ],
  weak: [
    "This answer needs more work. The core concept wasn't quite captured correctly. I'd recommend reviewing this topic before your actual interview.",
    "The response was quite vague and missed the key technical aspects. Make sure you can explain this concept clearly with examples.",
    "Unfortunately, this answer didn't address the question accurately. Focus on understanding the fundamentals of this topic."
  ]
}

// ── SERVICE FUNCTIONS ────────────────────────────────────────────────────────

const generateQuestionPlan = (role, company) => {
  const techQs = technicalQuestions[role] ||
    technicalQuestions['Full Stack Developer']

  const shuffledTech = [...techQs].sort(() => Math.random() - 0.5).slice(0, 3)
  const shuffledBehavioral = [...behavioralQuestions].sort(() => Math.random() - 0.5).slice(0, 2)
  const background = backgroundQuestions.general.sort(() => Math.random() - 0.5).slice(0, 2)
  const coding = codingQuestions[Math.floor(Math.random() * codingQuestions.length)]

  return {
    backgroundQuestions: background.map(q => ({ question: q, context: `Based on the candidate's profile and experience` })),
    technicalQuestions: shuffledTech.map(q => ({ question: q, expectedTopics: ['core concept', 'best practices', 'real-world application'] })),
    behavioralQuestions: shuffledBehavioral.map(q => ({ question: q })),
    codingQuestion: coding
  }
}

const evaluateAnswer = (question, answer) => {
  const wordCount = answer.split(/\s+/).filter(Boolean).length
  let score, category

  if (wordCount < 10) {
    score = Math.floor(Math.random() * 3) + 1
    category = 'weak'
  } else if (wordCount < 30) {
    score = Math.floor(Math.random() * 2) + 3
    category = 'average'
  } else if (wordCount < 80) {
    score = Math.floor(Math.random() * 2) + 5
    category = 'good'
  } else {
    score = Math.floor(Math.random() * 2) + 7
    category = 'good'
  }

  // Bonus for keywords
  const technicalKeywords = ['algorithm', 'complexity', 'optimize', 'performance', 'scalable', 'pattern', 'design', 'architecture', 'database', 'cache', 'async', 'concurrent', 'state', 'component', 'hook', 'api', 'rest', 'query']
  const keywordMatches = technicalKeywords.filter(kw => answer.toLowerCase().includes(kw)).length
  score = Math.min(10, score + Math.floor(keywordMatches / 2))

  if (score >= 8) category = 'excellent'
  else if (score >= 6) category = 'good'
  else if (score >= 4) category = 'average'
  else category = 'weak'

  const feedbackOptions = evaluationFeedback[category]
  const feedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)]

  const strengths = score >= 5
    ? ['Structured response', 'Clear communication']
    : ['Attempted to address the question']
  const improvements = score < 8
    ? ['Provide more specific examples', 'Dive deeper into technical trade-offs']
    : ['Continue demonstrating this level of depth']

  return { score, feedback, strengths, improvements }
}

const evaluateCode = (question, code, language) => {
  const lineCount = code.split('\n').filter(l => l.trim()).length
  const hasReturnStatement = code.includes('return')
  const hasLoops = /for|while|forEach|map|reduce/.test(code)
  const hasConditions = /if|switch|ternary/.test(code)

  let score = 5
  if (lineCount > 3) score++
  if (hasReturnStatement) score++
  if (hasLoops || hasConditions) score++
  if (lineCount > 8) score++
  score = Math.min(10, Math.max(1, score + Math.floor(Math.random() * 2) - 1))

  const isCorrect = score >= 6
  const complexities = ['O(n)', 'O(n²)', 'O(log n)', 'O(n log n)', 'O(1)']
  const spaceComplexities = ['O(n)', 'O(1)', 'O(log n)']

  return {
    score,
    isCorrect,
    timeComplexity: complexities[Math.floor(Math.random() * 3)],
    spaceComplexity: spaceComplexities[Math.floor(Math.random() * 2)],
    feedback: isCorrect
      ? `Good solution! The code appears to handle the main cases correctly. ${lineCount > 8 ? 'The logic is well-structured.' : 'Consider adding edge case handling for more robust code.'}`
      : `The solution has some issues that would prevent it from passing all test cases. Review the logic carefully, especially edge cases like empty inputs and boundary conditions.`,
    improvements: score < 8
      ? ['Add input validation for edge cases', 'Consider time complexity optimizations', 'Add comments to explain your approach']
      : ['Great solution — consider if there\'s a more memory-efficient approach', 'Well done on handling edge cases']
  }
}

// Generates AI interviewer response chunks (simulated streaming)
const getInterviewerResponse = (stage, questionIndex, questionPlan, candidateMessage) => {
  const responses = {
    intro: [
      `Hello! I'm Alex, a senior technical interviewer here. Thanks for joining us today for the ${questionPlan?.role || 'engineering'} position. I'm excited to learn more about your background and experience. To kick things off, could you please give me a brief introduction about yourself — your background, what you've been working on recently, and what excites you about this opportunity?`
    ],
    background: questionPlan?.backgroundQuestions?.map(q => {
      return `Thank you for sharing that — it's really helpful context. ${q.question}`
    }) || [
      "Thank you for that introduction! Let me ask you about your experience. Can you walk me through your most impactful project and what your specific contribution was?",
      "That's fascinating. Based on what you've shared, can you tell me about a challenging technical problem you solved and how you approached it?"
    ],
    technical: questionPlan?.technicalQuestions?.map((q, i) => {
      const transitions = [
        "Great answer, thank you. Let's move into some more technical territory now.",
        "I appreciate the detail there. Let's continue with another technical question.",
        "Very interesting perspective. One more technical question for you."
      ]
      return `${transitions[i % transitions.length]} ${q.question}`
    }) || [],
    behavioral: questionPlan?.behavioralQuestions?.map((q, i) => {
      const transitions = [
        "Excellent technical knowledge! Let's shift to some behavioral questions now.",
        "Thanks for that example. I have one more situational question."
      ]
      return `${transitions[i % transitions.length]} ${q.question}`
    }) || [],
    coding: [
      "Fantastic — you've done really well in this section. Let's move to a short coding exercise now. I'll hand you over to the coding environment. Good luck!"
    ],
    followup: [
      `That's an interesting answer. Could you elaborate a bit more on ${candidateMessage?.split(' ').slice(0, 3).join(' ') || 'that point'}? Specifically, what were the trade-offs you considered?`,
      "I appreciate that response. Can you give me a specific example from your experience that illustrates this point?",
      "Interesting perspective. How would you approach this differently if you were working in a larger scale system?"
    ]
  }

  const stageResponses = responses[stage] || responses.followup
  const response = stageResponses[questionIndex % stageResponses.length] ||
    stageResponses[stageResponses.length - 1]

  return response || "Thank you for sharing that. Let's move on to the next topic."
}

const generateReport = (transcript, sessionData) => {
  const candidateMessages = transcript.filter(m => m.role === 'candidate')
  const scores = candidateMessages.filter(m => m.score !== null && m.score !== undefined).map(m => m.score)

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 6

  const overallScore = Math.min(100, Math.round(avgScore * 10 + Math.floor(Math.random() * 10)))
  const communication = Math.min(100, overallScore + Math.floor(Math.random() * 10) - 5)
  const technical = Math.min(100, overallScore + Math.floor(Math.random() * 10) - 5)
  const problemSolving = Math.min(100, overallScore + Math.floor(Math.random() * 10) - 5)
  const behavioral = Math.min(100, overallScore + Math.floor(Math.random() * 10) - 5)

  const codeBonus = sessionData?.codeScore ? Math.round(sessionData.codeScore * 2) : 0
  const finalOverall = Math.min(100, Math.round((overallScore + codeBonus) / (codeBonus > 0 ? 1.2 : 1)))

  let hiringSuggestion = 'Borderline'
  if (finalOverall >= 80) hiringSuggestion = 'Strong Hire'
  else if (finalOverall >= 65) hiringSuggestion = 'Hire'
  else if (finalOverall >= 45) hiringSuggestion = 'Borderline'
  else hiringSuggestion = 'No Hire'

  const allStrengths = [
    'Clear and structured communication',
    'Strong understanding of core concepts',
    'Good problem-solving approach',
    'Demonstrates real-world experience',
    'Takes initiative in explaining thought process',
    'Shows depth of technical knowledge',
    'Handles follow-up questions well'
  ]

  const allImprovements = [
    'Dive deeper into system design concepts',
    'Practice explaining trade-offs more explicitly',
    'Strengthen knowledge of algorithmic complexity',
    'Work on conciseness — some answers were overly verbose',
    'Provide more quantified impact in experience descriptions',
    'Brush up on distributed systems fundamentals',
    'Improve confidence when discussing unfamiliar topics'
  ]

  const strengths = allStrengths.sort(() => Math.random() - 0.5).slice(0, 3)
  const improvements = allImprovements.sort(() => Math.random() - 0.5).slice(0, 3)

  return {
    overallScore: finalOverall,
    scores: {
      communication: Math.max(10, communication),
      technicalKnowledge: Math.max(10, technical),
      problemSolving: Math.max(10, problemSolving),
      behavioralSkills: Math.max(10, behavioral)
    },
    summary: `The candidate demonstrated ${finalOverall >= 70 ? 'a solid' : 'a reasonable'} understanding of ${sessionData?.role || 'software engineering'} fundamentals with ${finalOverall >= 70 ? 'clear and confident' : 'generally clear'} communication throughout the interview. ${finalOverall >= 70 ? 'They showed good depth in technical questions and provided relevant examples from their experience.' : 'There is room to improve technical depth and provide more concrete examples.'} The coding round ${sessionData?.codeScore >= 6 ? 'was completed successfully with a good approach.' : 'could be stronger with more attention to edge cases.'} Overall, this candidate ${hiringSuggestion === 'Strong Hire' || hiringSuggestion === 'Hire' ? 'would be a good fit' : 'needs more preparation'} for the ${sessionData?.role || 'role'} at ${sessionData?.company || 'the company'}.`,
    strengths,
    improvements,
    detailedFeedback: {
      communication: `The candidate's communication was ${communication >= 70 ? 'clear and well-structured' : 'adequate but could be improved'}. They ${communication >= 70 ? 'explained technical concepts in an accessible way and maintained good clarity throughout the interview.' : 'sometimes used vague language and could benefit from more structured responses using frameworks like STAR.'}`,
      technical: `Technical knowledge was ${technical >= 70 ? 'strong, with accurate answers to most questions and good understanding of underlying principles.' : 'mixed, with some gaps in fundamental concepts that should be addressed before interviewing at senior level.'}${technical >= 70 ? ' The candidate showed awareness of trade-offs and real-world constraints.' : ' More hands-on practice and study of core CS fundamentals is recommended.'}`,
      behavioral: `In behavioral questions, the candidate ${behavioral >= 70 ? 'provided well-structured examples using the STAR method and demonstrated good self-awareness.' : 'struggled to provide specific, quantified examples. Practice structuring past experiences using the STAR framework (Situation, Task, Action, Result).'}`
    },
    recommendedResources: [
      { topic: 'System Design', resource: '"Designing Data-Intensive Applications" by Martin Kleppmann' },
      { topic: 'Algorithms', resource: 'LeetCode Top 150 Interview Questions + NeetCode.io' },
      { topic: 'Behavioral Interviews', resource: '"Cracking the Coding Interview" by Gayle McDowell' },
      { topic: 'Frontend', resource: 'JavaScript.info + "Learning React" by Alex Banks' }
    ],
    hiringSuggestion
  }
}

module.exports = {
  generateQuestionPlan,
  evaluateAnswer,
  evaluateCode,
  getInterviewerResponse,
  generateReport
}
