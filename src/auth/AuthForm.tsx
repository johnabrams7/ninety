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
    const { data, error } =
      mode === 'in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) setMsg(error.message)
    else if (mode === 'up' && !data.session) setMsg('Check your email to confirm your account, then sign in.')
  }

  return (
    <form className="auth" onSubmit={submit}>
      <h2>{mode === 'in' ? 'Sign in' : 'Create your account'}</h2>
      <label>
        Email
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Password
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button type="submit" disabled={busy}>{mode === 'in' ? 'Sign in' : 'Sign up'}</button>
      {msg && <p role="status">{msg}</p>}
      <button type="button" className="link" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
        {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
      </button>
    </form>
  )
}
