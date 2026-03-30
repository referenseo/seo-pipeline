import { useState, useRef, useEffect } from "react";

const CURRENT_YEAR = 2026;

const STEPS = [
  { id: "intention",  label: "Intention & Conversion", icon: "🎯", desc: "Décryptage intention + angles CTA" },
  { id: "competitors",label: "Concurrents",            icon: "🔍", desc: "Top 10 SERP + requêtes conversationnelles" },
  { id: "longtail",   label: "Longue traîne",          icon: "📊", desc: "15 mots-clés ultra-ciblés" },
  { id: "article",    label: "Article SEO",            icon: "✍️",  desc: "1500 mots structuré + shortcodes" },

];

const AUDIENCE = "Personnes qui souhaitent se lancer dans le business en ligne, ou qui sont dans les premières années de leur aventure entrepreneuriale.";
const CTA = "s'abonner à la newsletter des Makers (lancer et développer son business en ligne)";
const TON = "Enthousiaste et inspirant. Tutoyer le lecteur. On n'utilise pas le 'je' mais le 'nous' et le 'on'.";
const OBJECTIF = "Donner des conseils pratiques, pertinents et avisés qui s'appuient sur les grands principes.";

const SYSTEM_BASE = (siteName) =>
  `Tu es un expert SEO et rédacteur web francophone spécialisé pour le site "${siteName}". Nous sommes en ${CURRENT_YEAR}.
Tes contenus sont à jour pour ${CURRENT_YEAR}, optimisés pour Google, écrits pour les humains d'abord.
Tu réponds UNIQUEMENT en JSON valide, sans backticks, sans commentaires, sans texte avant ou après.`;

