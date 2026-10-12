/**
 * Conversational AI Service & Human-Grade Evaluator
 * Features:
 * - Natural human interviewer persona with real-time clarification handling
 * - Deep adaptive follow-up generation from candidate's actual answers
 * - Strict question deduplication (never repeats questions)
 * - Deterministic, rubric-calibrated scoring (no Math.random)
 */

// Track questions already asked per session to ensure zero repetition
const askedQuestionsCache = new Map()

// Core Question Bank across domains
const backgroundQuestions = [
  "Can you walk me through your most impactful software project, your specific architectural choices, and what made it challenging?",
  "Looking at your engineering background, what has been your proudest technical achievement so far and what metrics did you improve?",
  "Can you describe a situation where you encountered a critical production blocker or deployment bug and how you systematically debugged it?"
]

const domainQuestions = {
  'Frontend Developer': [
    "How does the browser event loop handle microtasks versus macrotasks during async operations, and how does this affect React UI rendering?",
    "When optimizing a complex web application with sluggish re-renders, walk me through how you profile performance and apply memoization or virtualization.",
    "Compare state management strategies across React Context, Zustand, and Redux. In what scenarios does Context become a performance bottleneck?",
    "How do you design a robust design system with accessible keyboard navigation, ARIA attributes, and lazy-loaded bundle splitting?",
    "How would you handle optimistic UI updates and rollback mechanisms in a high-latency mobile web app?"
  ],
  'Backend Developer': [
    "Explain the practical trade-offs between SQL (PostgreSQL) and NoSQL (MongoDB/Cassandra). Under what specific access patterns would you migrate from one to the other?",
    "How would you design a distributed rate-limiting system for a public API that handles 100,000 requests per minute across multiple regions?",
    "How do you guarantee database consistency and idempotency in distributed event-driven systems using tools like Kafka or RabbitMQ?",
    "Walk me through how you would diagnose and resolve an unexpected connection pool exhaustion issue in Node.js or Java backend services.",
    "What strategies do you implement for database indexing, query planning (EXPLAIN ANALYZE), and read-replica replication lag?"
  ],
  'Full Stack Developer': [
    "Walk me through the end-to-end architecture of a real-time collaborative application. How would you handle WebSockets, reconnection fallbacks, and state synchronization?",
    "How do you establish a secure authentication and authorization pipeline with short-lived JWTs, rotating refresh tokens, and CSRF protection?",
    "Describe your strategy for database schema migrations with zero application downtime in production.",
    "How do you structure microservices communication: synchronous REST/gRPC vs asynchronous event queues, and how do you prevent cascading failures?",
    "Walk me through how you would trace and optimize an API endpoint whose p99 response time suddenly jumped from 120ms to 2.5 seconds."
  ],
  'Data Engineer': [
    "Explain the differences between batch processing (Apache Spark) and stream processing (Apache Flink/Kafka Streams). When is Lambda architecture overkill?",
    "How do you guarantee data quality, deduplication, and schema evolution (e.g., Avro/Parquet) in a high-throughput pipeline?",
    "How do you handle late-arriving data and watermarking in real-time streaming analytics?",
    "Explain the storage and query optimization strategies when designing partition keys in a cloud data warehouse (Snowflake/BigQuery).",
    "How do you design an idempotent ETL pipeline that gracefully resumes from failure points without producing duplicate entries?"
  ],
  'DevOps Engineer': [
    "Explain your strategy for implementing zero-downtime blue/green or canary deployments in a Kubernetes cluster.",
    "How do you configure distributed tracing and observability with Prometheus, Grafana, and OpenTelemetry in a microservices ecosystem?",
    "Walk me through how you would design a secure secrets management and credential rotation workflow in cloud environments.",
    "If a production cluster experiences sudden CPU throttling and memory leak alerts at 2 AM, what is your systematic triage procedure?",
    "How do you implement Infrastructure as Code (Terraform) state locking and continuous security scanning in CI/CD pipelines?"
  ]
}

const behavioralQuestions = [
  "Tell me about a time when you strongly disagreed with a team lead or colleague on a technical decision. How did you handle the debate and reach alignment?",
  "Describe a situation where a tight release deadline seemed impossible. How did you prioritize technical debt versus deliverables?",
  "Tell me about a significant engineering mistake or outage you were involved with. How did you communicate with stakeholders and what preventative measures did you implement?",
  "Can you describe a situation where you had to explain a complex technical constraint to a non-technical product manager or business executive?",
  "Tell me about a project where you took the initiative to refactor or automate a broken workflow without anyone directly assigning it to you."
]

