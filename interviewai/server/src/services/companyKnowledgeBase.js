/**
 * Company Knowledge Base — Curated interview patterns for specific companies.
 * 
 * This is the dataset layer that feeds into the RAG pipeline.
 * Instead of training a custom model (expensive, impractical), we store
 * structured company-specific knowledge and retrieve it at query time
 * using the same vector store / cosine similarity approach as resume RAG.
 * 
 * DATA SOURCES (all publicly available):
 * - Glassdoor interview reviews
 * - GeeksForGeeks company-specific interview experiences  
 * - LeetCode discuss company tags
 * - Company career pages (official hiring criteria)
 * - Published blog posts from recruiters
 */

const companyProfiles = {
  // ─── ACCENTURE ──────────────────────────────────────────────────────────────
  accenture: {
    name: 'Accenture',
    industry: 'IT Consulting & Services',
    interviewStyle: 'structured',
    rounds: [
      'Online Assessment (Aptitude + Coding)',
      'Technical Interview',
      'HR Interview'
    ],
    focusAreas: [
      'Communication skills (heavily weighted)',
      'Adaptability and willingness to relocate',
      'Basic DSA — arrays, strings, sorting',
      'OOP concepts — inheritance, polymorphism, abstraction',
      'SQL queries and database basics',
      'Cloud fundamentals (AWS/Azure basics)',
      'Agile methodology understanding'
    ],
    commonQuestions: [
      { category: 'technical', question: 'Explain the four pillars of OOP with real-world examples.', difficulty: 'easy' },
      { category: 'technical', question: 'What is the difference between an abstract class and an interface?', difficulty: 'easy' },
      { category: 'technical', question: 'Write a SQL query to find the second highest salary from an Employee table.', difficulty: 'medium' },
      { category: 'technical', question: 'Explain the difference between REST and SOAP APIs.', difficulty: 'medium' },
      { category: 'technical', question: 'What is normalization in databases? Explain up to 3NF.', difficulty: 'medium' },
      { category: 'behavioral', question: 'Tell me about a time you had to adapt to a significant change at work or college.', difficulty: 'easy' },
      { category: 'behavioral', question: 'Why do you want to work at Accenture specifically?', difficulty: 'easy' },
      { category: 'behavioral', question: 'Are you comfortable relocating to any city in India?', difficulty: 'easy' },
      { category: 'behavioral', question: 'Describe a project where you worked in a team. What was your role?', difficulty: 'easy' },
      { category: 'coding', question: 'Reverse a string without using built-in functions.', difficulty: 'easy' },
      { category: 'coding', question: 'Find if a number is a palindrome.', difficulty: 'easy' },
      { category: 'coding', question: 'Implement a function to check if two strings are anagrams.', difficulty: 'medium' }
    ],
    hiringCriteria: 'Accenture values communication and adaptability over deep technical skills for entry-level roles. They focus on whether candidates can learn quickly and work in diverse teams across global projects. Cultural fit and willingness to travel/relocate are important.',
    typicalDifficulty: 'easy-medium',
    interviewTips: [
      'Prepare strong answers about teamwork and adaptability',
      'Brush up on basic OOP, SQL, and DSA fundamentals',
      'Research Accenture\'s recent projects and digital transformation initiatives',
      'Be ready to discuss your willingness to relocate and work in shifts',
      'Communication clarity matters more than deep technical depth'
    ]
  },

  // ─── COGNIZANT ──────────────────────────────────────────────────────────────
  cognizant: {
    name: 'Cognizant',
    industry: 'IT Services & Digital Solutions',
    interviewStyle: 'structured',
    rounds: [
      'Online Assessment (Aptitude + Automata/Coding)',
      'Technical Interview Round 1',
      'Technical Interview Round 2 (Senior roles)',
      'HR Interview'
    ],
    focusAreas: [
      'Java or Python fundamentals',
      'Data structures — linked lists, stacks, queues, trees',
      'Database management — SQL joins, subqueries',
      'Web development basics — HTML, CSS, JavaScript',
      'Testing concepts and SDLC',
      'Problem-solving aptitude',
      'Communication and presentation skills'
    ],
    commonQuestions: [
      { category: 'technical', question: 'Explain the difference between HashMap and HashTable in Java.', difficulty: 'medium' },
      { category: 'technical', question: 'What are the different types of joins in SQL? Give examples.', difficulty: 'medium' },
      { category: 'technical', question: 'Explain the concept of multithreading and its advantages.', difficulty: 'medium' },
      { category: 'technical', question: 'What is the difference between stack and heap memory?', difficulty: 'medium' },
      { category: 'technical', question: 'Explain MVC architecture and where you\'ve used it.', difficulty: 'medium' },
      { category: 'behavioral', question: 'Why Cognizant? What do you know about our company?', difficulty: 'easy' },
      { category: 'behavioral', question: 'Tell me about a challenging bug you encountered and how you fixed it.', difficulty: 'medium' },
      { category: 'behavioral', question: 'Where do you see yourself in 5 years?', difficulty: 'easy' },
      { category: 'coding', question: 'Implement a function to detect a cycle in a linked list.', difficulty: 'medium' },
      { category: 'coding', question: 'Write a program to find the factorial of a number using recursion.', difficulty: 'easy' },
      { category: 'coding', question: 'Implement a stack using two queues.', difficulty: 'medium' }
    ],
    hiringCriteria: 'Cognizant focuses on strong fundamentals in programming (Java/Python), databases, and basic system design. They value candidates who can articulate their thought process clearly and demonstrate problem-solving ability. For GenC Next roles, higher DSA proficiency is expected.',
    typicalDifficulty: 'medium',
    interviewTips: [
      'Strong Java/Python fundamentals are essential',
      'Practice SQL queries — joins, group by, having clauses',
      'Be prepared to write code on a whiteboard or shared editor',
      'Know the difference between GenC, GenC Next, and GenC Elevate roles',
      'Prepare examples of projects with clear problem → solution → impact structure'
    ]
  },

  // ─── TCS (Tata Consultancy Services) ───────────────────────────────────────
  tcs: {
    name: 'TCS',
    industry: 'IT Services & Consulting',
    interviewStyle: 'structured',
    rounds: [
      'TCS NQT (National Qualifier Test)',
      'Technical Interview',
      'Managerial Interview',
      'HR Interview'
    ],
    focusAreas: [
      'C/C++/Java programming basics',
      'DBMS concepts and SQL',
      'Networking fundamentals (OSI model, TCP/IP)',
      'Operating system concepts',
      'Basic aptitude and logical reasoning',
      'Project discussion and final year project details'
    ],
    commonQuestions: [
      { category: 'technical', question: 'Explain the OSI model and the function of each layer.', difficulty: 'medium' },
      { category: 'technical', question: 'What are ACID properties in a database?', difficulty: 'easy' },
      { category: 'technical', question: 'Difference between process and thread in operating systems.', difficulty: 'medium' },
      { category: 'technical', question: 'Explain your final year project in detail. What challenges did you face?', difficulty: 'medium' },
      { category: 'technical', question: 'What is the difference between TCP and UDP?', difficulty: 'easy' },
      { category: 'behavioral', question: 'Are you comfortable with a 2-year service agreement bond?', difficulty: 'easy' },
      { category: 'behavioral', question: 'Why TCS over other IT companies?', difficulty: 'easy' },
      { category: 'behavioral', question: 'Are you willing to work in any technology domain assigned to you?', difficulty: 'easy' },
      { category: 'coding', question: 'Write a program to check if a string is a palindrome.', difficulty: 'easy' },
      { category: 'coding', question: 'Find the greatest common divisor (GCD) of two numbers.', difficulty: 'easy' },
      { category: 'coding', question: 'Print the Fibonacci series up to N terms.', difficulty: 'easy' }
    ],
    hiringCriteria: 'TCS has a mass hiring model and focuses on fundamentals — CS basics (OS, DBMS, Networks), coding ability in any language, and strong communication. The NQT score determines the role (Ninja vs Digital). Flexibility and willingness to learn new technologies are highly valued.',
    typicalDifficulty: 'easy',
    interviewTips: [
      'TCS NQT score is crucial — prepare aptitude and coding sections well',
      'Know your final year project inside out — they WILL ask about it',
      'Brush up on core CS subjects: OS, DBMS, CN',
      'Be honest about your skills — they value integrity',
      'Show enthusiasm for learning and flexibility in technology choices'
    ]
  },

  // ─── INFOSYS ───────────────────────────────────────────────────────────────
  infosys: {
    name: 'Infosys',
    industry: 'IT Services & Consulting',
    interviewStyle: 'semi-structured',
    rounds: [
      'InfyTQ / Online Assessment',
      'Technical Interview',
      'HR Interview'
    ],
    focusAreas: [
      'Programming in Java/Python/C++',
      'OOP concepts with examples',
      'Database design and SQL',
      'Basic data structures and algorithms',
      'Software engineering principles',
      'Puzzle-solving and logical reasoning'
    ],
    commonQuestions: [
      { category: 'technical', question: 'What is polymorphism? Explain with a code example.', difficulty: 'easy' },
      { category: 'technical', question: 'Explain the difference between an inner join and outer join with examples.', difficulty: 'medium' },
      { category: 'technical', question: 'What design patterns have you used in your projects?', difficulty: 'medium' },
      { category: 'technical', question: 'Explain how garbage collection works in Java.', difficulty: 'medium' },
      { category: 'behavioral', question: 'Tell me about a time you failed and what you learned from it.', difficulty: 'easy' },
      { category: 'behavioral', question: 'How do you stay updated with new technologies?', difficulty: 'easy' },
      { category: 'coding', question: 'Write a function to find the first non-repeating character in a string.', difficulty: 'medium' },
      { category: 'coding', question: 'Implement binary search on a sorted array.', difficulty: 'easy' }
    ],
    hiringCriteria: 'Infosys values strong academic performance, logical thinking, and coding fundamentals. The InfyTQ certification can fast-track the hiring process. They look for candidates who demonstrate continuous learning and can adapt to their structured training programs.',
    typicalDifficulty: 'easy-medium',
    interviewTips: [
      'Complete the InfyTQ certification if possible — it gives a significant advantage',
      'Practice puzzles and logical reasoning alongside coding',
      'Prepare to discuss at least 2 projects in depth',
      'Know Infosys Springboard and their training model',
      'Strong academic scores (60%+) are usually a baseline requirement'
    ]
  },

  // ─── WIPRO ─────────────────────────────────────────────────────────────────
  wipro: {
    name: 'Wipro',
    industry: 'IT Services & Business Process Solutions',
    interviewStyle: 'structured',
    rounds: [
      'Online Assessment (Aptitude + Coding)',
      'Technical Interview',
      'HR Interview'
    ],
    focusAreas: [
      'Programming basics in any language',
      'SQL and database fundamentals',
      'Networking basics',
      'Testing concepts',
      'Soft skills and communication'
    ],
    commonQuestions: [
      { category: 'technical', question: 'Explain the difference between overloading and overriding.', difficulty: 'easy' },
      { category: 'technical', question: 'What is the difference between DELETE, TRUNCATE, and DROP in SQL?', difficulty: 'easy' },
      { category: 'technical', question: 'What are the different types of testing?', difficulty: 'easy' },
      { category: 'behavioral', question: 'Tell me something about yourself that is not on your resume.', difficulty: 'easy' },
      { category: 'behavioral', question: 'How do you handle pressure and tight deadlines?', difficulty: 'easy' },
      { category: 'coding', question: 'Write a program to sort an array without using built-in sort functions.', difficulty: 'medium' },
      { category: 'coding', question: 'Check if a given number is an Armstrong number.', difficulty: 'easy' }
    ],
    hiringCriteria: 'Wipro focuses on aptitude, basic programming skills, and communication. Their elite and turbo hiring tracks require higher coding proficiency. Willingness to work across domains and shifts is important.',
    typicalDifficulty: 'easy',
    interviewTips: [
      'Focus on aptitude preparation — it carries significant weight',
      'Basic programming constructs and simple coding problems are enough',
      'Understand Wipro\'s service lines and recent acquisitions',
      'Communication skills are heavily evaluated in HR rounds'
    ]
  },

  // ─── GOOGLE ────────────────────────────────────────────────────────────────
  google: {
    name: 'Google',
    industry: 'Technology / FAANG',
    interviewStyle: 'unstructured-technical',
    rounds: [
      'Online Assessment (2-3 coding problems)',
      'Phone Screen (1-2 coding rounds)',
      'Onsite: 4-5 rounds (Coding, System Design, Behavioral/Googleyness)'
    ],
    focusAreas: [
      'Advanced data structures — trees, graphs, heaps, tries',
      'Dynamic programming and greedy algorithms',
      'System design (for L4+)',
      'Googleyness and Leadership (behavioral)',
      'Code quality, edge cases, and testing',
      'Time and space complexity analysis'
    ],
    commonQuestions: [
      { category: 'technical', question: 'Design a URL shortener like bit.ly. Walk me through the system design.', difficulty: 'hard' },
      { category: 'technical', question: 'Given a binary tree, return the level order traversal of its nodes\' values.', difficulty: 'medium' },
      { category: 'technical', question: 'Find the longest substring without repeating characters.', difficulty: 'medium' },
      { category: 'technical', question: 'Design a rate limiter for an API. How would you handle distributed systems?', difficulty: 'hard' },
      { category: 'behavioral', question: 'Tell me about a time you went above and beyond for a user/customer.', difficulty: 'medium' },
      { category: 'behavioral', question: 'Describe a situation where you had to push back on a decision you disagreed with.', difficulty: 'medium' },
      { category: 'coding', question: 'Implement LRU Cache with O(1) get and put operations.', difficulty: 'hard' },
      { category: 'coding', question: 'Given an array of integers, find two numbers that add up to a target sum.', difficulty: 'easy' },
      { category: 'coding', question: 'Serialize and deserialize a binary tree.', difficulty: 'hard' }
    ],
    hiringCriteria: 'Google evaluates on four pillars: Coding ability (clean, efficient code), Algorithmic thinking (optimal solutions), System Design (scalable architectures), and Googleyness (cultural fit, collaboration, intellectual humility). They hire for potential, not just current skill.',
    typicalDifficulty: 'hard',
    interviewTips: [
      'Solve 200+ LeetCode problems focusing on medium/hard difficulty',
      'Master patterns: sliding window, two pointers, BFS/DFS, DP, binary search',
      'Practice system design using "Designing Data-Intensive Applications" concepts',
      'Always discuss time/space complexity and edge cases',
      'Think out loud — communication during problem-solving is critical',
      'Prepare 5-6 strong STAR-format behavioral stories'
    ]
  },

  // ─── AMAZON ────────────────────────────────────────────────────────────────
  amazon: {
    name: 'Amazon',
    industry: 'Technology / FAANG',
    interviewStyle: 'leadership-principles-driven',
    rounds: [
      'Online Assessment (2-3 coding + work simulation)',
      'Phone Screen',
      'Onsite Loop: 4-5 rounds (Coding, System Design, Leadership Principles)'
    ],
    focusAreas: [
      'Amazon Leadership Principles (14 principles)',
      'Data structures and algorithms',
      'System design and scalability',
      'Object-oriented design',
      'Behavioral questions mapped to Leadership Principles'
    ],
    commonQuestions: [
      { category: 'technical', question: 'Design an e-commerce order processing system that handles millions of orders daily.', difficulty: 'hard' },
      { category: 'technical', question: 'Implement a trie data structure with insert, search, and startsWith operations.', difficulty: 'medium' },
      { category: 'behavioral', question: 'Tell me about a time you had to make a decision with incomplete data. (Bias for Action)', difficulty: 'medium' },
      { category: 'behavioral', question: 'Describe a time when you disagreed with your manager. How did you handle it? (Have Backbone; Disagree and Commit)', difficulty: 'medium' },
      { category: 'behavioral', question: 'Tell me about a time you simplified a complex process. (Invent and Simplify)', difficulty: 'medium' },
      { category: 'coding', question: 'Find the k most frequent elements in an array.', difficulty: 'medium' },
      { category: 'coding', question: 'Design a min stack that supports push, pop, top, and getMin in O(1).', difficulty: 'medium' }
    ],
    hiringCriteria: 'Amazon\'s interview process is uniquely centered around their 14 Leadership Principles. Every behavioral question maps to a specific principle. Technical skills matter, but inability to demonstrate Leadership Principles is an automatic rejection.',
    typicalDifficulty: 'medium-hard',
    interviewTips: [
      'Memorize and internalize all 14 Amazon Leadership Principles',
      'Prepare 2 STAR stories for each Leadership Principle',
      'Practice coding on a whiteboard or blank editor (no autocomplete)',
      'For system design, focus on scalability and trade-offs',
      'Use metrics and data in your behavioral answers — Amazon loves quantifiable impact'
    ]
  },

  // ─── MICROSOFT ─────────────────────────────────────────────────────────────
  microsoft: {
    name: 'Microsoft',
    industry: 'Technology / FAANG',
    interviewStyle: 'collaborative',
    rounds: [
      'Online Assessment',
      'Phone Screen (1-2 rounds)',
      'Onsite: 4 rounds (Coding, Design, Behavioral) + "As Appropriate" interview'
    ],
    focusAreas: [
      'Data structures and algorithms',
      'System design and architecture',
      'Object-oriented design principles',
      'Problem-solving approach and communication',
      'Growth mindset and collaboration'
    ],
    commonQuestions: [
      { category: 'technical', question: 'Design a parking lot system. What classes and methods would you use?', difficulty: 'medium' },
      { category: 'technical', question: 'Explain how a hash map works internally. How do you handle collisions?', difficulty: 'medium' },
      { category: 'behavioral', question: 'Tell me about a time you received critical feedback. How did you respond? (Growth Mindset)', difficulty: 'easy' },
      { category: 'behavioral', question: 'Describe a project where you had to collaborate with people outside your team.', difficulty: 'easy' },
      { category: 'coding', question: 'Reverse a linked list both iteratively and recursively.', difficulty: 'medium' },
      { category: 'coding', question: 'Validate if a binary search tree is valid.', difficulty: 'medium' },
      { category: 'coding', question: 'Find the maximum sum subarray (Kadane\'s Algorithm).', difficulty: 'medium' }
    ],
    hiringCriteria: 'Microsoft values growth mindset, collaboration, and the ability to learn from failures. They look for candidates who can think through problems methodically, communicate their approach clearly, and write clean, maintainable code.',
    typicalDifficulty: 'medium',
    interviewTips: [
      'Microsoft interviews are more collaborative — interviewers may help you',
      'Focus on writing clean, production-quality code',
      'Prepare to discuss trade-offs in your design decisions',
      'Show growth mindset — discuss what you\'ve learned from failures',
      'The "As Appropriate" (AA) round is with a senior leader and is mostly behavioral'
    ]
  }
}

