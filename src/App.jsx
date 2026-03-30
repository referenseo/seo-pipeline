import { useState, useRef, useEffect } from "react";

const STEPS = [
  { id: "competitors", label: "Concurrence",   icon: "🔍", desc: "Top SERP + angles éditoriaux" },
  { id: "entities",    label: "Entités",        icon: "🏷️",  desc: "Champ sémantique + LSI" },
  { id: "longtail",   label: "Longue traîne",  icon: "📊", desc: "Variantes + intentions" },
  { id: "faq",        label: "FAQ & PAA",      icon: "❓",  desc: "Questions fréquentes" },
  { id: "plan",       label: "Plan",           icon: "📋",  desc: "Structure H1/H2/H3" },
  { id: "article",    label: "Article",        icon: "✍️",  desc: "Rédaction complète HTML" },
];

const SYSTEM_BASE = (siteName) =>
  `Tu es un expert SEO et rédacteur web francophone spécialisé pour le site "${siteName}".
Tes contenus sont optimisés pour Google, structurés H1/H2/H3, écrits pour les humains d'abord.
Tu réponds UNIQUEMENT en JSON valide, sans backticks, sans commentaires, sans texte avant ou après.`;

const PROMPTS = {
  competitors: (s, k, site) => ({
    system: SYSTEM_BASE(site),
    user: `Analyse la concurrence SEO pour le sujet: "${s}", mot-clé: "${k}". Simule les 10 premiers résultats Google FR, identifie les patterns, angles, et opportunités de différenciation.
JSON: {"top_results":[{"title":"...","angle":"...","estimated_words":0,"structure_type":"..."}],"content_gaps":["..."],"winning_angle":"...","recommended_approach":"..."}`
  }),
  entities: (s, k, site) => ({
    system: SYSTEM_BASE(site),
    user: `Pour l'article "${s}" (mot-clé: "${k}"), identifie toutes les entités nommées et concepts sémantiques essentiels.
JSON: {"persons":["..."],"brands_tools":["..."],"concepts":["..."],"places":["..."],"lsi_keywords":["..."],"semantic_field":["..."]}`
  }),
  longtail: (s, k, site) => ({
    system: SYSTEM_BASE(site),
    user: `Génère la longue traîne SEO pour "${s}" / "${k}" en français.
JSON: {"exact_match":["..."],"question_keywords":["..."],"comparison_keywords":["..."],"beginner_keywords":["..."],"expert_keywords":["..."],"secondary_keywords":["..."],"total_search_intent":"informationnelle|transactionnelle|navigationnelle"}`
  }),
  faq: (s, k, site) => ({
    system: SYSTEM_BASE(site),
    user: `Génère FAQ + People Also Ask pour un article sur "${s}" / "${k}".
JSON: {"paa_questions":[{"question":"...","short_answer":"..."}],"faq_items":[{"question":"...","answer":"..."}],"featured_snippet_opportunity":{"question":"...","ideal_answer":"..."}}`
  }),
  plan: (s, k, prev, site) => ({
    system: SYSTEM_BASE(site),
    user: `Sur la base des analyses: ${JSON.stringify({competitors:prev.competitors,entities:prev.entities,longtail:prev.longtail,faq:prev.faq})}, crée un plan éditorial SEO pour "${s}" / "${k}".
JSON: {"h1":"...","meta_title":"...","meta_description":"...","intro_angle":"...","sections":[{"h2":"...","h3s":["..."],"key_entities":["..."],"target_keywords":["..."],"estimated_words":0}],"conclusion_cta":"...","total_estimated_words":0}`
  }),
  article: (s, k, prev, site) => ({
    system: `${SYSTEM_BASE(site)} Génère des articles longs et qualitatifs avec intro accrocheuse, transitions fluides, exemples concrets. HTML sémantique structuré.`,
    user: `Rédige l'article HTML complet d'après ce plan: ${JSON.stringify(prev.plan)}. Sujet: "${s}", mot-clé: "${k}", LSI: ${JSON.stringify(prev.entities?.lsi_keywords?.slice(0,10))}, FAQ: ${JSON.stringify(prev.faq?.faq_items?.slice(0,3))}.
JSON: {"html_content":"<article>...</article>","word_count":0,"reading_time_minutes":0,"seo_score_estimate":0,"title":"...","excerpt":"..."}`
  }),
};

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    }),
  });
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean);
}

