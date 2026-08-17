"use client";

import { useState } from "react";

const CONSTRAINTS = [
  ["vegan","🌱 Vegan"],["vegetarian","🥦 Vegetarian"],["gluten_free","🌾 Gluten-Free"],["dairy_free","🥛 Dairy-Free"],
  ["nut_free","🥜 Nut-Free"],["low_carb","🥩 Low-Carb"],["halal","☪️ Halal"],["kosher","✡️ Kosher"]
];
const GOALS = [["weight_loss","⚖️ Weight Loss"],["muscle_gain","💪 Muscle Gain"],["maintenance","🎯 Maintenance"],["athletic","🏃 Athletic Performance"],["heart_health","❤️ Heart Health"]];
const BUDGETS = [["budget",50,"💵"],["moderate",100,"💳"],["premium",200,"💎"]];

function Markdown({ text }) {
  return <div className="markdown">{text.split("\n").map((line,i) => {
    if (line.startsWith("## ")) return <h2 key={i}>{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i}>{line.slice(4)}</h3>;
    if (line.startsWith("- ") || line.startsWith("* ")) return <div className="bullet" key={i}>• {line.slice(2)}</div>;
    if (/^\|.*\|$/.test(line)) return <div className="tableline" key={i}>{line}</div>;
    if (!line.trim()) return <div className="gap" key={i}/>;
    return <p key={i}>{line}</p>;
  })}</div>;
}