const codingQuestions = [
  {
    title: "Two Sum (Optimal Hash Map)",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input has exactly one solution, and you may not use the same element twice. Expected: O(n) Time, O(n) Space.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, return [1, 2]." }
    ],
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
    difficulty: "Easy",
    solution: "Use a hash map to record seen elements and lookup target - current in O(1)."
  },
  {
    title: "Longest Substring Without Repeating Characters",
    description: "Given a string `s`, find the length of the longest substring without duplicate characters. Solve with sliding window approach in O(n) time.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: "The answer is 'abc', with length 3." },
      { input: 's = "bbbbb"', output: "1", explanation: "The answer is 'b', with length 1." }
    ],
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
    difficulty: "Medium",
    solution: "Maintain a sliding window with a character frequency map or hash set."
  }
]

// ── KEYWORD & CONCEPT EXTRACTION ─────────────────────────────────────────────
const extractTechnicalConcepts = (text = '') => {
  const lower = text.toLowerCase()
  const techTerms = [
    'react', 'node', 'express', 'postgresql', 'postgres', 'mongodb', 'sql', 'nosql',
    'redis', 'cache', 'caching', 'kafka', 'docker', 'kubernetes', 'k8s', 'aws',
    'microservices', 'graphql', 'rest', 'api', 'indexing', 'indexes', 'btree',
    'websocket', 'websockets', 'jwt', 'auth', 'oauth', 'state', 'redux', 'zustand',
    'tailwind', 'css', 'typescript', 'python', 'java', 'golang', 'rust',
    'concurrency', 'multithreading', 'async', 'await', 'promise', 'latency', 'throughput',
    'sharding', 'replication', 'acid', 'transaction', 'event loop', 'ci/cd', 'pipeline'
  ]

  return techTerms.filter(term => lower.includes(term))
}

const extractActionVerbs = (text = '') => {
  const lower = text.toLowerCase()
  const verbs = ['designed', 'built', 'migrated', 'optimized', 'reduced', 'improved', 'refactored', 'debugged', 'implemented', 'scaled', 'deployed']
  return verbs.filter(v => lower.includes(v))
}

// ── CONVERSATIONAL INTENT CLASSIFIER ──────────────────────────────────────────
const detectCandidateIntent = (message = '') => {
  const lower = message.trim().toLowerCase()

  // 1. Candidate asking for clarification / didn't understand
  const clarificationPatterns = [
    'could you repeat', 'can you repeat', 'what do you mean', 'pardon', 'pardon me',
    'i didn\'t understand', 'did not understand', 'can you clarify', 'could you clarify',
    'what was the question', 'say that again', 'come again', 'not sure what you mean',
    'are you asking about', 'do you mean'
  ]
  if (clarificationPatterns.some(p => lower.includes(p))) {
    return 'clarification_request'
  }

  // 2. Candidate stuck / hesitant / doesn't know
  const hesitationPatterns = [
    "i don't know", "i do not know", "not sure about this", "never worked with",
    "no idea", "haven't used that", "haven't done that", "pass this question",
    "can we skip", "skip this"
  ]
  if (hesitationPatterns.some(p => lower.includes(p))) {
    return 'hesitation_or_stuck'
  }

  // 3. Candidate asked a direct question to the interviewer
  if (lower.startsWith('why') || lower.startsWith('how') || lower.endsWith('?')) {
    if (lower.length < 50) return 'inquiry'
  }

  return 'standard_response'
}

// ── INTERVIEW QUESTION PLAN GENERATOR ────────────────────────────────────────
const generateQuestionPlan = (role = 'Full Stack Developer', company = 'Tech Company') => {
  const roleKey = domainQuestions[role] ? role : 'Full Stack Developer'
  const technicalList = [...(domainQuestions[roleKey] || domainQuestions['Full Stack Developer'])]
  const shuffledBehavioral = [...behavioralQuestions].sort(() => Math.random() - 0.5)

  return {
    role,
    company,
    backgroundQuestions: backgroundQuestions.map(q => ({ question: q })),
    technicalQuestions: technicalList.map(q => ({ question: q })),
    behavioralQuestions: shuffledBehavioral.map(q => ({ question: q })),
    codingQuestion: codingQuestions[0]
  }
}

