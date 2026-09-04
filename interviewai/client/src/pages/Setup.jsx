import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { interviewApi } from '../api/interview.js'
import Button from '../components/ui/Button.jsx'

const ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Engineer', 'DevOps Engineer', 'Mobile Developer', 'Machine Learning Engineer', 'Product Manager']
const COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber', 'Airbnb', 'Stripe', 'Startup']
const TYPES = [
  { id: 'technical', label: 'Technical Only', desc: 'Focus on tech questions', icon: '💻' },
  { id: 'behavioral', label: 'Technical + Behavioral', desc: 'Balanced mix', icon: '⚖️' },
  { id: 'full', label: 'Full Interview', desc: 'Complete experience', icon: '🎯' },
]

export default function Setup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [resume, setResume] = useState(null)
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [interviewType, setInterviewType] = useState('full')
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setResume(accepted[0])
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
      if (resume) formData.append('resume', resume)

      const { data } = await interviewApi.start(formData)
      toast.success('Interview session created! Good luck 🍀')
      navigate(`/interview/${data.sessionId}`, { state: { questionPlan: data.questionPlan } })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start interview')
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
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Set Up Your Interview</h1>
          <p className="text-slate-400 mt-2">Configure your personalized mock interview</p>
        </motion.div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <button
                onClick={() => s.num < step && setStep(s.num)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  step === s.num ? 'bg-blue-500 text-white' :
                  step > s.num ? 'bg-green-500/20 text-green-400 cursor-pointer' :
                  'bg-white/5 text-slate-500'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  step > s.num ? 'bg-green-500 text-white' : ''
                }`}>
                  {step > s.num ? '✓' : s.num}
                </span>
                <span className="hidden sm:block">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-6 h-px ${step > s.num ? 'bg-green-500' : 'bg-white/10'}`} />
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
                  <h2 className="text-xl font-semibold text-white mb-1">Upload Your Resume</h2>
                  <p className="text-slate-400 text-sm">PDF format, up to 5MB. Optional but recommended for personalized questions.</p>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                    isDragActive ? 'border-blue-500 bg-blue-500/10' :
                    resume ? 'border-green-500/50 bg-green-500/5' :
                    'border-white/10 hover:border-blue-500/50 hover:bg-white/5'
                  }`}
                >
                  <input {...getInputProps()} />
                  {resume ? (
                    <div className="space-y-3">
                      <div className="text-4xl">📄</div>
                      <p className="text-green-400 font-medium">{resume.name}</p>
                      <p className="text-slate-500 text-sm">{(resume.size / 1024).toFixed(0)} KB • PDF</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setResume(null) }}
                        className="text-red-400 hover:text-red-300 text-xs transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-4xl">📤</div>
                      <p className="text-slate-300 font-medium">
                        {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                      </p>
                      <p className="text-slate-500 text-sm">or click to browse · PDF only · Max 5MB</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
                    Skip (use generic questions)
                  </Button>
                  <Button onClick={() => setStep(2)} className="flex-1" disabled={!resume}>
                    Continue →
                  </Button>
                </div>
                {!resume && (
                  <p className="text-center text-slate-500 text-xs">You can skip this step and still get a great interview experience</p>
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
                  <p className="text-slate-400 text-sm">Questions will be tailored to your specific target.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Role *</label>
                    <input
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      placeholder="e.g. Frontend Developer"
                      className="input-field mb-2"
                      list="roles-list"
                    />
                    <datalist id="roles-list">
                      {ROLES.map(r => <option key={r} value={r} />)}
                    </datalist>
                    <div className="flex flex-wrap gap-2">
                      {ROLES.slice(0, 5).map(r => (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            role === r
                              ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Company *</label>
                    <input
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="e.g. Google"
                      className="input-field mb-2"
                      list="companies-list"
                    />
                    <datalist id="companies-list">
                      {COMPANIES.map(c => <option key={c} value={c} />)}
                    </datalist>
                    <div className="flex flex-wrap gap-2">
                      {COMPANIES.slice(0, 6).map(c => (
                        <button
                          key={c}
                          onClick={() => setCompany(c)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            company === c
                              ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          {c}
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
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        interviewType === type.id
                          ? 'bg-blue-500/15 border-blue-500/50'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div>
                          <p className={`font-medium ${interviewType === type.id ? 'text-blue-400' : 'text-white'}`}>
                            {type.label}
                          </p>
                          <p className="text-slate-400 text-sm">{type.desc}</p>
                        </div>
                        {interviewType === type.id && (
                          <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
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
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-slate-400 text-sm w-20">{item.label}:</span>
                      <span className="text-white text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-blue-400 text-sm leading-relaxed">
                    💡 <strong>Tip:</strong> Treat this like a real interview — take your time, think before answering, and elaborate on your responses with specific examples.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setStep(3)} className="flex-1">← Back</Button>
                  <Button onClick={handleStart} loading={loading} size="lg" className="flex-2 flex-grow-[2]">
                    🚀 Start Interview
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
