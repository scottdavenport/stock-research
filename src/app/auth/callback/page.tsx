'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [message, setMessage] = useState('Processing...')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setMessage('Authentication failed. Please try again.')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        if (data.session) {
          setMessage('Successfully authenticated! Redirecting...')
          setTimeout(() => router.push('/'), 1000)
        } else {
          setMessage('No session found. Redirecting to login...')
          setTimeout(() => router.push('/login'), 2000)
        }
      } catch (error) {
        setMessage('An error occurred. Please try again.')
        setTimeout(() => router.push('/login'), 2000)
      }
    }

    handleAuthCallback()
  }, [router, mounted])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
        </div>
        
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  )
}