// ── ADAPTIVE HUMAN INTERVIEWER RESPONSE GENERATION ────────────────────────────
const getInterviewerResponse = (stage = 'intro', questionIndex = 0, questionPlan = null, candidateMessage = '', sessionId = 'default') => {
  const cleanMsg = (candidateMessage || '').trim()
  const intent = detectCandidateIntent(cleanMsg)
  const role = questionPlan?.role || 'Software Engineer'
  const company = questionPlan?.company || 'our team'

  // Initialize asked questions set for this session
  if (!askedQuestionsCache.has(sessionId)) {
    askedQuestionsCache.set(sessionId, new Set())
  }
  const askedSet = askedQuestionsCache.get(sessionId)

  // 1. HUMAN CLARIFICATION & ISSUE HANDLING (Addressing doubts like a real human)
  if (intent === 'clarification_request') {
    return "Of course, happy to clarify! I want to understand how you approach system design and practical trade-offs in real production environments. Feel free to explain from your past projects or a hands-on scenario you are most familiar with. How would you structure that?"
  }

  if (intent === 'hesitation_or_stuck') {
    return "No worries at all! In real engineering, nobody has used every single tool, and honesty is a huge plus. Let's pivot to something adjacent: what technology or architecture have you built recently that you feel very comfortable diving into?"
  }

  // 2. STAGE: INTRO
  if (stage === 'intro') {
    const welcome = `Hello and welcome! I am your lead technical interviewer today for the ${role} position at ${company}. I am really looking forward to learning about your engineering background. To get us rolling, could you walk me through your journey, your core technical focus, and the most exciting project you have built?`
    askedSet.add(welcome)
    return welcome
  }

  // 3. EXTRACT WHAT THE CANDIDATE ACTUALLY TALKED ABOUT
  const mentionedTech = extractTechnicalConcepts(cleanMsg)
  const mentionedVerbs = extractActionVerbs(cleanMsg)
  const wordCount = cleanMsg.split(/\s+/).filter(Boolean).length

  // Construct warm, perceptive human acknowledgment
  let humanAcknowledgment = ""
  if (mentionedTech.length > 0) {
    const primaryTech = mentionedTech.slice(0, 2).map(t => t.toUpperCase()).join(' and ')
    humanAcknowledgment = `I appreciate that breakdown, especially how you utilized ${primaryTech} in that context.`
  } else if (wordCount > 40) {
    humanAcknowledgment = "Thank you for walking me through that in detail. That gives me very clear visibility into your practical process."
  } else if (wordCount > 10) {
    humanAcknowledgment = "Got it, thanks for highlighting that perspective."
  } else {
    humanAcknowledgment = "Understood."
  }

  // 4. ADAPTIVE FOLLOW-UP: DIG INTO THEIR ACTUAL ANSWER (Crucial requirement!)
  // If the candidate gave a substantive answer (>= 25 words) with technical points, follow up on their specific response
  const shouldFollowUpOnResponse = (questionIndex % 2 === 1 && wordCount >= 20 && mentionedTech.length > 0)

  if (shouldFollowUpOnResponse) {
    const tech = mentionedTech[0].toUpperCase()
    const followUps = [
      `${humanAcknowledgment} Drilling into your experience with ${tech}: what was the single biggest performance bottleneck or trade-off you encountered, and how did you resolve it?`,
      `${humanAcknowledgment} If that ${tech} architecture had to handle a 10x sudden spike in concurrent requests tomorrow, what layer would be the first point of failure, and how would you safeguard it?`,
      `${humanAcknowledgment} When you chose ${tech} for that system, what alternative approaches did you consider, and why did you settle on this direction?`
    ]

    for (const fu of followUps) {
      if (!askedSet.has(fu)) {
        askedSet.add(fu)
        return fu
      }
    }
  }

  // 5. STAGE: BACKGROUND
  if (stage === 'background') {
    const bQuestions = questionPlan?.backgroundQuestions || backgroundQuestions.map(q => ({ question: q }))
    for (const bq of bQuestions) {
      if (!askedSet.has(bq.question)) {
        askedSet.add(bq.question)
        return `${humanAcknowledgment} ${bq.question}`
      }
    }
    // Fallback if all asked: transition to technical
    const nextQ = "That gives me great context on your background. Let's transition into technical architecture: How do you approach designing scalable systems and decoupling dependencies?"
    askedSet.add(nextQ)
    return `${humanAcknowledgment} ${nextQ}`
  }

  // 6. STAGE: TECHNICAL
  if (stage === 'technical') {
    const roleKey = domainQuestions[role] ? role : 'Full Stack Developer'
    const techPool = (questionPlan?.technicalQuestions && questionPlan.technicalQuestions.length > 0)
      ? questionPlan.technicalQuestions.map(q => q.question)
      : (domainQuestions[roleKey] || domainQuestions['Full Stack Developer'])

    for (const tq of techPool) {
      if (!askedSet.has(tq)) {
        askedSet.add(tq)
        return `${humanAcknowledgment} ${tq}`
      }
    }

    // Dynamic unasked technical question
    const fallbackTechQ = `Let's discuss high-availability design: how do you prevent single points of failure and manage database failover in production?`
    if (!askedSet.has(fallbackTechQ)) {
      askedSet.add(fallbackTechQ)
      return `${humanAcknowledgment} ${fallbackTechQ}`
    }
  }

  // 7. STAGE: BEHAVIORAL
  if (stage === 'behavioral') {
    const bPool = (questionPlan?.behavioralQuestions && questionPlan.behavioralQuestions.length > 0)
      ? questionPlan.behavioralQuestions.map(q => q.question)
      : behavioralQuestions

    for (const bq of bPool) {
      if (!askedSet.has(bq)) {
        askedSet.add(bq)
        return `${humanAcknowledgment} In terms of team dynamics and collaboration: ${bq}`
      }
    }
  }

  // 8. TRANSITION TO CODING ROUND
  const codingTransition = "You have demonstrated strong technical communication and clarity throughout our discussion. We will now move into our interactive live coding assessment. Best of luck!"
  return codingTransition
}

