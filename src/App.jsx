import { useState, useRef, useEffect } from "react";

const CURRENT_YEAR = 2026;
const STEPS = [
  { id:"intention",   label:"Intention & Conversion", icon:"🎯", desc:"Décryptage intention + angles CTA" },
  { id:"competitors", label:"Concurrents",            icon:"🔍", desc:"Top 10 SERP + requêtes conversationnelles" },
  { id:"longtail",    label:"Longue traîne",          icon:"📊", desc:"Stratégie mots-clés + angle éditorial" },
  { id:"article",     label:"Article SEO",            icon:"✍️",  desc:"Rédaction complète Gutenberg" },
];

const AUDIENCE = "Personnes qui souhaitent se lancer dans le business en ligne, ou qui sont dans les premières années de leur aventure entrepreneuriale.";
const CTA_DEFAULT = "s'abonner à la newsletter des Makers (lancer et développer son business en ligne)";
const TON_DEFAULT = "Enthousiaste et inspirant. Tutoyer le lecteur. On n'utilise pas le 'je' mais le 'nous' et le 'on'.";
const OBJECTIF_DEFAULT = "Donner des conseils pratiques, pertinents et avisés qui s'appuient sur les grands principes.";

const SIGNATURE_EDITORIALE_DEFAULT = `SIGNATURE ÉDITORIALE — LES MAKERS (NON NÉGOCIABLE)
Ce contenu a une voix reconnaissable. Pas neutre. Pas académique. Direct, lucide, orienté business.
Écrit par quelqu'un qui pratique — pas par quelqu'un qui théorise.

STRUCTURE D'OUVERTURE:
1. HOOK VÉRITÉ (1ère phrase): casse une croyance, formule courte et directe.
   INTERDIT: commencer par "Dans cet article", "Bienvenue", "Vous avez sûrement déjà entendu"
   Exemples: "Le problème, ce n'est pas ton budget. C'est ton contenu."
2. PROMESSE CLAIRE (2e paragraphe): 1 phrase sur ce que le lecteur va gagner.

MOMENTS SIGNATURE (2 à 4 par article, répartis naturellement):
- Vérité terrain: "On voit ça tout le temps : [comportement]. Et ça ne marche jamais parce que [raison]."
- Erreur fréquente: "Erreur classique : [action]. Résultat → [conséquence concrète]."
- Insight business: "Le vrai levier, ce n'est pas [idée reçue]. C'est [vérité contre-intuitive]."
- Test terrain: "On a testé [action] pendant [durée]. Résultat : [observation concrète]."

MINI PUNCHLINES (1 par H2 minimum): phrase courte, standalone, mémorable.

CTA ORIENTÉ RÉSULTAT: formuler le bénéfice concret AVANT l'action. INTERDIT: "Abonne-toi à notre newsletter"

RÈGLES D'ÉCRITURE:
✅ Phrases courtes (15 mots max en moyenne) ✅ Concret > théorie ✅ 1 idée par paragraphe
❌ Phrases molles ❌ Jargon marketing ❌ Ton neutre ❌ Contenu interchangeable`;

const DEFAULT_PROFILE = {
  signature: SIGNATURE_EDITORIALE_DEFAULT,
  shortcodeIntro: "[elementor-template id=\"22062\"]",
  shortcodeConclusion: "[elementor-template id=\"1148\"]",
  useYearVars: true,
  snippetBg: "#fdeecd",
  snippetEnabled: true,
  cta: CTA_DEFAULT,
  ton: TON_DEFAULT,
};

const SYSTEM_BASE = (siteName) =>
  `Tu es un expert SEO et rédacteur web francophone spécialisé pour le site "${siteName}". Nous sommes en ${CURRENT_YEAR}.
Tes contenus sont à jour pour ${CURRENT_YEAR}, optimisés pour Google, écrits pour les humains d'abord.
Tu réponds UNIQUEMENT en JSON valide, sans backticks, sans commentaires, sans texte avant ou après.`;

