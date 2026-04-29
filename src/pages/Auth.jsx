import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const mounted = useRef(true)

  useEffect(() => () => { mounted.current = false }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (!mounted.current) return
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (!mounted.current) return
      if (error) setError(error.message)
      else setSignedUp(true)
    }
    if (mounted.current) setLoading(false)
  }

  if (signedUp) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif font-light tracking-[0.3em] text-4xl text-primary mb-4">DRAPE</h1>
        <p className="text-primary mb-2">Check your email to confirm your account.</p>
        <p className="text-muted text-sm">Then come back here to sign in.</p>
        <button onClick={() => { setSignedUp(false); setMode('login') }} className="text-accent text-sm mt-8">
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <h1 className="font-serif font-light tracking-[0.3em] text-4xl text-primary mb-2">DRAPE</h1>
      <p className="font-serif font-light italic text-muted text-sm mb-10">Your personal wardrobe, curated by AI.</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div>
          <label htmlFor="email" className="sr-only">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-border px-0 py-4 text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-border px-0 py-4 text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            required
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-bg py-4 rounded-xl font-medium tracking-widest text-sm uppercase disabled:opacity-50"
        >
          {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(null) }}
          className="w-full text-muted text-sm py-2"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
