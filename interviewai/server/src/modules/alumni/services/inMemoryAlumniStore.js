/**
 * Resilient In-Memory Storage for Alumni System
 * Used when MongoDB is offline or in development demo mode.
 */

const now = new Date()

const inMemoryAlumni = [
  {
    _id: 'alm-google-1',
    userId: 'usr-alumni-1',
    institutionId: 'inst-demo-campus',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@campus.edu',
    company: 'Google',
    role: 'Senior Software Engineer (SDE-2)',
    department: 'CSE',
    domain: 'Distributed Systems & Cloud',
    graduationYear: '2022',
    expertiseTags: ['Distributed Systems', 'Go', 'Kubernetes', 'System Design', 'Microservices'],
    bio: 'Ex-intern, now 3+ years at Google Cloud Core Infrastructure. Mentored 20+ campus juniors.',
    linkedinUrl: 'https://linkedin.com/in/ananya-sharma-demo',
    isVerified: true,
    verificationMethod: 'institutional_email',
    rating: 4.9,
    sessionsConducted: 14
  },
  {
    _id: 'alm-msft-2',
    userId: 'usr-alumni-2',
    institutionId: 'inst-demo-campus',
    name: 'Vikram Malhotra',
    email: 'vikram.m@campus.edu',
    company: 'Microsoft',
    role: 'Software Development Engineer II',
    department: 'CSE',
    domain: 'Cloud Services & Enterprise Architecture',
    graduationYear: '2023',
    expertiseTags: ['Azure Functions', 'C#', 'SQL Scalability', 'React', 'Low-Level Design'],
    bio: 'Specializing in cloud resilience and enterprise backend services at Azure Core.',
    linkedinUrl: 'https://linkedin.com/in/vikram-m-demo',
    isVerified: true,
    verificationMethod: 'officer_approval',
    rating: 4.85,
    sessionsConducted: 11
  },
  {
    _id: 'alm-amazon-3',
    userId: 'usr-alumni-3',
    institutionId: 'inst-demo-campus',
    name: 'Priya Sengupta',
    email: 'priya.s@campus.edu',
    company: 'Amazon',
    role: 'Software Development Engineer',
    department: 'ECE',
    domain: 'Full-Stack & Distributed Databases',
    graduationYear: '2023',
    expertiseTags: ['AWS Lambda', 'DynamoDB', 'Java', 'Microservices', 'Leadership Principles'],
    bio: 'SDE at AWS Commerce. Happy to conduct mock bar raiser interviews and behavioral drills.',
    linkedinUrl: 'https://linkedin.com/in/priya-s-demo',
    isVerified: true,
    verificationMethod: 'institutional_email',
    rating: 4.95,
    sessionsConducted: 18
  },
  {
    _id: 'alm-gs-4',
    userId: 'usr-alumni-4',
    institutionId: 'inst-demo-campus',
    name: 'Karthik Iyer',
    email: 'karthik.i@campus.edu',
    company: 'Goldman Sachs',
    role: 'Quantitative Analyst / Associate',
    department: 'EEE',
    domain: 'FinTech & High-Frequency Systems',
    graduationYear: '2021',
    expertiseTags: ['C++', 'Low Latency', 'Algorithms', 'Financial Engineering', 'Multi-Threading'],
    bio: 'Focusing on algorithmic trading systems and data structures. Passionate about CS fundamentals.',
    linkedinUrl: 'https://linkedin.com/in/karthik-i-demo',
    isVerified: true,
    verificationMethod: 'officer_approval',
    rating: 4.75,
    sessionsConducted: 9
  }
]

const inMemorySlots = [
  {
    _id: 'slot-101',
    alumniProfileId: 'alm-google-1',
    alumniUserId: 'usr-alumni-1',
    alumniName: 'Ananya Sharma',
    alumniCompany: 'Google',
    institutionId: 'inst-demo-campus',
    startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
    topic: 'Mock Technical System Design Drill (Google SDE-2 Style)',
    isBooked: false,
    status: 'available'
  },
  {
    _id: 'slot-102',
    alumniProfileId: 'alm-msft-2',
    alumniUserId: 'usr-alumni-2',
    alumniName: 'Vikram Malhotra',
    alumniCompany: 'Microsoft',
    institutionId: 'inst-demo-campus',
    startTime: new Date(Date.now() + 2 * 86400000).toISOString(), // +2 days
    endTime: new Date(Date.now() + 2 * 86400000 + 3600000).toISOString(),
    topic: 'DSA & Low-Level Object Oriented Design (LLD)',
    isBooked: false,
    status: 'available'
  },
  {
    _id: 'slot-103',
    alumniProfileId: 'alm-amazon-3',
    alumniUserId: 'usr-alumni-3',
    alumniName: 'Priya Sengupta',
    alumniCompany: 'Amazon',
    institutionId: 'inst-demo-campus',
    startTime: new Date(Date.now() + 3 * 86400000).toISOString(), // +3 days
    endTime: new Date(Date.now() + 3 * 86400000 + 3600000).toISOString(),
    topic: 'Amazon LP Behavioral Drill + Graph / Tree Coding Mock',
    isBooked: false,
    status: 'available'
  }
]