function buildArticlePrompt(s, k, site, wordCount, instructions, prevData, profile) {
  const cta = profile?.cta || CTA_DEFAULT;
  const ton = profile?.ton || TON_DEFAULT;
  const sig = profile?.signature || "";
  const useYear = profile?.useYearVars !== false;
  const scIntro = profile?.shortcodeIntro || "";
  const scEnd = profile?.shortcodeConclusion || "";
  const snippetBg = profile?.snippetEnabled ? (profile?.snippetBg || "#fdeecd") : null;

  const yearNote = useYear
    ? "Utiliser [current_date format=Y] pour toute mention de l'année dans le corps du texte."
    : "Ne pas utiliser de variable d'année dynamique — écrire l'année en toutes lettres si nécessaire.";

  const titleNote = useYear
    ? "wp_title: titre WordPress avec [current_date format=Y] pour l'année. meta_title: SANS année (gérée par SEOPress via %%currentyear%%)."
    : "wp_title et meta_title: sans variable d'année.";

  const snippetInstruction = snippetBg
    ? `BLOC B — Réponse directe (featured snippet):
▸ Envelopper dans un bloc Gutenberg group avec fond coloré #${snippetBg.replace("#","")}:
<!-- wp:group {"style":{"color":{"background":"${snippetBg}"},"spacing":{"padding":{"top":"1rem","bottom":"1rem","left":"1.25rem","right":"1.25rem"}}},"backgroundColor":"","layout":{"type":"constrained"}} -->
<div class="wp-block-group has-background" style="background-color:${snippetBg};padding:1rem 1.25rem">
<!-- wp:paragraph -->
<p>📌 <strong>Résumé :</strong> [réponse directe 40-60 mots, mot-clé dans les 10 premiers mots]</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
▸ Format: paragraphe court si définition, liste si étapes. NE PAS titrer ce bloc.`
    : `BLOC B — Réponse directe (featured snippet, 40-60 mots):
▸ Bloc Gutenberg paragraphe simple, réponse directe, mot-clé dans les 10 premiers mots. Pas de titre.`;

  const introEnd = scIntro ? `▸ Terminer par: <!-- wp:shortcode -->${scIntro}<!-- /wp:shortcode -->` : "";
  const conclusionEnd = scEnd ? `▸ Terminer par: <!-- wp:shortcode -->${scEnd}<!-- /wp:shortcode -->` : "";

  return {
    system: `Tu es le rédacteur éditorial senior de ${site}. Nous sommes en ${CURRENT_YEAR}.
Tu as une voix reconnaissable : directe, lucide, orientée business. Pas neutre, pas académique.
Tu écris comme quelqu'un qui pratique — pas comme quelqu'un qui théorise.
Tu produis des articles qui rankent top 3 ET que les gens lisent jusqu'au bout.
Tu travailles en 3 phases obligatoires. Tu réponds UNIQUEMENT en JSON valide, sans backticks ni commentaires.`,
    user: `Rédige un article SEO de ${wordCount} mots sur: "${s}".

CONTEXTE:
- Mot-clé principal: ${prevData?.longtail?.mot_cle_principal || k}
- Mots-clés secondaires: ${(prevData?.longtail?.mots_cles_secondaires || []).join(", ") || k}
- Intention: ${prevData?.longtail?.intention_dominante || "informationnelle"}
- Angle: ${prevData?.longtail?.angle_editorial || "guide pratique"}
- Audience: ${AUDIENCE}
- Ton: ${ton}
- CTA: ${cta}
- Requêtes à couvrir: ${(prevData?.competitors?.requetes_conversationnelles || []).slice(0,8).join(" / ")}
- Content gaps: ${(prevData?.competitors?.content_gaps || []).slice(0,5).join(", ")}
- Consignes: ${instructions}

${sig ? `════════════════════════════════════\n${sig}\n════════════════════════════════════` : ""}

PHASE 1 — PRÉPARATION (bloquante):
▸ mot_cle_principal_final: 1 seul (2-4 mots)
▸ mots_cles_secondaires_final: 5 exactement, simples, 2-4 mots, langage naturel
▸ intention_finale, angle_final (guide débutant/erreurs à éviter/étude de cas/méthode étape par étape)
▸ promesse_article: 1 phrase résumant ce que le lecteur gagne
▸ hook_verite: 1ère phrase qui casse une croyance (voir signature)
▸ moments_signature_planifies: 2-4 moments avec format et section prévue

PHASE 2 — RÉDACTION:

FORMAT GUTENBERG:
- Paragraphe: <!-- wp:paragraph --><p>texte</p><!-- /wp:paragraph -->
- H2: <!-- wp:heading {"level":2} --><h2>titre</h2><!-- /wp:heading -->
- H3: <!-- wp:heading {"level":3} --><h3>titre</h3><!-- /wp:heading -->
- Liste: <!-- wp:list --><ul><!-- wp:list-item --><li>item</li><!-- /wp:list-item --></ul><!-- /wp:list -->
- Punchline: <!-- wp:quote --><blockquote class="wp-block-quote"><p>texte</p></blockquote><!-- /wp:quote -->
- Shortcode: <!-- wp:shortcode -->[shortcode]<!-- /wp:shortcode -->

BLOC A — Métadonnées: ${titleNote}
meta_description: 130-160 caractères, incitative, sans année.

${snippetInstruction}

BLOC C — Introduction (80 mots max):
▸ Ligne 1: hook vérité (croyance cassée, jamais "Dans cet article" ou "Bienvenue")
▸ Lignes 2-3: contexte + mot-clé naturel
▸ Dernière ligne: promesse claire orientée résultat
${introEnd}

BLOC D — Corps (min 4 H2):
▸ H2 naturels: questions ou affirmations humaines avec verbe
▸ Chaque section: 1 idée + développement + exemple concret + 1 punchline
▸ 2-4 moments signature répartis naturellement
▸ 1 chiffre/stat concret minimum
▸ Paragraphes: 3-4 lignes max
▸ Transitions fluides entre sections
▸ ${yearNote}

BLOC E — FAQ (3 questions PAA):
▸ Questions comme les gens les cherchent, réponses 50-150 mots, ton signature maintenu

BLOC F — Conclusion + CTA:
▸ 2-3 phrases percutantes (pas de répétition)
▸ CTA: bénéfice concret AVANT l'action
${conclusionEnd}

ANTI-STUFFING: expression >5 mots ressemblant à mot-clé collé = INTERDITE. Test H2: "un humain dirait-il ça à l'oral ?" → non → réécrire.
SEO: densité 1-1.5%, champ sémantique 15+, entités nommées, 2-3 ancres maillage, EEAT.

PHASE 3 — AUTO-CORRECTION:
✓ VÉR.1 Phrases SEO artificielles? → réécrire
✓ VÉR.2 Article générique IA? → ajouter concret/vécu
✓ VÉR.3 Chaque H2 actionnable? → enrichir
✓ VÉR.4 Hook crée tension dès ligne 1? → réécrire
✓ VÉR.5 Moments signature présents et naturels (min 2)? → ajouter
✓ VÉR.6 CTA orienté résultat? → reformuler

JSON: {
  "mot_cle_principal_final":"...","mots_cles_secondaires_final":["..."],"angle_final":"...",
  "promesse_article":"...","hook_verite":"...",
  "meta_title":"...","meta_description":"...","wp_title":"...",
  "html_content":"<!-- wp:paragraph -->...<!-- /wp:paragraph -->",
  "word_count":0,"reading_time_minutes":0,"seo_score_estimate":0,
  "champ_semantique":["..."],"ancres_maillage":[{"ancre":"...","sujet_cible":"..."}],
  "excerpt":"...",
  "moments_signature_utilises":["format:..., section:..."],
  "auto_correction_log":["VÉR.1:...","VÉR.2:...","VÉR.3:...","VÉR.4:...","VÉR.5:...","VÉR.6:..."]
}`
  };
}

