import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    let initialised = false

    supabase.auth.getSession().then(({ data }) => {
      if (!initialised) setSession(data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      initialised = true   // listener wins from here on
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, loading: session === undefined }
}