const PROMPTS = {
  intention: (s, k, secondaryKw, site, wordCount, instructions) => ({
    system: SYSTEM_BASE(site),
    user: `Tu es un expert en SEO et copywriting de conversion. Analyse le mot-clé: "${k}" pour un article sur "${s}".
Audience: ${AUDIENCE}
Ton: ${TON}
Consignes supplémentaires: ${instructions}

Donne une analyse structurée:
1. Décryptage intention de recherche (informer/comparer/acheter/agir/résoudre). Émotions et douleurs sous-jacentes.
2. Niveaux de conscience (note 0-5 pour chaque): inconscient du problème / conscient mais pas des solutions / en phase de comparaison.
3. Appels à l'action adaptés à chaque étape (lead magnet, call, produit, cas client) et où les insérer.
4. Angle différenciant: approche éditoriale originale vs concurrents.

JSON: {"intention_type":"...","emotions_douleurs":["..."],"awareness_levels":{"inconscient":{"score":0,"raison":"..."},"conscient_pb":{"score":0,"raison":"..."},"comparaison":{"score":0,"raison":"..."}},"cta_par_etape":[{"etape":"...","cta":"...","placement":"..."}],"angle_differenciant":"...","resume_strategie":"..."}`
  }),

  competitors: (s, k, secondaryKw, site, wordCount, instructions) => ({
    system: SYSTEM_BASE(site),
    user: `Étudie les 10 concurrents les mieux positionnés sur Google FR en ${CURRENT_YEAR} pour la requête "${k}" (sujet: "${s}").
En t'appuyant sur les relations entités-attributs et l'analyse sémantique, génère au moins 30 requêtes conversationnelles uniques qui déclenchent une recherche web sur ce sujet.
Consignes supplémentaires: ${instructions}

JSON: {"concurrents":[{"position":1,"titre":"...","angle":"...","nb_mots_estime":0,"points_forts":"..."}],"requetes_conversationnelles":["..."],"content_gaps":["..."],"recommandation":"..."}`
  }),

  longtail: (s, k, secondaryKw, site, wordCount, instructions) => ({
    system: SYSTEM_BASE(site),
    user: `Tu es un expert SEO avec 10 ans d'expérience spécialisé dans "${k}". Effectue une analyse SEO complète pour: "${s}".
Audience: ${AUDIENCE}
Objectif: ${CTA}
Consignes supplémentaires: ${instructions}

PARTIE 1 — Stratégie de mots-clés:
- 1 mot-clé principal confirmé (court, 2-4 mots max)
- 5 à 10 mots-clés secondaires PROPRES: expressions courtes (2-4 mots), naturelles, qu'un humain taperait vraiment sur Google. PAS de phrases longues artificielles. PAS de mots-clés collés ensemble.
- Intention de recherche dominante

PARTIE 2 — Longue traîne (15 requêtes):
Requêtes conversationnelles naturelles, faible concurrence, fort potentiel de conversion.
Pour chaque: requête, volume estimé, concurrence (Faible/Moyen/Élevé), intention, étape funnel.

PARTIE 3 — Angle éditorial recommandé:
Choisis UN angle parmi: débutant pas à pas / erreurs à éviter / étude de cas / méthode concrète / comparatif / retour d'expérience.
Justifie pourquoi cet angle est le plus différenciant vs la concurrence.

JSON: {
  "mot_cle_principal": "...",
  "mots_cles_secondaires": ["mot court", "autre expression", "..."],
  "intention_dominante": "informationnelle|transactionnelle|navigationnelle",
  "angle_editorial": "...",
  "justification_angle": "...",
  "mots_cles_longtail": [{"requete":"...","volume_estime":"...","concurrence":"Faible|Moyen|Élevé","intention":"...","funnel":"..."}],
  "liste_brute": "mot1, mot2, mot3..."
}`
  }),

  article: (s, k, secondaryKw, site, wordCount, instructions, prevData) => ({
    system: `Tu es un rédacteur editorial senior francophone, spécialisé SEO pour le site ${site}. Nous sommes en ${CURRENT_YEAR}.
Tu produis des articles qui rankent top 3 ET que les humains veulent vraiment lire.
Tu travailles en 3 phases obligatoires et séquentielles avant de rédiger.
Tu réponds UNIQUEMENT en JSON valide, sans backticks, sans commentaires, sans texte avant ou après.`,
    user: `Rédige un article SEO de ${wordCount} mots sur le sujet: "${s}".

Données disponibles:
- Mot-clé principal confirmé: ${prevData?.longtail?.mot_cle_principal || k}
- Mots-clés secondaires: ${(prevData?.longtail?.mots_cles_secondaires || []).join(", ") || k}
- Intention: ${prevData?.longtail?.intention_dominante || "informationnelle"}
- Angle éditorial: ${prevData?.longtail?.angle_editorial || "guide pratique"}
- Promesse implicite: ${prevData?.longtail?.justification_angle || ""}
- Audience: ${AUDIENCE}
- Ton: ${TON} — tutoiement, "nous" et "on", pas de "je"
- Objectif conversion: ${CTA}
- Requêtes à couvrir: ${(prevData?.competitors?.requetes_conversationnelles || []).slice(0,8).join(" / ")}
- Content gaps concurrents: ${(prevData?.competitors?.content_gaps || []).slice(0,5).join(", ")}
- Consignes spécifiques: ${instructions}

════════════════════════════════════
PHASE 1 — PRÉPARATION STRATÉGIQUE (bloquante)
════════════════════════════════════
Avant toute rédaction, définis dans le JSON:
▸ mot_cle_principal_final: 1 seul mot-clé (2-4 mots)
▸ mots_cles_secondaires_final: exactement 5, simples, 2-4 mots chacun, qu'un humain taperait naturellement
▸ intention_finale: informationnelle / transactionnelle / navigationnelle
▸ angle_final: UN seul parmi → "guide débutant" / "erreurs à éviter" / "étude de cas" / "méthode étape par étape"
▸ promesse_article: 1 phrase qui résume ce que le lecteur va gagner
▸ hook_differentiant: ce qui rend CET article unique vs tous les autres sur le même sujet

════════════════════════════════════
PHASE 2 — RÉDACTION AVEC CONTRAINTES STRICTES
════════════════════════════════════

FORMAT BLOCS GUTENBERG OBLIGATOIRE:
- Paragraphe: <!-- wp:paragraph --><p>texte</p><!-- /wp:paragraph -->
- H2: <!-- wp:heading {"level":2} --><h2>titre</h2><!-- /wp:heading -->
- H3: <!-- wp:heading {"level":3} --><h3>titre</h3><!-- /wp:heading -->
- Liste: <!-- wp:list --><ul><!-- wp:list-item --><li>item</li><!-- /wp:list-item --></ul><!-- /wp:list -->
- Citation: <!-- wp:quote --><blockquote class="wp-block-quote"><p>texte</p></blockquote><!-- /wp:quote -->
- Shortcode: <!-- wp:shortcode -->[shortcode]<!-- /wp:shortcode -->

STRUCTURE EN 6 BLOCS:

BLOC A — Métadonnées:
▸ meta_title: accrocheur, mot-clé au début, SANS année
▸ wp_title: même titre + [current_date format=Y] pour l'année
▸ meta_description: 130-160 caractères, incitative, sans année

BLOC B — Réponse directe (featured snippet, 40-60 mots):
▸ Répond directement à la requête principale en 40-60 mots
▸ Format: paragraphe court si définition, liste si étapes
▸ Mot-clé dans les 10 premiers mots
▸ NE PAS titrer ce bloc, ne pas l'introduire — juste la réponse
▸ Envelopper en bloc Gutenberg

BLOC C — Introduction (75 mots max):
▸ Ligne 1: accroche forte — question, stat concrète, ou situation que le lecteur reconnaît
▸ Lignes 2-3: contexte rapide + mot-clé intégré naturellement
▸ Fin: <!-- wp:shortcode -->[elementor-template id="22062"]<!-- /wp:shortcode -->

BLOC D — Corps de l'article:
▸ Minimum 4 H2 — formulés comme des vraies questions ou affirmations humaines
▸ Chaque H2: 1 idée centrale + développement + 1 exemple concret minimum
▸ OBLIGATOIRE dans l'article entier: au moins 2 passages "on a testé… résultat…" ou "erreur fréquente que l'on voit souvent…"
▸ OBLIGATOIRE: au moins 1 chiffre ou statistique concrète et sourcée
▸ Paragraphes courts: 3-4 lignes max
▸ Transitions naturelles entre sections (1 phrase de liaison)
▸ H3 pour approfondir si nécessaire
▸ [current_date format=Y] pour toute mention de l'année

BLOC E — FAQ (3 questions):
▸ Questions formulées comme les gens les tapent vraiment sur Google
▸ Réponses 50-150 mots, directes, sans intro inutile

BLOC F — Conclusion + CTA:
▸ Résumé des points clés en 2-3 phrases (pas de répétition mot pour mot)
▸ Appel à l'action: ${CTA}
▸ <!-- wp:shortcode -->[elementor-template id="1148"]<!-- /wp:shortcode -->

RÈGLE ANTI-KEYWORD STUFFING — CRITIQUE:
▸ Toute expression de plus de 5 mots qui ressemble à un mot-clé collé = INTERDITE
▸ Exemples interdits: "tiktok ads débutant entrepreneur budget", "stratégie publicité tiktok business en ligne"
▸ Test obligatoire pour chaque titre H2/H3: "Est-ce qu'un humain dirait ça à l'oral ?" → Si non → réécrire
▸ Les mots-clés secondaires s'intègrent dans des phrases déjà naturelles, jamais placés pour cocher une case
▸ INTERDIT: promesses vides ("booster", "hacker", "devenir expert en X jours")
▸ INTERDIT: anglicismes inutiles quand le français existe

RÈGLES SEO:
▸ Densité mot-clé principal: 1% à 1.5% — pas plus
▸ Champ sémantique: 15+ termes liés au sujet
▸ Entités nommées: outils, marques, concepts concrets
▸ 2-3 ancres de maillage interne naturelles proposées
▸ EEAT renforcé: chiffres datés, exemples vérifiables, expertise démontrée

════════════════════════════════════
PHASE 3 — AUTO-CORRECTION AVANT LIVRAISON
════════════════════════════════════
Avant de produire le JSON final, effectue ces 4 vérifications et corrige si nécessaire:

✓ VÉR. 1 — Phrases SEO artificielles?
  Lis chaque H2/H3 et chaque phrase avec un mot-clé. Si ça sonne faux → réécrire.

✓ VÉR. 2 — Cet article pourrait-il être généré par une IA standard?
  Si oui → ajouter du concret, du vécu, une erreur réelle, un chiffre précis.

✓ VÉR. 3 — Le lecteur apprend-il quelque chose d'actionnable?
  Chaque H2 doit apporter au moins 1 conseil applicable immédiatement.

✓ VÉR. 4 — Le début donne-t-il envie de lire la suite?
  L'accroche doit créer une tension ou poser une question que le lecteur veut résoudre.

JSON: {
  "mot_cle_principal_final": "...",
  "mots_cles_secondaires_final": ["...", "...", "...", "...", "..."],
  "angle_final": "...",
  "promesse_article": "...",
  "meta_title": "...",
  "meta_description": "...",
  "wp_title": "...",
  "html_content": "<!-- wp:paragraph -->...<!-- /wp:paragraph -->",
  "word_count": 0,
  "reading_time_minutes": 0,
  "seo_score_estimate": 0,
  "champ_semantique": ["..."],
  "ancres_maillage": [{"ancre": "...", "sujet_cible": "..."}],
  "excerpt": "...",
  "auto_correction_log": ["VÉR.1: ...", "VÉR.2: ...", "VÉR.3: ...", "VÉR.4: ..."]
}`
  }),


};

