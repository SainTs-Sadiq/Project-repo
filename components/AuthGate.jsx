"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "../lib/supabase/browser";

export default function AuthGate({ children }) {
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const supabase = getSupabaseBrowser();
      setClient(supabase);
      supabase.auth.getSession().then(({ data }) => { setSession(data.session); setBusy(false); });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
      return () => listener.subscription.unsubscribe();
    } catch (e) { setError(e.message); setBusy(false); }
  }, []);

  async function submit(e) {
    e.preventDefault(); setError(""); setMessage(""); setBusy(true);
    const result = mode === "signin"
      ? await client.auth.signInWithPassword({ email, password })
      : await client.auth.signUp({ email, password });
    if (result.error) setError(result.error.message);
    else if (mode === "signup" && !result.data.session) setMessage("Account created. Check your email if email confirmation is enabled in Supabase.");
    setBusy(false);
  }

  if (busy && !client) return <div className="auth-screen"><div className="auth-card"><h1>Food Procurement Intelligence</h1><p>Loading secure authentication…</p></div></div>;
  if (!client) return <div className="auth-screen"><div className="auth-card"><h1>Configuration required</h1><p>{error}</p><small>Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.</small></div></div>;
  if (session) return <>{children}</>;

  return <div className="auth-screen"><div className="auth-card"><div className="auth-mark">IF</div><span className="auth-kicker">SECURE ACCESS</span><h1>{mode === "signin" ? "Welcome back." : "Create your account."}</h1><p>Sign in to keep your dietary profile, menu evaluations and procurement history persistent.</p><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label><label>Password<input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"}/></label>{error&&<div className="auth-error">{error}</div>}{message&&<div className="auth-message">{message}</div>}<button disabled={busy}>{busy?"Working…":mode === "signin"?"Sign in →":"Create account →"}</button></form><button className="auth-switch" onClick={()=>{setMode(mode === "signin" ? "signup":"signin");setError("");setMessage("")}}>{mode === "signin"?"Need an account? Create one":"Already have an account? Sign in"}</button></div><style jsx>{` .auth-screen{min-height:100vh;background:#f5f3ee;display:grid;place-items:center;padding:24px;font-family:Arial,sans-serif}.auth-card{width:min(460px,100%);background:#faf9f5;border:1px solid #dedbd2;padding:42px;box-shadow:0 20px 70px #0000000b}.auth-mark{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:#314d3b;color:#fff;font-weight:700;margin-bottom:22px}.auth-kicker{font-size:9px;letter-spacing:2px;color:#b08b35;font-weight:700}.auth-card h1{font:700 38px Georgia,serif;margin:10px 0}.auth-card p{font-size:12px;line-height:1.7;color:#74736a}.auth-card form{display:grid;gap:15px;margin-top:25px}.auth-card label{font-size:9px;color:#555;display:grid;gap:7px}.auth-card input{padding:13px;border:1px solid #dedbd2;background:#fff}.auth-card form button{padding:14px;border:0;background:#314d3b;color:#fff;cursor:pointer}.auth-card button:disabled{opacity:.55}.auth-switch{border:0;background:none;color:#314d3b;margin-top:18px;cursor:pointer;font-size:10px}.auth-error,.auth-message{padding:10px;font-size:9px;line-height:1.5}.auth-error{background:#f1d9d6;color:#8e3932}.auth-message{background:#dce8dc;color:#314d3b}`}</style></div>;
}