export default function Home() {
  const [step,setStep]=useState(0), [loading,setLoading]=useState(false), [error,setError]=useState("");
  const [result,setResult]=useState(""), [tab,setTab]=useState(0), [question,setQuestion]=useState(""), [history,setHistory]=useState([]);
  const [profile,setProfile]=useState({household:2,constraints:[],goal:"maintenance",budget:"moderate",budgetAmount:100,notes:""});

  const toggleConstraint=id=>setProfile(p=>({...p,constraints:p.constraints.includes(id)?p.constraints.filter(x=>x!==id):[...p.constraints,id]}));
  const generate=async()=>{
    setLoading(true);setError("");
    try { const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profile})}); const d=await r.json(); if(!r.ok) throw new Error(d.error); setResult(d.text||"");setStep(4);setTab(0); }
    catch(e){setError(e.message||"Generation failed.");} finally{setLoading(false);}
  };
  const refine=async()=>{
    if(!question.trim()||!result)return; setLoading(true);setError("");
    try { const r=await fetch("/api/refine",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profile,currentPlan:result,question})}); const d=await r.json(); if(!r.ok) throw new Error(d.error); setHistory(h=>[...h,{q:question,a:d.text}]);setQuestion(""); }
    catch(e){setError(e.message||"Refinement failed.");} finally{setLoading(false);}
  };

  return <main>
    <header><div className="eyebrow">INTELLIGENT FOOD PROCUREMENT</div><h1>Plan smarter.<br/><em>Eat better.</em></h1><p>AI-powered grocery planning tailored to your household, goals, dietary needs and budget.</p></header>
    <nav>{["Profile","Diet","Goal","Review","Results"].map((x,i)=><button key={x} className={step===i?"active":""} onClick={()=>i<4&&setStep(i)}>{i+1}<small>{x}</small></button>)}</nav>

    {step===0&&<section className="card"><h2>👥 Household</h2><p>How many people are you planning for?</p><div className="counter"><button onClick={()=>setProfile(p=>({...p,household:Math.max(1,p.household-1)}))}>−</button><strong>{profile.household}</strong><button onClick={()=>setProfile(p=>({...p,household:Math.min(12,p.household+1)}))}>+</button><span>person{profile.household!==1?"s":""}</span></div><h2>💰 Weekly Budget</h2><p>Choose your approximate weekly food budget.</p><div className="grid">{BUDGETS.map(([id,n,icon])=><button key={id} className={profile.budget===id?"choice selected":"choice"} onClick={()=>setProfile(p=>({...p,budget:id,budgetAmount:n}))}><b>{icon}</b><strong>{id[0].toUpperCase()+id.slice(1)}</strong><small>${n}/week</small></button>)}</div><button className="cta" onClick={()=>setStep(1)}>Continue →</button></section>}

    {step===1&&<section className="card"><h2>🥗 Dietary Constraints</h2><p>Select every dietary requirement that applies.</p><div className="chips">{CONSTRAINTS.map(([id,label])=><button key={id} className={profile.constraints.includes(id)?"chip selected":"chip"} onClick={()=>toggleConstraint(id)}>{label}</button>)}</div><label>Special notes, allergies or preferences<textarea value={profile.notes} onChange={e=>setProfile(p=>({...p,notes:e.target.value}))} placeholder="e.g. peanut allergy, dislike mushrooms, prefer local foods..."/></label><div className="row"><button className="back" onClick={()=>setStep(0)}>← Back</button><button className="cta" onClick={()=>setStep(2)}>Continue →</button></div></section>}

    {step===2&&<section className="card"><h2>🎯 Nutrition Goal</h2><p>Your primary objective shapes the meal and procurement recommendations.</p><div className="chips">{GOALS.map(([id,label])=><button key={id} className={profile.goal===id?"chip selected":"chip"} onClick={()=>setProfile(p=>({...p,goal:id}))}>{label}</button>)}</div><div className="row"><button className="back" onClick={()=>setStep(1)}>← Back</button><button className="cta" onClick={()=>setStep(3)}>Continue →</button></div></section>}

    {step===3&&<section className="card"><h2>✨ Review & Generate</h2><p>Confirm your profile before the AI builds your personalized plan.</p><div className="summary"><div><small>HOUSEHOLD</small><b>{profile.household} people</b></div><div><small>BUDGET</small><b>${profile.budgetAmount}/week</b></div><div><small>GOAL</small><b>{GOALS.find(x=>x[0]===profile.goal)?.[1]}</b></div><div><small>CONSTRAINTS</small><b>{profile.constraints.length?profile.constraints.length+" selected":"None"}</b></div></div>{error&&<div className="error">⚠️ {error}</div>}{loading?<div className="loading">Generating your personalized plan…</div>:<div className="row"><button className="back" onClick={()=>setStep(2)}>← Back</button><button className="cta" onClick={generate}>Generate My Plan →</button></div>}</section>}

    {step===4&&result&&<section className="card"><div className="resultHead"><div><h2>Your <em>Optimized</em> Plan</h2><p>{profile.household} people · ${profile.budgetAmount}/week · {GOALS.find(x=>x[0]===profile.goal)?.[1]}</p></div><button className="back" onClick={()=>{setStep(0);setResult("");setHistory([])}}>↺ New Plan</button></div><div className="tabs"><button className={tab===0?"activeTab":""} onClick={()=>setTab(0)}>Plan</button><button className={tab===1?"activeTab":""} onClick={()=>setTab(1)}>Refine</button><button className={tab===2?"activeTab":""} onClick={()=>setTab(2)}>Profile</button></div>{tab===0&&<Markdown text={result}/>} {tab===1&&<div><p>Ask a follow-up question to adjust your plan.</p>{history.map((x,i)=><div className="qa" key={i}><b>❓ {x.q}</b><Markdown text={x.a}/></div>)}<div className="ask"><input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==="Enter"&&refine()} placeholder="Swap chicken for tofu, add more fiber…"/><button className="cta" onClick={refine} disabled={loading}>Ask →</button></div></div>}{tab===2&&<div className="summary"><div><small>HOUSEHOLD</small><b>{profile.household} people</b></div><div><small>BUDGET</small><b>{profile.budget} · ${profile.budgetAmount}/wk</b></div><div><small>GOAL</small><b>{GOALS.find(x=>x[0]===profile.goal)?.[1]}</b></div><div><small>CONSTRAINTS</small><b>{profile.constraints.map(id=>CONSTRAINTS.find(x=>x[0]===id)?.[1]).join(", ")||"None"}</b></div></div>}</section>}
    <footer>Intelligent Food Procurement · Powered by Claude AI</footer>
  </main>;
}

