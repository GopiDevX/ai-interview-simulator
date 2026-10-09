import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { interviewApi } from '../api/interview.js'
import Button from '../components/ui/Button.jsx'
import { HR_PERSONAS } from '../components/interview/HRAvatar.jsx'

const ROLES = [
  'Full Stack Developer',
  'Backend Developer',
  'Frontend Developer',
  'Machine Learning Engineer',
  'Data Engineer',
  'DevOps Engineer',
  'Product Manager'
]

const CURATED_COMPANIES = [
  { name: 'Accenture', badge: 'Curated Rubric', difficulty: 'Easy-Medium' },
  { name: 'Cognizant', badge: 'Curated Rubric', difficulty: 'Medium' },
  { name: 'TCS', badge: 'Curated Rubric', difficulty: 'Easy-Medium' },
  { name: 'Infosys', badge: 'Curated Rubric', difficulty: 'Easy-Medium' },
  { name: 'Wipro', badge: 'Curated Rubric', difficulty: 'Easy-Medium' },
  { name: 'Google', badge: 'High DSA', difficulty: 'Hard' },
  { name: 'Amazon', badge: 'STAR Leadership', difficulty: 'Hard' },
  { name: 'Microsoft', badge: 'Systems & Cloud', difficulty: 'Hard' },
]

const DEMO_PROFILES = [
  {
    id: 'fullstack',
    title: 'Full Stack Engineer',
    role: 'Full Stack Developer',
    company: 'Google',
    icon: '🚀',
    summary: 'React 18, Node.js, Express, Microservices & PostgreSQL',
    resumeText: `EXPERIENCE
Full Stack Software Engineer at CloudScale Inc (2022 - Present)
- Designed and implemented microservices handling 50k requests/sec using Node.js, Express, and Redis.
- Built responsive user interfaces in React 18, Tailwind CSS, and WebSockets for real-time collaboration.
- Reduced database query latency by 42% through PostgreSQL query optimization, B-Tree indexes, and caching.

PROJECTS
- E-Commerce Microservices Engine: Built distributed checkout with Stripe API, Kafka event streaming, and idempotency guarantees.
- Real-Time Collaborative Canvas: Implemented WebSockets and CRDTs for multi-user low-latency document sync.

SKILLS
- Languages: JavaScript, TypeScript, Python, SQL
- Technologies: React, Node.js, Express, Docker, Kubernetes, AWS, PostgreSQL, MongoDB, Redis, GraphQL
- Fundamentals: Data Structures, Algorithms, System Design, REST APIs, CI/CD

EDUCATION
B.Tech in Computer Science, GPA: 8.8/10.0`
  },
  {
    id: 'enterprise',
    title: 'Enterprise SDE',
    role: 'Backend Developer',
    company: 'Accenture',
    icon: '🏢',
    summary: 'Java 17, Spring Boot, OOP, SQL Normalization & Agile',
    resumeText: `EXPERIENCE
Software Associate at TechSolutions (2023 - Present)
- Developed enterprise REST APIs using Java 17 and Spring Boot for high-volume banking transactions.
- Implemented database normalization up to 3NF, creating optimized stored procedures in MySQL and Oracle.
- Participated in bi-weekly Agile sprints, code reviews, and automated unit testing with JUnit and Mockito.

PROJECTS
- Hospital Management Portal: Designed modular patient admission portal using Spring Boot and Hibernate ORM.
- Banking Transaction Ledger: Built ACID-compliant ledger with row-level locking and transaction rollback mechanisms.

SKILLS
- Core: Java, Object Oriented Programming (OOP), Data Structures, SQL, JDBC, Hibernate
- Frameworks & Tools: Spring Boot, Maven, Git, Docker, Postman, Jenkins
- Concepts: Polymorphism, Inheritance, Database Normalization, Agile Scrum

EDUCATION
B.E. in Information Technology, First Class with Distinction`
  },
  {
    id: 'ml_ai',
    title: 'AI / ML Engineer',
    role: 'Machine Learning Engineer',
    company: 'Amazon',
    icon: '🧠',
    summary: 'Python, PyTorch, Scikit-Learn, RAG & NLP Pipelines',
    resumeText: `EXPERIENCE
Machine Learning Engineer at DataIntelligence (2022 - Present)
- Trained classification and regression models in Scikit-Learn with 94%+ accuracy for predictive scoring.
- Built Retrieval-Augmented Generation (RAG) pipelines using vector embeddings, FAISS, and cosine similarity search.
- Containerized model inference microservices in Docker and deployed to AWS with < 15ms latency.

PROJECTS
- Autonomous Resume Parser: Extracted structured candidate entities from raw PDFs using TF-IDF and regex tokenization.
- Multi-Class Scoring Classifier: Trained logistic and ridge pipelines, evaluating confusion matrices and F1 scores.

SKILLS
- Languages: Python, C++, SQL
- ML/AI: Scikit-Learn, PyTorch, NumPy, Pandas, TF-IDF, HuggingFace, RAG, Vector Databases
- Deployment: Docker, FastAPI, AWS EC2, GitHub Actions

EDUCATION
M.S. in Computer Science / Data Science`
  }
]

