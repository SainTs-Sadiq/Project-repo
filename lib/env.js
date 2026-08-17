const required=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY'];
export function validatePublicEnv(){const missing=required.filter(k=>!process.env[k]);if(missing.length)throw new Error(`Missing required environment variables: ${missing.join(', ')}`)}
export function validateServerEnv(){validatePublicEnv();if(!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')}