// ── HELPER FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Get a company profile by name (case-insensitive, fuzzy match).
 */
function getCompanyProfile(companyName) {
  if (!companyName) return null
  
  const normalized = companyName.toLowerCase().trim()
  
  // Direct match
  if (companyProfiles[normalized]) {
    return companyProfiles[normalized]
  }

  // Fuzzy match — check if the input contains or is contained by a key
  for (const [key, profile] of Object.entries(companyProfiles)) {
    if (normalized.includes(key) || key.includes(normalized) || 
        normalized.includes(profile.name.toLowerCase()) || 
        profile.name.toLowerCase().includes(normalized)) {
      return profile
    }
  }

  return null
}

/**
 * Format company profile into a context string for the LLM prompt.
 */
function formatCompanyContext(profile) {
  if (!profile) return ''

  let context = `\n=== COMPANY-SPECIFIC INTERVIEW INTELLIGENCE ===\n`
  context += `Company: ${profile.name} (${profile.industry})\n`
  context += `Interview Style: ${profile.interviewStyle}\n`
  context += `Typical Difficulty: ${profile.typicalDifficulty}\n\n`

  context += `INTERVIEW ROUNDS:\n`
  profile.rounds.forEach((r, i) => {
    context += `  ${i + 1}. ${r}\n`
  })

  context += `\nFOCUS AREAS (what ${profile.name} specifically tests):\n`
  profile.focusAreas.forEach(f => {
    context += `  • ${f}\n`
  })

  context += `\nHIRING CRITERIA:\n${profile.hiringCriteria}\n`

  context += `\nSAMPLE QUESTIONS ${profile.name} ACTUALLY ASKS:\n`
  profile.commonQuestions.forEach(q => {
    context += `  [${q.category.toUpperCase()}] [${q.difficulty}] ${q.question}\n`
  })

  context += `\nINTERVIEW TIPS FOR ${profile.name.toUpperCase()}:\n`
  profile.interviewTips.forEach(t => {
    context += `  💡 ${t}\n`
  })

  return context
}

/**
 * Get all available company names.
 */
function getAvailableCompanies() {
  return Object.values(companyProfiles).map(p => p.name)
}

/**
 * Get company-specific questions filtered by category.
 */
function getCompanyQuestions(companyName, category = null) {
  const profile = getCompanyProfile(companyName)
  if (!profile) return []

  if (category) {
    return profile.commonQuestions.filter(q => q.category === category)
  }
  return profile.commonQuestions
}

module.exports = {
  companyProfiles,
  getCompanyProfile,
  formatCompanyContext,
  getAvailableCompanies,
  getCompanyQuestions
}