const TYPES = [
  { id: 'technical', label: 'Technical Only', desc: 'Focus on tech questions', icon: '💻' },
  { id: 'behavioral', label: 'Technical + Behavioral', desc: 'Balanced mix', icon: '⚖️' },
  { id: 'full', label: 'Full Interview', desc: 'Complete experience', icon: '🎯' },
]

export default function Setup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [resume, setResume] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [selectedDemoId, setSelectedDemoId] = useState(null)
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [interviewType, setInterviewType] = useState('full')
  const [selectedPersona, setSelectedPersona] = useState('sarah')
  const [isStrictMode, setIsStrictMode] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSelectDemo = (profile) => {
    setSelectedDemoId(profile.id)
    setResume(null)
    setResumeText(profile.resumeText)
    setRole(profile.role)
    setCompany(profile.company)
    toast.success(`Loaded "${profile.title}" demo profile!`)
  }

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) {
      setResume(accepted[0])
      setSelectedDemoId(null)
      setResumeText('')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDropRejected: () => toast.error('Please upload a PDF under 5MB')
  })

  const handleStart = async () => {
    if (!role) return toast.error('Please select a role')
    if (!company) return toast.error('Please select a company')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('role', role)
      formData.append('company', company)
      formData.append('interviewType', interviewType)
      if (resume) {
        formData.append('resume', resume)
      } else if (resumeText) {
        formData.append('resumeText', resumeText)
      }

      const { data } = await interviewApi.start(formData)
      toast.success('Interview session created! Good luck 🍀')
      navigate(`/interview/${data.sessionId}`, {
        state: {
          questionPlan: data.questionPlan,
          persona: selectedPersona,
          isStrictMode: isStrictMode
        }
      })
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Free tier limit reached! Redirecting to upgrade...')
        navigate('/pricing')
      } else {
        toast.error(err.response?.data?.error || 'Failed to start interview')
      }
    } finally {
      setLoading(false)
    }
  }

  const canProceedStep1 = step > 1
  const canProceedStep2 = step > 2 || (role && company)

  const steps = [
    { num: 1, label: 'Resume' },
    { num: 2, label: 'Role & Company' },
    { num: 3, label: 'Interview Type' },
    { num: 4, label: 'Start' },
  ]

  return (
    <div className="min-h-screen hero-bg pt-20 px-4 pb-12 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-display font-bold text-white mb-3">Set Up Your Interview</h1>
          <p className="text-slate-400 font-medium">Configure your personalized mock interview</p>
        </motion.div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <button
                onClick={() => s.num < step && setStep(s.num)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  step === s.num ? 'bg-electric-blue text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' :
                  step > s.num ? 'bg-electric-emerald/20 text-electric-emerald cursor-pointer hover:bg-electric-emerald/30' :
                  'bg-white/5 text-slate-500 hover:bg-white/10'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > s.num ? 'bg-electric-emerald text-navy-dark' : 
                  step === s.num ? 'bg-white text-electric-blue' : 'bg-white/10'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </span>
                <span className="hidden sm:block uppercase tracking-wider">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-8 h-1 rounded-full ${step > s.num ? 'bg-electric-emerald' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-card p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Resume Upload */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Candidate Profile & Resume</h2>
                  <p className="text-slate-400 text-sm">Upload your own PDF, or select a pre-calibrated demo profile to start immediately.</p>
                </div>

                {/* 1-Click Demo Profiles */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    ⚡ Quick Start: 1-Click Demo Profiles (With Curated Resume & Projects)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {DEMO_PROFILES.map((p) => {
                      const isSelected = selectedDemoId === p.id
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectDemo(p)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-600/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                              : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{p.icon}</span>
                            <span className="text-xs font-bold text-white truncate">{p.title}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                            {p.summary}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[10px]">
                            <span className="text-cyan-400 font-medium">{p.company}</span>
                            {isSelected && <span className="text-emerald-400 font-bold">✓ Selected</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className="text-slate-500 text-xs font-medium uppercase">Or upload custom PDF</span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                    isDragActive ? 'border-electric-cyan bg-electric-cyan/10 scale-[1.02]' :
                    resume ? 'border-electric-emerald/50 bg-electric-emerald/5' :
                    'border-white/10 hover:border-electric-cyan/50 hover:bg-white/5'
                  }`}
                >
                  {isDragActive && <div className="absolute inset-0 bg-gradient-to-r from-electric-cyan/20 to-electric-blue/20 blur-3xl -z-10" />}
                  
                  <input {...getInputProps()} />
                  {resume ? (
                    <div className="space-y-4">
                      <div className="text-5xl drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">📄</div>
                      <div>
                        <p className="text-electric-emerald font-bold text-lg">{resume.name}</p>
                        <p className="text-slate-400 text-sm mt-1">{(resume.size / 1024).toFixed(0)} KB • PDF</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setResume(null) }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-electric-blue/20 to-electric-purple/20 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                        <span className="text-4xl">📤</span>
                      </div>
                      <div>
                        <p className="text-slate-200 font-bold text-lg mb-1">
                          {isDragActive ? 'Drop your resume right here' : 'Drag & drop your resume'}
                        </p>
                        <p className="text-slate-400 text-sm">or click to browse · PDF only · Max 5MB</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
                    Skip (use generic questions)
                  </Button>
                  <Button onClick={() => setStep(2)} className="flex-1" disabled={!resume && !resumeText}>
                    Continue →
                  </Button>
                </div>
                {!resume && !resumeText && (
                  <p className="text-center text-slate-500 text-xs">You can skip this step or choose a demo profile above</p>
                )}
              </motion.div>
            )}

            {/* Step 2: Role & Company */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Target Role & Company</h2>
                  <p className="text-slate-400 text-sm">Questions and scoring rubrics are tailored to your target company.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Role *</label>
                    <input
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      placeholder="e.g. Full Stack Developer"
                      className="input-field mb-2"
                      list="roles-list"
                    />
                    <datalist id="roles-list">
                      {ROLES.map(r => <option key={r} value={r} />)}
                    </datalist>
                    <div className="flex flex-wrap gap-2">
                      {ROLES.map(r => (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={`text-xs font-semibold tracking-wide px-3.5 py-1.5 rounded-xl border transition-all ${
                            role === r
                              ? 'bg-electric-blue/20 border-electric-blue/50 text-electric-cyan shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-300">Target Company *</label>
                      <span className="text-[11px] text-cyan-400">✨ Calibrated Company Rubrics</span>
                    </div>
                    <input
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="e.g. Accenture, Google, TCS"
                      className="input-field mb-3"
                      list="companies-list"
                    />
                    <datalist id="companies-list">
                      {CURATED_COMPANIES.map(c => <option key={c.name} value={c.name} />)}
                    </datalist>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CURATED_COMPANIES.map(c => (
                        <button
                          key={c.name}
                          onClick={() => setCompany(c.name)}
                          className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                            company === c.name
                              ? 'bg-blue-600/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <span className="font-bold text-xs truncate">{c.name}</span>
                          <span className="text-[10px] text-cyan-400 mt-1">{c.badge}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1" disabled={!role || !company}>Continue →</Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Interview Type */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Interview Format</h2>
                  <p className="text-slate-400 text-sm">Choose the type of interview you'd like to practice.</p>
                </div>

                <div className="space-y-3">
                  {TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setInterviewType(type.id)}
                      className={`w-full p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                        interviewType === type.id
                          ? 'bg-electric-blue/10 border-electric-blue/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors ${
                          interviewType === type.id ? 'bg-electric-blue/20 text-white' : 'bg-white/5 text-slate-400'
                        }`}>
                          {type.icon}
                        </div>
                        <div>
                          <p className={`font-bold text-lg ${interviewType === type.id ? 'text-electric-cyan' : 'text-white'}`}>
                            {type.label}
                          </p>
                          <p className="text-slate-400 text-sm mt-0.5">{type.desc}</p>
                        </div>
                        {interviewType === type.id && (
                          <div className="ml-auto w-6 h-6 rounded-full bg-electric-cyan flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                            <svg className="w-4 h-4 text-navy-dark" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* HR Interviewer Persona Selection */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>👔</span> Select Your Lead IT HR Interviewer
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Choose an AI recruiter persona tailored with distinct interview styles, speech accents, and evaluation priorities.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {HR_PERSONAS.map(persona => (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => setSelectedPersona(persona.id)}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col items-center sm:items-start ${
                          selectedPersona === persona.id
                            ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 w-full mb-2">
                          <img
                            src={persona.image}
                            alt={persona.name}
                            className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow-md"
                          />
                          <div>
                            <p className="font-bold text-white text-sm">{persona.name}</p>
                            <p className="text-[10px] text-blue-400 font-medium leading-tight">{persona.title}</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                          {persona.bio}
                        </p>
                        {selectedPersona === persona.id && (
                          <div className="mt-2 text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 flex items-center gap-1">
                            <span>✓</span> Selected Recruiter
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Strict Proctoring Toggle */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
                        🛡️
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-sm">Strict HR Proctoring & Integrity Mode</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                            Recommended
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">
                          Enforces tab switch tracking, gaze/face verification, noise detection, and generates an Authenticity Trust Score.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={isStrictMode}
                        onChange={e => setIsStrictMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">← Back</Button>
                  <Button onClick={() => setStep(4)} className="flex-1">Continue →</Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirm & Start */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Ready to Begin?</h2>
                  <p className="text-slate-400 text-sm">Review your setup and start the interview when ready.</p>
                </div>

                <div className="space-y-3 bg-white/5 rounded-xl p-5">
                  {[
                    { label: 'Resume', value: resume ? resume.name : 'Using generic questions', icon: '📄' },
                    { label: 'Role', value: role, icon: '💼' },
                    { label: 'Company', value: company, icon: '🏢' },
                    { label: 'Format', value: TYPES.find(t => t.id === interviewType)?.label, icon: '🎯' },
                    { label: 'Interviewer', value: HR_PERSONAS.find(p => p.id === selectedPersona)?.name + ' (IT HR Lead)', icon: '👔' },
                    { label: 'Proctoring', value: isStrictMode ? 'Active (Strict Anti-Cheat & Trust Score)' : 'Standard Practice Mode', icon: '🛡️' }
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-slate-400 text-sm w-24">{item.label}:</span>
                      <span className="text-white text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-electric-cyan/10 border border-electric-cyan/20 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                  <p className="text-electric-cyan text-sm leading-relaxed">
                    <span className="text-lg mr-2">💡</span>
                    <strong>HR Pro Tip:</strong> Answer in a conversational, structured manner using the <strong>STAR Method</strong> (Situation, Task, Action, Result). State specific metrics and engineering trade-offs.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="secondary" onClick={() => setStep(3)} className="flex-1 py-4 font-bold">← Back</Button>
                  <Button 
                    onClick={handleStart} 
                    loading={loading} 
                    className="flex-[2] py-4 bg-gradient-to-r from-electric-blue to-electric-cyan hover:from-blue-500 hover:to-cyan-400 border-0 glow-blue text-white font-bold text-lg"
                  >
                    🚀 Launch HR Interview
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