const PROMPTS = {
  intention: (s, k, site, wordCount, instructions) => ({
    system: SYSTEM_BASE(site),
    user: `Expert SEO et copywriting. Analyse "${k}" pour un article sur "${s}". Audience: ${AUDIENCE}
Donne: intention de recherche, émotions sous-jacentes, niveaux de conscience (0-5 chacun), CTAs par étape avec placement, angle différenciant.
JSON: {"intention_type":"...","emotions_douleurs":["..."],"awareness_levels":{"inconscient":{"score":0,"raison":"..."},"conscient_pb":{"score":0,"raison":"..."},"comparaison":{"score":0,"raison":"..."}},"cta_par_etape":[{"etape":"...","cta":"...","placement":"..."}],"angle_differenciant":"...","resume_strategie":"..."}`
  }),
  competitors: (s, k, site, wordCount, instructions) => ({
    system: SYSTEM_BASE(site),
    user: `Étudie les 10 premiers résultats Google FR ${CURRENT_YEAR} pour "${k}" (sujet: "${s}"). Génère 30 requêtes conversationnelles uniques. Consignes: ${instructions}
JSON: {"concurrents":[{"position":1,"titre":"...","angle":"...","nb_mots_estime":0,"points_forts":"..."}],"requetes_conversationnelles":["..."],"content_gaps":["..."],"recommandation":"..."}`
  }),
  longtail: (s, k, site, wordCount, instructions) => ({
    system: SYSTEM_BASE(site),
    user: `Expert SEO 10 ans. Analyse stratégique complète pour "${s}" / "${k}". Audience: ${AUDIENCE}. Consignes: ${instructions}

PARTIE 1 — Stratégie mots-clés:
- 1 mot-clé principal (2-4 mots)
- 5 mots-clés secondaires PROPRES (2-4 mots chacun, naturels, pas de phrases collées)
- Intention dominante

PARTIE 2 — 15 requêtes longue traîne avec: requête, volume, concurrence, intention, funnel

PARTIE 3 — Angle éditorial: UN parmi débutant pas à pas / erreurs à éviter / étude de cas / méthode concrète. Justification vs concurrence.

JSON: {
  "mot_cle_principal":"...","mots_cles_secondaires":["..."],"intention_dominante":"...",
  "angle_editorial":"...","justification_angle":"...",
  "mots_cles_longtail":[{"requete":"...","volume_estime":"...","concurrence":"Faible|Moyen|Élevé","intention":"...","funnel":"..."}],
  "liste_brute":"mot1, mot2..."
}`
  }),
};

const SITES_KEY = "seo_pipeline_sites_v7";
const QUEUE_KEY = "seo_pipeline_queue_v7";
const INSTR_KEY = "seo_pipeline_instructions_v3";

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
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:maxTokens, system:prompt.system, messages:[{role:"user",content:prompt.user}] }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `HTTP ${res.status}`); }
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.content?.map(b => b.text || "").join("") || "";
  if (!text) throw new Error("Réponse vide");
  const clean = text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
  const s = clean.indexOf("{"), e2 = clean.lastIndexOf("}");
  if (s===-1||e2===-1) throw new Error("JSON introuvable");
  return JSON.parse(clean.slice(s,e2+1));
}

async function publishToWordPress(profile, articleData) {
  const credentials = btoa(`${profile.wpUser}:${profile.appPassword}`);
  const cleanUrl = profile.wpUrl.replace(/\/$/,"");
  const useYear = profile?.editorial?.useYearVars !== false;
  const seopressTitle = useYear && articleData.meta_title ? `${articleData.meta_title} %%currentyear%%` : articleData.meta_title;
  const res = await fetch(`${cleanUrl}/wp-json/wp/v2/posts`, {
    method:"POST",
    headers:{"Content-Type":"application/json", Authorization:`Basic ${credentials}`},
    body: JSON.stringify({
      title: articleData.wp_title || articleData.meta_title,
      content: articleData.html_content,
      excerpt: articleData.excerpt,
      status: "draft",
      meta: { _seopress_titles_title: seopressTitle, _seopress_titles_desc: articleData.meta_description || "" },
    }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || `HTTP ${res.status}`); }
  return await res.json();
}

const Spinner = () => (
  <span style={{display:"inline-block",width:13,height:13,border:"2px solid var(--color-border-tertiary)",borderTop:"2px solid var(--color-text-secondary)",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}} />
);
const Badge = ({ status, label }) => {
  const m = {
    idle:      {bg:"var(--color-background-secondary)",color:"var(--color-text-tertiary)",label:"En attente"},
    running:   {bg:"#FEF3C7",color:"#92400E",label:"En cours…"},
    done:      {bg:"#D1FAE5",color:"#065F46",label:"Terminé"},
    error:     {bg:"#FEE2E2",color:"#991B1B",label:"Erreur"},
    published: {bg:"#D1FAE5",color:"#065F46",label:"Publié"},
    queued:    {bg:"#EDE9FE",color:"#5B21B6",label:"En file"},
  }[status] || {};
  return <span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:m.bg,color:m.color,fontWeight:500,whiteSpace:"nowrap"}}>{label||m.label}</span>;
};

