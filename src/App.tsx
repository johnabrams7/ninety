import { AuthForm } from './auth/AuthForm'
import { useSession } from './auth/useSession'
import { Tracker } from './components/Tracker'
import { isConfigured, supabase } from './data/supabase'

export default function App() {
  const session = useSession()

  if (!isConfigured)
    return <div className="app"><p className="error">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local (see README), then restart the dev server.</p></div>
  if (session === undefined) return <div className="app"><p className="hint">Loading…</p></div>
  if (session === null)
    return <div className="app"><header className="top"><div className="brand">Ninety<small>Aim for 90%+. Perfect is not the goal.</small></div></header><AuthForm /></div>

  return (
    <div className="app">
      <Tracker />
      <div className="foot"><button className="link" onClick={() => supabase.auth.signOut()}>Sign out ({session.user.email})</button></div>
    </div>
  )
}