const STEP_INSTRUCTIONS_KEY = "seo_pipeline_instructions_v3";
const SITES_KEY = "seo_pipeline_sites_v3";

function loadLS(key, def) { try { return JSON.parse(localStorage.getItem(key) || "null") ?? def; } catch { return def; } }
function saveLS(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

const DEFAULT_INSTRUCTIONS = Object.fromEntries(STEPS.map(s => [s.id, ""]));

async function callClaude(prompt, maxTokens = 3000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `HTTP ${res.status}`); }
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.content?.map(b => b.text || "").join("") || "";
  if (!text) throw new Error("Réponse vide de l'API");
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const jsonStart = clean.indexOf("{");
  const jsonEnd = clean.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) throw new Error("JSON introuvable dans la réponse");
  return JSON.parse(clean.slice(jsonStart, jsonEnd + 1));
}

async function publishToWordPress(profile, articleData) {
  const credentials = btoa(`${profile.wpUser}:${profile.appPassword}`);
  const cleanUrl = profile.wpUrl.replace(/\/$/, "");

  const seopressTitle = articleData.meta_title
    ? `${articleData.meta_title} %%currentyear%%`
    : undefined;

  const res = await fetch(`${cleanUrl}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${credentials}` },
    body: JSON.stringify({
      title: articleData.wp_title || articleData.meta_title || articleData.title,
      content: articleData.html_content,
      excerpt: articleData.excerpt,
      status: "draft",
      meta: {
        _seopress_titles_title: seopressTitle,
        _seopress_titles_desc: articleData.meta_description || "",
      },
    }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || `HTTP ${res.status}`); }
  return await res.json();
}