async function publishToWordPress(profile, articleData) {
  const credentials = btoa(`${profile.wpUser}:${profile.appPassword}`);
  const cleanUrl = profile.wpUrl.replace(/\/$/, "");
  const res = await fetch(`${cleanUrl}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "an, "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "an, Authorization: `Basic ${credentials}` },
    body: JSON.stringify({
      title: articleData.title,
      content: articleData.html_content,
      excerpt: articleData.excerpt,
      status: "draft",
    }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || `HTTP ${res.status}`); }
  return await res.json();
}

const STORAGE_KEY = "seo_pipeline_sites_v2";
function loadSites() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function saveSites(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} }

const Spinner = () => (
  <span style={{ display:"inline-block", width:13, height:13, border:"2px solid var(--color-border-tertiary)", borderTop:"2px solid var(--color-text-secondary)", borderRadius:"50%", animation:"spin 0.8s linear infinite", flexShrink:0 }} />
);

const Badge = ({ status }) => {
  const m = { idle:{bg:"var(--color-background-secondary)",color:"var(--color-text-tertiary)",label:"En attente"}, running:{bg:"#FEF3C7",color:"#92400E",label:"En cours…"}, done:{bg:"#D1FAE5",color:"#065F46",label:"Terminé"}, error:{bg:"#FEE2E2",color:"#991B1B",label:"Erreur"} }[status] || {};
  return <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:m.bg, color:m.color, fontWeight:500, whiteSpace:"nowrap" }}>{m.label}</span>;
};

function SiteModal({ sites, onSave, onSelect, onDelete, onClose }) {
  const [form, setForm] = useState({ name:"", url:"", user:"", password:"" });
  const [editing, setEditing] = useState(null);
  const [localSites, setLocalSites] = useState(sites);
  const canSave = form.name && form.url && form.user && form.password;

  const handleSave = () => {
    if (!canSave) return;
    const entry = { name:form.name, wpUrl:form.url, wpUser:form.user, appPassword:form.password };
    const updated = editing !== null ? localSites.map((s,i)=>i===editing?entry:s) : [...localSites, entry];
    setLocalSites(updated);
    onSave(updated);
    setForm({ name:"", url:"", user:"", password:"" });
    setEditing(null);
  };

  const handleEdit = (i) => {
    const s = localSites[i];
    setForm({ name:s.name, url:s.wpUrl, user:s.wpUser, password:s.appPassword });
    setEditing(i);
  };

  const handleDelete = (i) => {
    const updated = localSites.filter((_,idx)=>idx!==i);
    setLocalSites(updated);
    onDelete(updated);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", width:"100%", maxWidth:500, maxHeight:"85vh", overflowY:"auto", padding:"1.25rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:500, color:"var(--color-text-primary)" }}>Mes sites WordPress</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"var(--color-text-secondary)", lineHeight:1, padding:"0 4px" }}>×</button>
        </div>

        {localSites.length > 0 && (
          <div style={{ marginBottom:"1rem", display:"flex", flexDirection:"column", gap:6 }}>
            {localSites.map((site, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>{site.name}</p>
                  <p style={{ margin:0, fontSize:11, color:"var(--color-text-secondary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{site.wpUrl} · {site.wpUser}</p>
                </div>
                <button onClick={() => onSelect(site)} style={{ fontSize:12, padding:"4px 10px", color:"var(--color-text-info)", background:"none", border:"0.5px solid var(--color-border-info)", borderRadius:"var(--border-radius-md)", cursor:"pointer" }}>Choisir</button>
                <button onClick={() => handleEdit(i)} style={{ fontSize:12, padding:"4px 8px", background:"none", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", cursor:"pointer", color:"var(--color-text-secondary)" }}>✎</button>
                <button onClick={() => handleDelete(i)} style={{ fontSize:12, padding:"4px 8px", background:"none", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", cursor:"pointer", color:"var(--color-text-danger)" }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: localSites.length > 0 ? "0.5px solid var(--color-border-tertiary)" : "none", paddingTop: localSites.length > 0 ? "1rem" : 0 }}>
          <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>
            {editing !== null ? "Modifier le site" : "Ajouter un site"}
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            {[
              { key:"name", lbl:"Nom du site", ph:"lesmakers.fr", type:"text" },
              { key:"url",  lbl:"URL WordPress", ph:"https://lesmakers.fr", type:"url" },
              { key:"user", lbl:"Identifiant WP", ph:"admin", type:"text" },
              { key:"password", lbl:"Application Password", ph:"xxxx xxxx xxxx xxxx", type:"password" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:11, color:"var(--color-text-secondary)", display:"block", marginBottom:3 }}>
                  {f.lbl}
                  {f.key === "password" && <a href="https://wordpress.org/documentation/article/application-passwords/" target="_blank" rel="noopener" style={{ color:"var(--color-text-info)", fontSize:10, marginLeft:4 }}>(aide)</a>}
                </label>
                <input type={f.type} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} placeholder={f.ph} style={{ width:"100%", boxSizing:"border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={handleSave} disabled={!canSave} style={{ padding:"7px 16px", fontWeight:500, opacity:canSave?1:0.45, cursor:canSave?"pointer":"not-allowed" }}>
              {editing !== null ? "Enregistrer" : "+ Ajouter"}
            </button>
            {editing !== null && (
              <button onClick={()=>{ setEditing(null); setForm({name:"",url:"",user:"",password:""}); }} style={{ fontSize:12, padding:"6px 12px", color:"var(--color-text-secondary)" }}>Annuler</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [subject, setSubject] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sites, setSites] = useState([]);
  const [activeSite, setActiveSite] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [results, setResults] = useState({});
  const [stepStatus, setStepStatus] = useState({});
  const [running, setRunning] = useState(false);
  const [wpStatus, setWpStatus] = useState(null);
  const [wpResult, setWpResult] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);
  const abortRef = useRef(false);

  useEffect(() => {
    const s = loadSites();
    setSites(s);
    if (s.length > 0) setActiveSite(s[0]);
  }, []);

  const isReady = subject.trim() && keyword.trim();
  const isDone = stepStatus["article"] === "done";
  const completedCount = STEPS.filter(s => stepStatus[s.id] === "done").length;
  const setStatus = (id, s) => setStepStatus(prev => ({ ...prev, [id]: s }));

  function handleSiteSave(updated) { setSites(updated); saveSites(updated); if (!activeSite && updated.length > 0) setActiveSite(updated[0]); }
  function handleSiteSelect(site) { setActiveSite(site); setShowModal(false); }
  function handleSiteDelete(updated) { setSites(updated); saveSites(updated); if (activeSite && !updated.find(s=>s.name===activeSite.name)) setActiveSite(updated[0]||null); }

  async function runPipeline() {
    if (!isReady) return;
    abortRef.current = false;
    setRunning(true);
    setResults({});
    setStepStatus({});
    setWpStatus(null);
    setWpResult(null);
    const acc = {};
    const siteName = activeSite?.name || "mon site";
    try {
      for (const { id } of STEPS) {
        if (abortRef.current) break;
        setStatus(id, "running");
        try {
          const p = id==="competitors" ? PROMPTS.competitors(subject,keyword,siteName)
                  : id==="entities"    ? PROMPTS.entities(subject,keyword,siteName)
                  : id==="longtail"    ? PROMPTS.longtail(subject,keyword,siteName)
                  : id==="faq"         ? PROMPTS.faq(subject,keyword,siteName)
                  : id==="plan"        ? PROMPTS.plan(subject,keyword,acc,siteName)
                  :                      PROMPTS.article(subject,keyword,acc,siteName);
          const data = await callClaude(p);
          acc[id] = data;
          setResults(prev => ({ ...prev, [id]: data }));
          setStatus(id, "done");
        } catch(e) {
          setStatus(id, "error");
          acc[id] = { error: e.message };
        }
      }
    } finally { setRunning(false); }
  }

  async function handlePublish() {
    if (!activeSite) { setWpStatus("no_site"); return; }
    const article = results["article"];
    if (!article) return;
    setWpStatus("publishing");
    try {
      const res = await publishToWordPress(activeSite, article);
      setWpResult(res);
      setWpStatus("published");
    } catch(e) {
      setWpStatus("error_wp");
      setWpResult({ error: e.message });
    }
  }

  return (
    <div style={{ fontFamily:"var(--font-sans)", maxWidth:700, margin:"0 auto", padding:"1.5rem 1rem" }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(3px); } to { opacity:1; transform:translateY(0); } }
        .step-row { transition:background 0.12s; border-radius:var(--border-radius-md); }
        .step-row:hover { background:var(--color-background-secondary) !important; }
      `}</style>

      {showModal && (
        <SiteModal
          sites={sites}
          onSave={handleSiteSave}
          onSelect={handleSiteSelect}
          onDelete={handleSiteDelete}
          onClose={() => setShowModal(false)}
        />
      )}

      <div style={{ marginBottom:"1.25rem" }}>
        <h2 style={{ fontSize:20, fontWeight:500, margin:"0 0 2px", color:"var(--color-text-primary)" }}>Pipeline SEO Automatisé</h2>
        <p style={{ fontSize:13, color:"var(--color-text-secondary)", margin:0 }}>De l'idée à la publication WordPress en 6 étapes IA</p>
      </div>

      <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"1rem 1.25rem", marginBottom:"0.75rem" }}>

        <div style={{ marginBottom:"0.875rem" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, color:"var(--color-text-secondary)", fontWeight:500 }}>Site cible</span>
            <button onClick={() => setShowModal(true)} style={{ fontSize:11, padding:"3px 10px" }}>
              {sites.length === 0 ? "+ Ajouter un site" : "⚙ Gérer les sites"}
            </button>
          </div>
          {sites.length === 0 ? (
            <p style={{ fontSize:12, color:"var(--color-text-tertiary)", margin:0 }}>Aucun site configuré — cliquez sur Ajouter pour paramétrer votre WordPress.</p>
          ) : (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {sites.map((site, i) => {
                const isActive = activeSite?.name === site.name;
                return (
                  <button key={i} onClick={() => setActiveSite(site)} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 11px", borderRadius:"var(--border-radius-md)", border: isActive ? "1px solid var(--color-border-primary)" : "0.5px solid var(--color-border-secondary)", background: isActive ? "var(--color-background-primary)" : "var(--color-background-secondary)", cursor:"pointer", fontSize:12, fontWeight: isActive ? 500 : 400, color:"var(--color-text-primary)", transition:"all 0.15s" }}>
                    {isActive && <span style={{ width:6, height:6, borderRadius:"50%", background:"#10B981", display:"inline-block", flexShrink:0 }} />}
                    {site.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:12, color:"var(--color-text-secondary)", display:"block", marginBottom:4 }}>Sujet de l'article</label>
            <input type="text" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="ex: Les meilleurs outils no-code 2025" style={{ width:"100%", boxSizing:"border-box" }} disabled={running} />
          </div>
          <div>
            <label style={{ fontSize:12, color:"var(--color-text-secondary)", display:"block", marginBottom:4 }}>Mot-clé principal</label>
            <input type="text" value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="ex: outils no-code" style={{ width:"100%", boxSizing:"border-box" }} disabled={running} />
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={runPipeline} disabled={!isReady||running} style={{ padding:"8px 20px", fontWeight:500, opacity:(!isReady||running)?0.45:1, cursor:(!isReady||running)?"not-allowed":"pointer" }}>
            {running ? "Pipeline en cours…" : "▶ Lancer le pipeline"}
          </button>
          {running && (
            <>
              <Spinner />
              <button onClick={() => { abortRef.current=true; setRunning(false); }} style={{ fontSize:12, padding:"5px 12px", color:"var(--color-text-secondary)" }}>Arrêter</button>
            </>
          )}
          {!running && completedCount > 0 && (
            <span style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{completedCount}/{STEPS.length} étapes complètes</span>
          )}
        </div>
      </div>

      {(running || completedCount > 0) && (
        <div style={{ height:2, background:"var(--color-background-secondary)", borderRadius:99, marginBottom:"0.75rem", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${Math.round((completedCount/STEPS.length)*100)}%`, background:"var(--color-text-primary)", borderRadius:99, transition:"width 0.5s ease" }} />
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:"0.75rem" }}>
        {STEPS.map((step, i) => {
          const status = stepStatus[step.id] || "idle";
          const data = results[step.id];
          const isExp = expandedStep === step.id;
          return (
            <div key={step.id} className="step-row" style={{ border:"0.5px solid var(--color-border-tertiary)", overflow:"hidden", animation: status==="done" ? "fadeIn 0.25s ease" : "none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px" }}>
                <span style={{ fontSize:15, minWidth:20, textAlign:"center" }}>{step.icon}</span>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>{i+1}. {step.label}</span>
                  <span style={{ fontSize:11, color:"var(--color-text-secondary)", marginLeft:8 }}>{step.desc}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {status === "running" && <Spinner />}
                  <Badge status={status} />
                  {data && (
                    <button onClick={() => setExpandedStep(isExp?null:step.id)} style={{ fontSize:11, padding:"2px 6px", color:"var(--color-text-secondary)", background:"none", border:"none", cursor:"pointer" }}>
                      {isExp ? "▲" : "▼"}
                    </button>
                  )}
                </div>
              </div>

              {isExp && data && (
                <div style={{ borderTop:"0.5px solid var(--color-border-tertiary)", padding:"10px 12px", background:"var(--color-background-secondary)", animation:"fadeIn 0.2s ease" }}>

                  {step.id === "competitors" && (
                    <div>
                      <p style={{ margin:"0 0 6px", fontSize:12 }}><strong style={{ color:"var(--color-text-primary)" }}>Angle gagnant :</strong> <span style={{ color:"var(--color-text-secondary)" }}>{data.winning_angle}</span></p>
                      <p style={{ margin:"0 0 8px", fontSize:12, color:"var(--color-text-secondary)" }}>{data.recommended_approach}</p>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                        {(data.content_gaps||[]).slice(0,6).map((g,j) => <span key={j} style={{ fontSize:11, padding:"2px 8px", background:"var(--color-background-info)", color:"var(--color-text-info)", borderRadius:99 }}>{g}</span>)}
                      </div>
                    </div>
                  )}

                  {step.id === "entities" && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {[["Concepts",data.concepts],["LSI",data.lsi_keywords],["Outils",data.brands_tools],["Champ sémantique",data.semantic_field]].map(([lbl,arr]) => arr?.length > 0 && (
                        <div key={lbl}>
                          <p style={{ fontSize:11, color:"var(--color-text-secondary)", margin:"0 0 4px" }}>{lbl}</p>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                            {arr.slice(0,6).map((e,j) => <span key={j} style={{ fontSize:11, padding:"2px 6px", background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:4, color:"var(--color-text-primary)" }}>{e}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.id === "longtail" && (
                    <div>
                      <p style={{ margin:"0 0 6px", fontSize:12 }}><strong style={{ color:"var(--color-text-primary)" }}>Intention :</strong> <span style={{ color:"var(--color-text-secondary)" }}>{data.total_search_intent}</span></p>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                        {[...(data.question_keywords||[]),...(data.comparison_keywords||[]),...(data.beginner_keywords||[])].slice(0,12).map((k,j)=><span key={j} style={{ fontSize:11, padding:"2px 7px", background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:4, color:"var(--color-text-primary)" }}>{k}</span>)}
                      </div>
                    </div>
                  )}

                  {step.id === "faq" && (
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {(data.faq_items||data.paa_questions||[]).slice(0,4).map((item,j) => (
                        <div key={j}>
                          <p style={{ margin:0, fontSize:12, fontWeight:500, color:"var(--color-text-primary)" }}>Q : {item.question}</p>
                          <p style={{ margin:"2px 0 0", fontSize:11, color:"var(--color-text-secondary)" }}>{(item.answer||item.short_answer||"").slice(0,130)}…</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.id === "plan" && (
                    <div>
                      <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>{data.h1}</p>
                      <p style={{ margin:"0 0 8px", fontSize:11, color:"var(--color-text-secondary)" }}>{data.meta_description}</p>
                      {(data.sections||[]).map((sec,j) => (
                        <div key={j} style={{ marginBottom:4 }}>
                          <p style={{ margin:0, fontSize:12, fontWeight:500, color:"var(--color-text-primary)" }}>H2 : {sec.h2}</p>
                          {(sec.h3s||[]).map((h,k) => <p key={k} style={{ margin:"2px 0 0 14px", fontSize:11, color:"var(--color-text-secondary)" }}>↳ {h}</p>)}
                        </div>
                      ))}
                      <p style={{ margin:"8px 0 0", fontSize:11, color:"var(--color-text-tertiary)" }}>≈ {data.total_estimated_words} mots</p>
                    </div>
                  )}

                  {step.id === "article" && (
                    <div>
                      <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                        {[{l:"Mots",v:data.word_count},{l:"Lecture",v:`${data.reading_time_minutes} min`},{l:"Score SEO",v:`${data.seo_score_estimate}/100`}].map(m=>(
                          <div key={m.l} style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", padding:"5px 14px", textAlign:"center" }}>
                            <div style={{ fontSize:15, fontWeight:500, color:"var(--color-text-primary)" }}>{m.v}</div>
                            <div style={{ fontSize:10, color:"var(--color-text-secondary)" }}>{m.l}</div>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize:12, color:"var(--color-text-secondary)", margin:"0 0 6px" }}><strong>Extrait :</strong> {data.excerpt}</p>
                      <div style={{ fontSize:11, background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", padding:"8px", maxHeight:100, overflow:"auto", fontFamily:"var(--font-mono)", color:"var(--color-text-tertiary)", wordBreak:"break-all" }}>
                        {(data.html_content||"").slice(0,500)}…
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>

      {isDone && (
        <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"1rem 1.25rem", animation:"fadeIn 0.3s ease" }}>
          <p style={{ margin:"0 0 10px", fontSize:14, fontWeight:500, color:"var(--color-text-primary)" }}>Publication WordPress</p>

          {activeSite ? (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-tertiary)", marginBottom:10 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#10B981", display:"inline-block", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>{activeSite.name}</p>
                <p style={{ margin:0, fontSize:11, color:"var(--color-text-secondary)" }}>{activeSite.wpUrl} · {activeSite.wpUser}</p>
              </div>
              <button onClick={() => setShowModal(true)} style={{ fontSize:11, padding:"3px 10px" }}>Changer</button>
            </div>
          ) : (
            <div style={{ padding:"8px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", marginBottom:10 }}>
              <p style={{ margin:0, fontSize:12, color:"var(--color-text-secondary)" }}>
                Aucun site sélectionné —{" "}
                <button onClick={() => setShowModal(true)} style={{ background:"none", border:"none", color:"var(--color-text-info)", cursor:"pointer", padding:0, fontSize:12 }}>ajouter un site</button>
              </p>
            </div>
          )}

          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button onClick={handlePublish} disabled={!activeSite||wpStatus==="publishing"} style={{ padding:"7px 18px", fontWeight:500, opacity:(!activeSite||wpStatus==="publishing")?0.45:1, cursor:(!activeSite||wpStatus==="publishing")?"not-allowed":"pointer" }}>
              {wpStatus==="publishing" ? "Publication…" : "📤 Publier en brouillon"}
            </button>
            <button onClick={() => {
              const html = results["article"]?.html_content || "";
              const blob = new Blob([html], {type:"text/html"});
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href=url; a.download=`article-${keyword.replace(/\s+/g,"-")}.html`; a.click();
            }} style={{ fontSize:12, padding:"7px 14px" }}>
              ⬇ Télécharger HTML
            </button>
          </div>

          {wpStatus === "published" && wpResult && (
            <div style={{ marginTop:10, background:"#D1FAE5", border:"0.5px solid #A7F3D0", borderRadius:"var(--border-radius-md)", padding:"10px 14px", animation:"fadeIn 0.3s ease" }}>
              <p style={{ margin:0, fontSize:13, fontWeight:500, color:"#065F46" }}>✓ Brouillon publié sur {activeSite?.name} !</p>
              <p style={{ margin:"3px 0 0", fontSize:12, color:"#065F46" }}>Article #{wpResult.id} — <a href={wpResult.link} target="_blank" rel="noopener" style={{ color:"#047857" }}>Voir dans WordPress ↗</a></p>
            </div>
          )}
          {(wpStatus === "error_wp" || wpStatus === "no_site") && (
            <div style={{ marginTop:10, background:"#FEE2E2", border:"0.5px solid #FECACA", borderRadius:"var(--border-radius-md)", padding:"10px 14px" }}>
              <p style={{ margin:0, fontSize:13, color:"#991B1B" }}>
                {wpStatus === "no_site" ? "Sélectionne un site WordPress d'abord." : `Erreur WP : ${wpResult?.error}`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