const inMemoryExperiences = [
  {
    _id: 'exp-201',
    institutionId: 'inst-demo-campus',
    alumniProfileId: 'alm-google-1',
    alumniName: 'Ananya Sharma',
    graduationYear: '2022',
    company: 'Google',
    role: 'Software Engineer (SDE-2)',
    interviewYear: '2025',
    selectionStatus: 'offered',
    overallDifficulty: 'Hard',
    rounds: [
      {
        roundName: 'Round 1: Screening & Algorithmic Problem Solving',
        roundType: 'Technical',
        questionsAsked: [
          'Design an in-memory rate limiter with sliding window counter',
          'Find median in a stream of running numbers under memory constraints'
        ],
        tips: 'Clarify edge cases early. State time and space complexity before typing any code.'
      },
      {
        roundName: 'Round 2: System Design & Scalability',
        roundType: 'System Design',
        questionsAsked: [
          'Design Google Docs collaborative conflict-free editing (OT / CRDT)',
          'Scale distributed pub-sub to 50M messages/sec with partition tolerance'
        ],
        tips: 'Start with back-of-the-envelope calculations: QPS, storage, and network bandwidth.'
      },
      {
        roundName: 'Round 3: Googleyness & Leadership',
        roundType: 'HR',
        questionsAsked: [
          'Tell me about a time you strongly disagreed with a senior engineer on technical architecture.'
        ],
        tips: 'Use the STAR format and focus on data-driven civil technical disagreement.'
      }
    ],
    preparationTips: 'Focus heavily on LeetCode Medium/Hard DP and Graph questions. Read "Designing Data-Intensive Applications" chapters 5 through 9.',
    recommendedResources: ['Designing Data-Intensive Applications', 'NeetCode 150', 'Grokking the System Design Interview'],
    moderationStatus: 'approved',
    indexedInRag: true,
    createdAt: new Date(Date.now() - 5 * 86400000)
  },
  {
    _id: 'exp-202',
    institutionId: 'inst-demo-campus',
    alumniProfileId: 'alm-msft-2',
    alumniName: 'Vikram Malhotra',
    graduationYear: '2023',
    company: 'Microsoft',
    role: 'Software Development Engineer II',
    interviewYear: '2024',
    selectionStatus: 'offered',
    overallDifficulty: 'Medium',
    rounds: [
      {
        roundName: 'Round 1: Online Assessment (Codility)',
        roundType: 'Technical',
        questionsAsked: [
          'Maximum profit with K transactions',
          'Minimizing string mutations with BFS'
        ],
        tips: 'Pass all hidden edge cases (empty strings, single item arrays).'
      },
      {
        roundName: 'Round 2: Technical & LLD',
        roundType: 'Technical',
        questionsAsked: [
          'Design an elevator management system adhering to SOLID principles',
          'Invert a binary tree with threaded traversal'
        ],
        tips: 'Microsoft interviewers love clean OOP principles, design patterns (Strategy, Factory), and unit testing.'
      }
    ],
    preparationTips: 'Brush up on C#/Java OOP, multi-threading, and deadlock prevention.',
    recommendedResources: ['Clean Code by Robert Martin', 'Striver SDE Sheet'],
    moderationStatus: 'approved',
    indexedInRag: true,
    createdAt: new Date(Date.now() - 12 * 86400000)
  }
]

const inMemoryReferrals = [
  {
    _id: 'ref-301',
    institutionId: 'inst-demo-campus',
    alumniProfileId: 'alm-google-1',
    alumniName: 'Ananya Sharma',
    company: 'Google',
    role: 'Software Engineer, Early Career 2026',
    jobLocation: 'Bangalore / Hyderabad, India',
    externalJobUrl: 'https://careers.google.com/jobs/results/early-career-swe',
    jobDescription: 'Looking for sharp 2026 graduates with strong DSA fundamentals and systems programming skills in C++, Go, or Java.',
    requiredExperience: '0-2 Years',
    requiredSkills: ['C++', 'Python', 'Go', 'Data Structures', 'Linux'],
    deadline: new Date(Date.now() + 14 * 86400000),
    status: 'open',
    applicants: []
  },
  {
    _id: 'ref-302',
    institutionId: 'inst-demo-campus',
    alumniProfileId: 'alm-msft-2',
    alumniName: 'Vikram Malhotra',
    company: 'Microsoft',
    role: 'SDE 1 - Azure Cloud Platform',
    jobLocation: 'Noida / Hyderabad, India',
    externalJobUrl: 'https://careers.microsoft.com/professionals/us/en/job/sde1-azure',
    jobDescription: 'Referral available for campus candidates with strong understanding of REST APIs, distributed databases, and high availability systems.',
    requiredExperience: '0-1 Years',
    requiredSkills: ['C#', 'Java', 'Azure', 'Microservices', 'SQL'],
    deadline: new Date(Date.now() + 21 * 86400000),
    status: 'open',
    applicants: []
  },
  {
    _id: 'ref-303',
    institutionId: 'inst-demo-campus',
    alumniProfileId: 'alm-amazon-3',
    alumniName: 'Priya Sengupta',
    company: 'Amazon',
    role: 'SDE-1 - Consumer Engagement',
    jobLocation: 'Bangalore, India',
    externalJobUrl: 'https://amazon.jobs/en/jobs/sde1-consumer',
    jobDescription: 'Direct referral for candidates having exceptional problem-solving and demonstrated curiosity in cloud technologies.',
    requiredExperience: 'Fresher / 2025-2026 Batch',
    requiredSkills: ['Java', 'Algorithms', 'Distributed Caching', 'Object Oriented Design'],
    deadline: new Date(Date.now() + 28 * 86400000),
    status: 'open',
    applicants: []
  }
]

const inMemoryScorecards = []
const inMemoryRequests = []

module.exports = {
  inMemoryAlumni,
  inMemorySlots,
  inMemoryExperiences,
  inMemoryReferrals,
  inMemoryScorecards,
  inMemoryRequests
}