const Spinner = () => (
  <span style={{ display:"inline-block", width:13, height:13, border:"2px solid var(--color-border-tertiary)", borderTop:"2px solid var(--color-text-secondary)", borderRadius:"50%", animation:"spin 0.8s linear infinite", flexShrink:0 }} />
);

const Badge = ({ status }) => {
  const m = {
    idle:    { bg:"var(--color-background-secondary)", color:"var(--color-text-tertiary)",  label:"En attente" },
    running: { bg:"#FEF3C7",  color:"#92400E",  label:"En cours…" },
    done:    { bg:"#D1FAE5",  color:"#065F46",  label:"Terminé" },
    error:   { bg:"#FEE2E2",  color:"#991B1B",  label:"Erreur" },
  }[status] || {};
  return <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:m.bg, color:m.color, fontWeight:500, whiteSpace:"nowrap" }}>{m.label}</span>;
};

function SiteModal({ sites, onSave, onSelect, onDelete, onClose }) {
  const [form, setForm] = useState({ name:"", url:"", user:"", password:"" });
  const [editing, setEditing] = useState(null);
  const [local, setLocal] = useState(sites);
  const canSave = form.name && form.url && form.user && form.password;

  const handleSave = () => {
    if (!canSave) return;
    const entry = { name:form.name, wpUrl:form.url, wpUser:form.user, appPassword:form.password };
    const updated = editing !== null ? local.map((s,i)=>i===editing?entry:s) : [...local, entry];
    setLocal(updated); onSave(updated);
    setForm({ name:"", url:"", user:"", password:"" }); setEditing(null);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", width:"100%", maxWidth:500, maxHeight:"85vh", overflowY:"auto", padding:"1.25rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:500 }}>Mes sites WordPress</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"var(--color-text-secondary)", padding:"0 4px" }}>×</button>
        </div>
        {local.length > 0 && (
          <div style={{ marginBottom:"1rem", display:"flex", flexDirection:"column", gap:6 }}>
            {local.map((site, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>{site.name}</p>
                  <p style={{ margin:0, fontSize:11, color:"var(--color-text-secondary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{site.wpUrl}</p>
                </div>
                <button onClick={()=>onSelect(site)} style={{ fontSize:12, padding:"4px 10px", color:"var(--color-text-info)", background:"none", border:"0.5px solid var(--color-border-info)", borderRadius:"var(--border-radius-md)", cursor:"pointer" }}>Choisir</button>
                <button onClick={()=>{ const s=local[i]; setForm({name:s.name,url:s.wpUrl,user:s.wpUser,password:s.appPassword}); setEditing(i); }} style={{ fontSize:12, padding:"4px 8px", background:"none", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", cursor:"pointer" }}>✎</button>
                <button onClick={()=>{ const u=local.filter((_,idx)=>idx!==i); setLocal(u); onDelete(u); }} style={{ fontSize:12, padding:"4px 8px", background:"none", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", cursor:"pointer", color:"var(--color-text-danger)" }}>✕</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ borderTop: local.length > 0 ? "0.5px solid var(--color-border-tertiary)" : "none", paddingTop: local.length > 0 ? "1rem" : 0 }}>
          <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:500 }}>{editing !== null ? "Modifier" : "Ajouter un site"}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            {[{k:"name",l:"Nom du site",p:"lesmakers.fr",t:"text"},{k:"url",l:"URL WordPress",p:"https://lesmakers.fr",t:"url"},{k:"user",l:"Identifiant WP",p:"admin",t:"text"},{k:"password",l:"Application Password",p:"xxxx xxxx xxxx xxxx",t:"password"}].map(f=>(
              <div key={f.k}>
                <label style={{ fontSize:11, color:"var(--color-text-secondary)", display:"block", marginBottom:3 }}>{f.l}</label>
                <input type={f.t} value={form[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})} placeholder={f.p} style={{ width:"100%", boxSizing:"border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={handleSave} disabled={!canSave} style={{ padding:"7px 16px", fontWeight:500, opacity:canSave?1:0.45 }}>{editing!==null?"Enregistrer":"+ Ajouter"}</button>
            {editing!==null && <button onClick={()=>{setEditing(null);setForm({name:"",url:"",user:"",password:""});}} style={{ fontSize:12, padding:"6px 12px" }}>Annuler</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [subject, setSubject]         = useState("");
  const [keyword, setKeyword]         = useState("");
  const [secondaryKw] = useState(""); // généré automatiquement par l'étape Longue traîne
  const [wordCount, setWordCount]     = useState(1500);
  const [instructions, setInstructions] = useState(DEFAULT_INSTRUCTIONS);
  const [showInstructions, setShowInstructions] = useState(false);
  const [activeInstrTab, setActiveInstrTab] = useState(STEPS[0].id);
  const [sites, setSites]             = useState([]);
  const [activeSite, setActiveSite]   = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [results, setResults]         = useState({});
  const [stepStatus, setStepStatus]   = useState({});
  const [running, setRunning]         = useState(false);
  const [wpStatus, setWpStatus]       = useState(null);
  const [wpResult, setWpResult]       = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);
  const abortRef = useRef(false);

  useEffect(() => {
    const s = loadLS(SITES_KEY, []);
    const instr = loadLS(STEP_INSTRUCTIONS_KEY, DEFAULT_INSTRUCTIONS);
    setSites(s);
    setInstructions(instr);
    if (s.length > 0) setActiveSite(s[0]);
  }, []);

  const saveInstructions = (updated) => { setInstructions(updated); saveLS(STEP_INSTRUCTIONS_KEY, updated); };
  const handleSiteSave   = (u) => { setSites(u); saveLS(SITES_KEY, u); if (!activeSite && u.length>0) setActiveSite(u[0]); };
  const handleSiteSelect = (s) => { setActiveSite(s); setShowModal(false); };
  const handleSiteDelete = (u) => { setSites(u); saveLS(SITES_KEY, u); if (activeSite && !u.find(s=>s.name===activeSite.name)) setActiveSite(u[0]||null); };

  const isReady = subject.trim() && keyword.trim();
  const isDone  = stepStatus["article"] === "done";
  const completedCount = STEPS.filter(s => stepStatus[s.id] === "done").length;
  const setStatus = (id, s) => setStepStatus(prev => ({ ...prev, [id]: s }));

  async function runPipeline() {
    if (!isReady) return;
    abortRef.current = false;
    setRunning(true); setResults({}); setStepStatus({}); setWpStatus(null); setWpResult(null);
    const acc = {};
    const siteName = activeSite?.name || "lesmakers.fr";

    const stepConfigs = [
      { id:"intention",   tokens:2000, build: ()=>PROMPTS.intention(subject,keyword,secondaryKw,siteName,wordCount,instructions.intention||"") },
      { id:"competitors", tokens:3000, build: ()=>PROMPTS.competitors(subject,keyword,secondaryKw,siteName,wordCount,instructions.competitors||"") },
      { id:"longtail",    tokens:2500, build: ()=>PROMPTS.longtail(subject,keyword,secondaryKw,siteName,wordCount,instructions.longtail||"") },
      { id:"article",     tokens:6000, build: ()=>PROMPTS.article(subject,keyword,secondaryKw,siteName,wordCount,instructions.article||"",acc) },

    ];

    try {
      for (const cfg of stepConfigs) {
        if (abortRef.current) break;
        setStatus(cfg.id, "running");
        try {
          const data = await callClaude(cfg.build(), cfg.tokens);
          acc[cfg.id] = data;
          setResults(prev => ({ ...prev, [cfg.id]: data }));
          setStatus(cfg.id, "done");
        } catch(e) {
          setStatus(cfg.id, "error");
          acc[cfg.id] = { error: e.message };
          setResults(prev => ({ ...prev, [cfg.id]: { error: e.message } }));
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
      setWpResult(res); setWpStatus("published");
    } catch(e) {
      setWpStatus("error_wp"); setWpResult({ error: e.message });
    }
  }

  return (
    <div style={{ fontFamily:"var(--font-sans)", maxWidth:720, margin:"0 auto", padding:"1.5rem 1rem" }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(3px); } to { opacity:1; transform:translateY(0); } }
        .step-row { transition:background 0.12s; border-radius:var(--border-radius-md); }
        .step-row:hover { background:var(--color-background-secondary) !important; }
        .instr-tab { padding:5px 12px; border:none; border-radius:var(--border-radius-md); cursor:pointer; font-size:12px; background:none; color:var(--color-text-secondary); transition:all 0.15s; }
        .instr-tab.active { background:var(--color-background-primary); color:var(--color-text-primary); font-weight:500; border:0.5px solid var(--color-border-tertiary); }
      `}</style>

      {showModal && <SiteModal sites={sites} onSave={handleSiteSave} onSelect={handleSiteSelect} onDelete={handleSiteDelete} onClose={()=>setShowModal(false)} />}

      <div style={{ marginBottom:"1.25rem" }}>
        <h2 style={{ fontSize:20, fontWeight:500, margin:"0 0 2px" }}>Pipeline SEO — Les Makers</h2>
        <p style={{ fontSize:13, color:"var(--color-text-secondary)", margin:0 }}>De l'idée à la publication WordPress en 5 étapes IA</p>
      </div>

      <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"1rem 1.25rem", marginBottom:"0.75rem" }}>

        <div style={{ marginBottom:"0.875rem" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, color:"var(--color-text-secondary)", fontWeight:500 }}>Site cible</span>
            <button onClick={()=>setShowModal(true)} style={{ fontSize:11, padding:"3px 10px" }}>{sites.length===0?"+ Ajouter un site":"⚙ Gérer les sites"}</button>
          </div>
          {sites.length === 0
            ? <p style={{ fontSize:12, color:"var(--color-text-tertiary)", margin:0 }}>Aucun site configuré.</p>
            : <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {sites.map((site,i) => {
                  const isActive = activeSite?.name === site.name;
                  return (
                    <button key={i} onClick={()=>setActiveSite(site)} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 11px", borderRadius:"var(--border-radius-md)", border: isActive?"1px solid var(--color-border-primary)":"0.5px solid var(--color-border-secondary)", background: isActive?"var(--color-background-primary)":"var(--color-background-secondary)", cursor:"pointer", fontSize:12, fontWeight:isActive?500:400, color:"var(--color-text-primary)" }}>
                      {isActive && <span style={{ width:6, height:6, borderRadius:"50%", background:"#10B981", display:"inline-block" }} />}
                      {site.name}
                    </button>
                  );
                })}
              </div>
          }
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
          <div>
            <label style={{ fontSize:12, color:"var(--color-text-secondary)", display:"block", marginBottom:4 }}>Sujet de l'article</label>
            <input type="text" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="ex: Comment créer un business en ligne" style={{ width:"100%", boxSizing:"border-box" }} disabled={running} />
          </div>
          <div>
            <label style={{ fontSize:12, color:"var(--color-text-secondary)", display:"block", marginBottom:4 }}>Mot-clé principal</label>
            <input type="text" value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="ex: business en ligne" style={{ width:"100%", boxSizing:"border-box" }} disabled={running} />
          </div>
        </div>

        <div style={{ marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <label style={{ fontSize:12, color:"var(--color-text-secondary)", fontWeight:500 }}>Longueur de l'article</label>
            <span style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>{wordCount} mots</span>
          </div>
          <input type="range" min={800} max={3000} step={100} value={wordCount} onChange={e=>setWordCount(Number(e.target.value))} style={{ width:"100%" }} disabled={running} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--color-text-tertiary)", marginTop:2 }}>
            <span>800 (court)</span><span>1500 (standard)</span><span>3000 (long)</span>
          </div>
        </div>

        <div style={{ marginBottom:12 }}>
          <button onClick={()=>setShowInstructions(!showInstructions)} style={{ fontSize:12, padding:"5px 12px", display:"flex", alignItems:"center", gap:6 }}>
            {showInstructions ? "▲" : "▼"} Consignes par étape
          </button>
          {showInstructions && (
            <div style={{ marginTop:10, background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-tertiary)", padding:"12px", animation:"fadeIn 0.2s ease" }}>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
                {STEPS.map(step => (
                  <button key={step.id} onClick={()=>setActiveInstrTab(step.id)} className={"instr-tab"+(activeInstrTab===step.id?" active":"")}>
                    {step.icon} {step.label}
                  </button>
                ))}
              </div>
              {STEPS.map(step => activeInstrTab === step.id && (
                <div key={step.id}>
                  <label style={{ fontSize:11, color:"var(--color-text-secondary)", display:"block", marginBottom:4 }}>Consignes pour "{step.label}"</label>
                  <textarea
                    value={instructions[step.id] || ""}
                    onChange={e => saveInstructions({...instructions, [step.id]: e.target.value})}
                    placeholder={`Consignes spécifiques pour l'étape ${step.label}…`}
                    rows={3}
                    style={{ width:"100%", boxSizing:"border-box", fontSize:12, padding:"8px", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", resize:"vertical", fontFamily:"var(--font-sans)" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={runPipeline} disabled={!isReady||running} style={{ padding:"8px 20px", fontWeight:500, opacity:(!isReady||running)?0.45:1, cursor:(!isReady||running)?"not-allowed":"pointer" }}>
            {running ? "Pipeline en cours…" : "▶ Lancer le pipeline"}
          </button>
          {running && (
            <>
              <Spinner />
              <button onClick={()=>{abortRef.current=true;setRunning(false);}} style={{ fontSize:12, padding:"5px 12px", color:"var(--color-text-secondary)" }}>Arrêter</button>
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
          const data   = results[step.id];
          const isExp  = expandedStep === step.id;
          return (
            <div key={step.id} className="step-row" style={{ border:"0.5px solid var(--color-border-tertiary)", overflow:"hidden", animation:status==="done"?"fadeIn 0.25s ease":"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px" }}>
                <span style={{ fontSize:15, minWidth:20, textAlign:"center" }}>{step.icon}</span>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>{i+1}. {step.label}</span>
                  <span style={{ fontSize:11, color:"var(--color-text-secondary)", marginLeft:8 }}>{step.desc}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {status==="running" && <Spinner />}
                  <Badge status={status} />
                  {data && !data.error && (
                    <button onClick={()=>setExpandedStep(isExp?null:step.id)} style={{ fontSize:11, padding:"2px 6px", color:"var(--color-text-secondary)", background:"none", border:"none", cursor:"pointer" }}>
                      {isExp?"▲":"▼"}
                    </button>
                  )}
                  {data?.error && <span style={{ fontSize:11, color:"#991B1B" }} title={data.error}>⚠ {data.error.slice(0,40)}</span>}
                </div>
              </div>

              {isExp && data && !data.error && (
                <div style={{ borderTop:"0.5px solid var(--color-border-tertiary)", padding:"10px 12px", background:"var(--color-background-secondary)", animation:"fadeIn 0.2s ease" }}>

                  {step.id === "intention" && (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <p style={{ margin:0, fontSize:12 }}><strong style={{ color:"var(--color-text-primary)" }}>Intention :</strong> <span style={{ color:"var(--color-text-secondary)" }}>{data.intention_type}</span></p>
                      <p style={{ margin:0, fontSize:12 }}><strong style={{ color:"var(--color-text-primary)" }}>Angle différenciant :</strong> <span style={{ color:"var(--color-text-secondary)" }}>{data.angle_differenciant}</span></p>
                      <p style={{ margin:0, fontSize:12, color:"var(--color-text-secondary)" }}>{data.resume_strategie}</p>
                      {(data.cta_par_etape||[]).slice(0,2).map((c,j)=>(
                        <div key={j} style={{ padding:"6px 10px", background:"var(--color-background-primary)", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-tertiary)" }}>
                          <p style={{ margin:0, fontSize:11, fontWeight:500, color:"var(--color-text-primary)" }}>{c.etape}</p>
                          <p style={{ margin:"2px 0 0", fontSize:11, color:"var(--color-text-secondary)" }}>{c.cta} → {c.placement}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.id === "competitors" && (
                    <div>
                      <p style={{ margin:"0 0 8px", fontSize:12, color:"var(--color-text-secondary)" }}>{data.recommandation}</p>
                      <p style={{ margin:"0 0 6px", fontSize:12, fontWeight:500, color:"var(--color-text-primary)" }}>Requêtes conversationnelles ({(data.requetes_conversationnelles||[]).length})</p>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:8 }}>
                        {(data.requetes_conversationnelles||[]).slice(0,8).map((r,j)=><span key={j} style={{ fontSize:11, padding:"2px 7px", background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:4 }}>{r}</span>)}
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                        {(data.content_gaps||[]).slice(0,5).map((g,j)=><span key={j} style={{ fontSize:11, padding:"2px 8px", background:"var(--color-background-info)", color:"var(--color-text-info)", borderRadius:99 }}>Gap : {g}</span>)}
                      </div>
                    </div>
                  )}

                  {step.id === "longtail" && (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        <div style={{ padding:"6px 10px", background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", flex:1 }}>
                          <p style={{ margin:"0 0 2px", fontSize:10, color:"var(--color-text-secondary)" }}>Mot-clé principal</p>
                          <p style={{ margin:0, fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>{data.mot_cle_principal}</p>
                        </div>
                        <div style={{ padding:"6px 10px", background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", flex:1 }}>
                          <p style={{ margin:"0 0 2px", fontSize:10, color:"var(--color-text-secondary)" }}>Intention</p>
                          <p style={{ margin:0, fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>{data.intention_dominante}</p>
                        </div>
                      </div>
                      <div>
                        <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:500, color:"var(--color-text-primary)" }}>Angle éditorial</p>
                        <p style={{ margin:"0 0 2px", fontSize:12, color:"var(--color-text-secondary)" }}>{data.angle_editorial} — {data.justification_angle}</p>
                      </div>
                      <div>
                        <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:500, color:"var(--color-text-primary)" }}>Mots-clés secondaires</p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {(data.mots_cles_secondaires||[]).map((m,j)=>(
                            <span key={j} style={{ fontSize:11, padding:"2px 8px", background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:4, color:"var(--color-text-primary)" }}>{m}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:500, color:"var(--color-text-primary)" }}>Longue traîne top 5</p>
                        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                          {(data.mots_cles_longtail||[]).slice(0,5).map((m,j)=>(
                            <div key={j} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11 }}>
                              <span style={{ flex:1, color:"var(--color-text-primary)" }}>{m.requete}</span>
                              <span style={{ padding:"1px 6px", borderRadius:99, background:"var(--color-background-secondary)", color:"var(--color-text-secondary)", fontSize:10 }}>{m.concurrence}</span>
                              <span style={{ padding:"1px 6px", borderRadius:99, background:"var(--color-background-secondary)", color:"var(--color-text-secondary)", fontSize:10 }}>{m.funnel}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step.id === "article" && (
                    <div>
                      <p style={{ margin:"0 0 2px", fontSize:11, color:"var(--color-text-secondary)", fontWeight:500 }}>Titre WP : <span style={{ fontWeight:400, color:"var(--color-text-primary)" }}>{data.wp_title}</span></p>
                      <p style={{ margin:"0 0 4px", fontSize:11, color:"var(--color-text-secondary)", fontWeight:500 }}>Meta title SEOPress : <span style={{ fontWeight:400, color:"var(--color-text-primary)" }}>{data.meta_title}</span></p>
                      <p style={{ margin:"0 0 8px", fontSize:11, color:"var(--color-text-secondary)" }}>Meta desc : {data.meta_description}</p>
                      {data.promesse_article && (
                        <p style={{ margin:"0 0 8px", fontSize:12, fontStyle:"italic", color:"var(--color-text-secondary)", borderLeft:"2px solid var(--color-border-secondary)", paddingLeft:8 }}>"{data.promesse_article}"</p>
                      )}
                      <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                        {[{l:"Mots",v:data.word_count},{l:"Lecture",v:`${data.reading_time_minutes} min`},{l:"Score SEO",v:`${data.seo_score_estimate}/100`}].map(m=>(
                          <div key={m.l} style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", padding:"5px 14px", textAlign:"center" }}>
                            <div style={{ fontSize:15, fontWeight:500, color:"var(--color-text-primary)" }}>{m.v}</div>
                            <div style={{ fontSize:10, color:"var(--color-text-secondary)" }}>{m.l}</div>
                          </div>
                        ))}
                      </div>
                      {(data.auto_correction_log||[]).length > 0 && (
                        <div style={{ marginBottom:8, background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", padding:"8px 10px" }}>
                          <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:500, color:"var(--color-text-primary)" }}>Auto-correction</p>
                          {data.auto_correction_log.map((log,j)=>(
                            <p key={j} style={{ margin:"2px 0 0", fontSize:11, color:"var(--color-text-secondary)" }}>✓ {log}</p>
                          ))}
                        </div>
                      )}
                      {(data.ancres_maillage||[]).length > 0 && (
                        <div style={{ marginBottom:8 }}>
                          <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:500, color:"var(--color-text-primary)" }}>Maillage interne</p>
                          {data.ancres_maillage.map((a,j)=><p key={j} style={{ margin:"2px 0 0", fontSize:11, color:"var(--color-text-secondary)" }}>→ "{a.ancre}" → {a.sujet_cible}</p>)}
                        </div>
                      )}
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

      <div style={{ border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", overflow:"hidden", opacity: stepStatus["article"]==="done" ? 1 : 0.4, transition:"opacity 0.3s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:"var(--color-background-primary)" }}>
          <span style={{ fontSize:15, minWidth:20, textAlign:"center" }}>🚀</span>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>5. Publication WordPress</span>
            <span style={{ fontSize:11, color:"var(--color-text-secondary)", marginLeft:8 }}>Publier en brouillon sur ton site</span>
          </div>
          {wpStatus === "published" && <Badge status="done" />}
          {wpStatus === "publishing" && <><Spinner /><Badge status="running" /></>}
          {(wpStatus === "error_wp" || wpStatus === "no_site") && <Badge status="error" />}
        </div>

        {stepStatus["article"] === "done" && (
          <div style={{ borderTop:"0.5px solid var(--color-border-tertiary)", padding:"10px 12px", background:"var(--color-background-secondary)", display:"flex", flexDirection:"column", gap:10 }}>

            {activeSite ? (
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 10px", background:"var(--color-background-primary)", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-tertiary)" }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#10B981", display:"inline-block", flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>{activeSite.name}</p>
                  <p style={{ margin:0, fontSize:11, color:"var(--color-text-secondary)" }}>{activeSite.wpUrl} · {activeSite.wpUser}</p>
                </div>
                <button onClick={()=>setShowModal(true)} style={{ fontSize:11, padding:"3px 10px" }}>Changer</button>
              </div>
            ) : (
              <div style={{ padding:"7px 10px", background:"var(--color-background-primary)", borderRadius:"var(--border-radius-md)", border:"0.5px solid var(--color-border-tertiary)" }}>
                <p style={{ margin:0, fontSize:12, color:"var(--color-text-secondary)" }}>Aucun site configuré — <button onClick={()=>setShowModal(true)} style={{ background:"none", border:"none", color:"var(--color-text-info)", cursor:"pointer", padding:0, fontSize:12 }}>ajouter</button></p>
              </div>
            )}

            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button onClick={handlePublish} disabled={!activeSite||wpStatus==="publishing"} style={{ padding:"7px 18px", fontWeight:500, opacity:(!activeSite||wpStatus==="publishing")?0.45:1, cursor:(!activeSite||wpStatus==="publishing")?"not-allowed":"pointer" }}>
                {wpStatus==="publishing" ? "Publication en cours…" : "📤 Publier en brouillon"}
              </button>
              <button onClick={()=>{
                const html = results["article"]?.html_content || "";
                const blob = new Blob([html],{type:"text/html"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href=url; a.download=`article-${keyword.replace(/\s+/g,"-")}.html`; a.click();
              }} style={{ fontSize:12, padding:"7px 14px" }}>⬇ Télécharger HTML</button>
            </div>

            {wpStatus==="published" && wpResult && (
              <div style={{ background:"#D1FAE5", border:"0.5px solid #A7F3D0", borderRadius:"var(--border-radius-md)", padding:"10px 14px", animation:"fadeIn 0.3s ease" }}>
                <p style={{ margin:0, fontSize:13, fontWeight:500, color:"#065F46" }}>✓ Brouillon publié sur {activeSite?.name} !</p>
                <p style={{ margin:"3px 0 0", fontSize:12, color:"#065F46" }}>Article #{wpResult.id} — <a href={wpResult.link} target="_blank" rel="noopener" style={{ color:"#047857" }}>Voir dans WordPress ↗</a></p>
              </div>
            )}
            {(wpStatus==="error_wp"||wpStatus==="no_site") && (
              <div style={{ background:"#FEE2E2", border:"0.5px solid #FECACA", borderRadius:"var(--border-radius-md)", padding:"10px 14px" }}>
                <p style={{ margin:0, fontSize:13, color:"#991B1B" }}>{wpStatus==="no_site"?"Sélectionne un site d'abord.":`Erreur WP : ${wpResult?.error}`}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