const css=`
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
*{box-sizing:border-box}body{margin:0;background:#0a0a08;color:#f0ede6;font-family:'DM Mono',monospace}main{max-width:1000px;margin:auto;padding:30px 20px 70px}header{text-align:center;padding:45px 0 25px}header .eyebrow{color:#c8b560;font-size:11px;letter-spacing:4px;margin-bottom:15px}h1{font:700 clamp(42px,8vw,78px)/.95 'Playfair Display',serif;margin:0 0 18px}em{color:#c8b560}header p,.card>p{color:#77776d;font-size:13px;line-height:1.7}nav{display:flex;justify-content:center;gap:8px;margin:25px 0 30px}nav button{border:1px solid #292925;background:#111;color:#777;padding:9px 12px;border-radius:3px;cursor:pointer}nav button.active{background:#c8b560;color:#0a0a08}nav small{display:block;font-size:9px;margin-top:3px}.card{background:#111;border:1px solid #292925;padding:28px;border-radius:4px;margin-bottom:20px}.card h2{font:600 22px 'Playfair Display',serif;margin:0 0 5px}.card>p{margin:0 0 24px}.counter{display:flex;align-items:center;gap:16px;margin-bottom:35px}.counter button{width:40px;height:40px;background:#1a1a18;border:1px solid #333;color:#eee;font-size:22px}.counter strong{font:700 34px 'Playfair Display';color:#c8b560}.counter span{color:#777;font-size:12px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:25px}.choice,.chip{background:#111;border:1px solid #292925;color:#aaa;padding:15px;cursor:pointer;border-radius:3px}.choice b,.choice strong,.choice small{display:block}.choice b{font-size:22px}.choice strong{margin:6px 0;color:#eee}.choice small{color:#777}.choice.selected,.chip.selected{border-color:#c8b560;color:#c8b560;background:#181710}.chips{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:25px}.chip{padding:10px 14px;font-family:inherit}label{display:block;color:#777;font-size:11px}textarea,input{width:100%;margin-top:8px;background:#1a1a18;border:1px solid #292925;color:#eee;padding:13px;font:12px 'DM Mono';outline:none}textarea{min-height:90px;resize:vertical}.row{display:flex;gap:10px;margin-top:20px}.cta,.back{padding:13px 18px;border-radius:3px;font:500 11px 'DM Mono';cursor:pointer}.cta{border:0;background:#c8b560;color:#0a0a08;flex:1}.back{border:1px solid #292925;background:transparent;color:#888}.summary{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:20px 0}.summary>div{background:#1a1a18;border:1px solid #292925;padding:15px}.summary small{display:block;color:#555;font-size:9px;letter-spacing:2px;margin-bottom:7px}.summary b{font-size:12px}.error{background:#351818;border:1px solid #713333;padding:12px;color:#ff8b8b;font-size:11px}.loading{text-align:center;padding:40px;color:#c8b560}.resultHead{display:flex;justify-content:space-between;gap:15px;align-items:center}.resultHead h2{margin-bottom:5px}.resultHead p{color:#777;font-size:11px}.tabs{display:flex;border-bottom:1px solid #292925;margin:25px 0}.tabs button{background:none;border:0;color:#777;padding:12px 18px;cursor:pointer;font-family:inherit}.tabs .activeTab{color:#c8b560;border-bottom:2px solid #c8b560}.markdown{font-size:12px;line-height:1.8}.markdown h2{color:#c8b560;margin:28px 0 10px}.markdown h3{margin:20px 0 8px}.markdown p{margin:5px 0;color:#ddd}.bullet{color:#ddd}.tableline{overflow:auto;white-space:pre;color:#ccc;background:#0c0c0b;padding:4px}.gap{height:5px}.qa{border:1px solid #292925;margin:15px 0;padding:12px}.qa>b{color:#c8b560;font-size:11px}.ask{display:flex;gap:8px}.ask input{margin:0}.ask .cta{flex:0 0 100px}footer{text-align:center;color:#444;font-size:10px;margin-top:30px}@media(max-width:650px){.grid{grid-template-columns:1fr}.summary{grid-template-columns:1fr}.resultHead{flex-direction:column;align-items:flex-start}.row{flex-direction:column}.ask{flex-direction:column}.ask .cta{flex:auto}nav{flex-wrap:wrap}}
`;
if(typeof document!=="undefined"&&!document.getElementById("food-procurement-css")){const s=document.createElement("style");s.id="food-procurement-css";s.textContent=css;document.head.appendChild(s)}
