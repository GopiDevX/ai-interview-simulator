import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import api from '../api/auth' // use api directly for authenticated requests

export default function Pricing() {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please sign in to upgrade')
      return navigate('/login')
    }

    if (user.tier === 'pro') {
      return toast.error('You are already on the Pro tier!')
    }

    setLoading(true)
    try {
      const { data } = await api.post('/payment/create-checkout-session')
      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (err) {
      console.error(err)
      toast.error('Could not initiate checkout. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen hero-bg pt-24 px-4 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Master your technical interviews with our industry-leading AI simulator. Choose the plan that fits your career goals.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Tier */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 flex flex-col"
          >
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-slate-300 mb-2">Basic</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-slate-500">/ forever</span>
              </div>
              <p className="text-slate-400 mt-4 text-sm">Perfect for trying out the platform.</p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-slate-300">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                1 Full Mock Interview
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic Scorecard Report
              </li>
              <li className="flex items-center gap-3 text-slate-500 line-through">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Unlimited Practice Sessions
              </li>
              <li className="flex items-center gap-3 text-slate-500 line-through">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Advanced System Design Mode
              </li>
            </ul>

            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => navigate('/setup')}
            >
              Get Started Free
            </Button>
          </motion.div>

          {/* Pro Tier */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-8 flex flex-col relative overflow-hidden border-blue-500/50"
            style={{ background: 'linear-gradient(145deg, rgba(30,58,138,0.1) 0%, rgba(15,23,42,0.6) 100%)' }}
          >
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              RECOMMENDED
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-blue-400 mb-2">Pro</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">$5</span>
                <span className="text-slate-500">/ month</span>
              </div>
              <p className="text-slate-400 mt-4 text-sm">Everything you need to land your dream job.</p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-slate-200">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited Mock Interviews
              </li>
              <li className="flex items-center gap-3 text-slate-200">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced System Design Whiteboard
              </li>
              <li className="flex items-center gap-3 text-slate-200">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Live Code Execution Sandbox
              </li>
              <li className="flex items-center gap-3 text-slate-200">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Detailed Emailed Scorecards
              </li>
            </ul>

            <Button 
              fullWidth 
              loading={loading} 
              onClick={handleSubscribe}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {user?.tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