function SiteModal({ sites, onSave, onSelect, onDelete, onClose }) {
  const [tab, setTab] = useState("connexion");
  const [editIdx, setEditIdx] = useState(null);
  const [local, setLocal] = useState(sites);
  const [conn, setConn] = useState({name:"",url:"",user:"",password:""});
  const [prof, setProf] = useState(DEFAULT_PROFILE);
  const canSave = conn.name && conn.url && conn.user && conn.password;

  const startEdit = (i) => {
    const s = local[i];
    setConn({name:s.name,url:s.wpUrl,user:s.wpUser,password:s.appPassword});
    setProf(s.editorial || DEFAULT_PROFILE);
    setEditIdx(i);
    setTab("connexion");
  };

  const handleSave = () => {
    if (!canSave) return;
    const entry = {name:conn.name,wpUrl:conn.url,wpUser:conn.user,appPassword:conn.password,editorial:prof};
    const updated = editIdx !== null ? local.map((s,i)=>i===editIdx?entry:s) : [...local,entry];
    setLocal(updated); onSave(updated);
    setConn({name:"",url:"",user:"",password:""}); setProf(DEFAULT_PROFILE); setEditIdx(null);
  };

  const tabStyle = (t) => ({padding:"6px 14px",border:"none",borderRadius:"var(--border-radius-md)",cursor:"pointer",fontSize:12,fontWeight:tab===t?500:400,background:tab===t?"var(--color-background-primary)":"none",color:tab===t?"var(--color-text-primary)":"var(--color-text-secondary)",borderBottom:tab===t?"2px solid var(--color-text-primary)":"2px solid transparent"});

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",padding:"1.25rem",boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:600,color:"#111"}}>Mes sites WordPress</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#666",lineHeight:1,padding:"0 4px"}}>×</button>
        </div>

        {local.length > 0 && (
          <div style={{marginBottom:"1rem",display:"flex",flexDirection:"column",gap:6}}>
            {local.map((site,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#f9fafb",borderRadius:8,border:"1px solid #e5e7eb"}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:0,fontSize:13,fontWeight:500,color:"#111"}}>{site.name}</p>
                  <p style={{margin:0,fontSize:11,color:"#6b7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{site.wpUrl}</p>
                </div>
                <button onClick={()=>onSelect(site)} style={{fontSize:12,padding:"4px 10px",color:"#2563eb",background:"none",border:"1px solid #bfdbfe",borderRadius:6,cursor:"pointer"}}>Choisir</button>
                <button onClick={()=>startEdit(i)} style={{fontSize:12,padding:"4px 8px",background:"none",border:"1px solid #e5e7eb",borderRadius:6,cursor:"pointer",color:"#374151"}}>✎</button>
                <button onClick={()=>{const u=local.filter((_,idx)=>idx!==i);setLocal(u);onDelete(u);}} style={{fontSize:12,padding:"4px 8px",background:"none",border:"1px solid #e5e7eb",borderRadius:6,cursor:"pointer",color:"#dc2626"}}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{borderTop:"1px solid #e5e7eb",paddingTop:"1rem"}}>
          <p style={{margin:"0 0 10px",fontSize:13,fontWeight:600,color:"#111"}}>{editIdx!==null?"Modifier le site":"Ajouter un site"}</p>
          <div style={{display:"flex",gap:2,marginBottom:"1rem",background:"#f3f4f6",borderRadius:8,padding:3}}>
            <button style={tabStyle("connexion")} onClick={()=>setTab("connexion")}>Connexion WP</button>
            <button style={tabStyle("editorial")} onClick={()=>setTab("editorial")}>Profil éditorial</button>
          </div>

          {tab === "connexion" && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              {[{k:"name",l:"Nom du site",p:"lesmakers.fr",t:"text"},{k:"url",l:"URL WordPress",p:"https://lesmakers.fr",t:"url"},{k:"user",l:"Identifiant WP",p:"admin",t:"text"},{k:"password",l:"Application Password",p:"xxxx xxxx xxxx xxxx",t:"password"}].map(f=>(
                <div key={f.k}>
                  <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:3}}>{f.l}</label>
                  <input type={f.t} value={conn[f.k]} onChange={e=>setConn({...conn,[f.k]:e.target.value})} placeholder={f.p} style={{width:"100%",boxSizing:"border-box",border:"1px solid #d1d5db",borderRadius:6,padding:"6px 8px",fontSize:12}} />
                </div>
              ))}
            </div>
          )}

          {tab === "editorial" && (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div>
                  <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:3}}>Shortcode intro</label>
                  <input value={prof.shortcodeIntro||""} onChange={e=>setProf({...prof,shortcodeIntro:e.target.value})} placeholder="[elementor-template id=22062]" style={{width:"100%",boxSizing:"border-box",border:"1px solid #d1d5db",borderRadius:6,padding:"6px 8px",fontSize:12}} />
                </div>
                <div>
                  <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:3}}>Shortcode conclusion</label>
                  <input value={prof.shortcodeConclusion||""} onChange={e=>setProf({...prof,shortcodeConclusion:e.target.value})} placeholder="[elementor-template id=1148]" style={{width:"100%",boxSizing:"border-box",border:"1px solid #d1d5db",borderRadius:6,padding:"6px 8px",fontSize:12}} />
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#374151",cursor:"pointer"}}>
                  <input type="checkbox" checked={!!prof.useYearVars} onChange={e=>setProf({...prof,useYearVars:e.target.checked})} />
                  Variables d'année ([current_date format=Y] / %%currentyear%%)
                </label>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#374151",cursor:"pointer"}}>
                  <input type="checkbox" checked={!!prof.snippetEnabled} onChange={e=>setProf({...prof,snippetEnabled:e.target.checked})} />
                  Bloc rich snippet coloré
                </label>
                {prof.snippetEnabled && (
                  <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#374151"}}>
                    Couleur :
                    <input type="color" value={prof.snippetBg||"#fdeecd"} onChange={e=>setProf({...prof,snippetBg:e.target.value})} style={{width:32,height:24,border:"none",cursor:"pointer",borderRadius:4}} />
                    <span style={{fontSize:11,color:"#9ca3af"}}>{prof.snippetBg||"#fdeecd"}</span>
                  </label>
                )}
              </div>
              <div>
                <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:3}}>CTA de l'article</label>
                <input value={prof.cta||""} onChange={e=>setProf({...prof,cta:e.target.value})} placeholder={CTA_DEFAULT} style={{width:"100%",boxSizing:"border-box",border:"1px solid #d1d5db",borderRadius:6,padding:"6px 8px",fontSize:12}} />
              </div>
              <div>
                <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:3}}>Signature éditoriale</label>
                <textarea value={prof.signature||""} onChange={e=>setProf({...prof,signature:e.target.value})} rows={6} style={{width:"100%",boxSizing:"border-box",border:"1px solid #d1d5db",borderRadius:6,padding:"8px",fontSize:11,fontFamily:"monospace",resize:"vertical"}} />
              </div>
            </div>
          )}

          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button onClick={handleSave} disabled={!canSave} style={{padding:"7px 16px",fontWeight:500,background:"#111",color:"#fff",border:"none",borderRadius:6,cursor:canSave?"pointer":"not-allowed",opacity:canSave?1:0.4,fontSize:13}}>{editIdx!==null?"Enregistrer":"+ Ajouter"}</button>
            {editIdx!==null && <button onClick={()=>{setEditIdx(null);setConn({name:"",url:"",user:"",password:""});setProf(DEFAULT_PROFILE);}} style={{fontSize:12,padding:"6px 12px",background:"none",border:"1px solid #e5e7eb",borderRadius:6,cursor:"pointer"}}>Annuler</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SiteSelector({ sites, onSelect, onManage }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,width:"100%",maxWidth:420,padding:"1.5rem",boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
        <h3 style={{margin:"0 0 4px",fontSize:17,fontWeight:600,color:"#111"}}>Choisir un site</h3>
        <p style={{margin:"0 0 1rem",fontSize:13,color:"#6b7280"}}>Sur quel site veux-tu travailler aujourd'hui ?</p>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:"1rem"}}>
          {sites.map((site,i)=>(
            <button key={i} onClick={()=>onSelect(site)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"#10B981",display:"inline-block",flexShrink:0}} />
              <div>
                <p style={{margin:0,fontSize:13,fontWeight:500,color:"#111"}}>{site.name}</p>
                <p style={{margin:0,fontSize:11,color:"#9ca3af"}}>{site.wpUrl}</p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={onManage} style={{fontSize:12,padding:"6px 12px",background:"none",border:"1px solid #e5e7eb",borderRadius:6,cursor:"pointer",color:"#6b7280"}}>+ Ajouter un site</button>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("pipeline");
  const [subject, setSubject] = useState("");
  const [keyword, setKeyword] = useState("");
  const [wordCount, setWordCount] = useState(1500);
  const [instructions, setInstructions] = useState(DEFAULT_INSTRUCTIONS);
  const [showInstructions, setShowInstructions] = useState(false);
  const [activeInstrTab, setActiveInstrTab] = useState(STEPS[0].id);
  const [sites, setSites] = useState([]);
  const [activeSite, setActiveSite] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [results, setResults] = useState({});
  const [stepStatus, setStepStatus] = useState({});
  const [running, setRunning] = useState(false);
  const [wpStatus, setWpStatus] = useState(null);
  const [wpResult, setWpResult] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);
  const [queue, setQueue] = useState([]);
  const [qForm, setQForm] = useState({subject:"",keyword:"",wordCount:1500,siteId:""});
  const abortRef = useRef(false);

  useEffect(() => {
    const s = loadLS(SITES_KEY, []);
    const instr = loadLS(INSTR_KEY, DEFAULT_INSTRUCTIONS);
    const q = loadLS(QUEUE_KEY, []);
    setSites(s); setInstructions(instr); setQueue(q);
    if (s.length === 1) setActiveSite(s[0]);
    else if (s.length > 1) setShowSelector(true);
  }, []);

  const saveInstructions = (u) => { setInstructions(u); saveLS(INSTR_KEY, u); };
  const handleSiteSave = (u) => { setSites(u); saveLS(SITES_KEY, u); if (!activeSite && u.length>0) setActiveSite(u[0]); };
  const handleSiteSelect = (s) => { setActiveSite(s); setShowModal(false); setShowSelector(false); };
  const handleSiteDelete = (u) => { setSites(u); saveLS(SITES_KEY, u); if (activeSite && !u.find(s=>s.name===activeSite.name)) setActiveSite(u[0]||null); };

  const isReady = subject.trim() && keyword.trim() && activeSite;
  const isDone = stepStatus["article"] === "done";
  const completedCount = STEPS.filter(s => stepStatus[s.id] === "done").length;
  const setStatus = (id, s) => setStepStatus(prev=>({...prev,[id]:s}));

  async function runPipelineFor(subj, kw, wc, site, autoPublish = false) {
    abortRef.current = false;
    setRunning(true); setResults({}); setStepStatus({}); setWpStatus(null); setWpResult(null);
    const acc = {};
    const siteName = site?.name || "mon site";
    const profile = site?.editorial || DEFAULT_PROFILE;
    const stepConfigs = [
      { id:"intention",   tokens:2000, build:()=>PROMPTS.intention(subj,kw,siteName,wc,instructions.intention||"") },
      { id:"competitors", tokens:3000, build:()=>PROMPTS.competitors(subj,kw,siteName,wc,instructions.competitors||"") },
      { id:"longtail",    tokens:2500, build:()=>PROMPTS.longtail(subj,kw,siteName,wc,instructions.longtail||"") },
      { id:"article",     tokens:6500, build:()=>buildArticlePrompt(subj,kw,siteName,wc,instructions.article||"",acc,profile) },
    ];
    try {
      for (const cfg of stepConfigs) {
        if (abortRef.current) break;
        setStatus(cfg.id, "running");
        try {
          const data = await callClaude(cfg.build(), cfg.tokens);
          acc[cfg.id] = data;
          setResults(prev=>({...prev,[cfg.id]:data}));
          setStatus(cfg.id, "done");
        } catch(e) {
          setStatus(cfg.id, "error");
          acc[cfg.id] = {error:e.message};
          setResults(prev=>({...prev,[cfg.id]:{error:e.message}}));
        }
      }
      if (autoPublish && acc.article && !acc.article.error && site) {
        setWpStatus("publishing");
        try {
          const res = await publishToWordPress(site, acc.article);
          setWpResult(res); setWpStatus("published");
        } catch(e) { setWpStatus("error_wp"); setWpResult({error:e.message}); }
      }
    } finally { setRunning(false); }
  }

  async function handleRunPipeline() {
    if (!isReady) return;
    setTab("pipeline");
    await runPipelineFor(subject, keyword, wordCount, activeSite, true);
  }

  async function handleRunFromQueue(idx) {
    const item = queue[idx];
    const site = sites.find(s=>s.name===item.siteId) || activeSite;
    if (!site) return;
    setActiveSite(site);
    setSubject(item.subject); setKeyword(item.keyword); setWordCount(item.wordCount||1500);
    setTab("pipeline");
    const updQ = queue.map((q,i)=>i===idx?{...q,status:"running"}:q);
    setQueue(updQ); saveLS(QUEUE_KEY, updQ);
    await runPipelineFor(item.subject, item.keyword, item.wordCount||1500, site, true);
    setQueue(prev => {
      const u = prev.map((q,i)=>i===idx?{...q,status:"published",publishedAt:new Date().toLocaleDateString("fr-FR")}:q);
      saveLS(QUEUE_KEY, u); return u;
    });
  }

  function addToQueue() {
    if (!qForm.subject || !qForm.keyword) return;
    const entry = {...qForm, id:Date.now(), status:"queued", createdAt:new Date().toLocaleDateString("fr-FR")};
    const u = [...queue, entry]; setQueue(u); saveLS(QUEUE_KEY, u);
    setQForm({subject:"",keyword:"",wordCount:1500,siteId:activeSite?.name||""});
  }

  function removeFromQueue(idx) {
    const u = queue.filter((_,i)=>i!==idx); setQueue(u); saveLS(QUEUE_KEY, u);
  }

  const navStyle = (t) => ({padding:"8px 16px",border:"none",background:"none",cursor:"pointer",fontSize:13,fontWeight:tab===t?500:400,color:tab===t?"var(--color-text-primary)":"var(--color-text-secondary)",borderBottom:tab===t?"2px solid var(--color-text-primary)":"2px solid transparent"});

  return (
    <div style={{fontFamily:"var(--font-sans)",maxWidth:740,margin:"0 auto",padding:"1.5rem 1rem"}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
        .step-row{transition:background 0.12s;border-radius:var(--border-radius-md)}
        .step-row:hover{background:var(--color-background-secondary)!important}
        .instr-tab{padding:5px 12px;border:none;border-radius:var(--border-radius-md);cursor:pointer;font-size:12px;background:none;color:var(--color-text-secondary);transition:all 0.15s}
        .instr-tab.active{background:var(--color-background-primary);color:var(--color-text-primary);font-weight:500;border:0.5px solid var(--color-border-tertiary)}
        .queue-row:hover{background:var(--color-background-secondary)}
      `}</style>

      {showSelector && sites.length > 0 && !showModal && (
        <SiteSelector sites={sites} onSelect={handleSiteSelect} onManage={()=>{setShowSelector(false);setShowModal(true);}} />
      )}
      {showModal && (
        <SiteModal sites={sites} onSave={handleSiteSave} onSelect={handleSiteSelect} onDelete={handleSiteDelete} onClose={()=>setShowModal(false)} />
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:500,margin:"0 0 2px"}}>Pipeline SEO</h2>
          <p style={{fontSize:13,color:"var(--color-text-secondary)",margin:0}}>De l'idée à la publication WordPress en 4 étapes IA</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {activeSite && (
            <button onClick={()=>setShowSelector(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 11px",borderRadius:"var(--border-radius-md)",border:"1px solid var(--color-border-secondary)",background:"var(--color-background-primary)",cursor:"pointer",fontSize:12,fontWeight:500}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#10B981",display:"inline-block"}} />
              {activeSite.name}
            </button>
          )}
          <button onClick={()=>setShowModal(true)} style={{fontSize:11,padding:"5px 10px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-secondary)"}}>⚙ Sites</button>
        </div>
      </div>

      <div style={{display:"flex",gap:0,borderBottom:"0.5px solid var(--color-border-tertiary)",marginBottom:"1rem"}}>
        <button style={navStyle("pipeline")} onClick={()=>setTab("pipeline")}>Pipeline</button>
        <button style={navStyle("queue")} onClick={()=>setTab("queue")}>
          File d'attente {queue.filter(q=>q.status==="queued").length > 0 && <span style={{marginLeft:4,background:"#EDE9FE",color:"#5B21B6",borderRadius:99,padding:"1px 6px",fontSize:10,fontWeight:500}}>{queue.filter(q=>q.status==="queued").length}</span>}
        </button>
      </div>

      {tab === "pipeline" && (
        <>
          <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1rem 1.25rem",marginBottom:"0.75rem"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <label style={{fontSize:12,color:"var(--color-text-secondary)",display:"block",marginBottom:4}}>Sujet de l'article</label>
                <input type="text" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="ex: Comment créer un business en ligne" style={{width:"100%",boxSizing:"border-box"}} disabled={running} />
              </div>
              <div>
                <label style={{fontSize:12,color:"var(--color-text-secondary)",display:"block",marginBottom:4}}>Mot-clé principal</label>
                <input type="text" value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="ex: business en ligne" style={{width:"100%",boxSizing:"border-box"}} disabled={running} />
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <label style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>Longueur</label>
                <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{wordCount} mots</span>
              </div>
              <input type="range" min={800} max={3000} step={100} value={wordCount} onChange={e=>setWordCount(Number(e.target.value))} style={{width:"100%"}} disabled={running} />
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--color-text-tertiary)",marginTop:2}}>
                <span>800</span><span>1500</span><span>3000</span>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <button onClick={()=>setShowInstructions(!showInstructions)} style={{fontSize:12,padding:"4px 10px",display:"flex",alignItems:"center",gap:5}}>
                {showInstructions?"▲":"▼"} Consignes par étape
              </button>
              {showInstructions && (
                <div style={{marginTop:8,background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-tertiary)",padding:"10px",animation:"fadeIn 0.2s ease"}}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                    {STEPS.map(step=>(
                      <button key={step.id} onClick={()=>setActiveInstrTab(step.id)} className={"instr-tab"+(activeInstrTab===step.id?" active":"")}>
                        {step.icon} {step.label}
                      </button>
                    ))}
                  </div>
                  {STEPS.map(step=>activeInstrTab===step.id&&(
                    <div key={step.id}>
                      <textarea value={instructions[step.id]||""} onChange={e=>saveInstructions({...instructions,[step.id]:e.target.value})} placeholder={`Consignes pour "${step.label}"…`} rows={3} style={{width:"100%",boxSizing:"border-box",fontSize:12,padding:"8px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",resize:"vertical",fontFamily:"var(--font-sans)"}} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={handleRunPipeline} disabled={!isReady||running} style={{padding:"8px 20px",fontWeight:500,opacity:(!isReady||running)?0.45:1,cursor:(!isReady||running)?"not-allowed":"pointer"}}>
                {running?"Pipeline en cours…":"▶ Lancer le pipeline"}
              </button>
              {running && <><Spinner /><button onClick={()=>{abortRef.current=true;setRunning(false);}} style={{fontSize:12,padding:"5px 12px",color:"var(--color-text-secondary)"}}>Arrêter</button></>}
              {!running && completedCount>0 && <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{completedCount}/{STEPS.length} étapes</span>}
            </div>
          </div>

          {(running||completedCount>0) && (
            <div style={{height:2,background:"var(--color-background-secondary)",borderRadius:99,marginBottom:"0.75rem",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.round((completedCount/STEPS.length)*100)}%`,background:"var(--color-text-primary)",borderRadius:99,transition:"width 0.5s ease"}} />
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:"0.75rem"}}>
            {STEPS.map((step,i)=>{
              const status=stepStatus[step.id]||"idle";
              const data=results[step.id];
              const isExp=expandedStep===step.id;
              return (
                <div key={step.id} className="step-row" style={{border:"0.5px solid var(--color-border-tertiary)",overflow:"hidden",animation:status==="done"?"fadeIn 0.25s ease":"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px"}}>
                    <span style={{fontSize:15,minWidth:20,textAlign:"center"}}>{step.icon}</span>
                    <div style={{flex:1}}>
                      <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{i+1}. {step.label}</span>
                      <span style={{fontSize:11,color:"var(--color-text-secondary)",marginLeft:8}}>{step.desc}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {status==="running"&&<Spinner />}
                      <Badge status={status} />
                      {data&&!data.error&&<button onClick={()=>setExpandedStep(isExp?null:step.id)} style={{fontSize:11,padding:"2px 6px",color:"var(--color-text-secondary)",background:"none",border:"none",cursor:"pointer"}}>{isExp?"▲":"▼"}</button>}
                      {data?.error&&<span style={{fontSize:11,color:"#991B1B"}} title={data.error}>⚠ {data.error.slice(0,40)}</span>}
                    </div>
                  </div>
                  {isExp&&data&&!data.error&&(
                    <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",padding:"10px 12px",background:"var(--color-background-secondary)",animation:"fadeIn 0.2s ease"}}>
                      {step.id==="intention"&&(
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          <p style={{margin:0,fontSize:12}}><strong style={{color:"var(--color-text-primary)"}}>Intention :</strong> <span style={{color:"var(--color-text-secondary)"}}>{data.intention_type}</span></p>
                          <p style={{margin:0,fontSize:12}}><strong style={{color:"var(--color-text-primary)"}}>Angle :</strong> <span style={{color:"var(--color-text-secondary)"}}>{data.angle_differenciant}</span></p>
                          <p style={{margin:0,fontSize:12,color:"var(--color-text-secondary)"}}>{data.resume_strategie}</p>
                        </div>
                      )}
                      {step.id==="competitors"&&(
                        <div>
                          <p style={{margin:"0 0 8px",fontSize:12,color:"var(--color-text-secondary)"}}>{data.recommandation}</p>
                          <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:6}}>
                            {(data.requetes_conversationnelles||[]).slice(0,8).map((r,j)=><span key={j} style={{fontSize:11,padding:"2px 7px",background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:4}}>{r}</span>)}
                          </div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                            {(data.content_gaps||[]).slice(0,5).map((g,j)=><span key={j} style={{fontSize:11,padding:"2px 8px",background:"var(--color-background-info)",color:"var(--color-text-info)",borderRadius:99}}>Gap: {g}</span>)}
                          </div>
                        </div>
                      )}
                      {step.id==="longtail"&&(
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                            <div style={{padding:"6px 10px",background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",flex:1}}>
                              <p style={{margin:"0 0 1px",fontSize:10,color:"var(--color-text-secondary)"}}>Mot-clé principal</p>
                              <p style={{margin:0,fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{data.mot_cle_principal}</p>
                            </div>
                            <div style={{padding:"6px 10px",background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",flex:1}}>
                              <p style={{margin:"0 0 1px",fontSize:10,color:"var(--color-text-secondary)"}}>Angle éditorial</p>
                              <p style={{margin:0,fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{data.angle_editorial}</p>
                            </div>
                          </div>
                          <div>
                            <p style={{margin:"0 0 4px",fontSize:11,fontWeight:500,color:"var(--color-text-primary)"}}>Mots-clés secondaires</p>
                            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                              {(data.mots_cles_secondaires||[]).map((m,j)=><span key={j} style={{fontSize:11,padding:"2px 8px",background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:4}}>{m}</span>)}
                            </div>
                          </div>
                        </div>
                      )}
                      {step.id==="article"&&(
                        <div>
                          {data.hook_verite&&(
                            <div style={{marginBottom:8,padding:"8px 12px",background:"var(--color-background-primary)",borderLeft:"3px solid var(--color-border-primary)",borderRadius:"0 var(--border-radius-md) var(--border-radius-md) 0"}}>
                              <p style={{margin:"0 0 2px",fontSize:10,color:"var(--color-text-secondary)",fontWeight:500}}>HOOK VÉRITÉ</p>
                              <p style={{margin:0,fontSize:12,fontStyle:"italic",color:"var(--color-text-primary)"}}>{data.hook_verite}</p>
                            </div>
                          )}
                          {data.promesse_article&&<p style={{margin:"0 0 8px",fontSize:12,color:"var(--color-text-secondary)",borderLeft:"2px solid var(--color-border-secondary)",paddingLeft:8}}><strong style={{color:"var(--color-text-primary)"}}>Promesse :</strong> {data.promesse_article}</p>}
                          <p style={{margin:"0 0 2px",fontSize:11,color:"var(--color-text-secondary)"}}><strong style={{color:"var(--color-text-primary)"}}>Titre WP :</strong> {data.wp_title}</p>
                          <p style={{margin:"0 0 2px",fontSize:11,color:"var(--color-text-secondary)"}}><strong style={{color:"var(--color-text-primary)"}}>Meta SEOPress :</strong> {data.meta_title}</p>
                          <p style={{margin:"0 0 10px",fontSize:11,color:"var(--color-text-secondary)"}}><strong style={{color:"var(--color-text-primary)"}}>Meta desc :</strong> {data.meta_description}</p>
                          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                            {[{l:"Mots",v:data.word_count},{l:"Lecture",v:`${data.reading_time_minutes} min`},{l:"SEO",v:`${data.seo_score_estimate}/100`},{l:"Angle",v:data.angle_final}].map(m=>(
                              <div key={m.l} style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",padding:"4px 12px",textAlign:"center"}}>
                                <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{m.v}</div>
                                <div style={{fontSize:10,color:"var(--color-text-secondary)"}}>{m.l}</div>
                              </div>
                            ))}
                          </div>
                          {(data.moments_signature_utilises||[]).length>0&&(
                            <div style={{marginBottom:8,background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",padding:"8px 10px"}}>
                              <p style={{margin:"0 0 4px",fontSize:11,fontWeight:500,color:"var(--color-text-primary)"}}>Moments signature ({data.moments_signature_utilises.length})</p>
                              {data.moments_signature_utilises.map((m,j)=><p key={j} style={{margin:"2px 0 0",fontSize:11,color:"var(--color-text-secondary)"}}>▸ {m}</p>)}
                            </div>
                          )}
                          {(data.auto_correction_log||[]).length>0&&(
                            <div style={{marginBottom:8,background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",padding:"8px 10px"}}>
                              <p style={{margin:"0 0 4px",fontSize:11,fontWeight:500,color:"var(--color-text-primary)"}}>Auto-correction</p>
                              {data.auto_correction_log.map((l,j)=><p key={j} style={{margin:"2px 0 0",fontSize:11,color:"var(--color-text-secondary)"}}>✓ {l}</p>)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",overflow:"hidden",opacity:isDone?1:0.4,transition:"opacity 0.3s"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"var(--color-background-primary)"}}>
              <span style={{fontSize:15,minWidth:20,textAlign:"center"}}>🚀</span>
              <div style={{flex:1}}>
                <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>5. Publication WordPress</span>
                <span style={{fontSize:11,color:"var(--color-text-secondary)",marginLeft:8}}>Publication automatique en brouillon</span>
              </div>
              {wpStatus==="published"&&<Badge status="published" />}
              {wpStatus==="publishing"&&<><Spinner /><Badge status="running" /></>}
              {(wpStatus==="error_wp"||wpStatus==="no_site")&&<Badge status="error" />}
            </div>
            {isDone&&(
              <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",padding:"10px 12px",background:"var(--color-background-secondary)",display:"flex",flexDirection:"column",gap:8}}>
                {wpStatus==="publishing"&&<p style={{margin:0,fontSize:12,color:"var(--color-text-secondary)"}}>Publication en cours sur {activeSite?.name}…</p>}
                {wpStatus==="published"&&wpResult&&(
                  <div style={{background:"#D1FAE5",border:"0.5px solid #A7F3D0",borderRadius:"var(--border-radius-md)",padding:"10px 14px"}}>
                    <p style={{margin:0,fontSize:13,fontWeight:500,color:"#065F46"}}>✓ Brouillon publié sur {activeSite?.name} !</p>
                    <p style={{margin:"3px 0 0",fontSize:12,color:"#065F46"}}>Article #{wpResult.id} — <a href={wpResult.link} target="_blank" rel="noopener" style={{color:"#047857"}}>Voir dans WordPress ↗</a></p>
                  </div>
                )}
                {(wpStatus==="error_wp"||wpStatus==="no_site")&&(
                  <div style={{background:"#FEE2E2",border:"0.5px solid #FECACA",borderRadius:"var(--border-radius-md)",padding:"10px 14px"}}>
                    <p style={{margin:0,fontSize:13,color:"#991B1B"}}>{wpStatus==="no_site"?"Aucun site configuré.":wpResult?.error}</p>
                  </div>
                )}
                <button onClick={()=>{
                  const html=results["article"]?.html_content||"";
                  const blob=new Blob([html],{type:"text/html"});
                  const url=URL.createObjectURL(blob);
                  const a=document.createElement("a");
                  a.href=url;a.download=`article-${keyword.replace(/\s+/g,"-")}.html`;a.click();
                }} style={{alignSelf:"flex-start",fontSize:12,padding:"6px 14px"}}>⬇ Télécharger HTML</button>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "queue" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1rem 1.25rem"}}>
            <p style={{margin:"0 0 10px",fontSize:14,fontWeight:500,color:"var(--color-text-primary)"}}>Ajouter à la file</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <div>
                <label style={{fontSize:11,color:"var(--color-text-secondary)",display:"block",marginBottom:3}}>Sujet</label>
                <input value={qForm.subject} onChange={e=>setQForm({...qForm,subject:e.target.value})} placeholder="ex: Comment créer un business en ligne" style={{width:"100%",boxSizing:"border-box"}} />
              </div>
              <div>
                <label style={{fontSize:11,color:"var(--color-text-secondary)",display:"block",marginBottom:3}}>Mot-clé</label>
                <input value={qForm.keyword} onChange={e=>setQForm({...qForm,keyword:e.target.value})} placeholder="ex: business en ligne" style={{width:"100%",boxSizing:"border-box"}} />
              </div>
              <div>
                <label style={{fontSize:11,color:"var(--color-text-secondary)",display:"block",marginBottom:3}}>Site</label>
                <select value={qForm.siteId} onChange={e=>setQForm({...qForm,siteId:e.target.value})} style={{width:"100%",boxSizing:"border-box",padding:"6px 8px",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",fontSize:13}}>
                  <option value="">— Sélectionner —</option>
                  {sites.map((s,i)=><option key={i} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:"var(--color-text-secondary)",display:"block",marginBottom:3}}>Longueur (mots)</label>
                <input type="number" min={800} max={3000} step={100} value={qForm.wordCount} onChange={e=>setQForm({...qForm,wordCount:Number(e.target.value)})} style={{width:"100%",boxSizing:"border-box"}} />
              </div>
            </div>
            <button onClick={addToQueue} disabled={!qForm.subject||!qForm.keyword} style={{padding:"7px 16px",fontWeight:500,opacity:(!qForm.subject||!qForm.keyword)?0.45:1}}>+ Ajouter à la file</button>
          </div>

          {queue.length === 0
            ? <p style={{fontSize:13,color:"var(--color-text-tertiary)",textAlign:"center",padding:"2rem 0"}}>Aucun article en file d'attente.</p>
            : (
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {queue.map((item,i)=>(
                  <div key={item.id} className="queue-row" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",transition:"background 0.12s"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{margin:0,fontSize:13,fontWeight:500,color:"var(--color-text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.subject}</p>
                      <p style={{margin:"2px 0 0",fontSize:11,color:"var(--color-text-secondary)"}}>{item.keyword} · {item.siteId||"site non défini"} · {item.wordCount||1500} mots · {item.createdAt}</p>
                      {item.publishedAt&&<p style={{margin:"2px 0 0",fontSize:11,color:"#065F46"}}>Publié le {item.publishedAt}</p>}
                    </div>
                    <Badge status={item.status==="published"?"published":item.status==="running"?"running":"queued"} />
                    {item.status==="queued"&&(
                      <button onClick={()=>handleRunFromQueue(i)} disabled={running} style={{fontSize:12,padding:"5px 12px",fontWeight:500,opacity:running?0.45:1,cursor:running?"not-allowed":"pointer"}}>
                        ▶ Générer
                      </button>
                    )}
                    {item.status!=="running"&&(
                      <button onClick={()=>removeFromQueue(i)} style={{fontSize:11,padding:"4px 8px",color:"var(--color-text-secondary)",background:"none",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",cursor:"pointer"}}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}
