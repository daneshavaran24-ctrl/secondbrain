import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders } from '../_shared/cors.ts';

const PLAUD_CLIENT_ID = Deno.env.get('PLAUD_CLIENT_ID')!
const PLAUD_CLIENT_SECRET = Deno.env.get('PLAUD_CLIENT_SECRET')!
const PLAUD_REDIRECT_URI = Deno.env.get('PLAUD_REDIRECT_URI')!
const PLAUD_API_BASE = 'https://api.plaud.ai'

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, code, refreshToken } = await req.json()

    console.log('Plaud OAuth action:', action)

    // Get authorization URL
    if (action === 'getAuthUrl') {
      const authUrl = `${PLAUD_API_BASE}/oauth/authorize?` +
        `response_type=code&` +
        `client_id=${PLAUD_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(PLAUD_REDIRECT_URI)}&` +
        `scope=recordings:read recordings:write transcripts:read summaries:read`
      
      console.log('Generated auth URL')
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Exchange code for tokens
    if (action === 'exchangeCode') {
      console.log('Exchanging code for tokens')
      
      const tokenResponse = await fetch(`${PLAUD_API_BASE}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: PLAUD_REDIRECT_URI,
          client_id: PLAUD_CLIENT_ID,
          client_secret: PLAUD_CLIENT_SECRET,
        }),
      })

      const tokens = await tokenResponse.json()
      
      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', tokens)
        throw new Error(tokens.error || 'Failed to exchange code')
      }

      // Get user info
      const userInfoResponse = await fetch(`${PLAUD_API_BASE}/v1/user/info`, {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      })
      
      const userInfo = await userInfoResponse.json()
      console.log('User info retrieved successfully')

      return new Response(JSON.stringify({ 
        tokens, 
        userInfo: userInfo.email ? { email: userInfo.email, plaud_user_id: userInfo.id } : {} 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Refresh token
    if (action === 'refreshToken') {
      console.log('Refreshing token')
      
      const tokenResponse = await fetch(`${PLAUD_API_BASE}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: PLAUD_CLIENT_ID,
          client_secret: PLAUD_CLIENT_SECRET,
        }),
      })

      const tokens = await tokenResponse.json()
      
      if (!tokenResponse.ok) {
        console.error('Token refresh failed:', tokens)
        throw new Error(tokens.error || 'Failed to refresh token')
      }

      console.log('Token refreshed successfully')
      return new Response(JSON.stringify({ tokens }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Invalid action')
  } catch (error) {
    console.error('Plaud OAuth error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
