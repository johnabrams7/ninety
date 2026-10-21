import { useState, type FormEvent } from 'react'
import { supabase } from '../data/supabase'

export function AuthForm() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    try {
      const { data, error } =
        mode === 'in'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password })
      if (error) setMsg(error.message)
      else if (mode === 'up' && !data.session) setMsg('Check your email to confirm your account, then sign in.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Something went wrong.')
    }
    setBusy(false)
  }

  return (
    <form className="sheet" onSubmit={submit}>
      <h2>{mode === 'in' ? 'Sign in' : 'Create your account'}</h2>
      <label className="field" htmlFor="auth-email">
        Email
        <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field" htmlFor="auth-password">
        Password
        <input id="auth-password" type="password" required minLength={8} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button type="submit" className="btn primary" disabled={busy}>{mode === 'in' ? 'Sign in' : 'Sign up'}</button>
      {msg && <p className="auth-msg" role="status">{msg}</p>}
      <button type="button" className="link" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
        {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
      </button>
    </form>
  )
}