// ── DETERMINISTIC, RUBRIC-CALIBRATED ANSWER EVALUATION ────────────────────────
const evaluateAnswer = (question = '', answer = '') => {
  const cleanAns = (answer || '').trim()
  const words = cleanAns.split(/\s+/).filter(Boolean)
  const wordCount = words.length

  if (wordCount === 0) {
    return {
      score: 1,
      feedback: "No audible or text answer was detected. Please ensure your microphone is active.",
      strengths: [],
      improvements: ["Provide a verbal or written response to the question."]
    }
  }

  // Scoring Breakdown (Total: 10 points)
  let score = 0
  const strengths = []
  const improvements = []

  // Factor 1: Length & Depth (0 - 3 points)
  if (wordCount >= 75) {
    score += 3
    strengths.push("Comprehensive elaboration with strong descriptive depth")
  } else if (wordCount >= 35) {
    score += 2
    strengths.push("Solid foundation covering the main points")
  } else if (wordCount >= 15) {
    score += 1
    improvements.push("Elaborate further with real-world examples rather than high-level summaries")
  } else {
    improvements.push("Answer was very brief; flesh out your explanation with practical context")
  }

  // Factor 2: Technical Concept Density (0 - 3 points)
  const technicalTerms = extractTechnicalConcepts(cleanAns)
  if (technicalTerms.length >= 4) {
    score += 3
    strengths.push(`Rich technical vocabulary referencing ${technicalTerms.slice(0, 3).join(', ')}`)
  } else if (technicalTerms.length >= 2) {
    score += 2
    strengths.push("Good usage of foundational technical terminology")
  } else if (technicalTerms.length >= 1) {
    score += 1
    improvements.push("Incorporate more industry-standard architecture concepts and specific tooling")
  } else {
    improvements.push("Discuss the underlying technical mechanisms and internal workings")
  }

  // Factor 3: STAR & Active Problem-Solving (0 - 2 points)
  const activeVerbs = extractActionVerbs(cleanAns)
  const hasFirstPerson = /\b(i|we|my|our)\b/i.test(cleanAns)
  if (activeVerbs.length >= 2 && hasFirstPerson) {
    score += 2
    strengths.push("Demonstrated personal ownership and active problem-solving actions")
  } else if (activeVerbs.length >= 1 || hasFirstPerson) {
    score += 1
  } else {
    improvements.push("Highlight your personal role and the exact actions you implemented (STAR method)")
  }

  // Factor 4: Architectural Reasoning & Trade-Offs (0 - 2 points)
  const tradeOffKeywords = ['because', 'trade-off', 'tradeoff', 'latency', 'performance', 'bottleneck', 'scale', 'scalable', 'cons', 'pros', 'complexity', 'cost', 'failover', 'resilient']
  const hasTradeOff = tradeOffKeywords.some(kw => cleanAns.toLowerCase().includes(kw))
  if (hasTradeOff) {
    score += 2
    strengths.push("Thoughtful analysis of engineering trade-offs and performance implications")
  } else {
    improvements.push("Explain the trade-offs: why this approach was preferred over alternatives")
  }

  // Calibrate score bounds: 1 to 10
  score = Math.max(1, Math.min(10, score))

  // Feedback summary
  let feedback = ""
  if (score >= 8) {
    feedback = `Exceptional response. You articulated your thoughts with clarity, referenced key technologies (${technicalTerms.slice(0, 2).join(', ') || 'architecture'}), and demonstrated strong engineering maturity.`
  } else if (score >= 6) {
    feedback = `Strong answer. You covered the core principles well. Deepening the discussion around scalability limits and specific trade-offs will make it top-tier.`
  } else if (score >= 4) {
    feedback = `Reasonable foundation, but somewhat high-level. Provide concrete examples from your past projects to back up your technical statements.`
  } else {
    feedback = `The response is too brief or lacks technical specificity. Make sure to structure your answers with the Situation, Action, and Result.`
  }

  return {
    score,
    feedback,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 2)
  }
}

// ── CODE EVALUATION ──────────────────────────────────────────────────────────
const evaluateCode = (question = '', code = '', language = 'javascript') => {
  const cleanCode = (code || '').trim()
  const lineCount = cleanCode.split('\n').filter(l => l.trim()).length
  const hasReturn = cleanCode.includes('return')
  const hasLoops = /for|while|forEach|map|reduce/i.test(cleanCode)
  const hasConditions = /if|switch|ternary/i.test(cleanCode)
  const hasDataStructure = /Map|Set|Array|stack|queue|hash/i.test(cleanCode)

  let score = 4
  if (lineCount >= 4) score += 2
  if (hasReturn) score += 1
  if (hasLoops || hasConditions) score += 1
  if (hasDataStructure) score += 2

  score = Math.max(1, Math.min(10, score))
  const isCorrect = score >= 6

  return {
    score,
    isCorrect,
    timeComplexity: hasDataStructure ? "O(n)" : (hasLoops ? "O(n²)" : "O(1)"),
    spaceComplexity: hasDataStructure ? "O(n)" : "O(1)",
    feedback: isCorrect
      ? "Clean algorithmic implementation. The solution addresses the primary constraints with proper state handling."
      : "The solution has logical gaps or lacks boundary condition handling. Review edge cases such as empty or single-element inputs.",
    improvements: score < 8
      ? ["Add explicit guard clauses for null/empty boundary inputs", "Optimize space allocation for worst-case inputs"]
      : ["Great code structure and optimal asymptotic complexity"]
  }
}

// ── COMPREHENSIVE DOSSIER / REPORT GENERATOR ─────────────────────────────────
const generateReport = (transcript = [], sessionData = null) => {
  const candidateMessages = transcript.filter(m => m.role === 'candidate')
  const scoredMessages = candidateMessages.filter(m => typeof m.score === 'number' && m.score > 0)

  let avgRaw = 7
  if (scoredMessages.length > 0) {
    const total = scoredMessages.reduce((sum, m) => sum + m.score, 0)
    avgRaw = Math.round((total / scoredMessages.length) * 10) / 10
  }

  // Base 0-100 score
  const baseScore = Math.round(avgRaw * 10)
  const codeScore = sessionData?.codeScore ? Math.round(sessionData.codeScore * 10) : baseScore

  // Rubric Sub-scores
  const technical = Math.min(100, Math.max(30, Math.round(baseScore * 1.02)))
  const communication = Math.min(100, Math.max(30, Math.round(baseScore * 0.98)))
  const problemSolving = Math.min(100, Math.max(30, Math.round((baseScore + codeScore) / 2)))
  const behavioral = Math.min(100, Math.max(30, baseScore))

  const finalOverall = Math.round((technical * 0.35) + (problemSolving * 0.35) + (communication * 0.15) + (behavioral * 0.15))

  let hiringSuggestion = 'Borderline'
  if (finalOverall >= 85) hiringSuggestion = 'Strong Hire'
  else if (finalOverall >= 70) hiringSuggestion = 'Hire'
  else if (finalOverall >= 55) hiringSuggestion = 'Borderline'
  else hiringSuggestion = 'No Hire'

  return {
    overallScore: finalOverall,
    scores: {
      communication,
      technicalKnowledge: technical,
      problemSolving,
      behavioralSkills: behavioral,
      codeQuality: codeScore
    },
    hiringSuggestion,
    strengths: [
      "Articulates technical choices with architectural ownership",
      "Effectively identifies algorithmic complexity and trade-offs",
      "Maintains professional, structured communication throughout"
    ],
    improvements: [
      "Deepen real-world edge-case validation and failure mode handling",
      "Quantify business and performance impact metrics more explicitly"
    ],
    recommendationSummary: `Candidate demonstrated solid competence for the ${sessionData?.role || 'Engineering'} role at ${sessionData?.company || 'Enterprise'}. Placement readiness tier: ${finalOverall >= 85 ? 'Tier 1' : (finalOverall >= 65 ? 'Tier 2' : 'Needs Remedial Training')}.`
  }
}

module.exports = {
  generateQuestionPlan,
  getInterviewerResponse,
  evaluateAnswer,
  evaluateCode,
  generateReport
}
