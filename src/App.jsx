import { useState, useRef, useEffect } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
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
CTA ORIENTÉ RÉSULTAT: formuler le bénéfice concret AVANT l'action.
RÈGLES: ✅ Phrases courtes ✅ Concret > théorie ✅ 1 idée/paragraphe ❌ Phrases molles ❌ Jargon ❌ Ton neutre`;

const DEFAULT_PROFILE = {
  signature: SIGNATURE_EDITORIALE_DEFAULT,
  shortcodeIntro: "[elementor-template id=\"22062\"]",
  shortcodeConclusion: "[elementor-template id=\"1148\"]",
  useYearVars: true, snippetBg: "#fdeecd", snippetEnabled: true,
  cta: CTA_DEFAULT, ton: TON_DEFAULT,
};

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#FAFAF8", card: "#FFFFFF", border: "#E8E6E0",
  borderHover: "#D0CEC8", text: "#0F0F0E", textMuted: "#6B6860",
  textFaint: "#A8A49E", yellow: "#F3C05D", yellowLight: "#FEF3D0",
  yellowDark: "#C8950A", green: "#16A34A", greenLight: "#DCFCE7",
  red: "#DC2626", redLight: "#FEE2E2", purple: "#7C3AED", purpleLight: "#EDE9FE",
  shadow: "0 1px 3px rgba(15,15,14,0.08), 0 1px 2px rgba(15,15,14,0.04)",
  shadowMd: "0 4px 12px rgba(15,15,14,0.10), 0 2px 4px rgba(15,15,14,0.06)",
  shadowLg: "0 20px 48px rgba(15,15,14,0.14), 0 8px 16px rgba(15,15,14,0.08)",
  radius: "10px", radiusSm: "6px", radiusLg: "14px",
};

// ─── PROMPTS / AI LOGIC ───────────────────────────────────────────────────────
const SYSTEM_BASE = (s) => `Tu es un expert SEO et rédacteur web francophone spécialisé pour "${s}". Nous sommes en ${CURRENT_YEAR}. Tu réponds UNIQUEMENT en JSON valide, sans backticks, sans commentaires.`;

function buildArticlePrompt(s, k, site, wc, instructions, prevData, profile) {
  const cta=profile?.cta||CTA_DEFAULT, ton=profile?.ton||TON_DEFAULT, sig=profile?.signature||"";
  const useYear=profile?.useYearVars!==false, scIntro=profile?.shortcodeIntro||"", scEnd=profile?.shortcodeConclusion||"";
  const snippetBg=profile?.snippetEnabled?(profile?.snippetBg||"#fdeecd"):null;
  const yearNote=useYear?"Utiliser [current_date format=Y] pour toute mention de l'année.":"Écrire l'année en toutes lettres.";
  const titleNote=useYear?"wp_title: avec [current_date format=Y]. meta_title: SANS année (SEOPress gère via %%currentyear%%).":"wp_title et meta_title: sans variable d'année.";
  const snippetInstr=snippetBg?`BLOC B — Featured snippet: envelopper dans wp:group fond ${snippetBg}:
<!-- wp:group {"style":{"color":{"background":"${snippetBg}"},"spacing":{"padding":{"top":"1rem","bottom":"1rem","left":"1.25rem","right":"1.25rem"}}},"layout":{"type":"constrained"}} --><div class="wp-block-group has-background" style="background-color:${snippetBg};padding:1rem 1.25rem"><!-- wp:paragraph --><p>📌 <strong>Résumé :</strong> [réponse 40-60 mots]</p><!-- /wp:paragraph --></div><!-- /wp:group -->`
  :`BLOC B — Featured snippet (40-60 mots): bloc paragraphe simple, mot-clé dans les 10 premiers mots.`;
  return {
    system:`Tu es le rédacteur éditorial senior de ${site}. ${CURRENT_YEAR}. Voix directe, lucide, business. Tu travailles en 3 phases. JSON uniquement.`,
    user:`Rédige un article SEO de ${wc} mots sur: "${s}".
CONTEXTE: Mot-clé: ${prevData?.longtail?.mot_cle_principal||k} | Secondaires: ${(prevData?.longtail?.mots_cles_secondaires||[]).join(", ")||k} | Intention: ${prevData?.longtail?.intention_dominante||"informationnelle"} | Angle: ${prevData?.longtail?.angle_editorial||"guide pratique"} | Audience: ${AUDIENCE} | Ton: ${ton} | CTA: ${cta} | Requêtes: ${(prevData?.competitors?.requetes_conversationnelles||[]).slice(0,8).join(" / ")} | Consignes: ${instructions}
${sig?`════\n${sig}\n════`:""}
PHASE 1 — PRÉPARATION: mot_cle_principal_final (1, 2-4 mots), mots_cles_secondaires_final (5, simples), intention_finale, angle_final (guide débutant/erreurs/étude de cas/méthode), promesse_article (1 phrase), hook_verite (casse croyance).
PHASE 2 — RÉDACTION GUTENBERG:
Blocs: paragraphe=<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph --> | h2=<!-- wp:heading {"level":2} --><h2>x</h2><!-- /wp:heading --> | h3=<!-- wp:heading {"level":3} --><h3>x</h3><!-- /wp:heading --> | liste=<!-- wp:list --><ul><!-- wp:list-item --><li>x</li><!-- /wp:list-item --></ul><!-- /wp:list --> | punchline=<!-- wp:quote --><blockquote class="wp-block-quote"><p>x</p></blockquote><!-- /wp:quote --> | shortcode=<!-- wp:shortcode -->[x]<!-- /wp:shortcode -->
BLOC A — Métadonnées: ${titleNote} meta_description: 130-160 car, sans année.
${snippetInstr}
BLOC C — Intro (80 mots max): hook vérité ligne 1 (jamais "Dans cet article"), contexte + mot-clé naturel, promesse résultat. Fin: <!-- wp:shortcode -->${scIntro}<!-- /wp:shortcode -->
BLOC D — Corps (min 4 H2): H2 humains avec verbe, 1 idée+développement+exemple+punchline/section, 2-4 moments signature, 1 stat concrète, paragraphes 3-4 lignes, transitions fluides. ${yearNote}
BLOC E — FAQ (3 PAA): questions naturelles, réponses 50-150 mots.
BLOC F — Conclusion+CTA: 2-3 phrases, bénéfice concret avant action. Fin: <!-- wp:shortcode -->${scEnd}<!-- /wp:shortcode -->
ANTI-STUFFING: >5 mots mot-clé collé=INTERDIT. Test H2: "un humain dirait ça à l'oral?"→non→réécrire.
SEO: densité 1-1.5%, sémantique 15+, entités nommées, 2-3 ancres maillage, EEAT.
PHASE 3 — AUTO-CORRECTION: VÉR.1 phrases SEO artificielles? VÉR.2 article générique IA? VÉR.3 H2 actionnable? VÉR.4 hook tension ligne 1? VÉR.5 moments signature (min 2)? VÉR.6 CTA orienté résultat?
JSON: {"mot_cle_principal_final":"...","mots_cles_secondaires_final":["..."],"angle_final":"...","promesse_article":"...","hook_verite":"...","meta_title":"...","meta_description":"...","wp_title":"...","html_content":"...","word_count":0,"reading_time_minutes":0,"seo_score_estimate":0,"champ_semantique":["..."],"ancres_maillage":[{"ancre":"...","sujet_cible":"..."}],"excerpt":"...","moments_signature_utilises":["..."],"auto_correction_log":["..."]}`
  };
}

const PROMPTS = {
  intention:(s,k,site,wc,instr)=>({system:SYSTEM_BASE(site),user:`Expert SEO copywriting. Analyse "${k}" pour "${s}". Audience: ${AUDIENCE}. JSON: {"intention_type":"...","emotions_douleurs":["..."],"awareness_levels":{"inconscient":{"score":0,"raison":"..."},"conscient_pb":{"score":0,"raison":"..."},"comparaison":{"score":0,"raison":"..."}},"cta_par_etape":[{"etape":"...","cta":"...","placement":"..."}],"angle_differenciant":"...","resume_strategie":"..."}`}),
  competitors:(s,k,site,wc,instr)=>({system:SYSTEM_BASE(site),user:`Top 10 résultats Google FR ${CURRENT_YEAR} pour "${k}" / "${s}". 30 requêtes conversationnelles. Consignes: ${instr}. JSON: {"concurrents":[{"position":1,"titre":"...","angle":"...","nb_mots_estime":0,"points_forts":"..."}],"requetes_conversationnelles":["..."],"content_gaps":["..."],"recommandation":"..."}`}),
  longtail:(s,k,site,wc,instr)=>({system:SYSTEM_BASE(site),user:`Expert SEO 10 ans. Analyse stratégique "${s}" / "${k}". Audience: ${AUDIENCE}. Consignes: ${instr}
PARTIE 1: 1 mot-clé principal (2-4 mots), 5 secondaires propres (2-4 mots, naturels), intention dominante.
PARTIE 2: 15 requêtes longue traîne (requête, volume, concurrence, intention, funnel).
PARTIE 3: 1 angle éditorial (débutant/erreurs/étude de cas/méthode) + justification.
JSON: {"mot_cle_principal":"...","mots_cles_secondaires":["..."],"intention_dominante":"...","angle_editorial":"...","justification_angle":"...","mots_cles_longtail":[{"requete":"...","volume_estime":"...","concurrence":"Faible|Moyen|Élevé","intention":"...","funnel":"..."}],"liste_brute":"..."}`}),
};

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const SITES_KEY="seo_pipeline_sites_v7", QUEUE_KEY="seo_pipeline_queue_v7", INSTR_KEY="seo_pipeline_instructions_v3";
const loadLS=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"null")??d}catch{return d}};
const saveLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const DEFAULT_INSTRUCTIONS=Object.fromEntries(STEPS.map(s=>[s.id,""]));

// ─── API ──────────────────────────────────────────────────────────────────────
async function callClaude(prompt,maxTokens=3000){
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:maxTokens,system:prompt.system,messages:[{role:"user",content:prompt.user}]})});
  if(!res.ok){const e=await res.json();throw new Error(e.error?.message||`HTTP ${res.status}`);}
  const data=await res.json();
  if(data.error)throw new Error(data.error.message);
  const text=data.content?.map(b=>b.text||"").join("")||"";
  if(!text)throw new Error("Réponse vide");
  const clean=text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
  const s=clean.indexOf("{"),e2=clean.lastIndexOf("}");
  if(s===-1||e2===-1)throw new Error("JSON introuvable");
  return JSON.parse(clean.slice(s,e2+1));
}

async function publishToWordPress(profile,articleData){
  const creds=btoa(`${profile.wpUser}:${profile.appPassword}`);
  const url=profile.wpUrl.replace(/\/$/,"");
  const useYear=profile?.editorial?.useYearVars!==false;
  const seoTitle=useYear&&articleData.meta_title?`${articleData.meta_title} %%currentyear%%`:articleData.meta_title;
  const res=await fetch(`${url}/wp-json/wp/v2/posts`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Basic ${creds}`},body:JSON.stringify({title:articleData.wp_title||articleData.meta_title,content:articleData.html_content,excerpt:articleData.excerpt,status:"draft",meta:{_seopress_titles_title:seoTitle,_seopress_titles_desc:articleData.meta_description||""}})});
  if(!res.ok){const e=await res.json();throw new Error(e.message||`HTTP ${res.status}`);}
  return await res.json();
}

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
const Spinner=()=><span style={{display:"inline-block",width:14,height:14,border:`2px solid ${C.border}`,borderTop:`2px solid ${C.textMuted}`,borderRadius:"50%",animation:"rspin 0.8s linear infinite",flexShrink:0}}/>;

const Pill=({status,label})=>{
  const m={
    idle:{bg:C.bg,color:C.textFaint,label:"En attente"},
    running:{bg:"#FEF3C7",color:"#92400E",label:"En cours…"},
    done:{bg:C.greenLight,color:C.green,label:"Terminé"},
    error:{bg:C.redLight,color:C.red,label:"Erreur"},
    published:{bg:C.greenLight,color:C.green,label:"Publié ✓"},
    queued:{bg:C.purpleLight,color:C.purple,label:"Planifié"},
  }[status]||{bg:C.bg,color:C.textFaint,label:status};
  return <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,background:m.bg,color:m.color,fontWeight:600,letterSpacing:"0.01em",whiteSpace:"nowrap"}}>{label||m.label}</span>;
};

const Inp=({label,hint,...props})=>(
  <div>
    {label&&<label style={{display:"block",fontSize:11,fontWeight:600,color:C.textMuted,marginBottom:5,letterSpacing:"0.04em",textTransform:"uppercase"}}>{label}{hint&&<span style={{fontWeight:400,textTransform:"none",marginLeft:4,color:C.textFaint}}>{hint}</span>}</label>}
    <input {...props} style={{width:"100%",boxSizing:"border-box",height:40,padding:"0 12px",border:`1.5px solid ${C.border}`,borderRadius:C.radiusSm,background:C.card,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",transition:"border-color 0.15s",...(props.style||{})}} onFocus={e=>{e.target.style.borderColor=C.yellow;e.target.style.boxShadow=`0 0 0 3px ${C.yellowLight}`}} onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none"}} />
  </div>
);

const Btn=({children,variant="outline",disabled,onClick,style={}})=>{
  const base={display:"inline-flex",alignItems:"center",gap:6,padding:"0 18px",height:38,border:"none",borderRadius:C.radiusSm,fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",transition:"all 0.15s",opacity:disabled?0.45:1,fontFamily:"inherit",...style};
  const variants={
    primary:{background:C.text,color:"#fff",boxShadow:C.shadow},
    yellow:{background:C.yellow,color:C.text,boxShadow:C.shadow},
    outline:{background:C.card,color:C.text,border:`1.5px solid ${C.border}`},
    ghost:{background:"transparent",color:C.textMuted,padding:"0 10px"},
    danger:{background:C.redLight,color:C.red,border:`1.5px solid #FECACA`},
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...variants[variant]}}>{children}</button>;
};

// ─── SITE MODAL ───────────────────────────────────────────────────────────────
function SiteModal({sites,onSave,onSelect,onDelete,onClose}){
  const [mTab,setMTab]=useState("connexion");
  const [editIdx,setEditIdx]=useState(null);
  const [local,setLocal]=useState(sites);
  const [conn,setConn]=useState({name:"",url:"",user:"",password:""});
  const [prof,setProf]=useState(DEFAULT_PROFILE);
  const canSave=conn.name&&conn.url&&conn.user&&conn.password;

  const startEdit=i=>{const s=local[i];setConn({name:s.name,url:s.wpUrl,user:s.wpUser,password:s.appPassword});setProf(s.editorial||DEFAULT_PROFILE);setEditIdx(i);setMTab("connexion");};
  const handleSave=()=>{if(!canSave)return;const e={name:conn.name,wpUrl:conn.url,wpUser:conn.user,appPassword:conn.password,editorial:prof};const u=editIdx!==null?local.map((s,i)=>i===editIdx?e:s):[...local,e];setLocal(u);onSave(u);setConn({name:"",url:"",user:"",password:""});setProf(DEFAULT_PROFILE);setEditIdx(null);};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,15,14,0.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,width:"100%",maxWidth:580,maxHeight:"90vh",overflowY:"auto",boxShadow:C.shadowLg,border:`1px solid ${C.border}`}}>
        <div style={{padding:"1.25rem 1.5rem",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.card,borderRadius:`${C.radiusLg} ${C.radiusLg} 0 0`,zIndex:1}}>
          <div>
            <h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.text}}>Sites WordPress</h3>
            <p style={{margin:0,fontSize:12,color:C.textMuted,marginTop:1}}>Connexion et profil éditorial par site</p>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:C.radiusSm,border:`1.5px solid ${C.border}`,background:C.bg,color:C.textMuted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
        </div>

        <div style={{padding:"1.25rem 1.5rem"}}>
          {local.length>0&&(
            <div style={{marginBottom:"1.5rem",display:"flex",flexDirection:"column",gap:6}}>
              <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:C.textMuted,letterSpacing:"0.06em",textTransform:"uppercase"}}>Sites configurés</p>
              {local.map((site,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.bg,borderRadius:C.radius,border:`1.5px solid ${C.border}`}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:C.green,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:0,fontSize:13,fontWeight:600,color:C.text}}>{site.name}</p>
                    <p style={{margin:0,fontSize:11,color:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{site.wpUrl}</p>
                  </div>
                  <Btn variant="outline" onClick={()=>onSelect(site)} style={{height:30,fontSize:12,padding:"0 12px"}}>Choisir</Btn>
                  <Btn variant="ghost" onClick={()=>startEdit(i)} style={{height:30,fontSize:13}}>✎</Btn>
                  <Btn variant="danger" onClick={()=>{const u=local.filter((_,idx)=>idx!==i);setLocal(u);onDelete(u);}} style={{height:30,fontSize:13,padding:"0 8px"}}>✕</Btn>
                </div>
              ))}
            </div>
          )}

          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"1.25rem"}}>
            <p style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:C.text}}>{editIdx!==null?"Modifier le site":"Nouveau site"}</p>
            <div style={{display:"flex",background:C.bg,borderRadius:C.radiusSm,padding:3,gap:2,marginBottom:"1.25rem",border:`1.5px solid ${C.border}`}}>
              {[{id:"connexion",label:"🔌 Connexion WordPress"},{id:"editorial",label:"✏️ Profil éditorial"}].map(t=>(
                <button key={t.id} onClick={()=>setMTab(t.id)} style={{flex:1,padding:"7px 10px",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:mTab===t.id?700:400,background:mTab===t.id?C.card:"transparent",color:mTab===t.id?C.text:C.textMuted,boxShadow:mTab===t.id?C.shadow:"none",transition:"all 0.15s",fontFamily:"inherit"}}>{t.label}</button>
              ))}
            </div>

            {mTab==="connexion"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                {[{k:"name",l:"Nom du site",p:"lesmakers.fr",t:"text"},{k:"url",l:"URL WordPress",p:"https://lesmakers.fr",t:"url"},{k:"user",l:"Identifiant WP",p:"admin",t:"text"},{k:"password",l:"Application Password",p:"xxxx xxxx xxxx xxxx",t:"password"}].map(f=>(
                  <Inp key={f.k} label={f.l} type={f.t} value={conn[f.k]} onChange={e=>setConn({...conn,[f.k]:e.target.value})} placeholder={f.p} />
                ))}
              </div>
            )}
            {mTab==="editorial"&&(
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Inp label="Shortcode intro" value={prof.shortcodeIntro||""} onChange={e=>setProf({...prof,shortcodeIntro:e.target.value})} placeholder="[elementor-template id=22062]"/>
                  <Inp label="Shortcode conclusion" value={prof.shortcodeConclusion||""} onChange={e=>setProf({...prof,shortcodeConclusion:e.target.value})} placeholder="[elementor-template id=1148]"/>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:16,padding:"12px 14px",background:C.bg,borderRadius:C.radiusSm,border:`1.5px solid ${C.border}`}}>
                  {[{k:"useYearVars",l:"Variables d'année (SEOPress)"},{k:"snippetEnabled",l:"Bloc rich snippet coloré"}].map(({k,l})=>(
                    <label key={k} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:500,color:C.text,cursor:"pointer"}}>
                      <input type="checkbox" checked={!!prof[k]} onChange={e=>setProf({...prof,[k]:e.target.checked})} style={{width:15,height:15,accentColor:C.yellow}}/>
                      {l}
                    </label>
                  ))}
                  {prof.snippetEnabled&&(
                    <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:C.text}}>
                      Couleur snippet:
                      <input type="color" value={prof.snippetBg||"#fdeecd"} onChange={e=>setProf({...prof,snippetBg:e.target.value})} style={{width:36,height:28,border:`1.5px solid ${C.border}`,cursor:"pointer",borderRadius:4,padding:2}}/>
                      <span style={{fontSize:11,color:C.textFaint,fontFamily:"monospace"}}>{prof.snippetBg||"#fdeecd"}</span>
                    </label>
                  )}
                </div>
                <Inp label="CTA de l'article" value={prof.cta||""} onChange={e=>setProf({...prof,cta:e.target.value})} placeholder={CTA_DEFAULT}/>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,color:C.textMuted,marginBottom:5,letterSpacing:"0.04em",textTransform:"uppercase"}}>Signature éditoriale</label>
                  <textarea value={prof.signature||""} onChange={e=>setProf({...prof,signature:e.target.value})} rows={7} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.border}`,borderRadius:C.radiusSm,padding:"10px 12px",fontSize:11,fontFamily:"monospace",resize:"vertical",background:C.bg,color:C.text,outline:"none"}}/>
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:8}}>
              <Btn variant="primary" onClick={handleSave} disabled={!canSave}>{editIdx!==null?"Enregistrer les modifications":"+ Ajouter ce site"}</Btn>
              {editIdx!==null&&<Btn variant="outline" onClick={()=>{setEditIdx(null);setConn({name:"",url:"",user:"",password:""});setProf(DEFAULT_PROFILE);}}>Annuler</Btn>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SITE SELECTOR ────────────────────────────────────────────────────────────
function SiteSelector({sites,onSelect,onManage}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,15,14,0.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,width:"100%",maxWidth:440,padding:"1.75rem",boxShadow:C.shadowLg,border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"0.25rem"}}>
          <div style={{width:36,height:36,borderRadius:C.radiusSm,background:C.yellow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🌐</div>
          <div>
            <h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.text}}>Choisir un site</h3>
            <p style={{margin:0,fontSize:12,color:C.textMuted}}>Sur quel site travailles-tu aujourd'hui ?</p>
          </div>
        </div>
        <div style={{height:1,background:C.border,margin:"1rem 0"}}/>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:"1rem"}}>
          {sites.map((site,i)=>(
            <button key={i} onClick={()=>onSelect(site)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:C.radius,cursor:"pointer",textAlign:"left",transition:"all 0.15s",fontFamily:"inherit"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:C.green,flexShrink:0}}/>
              <div style={{flex:1}}>
                <p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>{site.name}</p>
                <p style={{margin:0,fontSize:11,color:C.textMuted}}>{site.wpUrl}</p>
              </div>
              <span style={{color:C.textFaint,fontSize:16}}>→</span>
            </button>
          ))}
        </div>
        <Btn variant="outline" onClick={onManage} style={{width:"100%",justifyContent:"center",height:36,fontSize:12}}>+ Ajouter un nouveau site</Btn>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("pipeline");
  const [subject,setSubject]=useState("");
  const [keyword,setKeyword]=useState("");
  const [wordCount,setWordCount]=useState(1500);
  const [instructions,setInstructions]=useState(DEFAULT_INSTRUCTIONS);
  const [showInstructions,setShowInstructions]=useState(false);
  const [activeInstrTab,setActiveInstrTab]=useState(STEPS[0].id);
  const [sites,setSites]=useState([]);
  const [activeSite,setActiveSite]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [showSelector,setShowSelector]=useState(false);
  const [results,setResults]=useState({});
  const [stepStatus,setStepStatus]=useState({});
  const [running,setRunning]=useState(false);
  const [wpStatus,setWpStatus]=useState(null);
  const [wpResult,setWpResult]=useState(null);
  const [expandedStep,setExpandedStep]=useState(null);
  const [queue,setQueue]=useState([]);
  const [qForm,setQForm]=useState({subject:"",keyword:"",wordCount:1500,date:""});
  const [editingQIdx,setEditingQIdx]=useState(null);
  const abortRef=useRef(false);

  useEffect(()=>{
    const s=loadLS(SITES_KEY,[]);const instr=loadLS(INSTR_KEY,DEFAULT_INSTRUCTIONS);const q=loadLS(QUEUE_KEY,[]);
    setSites(s);setInstructions(instr);setQueue(q);
    if(s.length===1)setActiveSite(s[0]);else if(s.length>1)setShowSelector(true);
  },[]);

  const saveInstr=(u)=>{setInstructions(u);saveLS(INSTR_KEY,u);};
  const handleSiteSave=(u)=>{setSites(u);saveLS(SITES_KEY,u);if(!activeSite&&u.length>0)setActiveSite(u[0]);};
  const handleSiteSelect=(s)=>{setActiveSite(s);setShowModal(false);setShowSelector(false);};
  const handleSiteDelete=(u)=>{setSites(u);saveLS(SITES_KEY,u);if(activeSite&&!u.find(s=>s.name===activeSite.name))setActiveSite(u[0]||null);};

  const isReady=subject.trim()&&keyword.trim()&&activeSite;
  const isDone=stepStatus["article"]==="done";
  const completedCount=STEPS.filter(s=>stepStatus[s.id]==="done").length;
  const setStatus=(id,s)=>setStepStatus(prev=>({...prev,[id]:s}));

  async function runPipelineFor(subj,kw,wc,site,autoPublish=false){
    abortRef.current=false;setRunning(true);setResults({});setStepStatus({});setWpStatus(null);setWpResult(null);
    const acc={};const siteName=site?.name||"mon site";const profile=site?.editorial||DEFAULT_PROFILE;
    const cfgs=[
      {id:"intention",tokens:2000,build:()=>PROMPTS.intention(subj,kw,siteName,wc,instructions.intention||"")},
      {id:"competitors",tokens:3000,build:()=>PROMPTS.competitors(subj,kw,siteName,wc,instructions.competitors||"")},
      {id:"longtail",tokens:2500,build:()=>PROMPTS.longtail(subj,kw,siteName,wc,instructions.longtail||"")},
      {id:"article",tokens:6500,build:()=>buildArticlePrompt(subj,kw,siteName,wc,instructions.article||"",acc,profile)},
    ];
    try{
      for(const cfg of cfgs){
        if(abortRef.current)break;setStatus(cfg.id,"running");
        try{const data=await callClaude(cfg.build(),cfg.tokens);acc[cfg.id]=data;setResults(prev=>({...prev,[cfg.id]:data}));setStatus(cfg.id,"done");}
        catch(e){setStatus(cfg.id,"error");acc[cfg.id]={error:e.message};setResults(prev=>({...prev,[cfg.id]:{error:e.message}}));}
      }
      if(autoPublish&&acc.article&&!acc.article.error&&site){
        setWpStatus("publishing");
        try{const r=await publishToWordPress(site,acc.article);setWpResult(r);setWpStatus("published");}
        catch(e){setWpStatus("error_wp");setWpResult({error:e.message});}
      }
    }finally{setRunning(false);}
  }

  const handleRunPipeline=async()=>{if(!isReady)return;setTab("pipeline");await runPipelineFor(subject,keyword,wordCount,activeSite,true);};

  async function handleRunFromQueue(idx){
    const item=queue[idx];const site=activeSite;if(!site)return;
    setSubject(item.subject);setKeyword(item.keyword);setWordCount(item.wordCount||1500);setTab("pipeline");
    const updQ=queue.map((q,i)=>i===idx?{...q,status:"running"}:q);setQueue(updQ);saveLS(QUEUE_KEY,updQ);
    await runPipelineFor(item.subject,item.keyword,item.wordCount||1500,site,true);
    setQueue(prev=>{const u=prev.filter((_,i)=>i!==idx);saveLS(QUEUE_KEY,u);return u;});
  }

  function sortQueue(q){return[...q].sort((a,b)=>{if(a.date&&b.date)return new Date(b.date)-new Date(a.date);if(a.date&&!b.date)return-1;if(!a.date&&b.date)return 1;return 0;});}

  function addToQueue(){
    if(!qForm.subject||!qForm.keyword)return;
    if(editingQIdx!==null){
      const u=queue.map((q,i)=>i===editingQIdx?{...q,...qForm}:q);
      const s=sortQueue(u);setQueue(s);saveLS(QUEUE_KEY,s);setEditingQIdx(null);
    }else{
      const entry={...qForm,id:Date.now(),status:"queued",createdAt:new Date().toLocaleDateString("fr-FR")};
      const s=sortQueue([...queue,entry]);setQueue(s);saveLS(QUEUE_KEY,s);
    }
    setQForm({subject:"",keyword:"",wordCount:1500,date:""});
  }

  function startEditQueue(idx){const item=queue[idx];setQForm({subject:item.subject,keyword:item.keyword,wordCount:item.wordCount||1500,date:item.date||""});setEditingQIdx(idx);}
  function removeFromQueue(idx){const u=queue.filter((_,i)=>i!==idx);setQueue(u);saveLS(QUEUE_KEY,u);}

  const queueForSite=queue.filter(q=>!q.siteId||q.siteId===activeSite?.name);
  const pendingCount=queueForSite.filter(q=>q.status==="queued").length;

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:'"Inter",-apple-system,BlinkMacSystemFont,sans-serif'}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box}
        @keyframes rspin{to{transform:rotate(360deg)}}
        @keyframes rfadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes rslide{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}
        @keyframes rpulse{0%,100%{opacity:1}50%{opacity:0.5}}
        input:focus,textarea:focus{outline:none}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:99px}
        .rstep:hover .rstepcaret{opacity:1!important}
      `}</style>

      {showSelector&&sites.length>0&&!showModal&&<SiteSelector sites={sites} onSelect={handleSiteSelect} onManage={()=>{setShowSelector(false);setShowModal(true);}}/>}
      {showModal&&<SiteModal sites={sites} onSave={handleSiteSave} onSelect={handleSiteSelect} onDelete={handleSiteDelete} onClose={()=>setShowModal(false)}/>}

      {/* HEADER */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:800,margin:"0 auto",padding:"0 1.5rem",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:C.radiusSm,background:C.text,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:C.yellow,fontSize:16,fontWeight:800,fontFamily:"'Sora',sans-serif"}}>R</span>
            </div>
            <div>
              <span style={{fontSize:15,fontWeight:800,color:C.text,fontFamily:"'Sora',sans-serif",letterSpacing:"-0.02em"}}>ReferenSEO</span>
              <span style={{fontSize:11,color:C.textFaint,marginLeft:6,fontWeight:500}}>/ Pipeline SEO</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {activeSite?(
              <button onClick={()=>setShowSelector(true)} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:C.radiusSm,cursor:"pointer",fontSize:12,fontWeight:600,color:C.text,fontFamily:"inherit",transition:"all 0.15s"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:C.green,display:"inline-block",flexShrink:0}}/>
                {activeSite.name}
                <span style={{color:C.textFaint,fontSize:10}}>▾</span>
              </button>
            ):(
              <Btn variant="yellow" onClick={()=>setShowModal(true)} style={{height:34,fontSize:12}}>+ Ajouter un site</Btn>
            )}
            <Btn variant="ghost" onClick={()=>setShowModal(true)} style={{height:34,fontSize:12,color:C.textMuted}}>⚙ Sites</Btn>
          </div>
        </div>
      </div>

      {/* NAV TABS */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:800,margin:"0 auto",padding:"0 1.5rem",display:"flex",gap:0}}>
          {[
            {id:"pipeline",label:"✍️ Générer un article"},
            {id:"queue",label:`📅 Calendrier éditorial`,count:pendingCount},
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"0 16px",height:46,border:"none",background:"none",cursor:"pointer",fontSize:13,fontWeight:tab===t.id?700:500,color:tab===t.id?C.text:C.textMuted,borderBottom:tab===t.id?`2.5px solid ${C.yellow}`:"2.5px solid transparent",transition:"all 0.15s",fontFamily:"inherit",marginBottom:-1}}>
              {t.label}
              {t.count>0&&<span style={{background:C.yellow,color:C.text,borderRadius:99,padding:"1px 7px",fontSize:10,fontWeight:700,minWidth:18,textAlign:"center"}}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{maxWidth:800,margin:"0 auto",padding:"1.5rem"}}>

        {/* PIPELINE TAB */}
        {tab==="pipeline"&&(
          <>
            {/* FORM CARD */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:C.radiusLg,padding:"1.5rem",marginBottom:"1rem",boxShadow:C.shadow}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                <Inp label="Sujet de l'article" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="ex: Comment créer un business en ligne" disabled={running}/>
                <Inp label="Mot-clé principal" value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="ex: business en ligne" disabled={running}/>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <label style={{fontSize:11,fontWeight:700,color:C.textMuted,letterSpacing:"0.04em",textTransform:"uppercase"}}>Longueur de l'article</label>
                  <span style={{fontSize:14,fontWeight:700,color:C.text,background:C.yellowLight,padding:"2px 10px",borderRadius:99,border:`1px solid ${C.yellow}`}}>{wordCount} mots</span>
                </div>
                <input type="range" min={800} max={3000} step={100} value={wordCount} onChange={e=>setWordCount(Number(e.target.value))} disabled={running} style={{width:"100%",accentColor:C.yellow,height:4,cursor:"pointer"}}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.textFaint,marginTop:4,fontWeight:500}}>
                  <span>800 · Court</span><span>1 500 · Standard</span><span>3 000 · Long</span>
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <button onClick={()=>setShowInstructions(!showInstructions)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:`1px solid ${C.border}`,borderRadius:C.radiusSm,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:500,color:C.textMuted,fontFamily:"inherit",transition:"all 0.15s"}}>
                  <span style={{fontSize:10,transition:"transform 0.15s",display:"inline-block",transform:showInstructions?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
                  Consignes par étape
                </button>
                {showInstructions&&(
                  <div style={{marginTop:10,background:C.bg,borderRadius:C.radius,border:`1px solid ${C.border}`,padding:"1rem",animation:"rfadeIn 0.2s ease"}}>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                      {STEPS.map(step=>(
                        <button key={step.id} onClick={()=>setActiveInstrTab(step.id)} style={{padding:"5px 12px",border:`1.5px solid ${activeInstrTab===step.id?C.yellow:C.border}`,borderRadius:C.radiusSm,cursor:"pointer",fontSize:12,fontWeight:activeInstrTab===step.id?700:500,background:activeInstrTab===step.id?C.yellowLight:C.card,color:activeInstrTab===step.id?C.yellowDark:C.textMuted,transition:"all 0.15s",fontFamily:"inherit"}}>
                          {step.icon} {step.label}
                        </button>
                      ))}
                    </div>
                    {STEPS.map(step=>activeInstrTab===step.id&&(
                      <textarea key={step.id} value={instructions[step.id]||""} onChange={e=>saveInstr({...instructions,[step.id]:e.target.value})} placeholder={`Consignes spécifiques pour "${step.label}"…`} rows={3} style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:C.radiusSm,padding:"10px 12px",fontSize:12,background:C.card,color:C.text,resize:"vertical",fontFamily:"inherit",outline:"none"}}/>
                    ))}
                  </div>
                )}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Btn variant="primary" onClick={handleRunPipeline} disabled={!isReady||running} style={{height:42,fontSize:14,padding:"0 24px"}}>
                  {running?<><Spinner/> En cours…</>:<>▶ Lancer le pipeline</>}
                </Btn>
                {running&&<Btn variant="outline" onClick={()=>{abortRef.current=true;setRunning(false);}} style={{height:42,fontSize:12,color:C.red,borderColor:C.red}}>Arrêter</Btn>}
                {!running&&completedCount>0&&<span style={{fontSize:12,color:C.textMuted,fontWeight:500}}>{completedCount}/{STEPS.length} étapes terminées</span>}
              </div>
            </div>

            {/* PROGRESS BAR */}
            {(running||completedCount>0)&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:C.radius,padding:"12px 16px",marginBottom:"1rem",boxShadow:C.shadow}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:600,color:C.text}}>Progression</span>
                  <span style={{fontSize:12,color:C.textMuted}}>{Math.round((completedCount/STEPS.length)*100)}%</span>
                </div>
                <div style={{height:6,background:C.bg,borderRadius:99,overflow:"hidden",border:`1px solid ${C.border}`}}>
                  <div style={{height:"100%",width:`${(completedCount/STEPS.length)*100}%`,background:`linear-gradient(90deg,${C.yellow},${C.yellowDark})`,borderRadius:99,transition:"width 0.6s cubic-bezier(0.4,0,0.2,1)"}}/>
                </div>
                <div style={{display:"flex",gap:4,marginTop:10}}>
                  {STEPS.map((step,i)=>{
                    const st=stepStatus[step.id]||"idle";
                    return(
                      <div key={step.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:st==="done"?C.yellow:st==="running"?C.yellowLight:st==="error"?C.redLight:C.bg,border:`2px solid ${st==="done"?C.yellowDark:st==="running"?C.yellow:st==="error"?C.red:C.border}`,transition:"all 0.3s",fontSize:12}}>
                          {st==="done"?"✓":st==="running"?<Spinner/>:st==="error"?"!":i+1}
                        </div>
                        <span style={{fontSize:9,fontWeight:600,color:st==="done"?C.yellowDark:C.textFaint,textAlign:"center",letterSpacing:"0.02em"}}>{step.label.split(" ")[0].toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP CARDS */}
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:"1rem"}}>
              {STEPS.map((step,i)=>{
                const status=stepStatus[step.id]||"idle";
                const data=results[step.id];
                const isExp=expandedStep===step.id;
                const isDoneStep=status==="done";
                return(
                  <div key={step.id} className="rstep" style={{background:C.card,border:`1px solid ${isDoneStep?C.yellow+"44":C.border}`,borderRadius:C.radius,overflow:"hidden",boxShadow:isDoneStep?`0 0 0 1px ${C.yellow+"33"},${C.shadow}`:C.shadow,transition:"all 0.3s",animation:isDoneStep?"rfadeIn 0.3s ease":"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:data&&!data.error?"pointer":"default"}} onClick={()=>data&&!data.error&&setExpandedStep(isExp?null:step.id)}>
                      <div style={{width:36,height:36,borderRadius:C.radiusSm,background:status==="done"?C.yellowLight:status==="running"?C.bg:C.bg,border:`1.5px solid ${status==="done"?C.yellow:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0,transition:"all 0.3s"}}>
                        {status==="done"?"✓":status==="running"?<Spinner/>:step.icon}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{margin:0,fontSize:13,fontWeight:700,color:C.text}}>{i+1}. {step.label}</p>
                        <p style={{margin:0,fontSize:11,color:C.textMuted,marginTop:1}}>{step.desc}</p>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {data?.error&&<span style={{fontSize:11,color:C.red,fontWeight:500}} title={data.error}>⚠ {data.error.slice(0,35)}</span>}
                        <Pill status={status}/>
                        {data&&!data.error&&<span className="rstepcaret" style={{color:C.textFaint,fontSize:11,opacity:isExp?1:0.3,transition:"opacity 0.15s"}}>{isExp?"▲":"▼"}</span>}
                      </div>
                    </div>

                    {isExp&&data&&!data.error&&(
                      <div style={{borderTop:`1px solid ${C.border}`,padding:"14px 16px",background:C.bg,animation:"rfadeIn 0.2s ease"}}>
                        {step.id==="intention"&&(
                          <div style={{display:"flex",flexDirection:"column",gap:10}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                              {[{l:"Intention",v:data.intention_type},{l:"Angle",v:data.angle_differenciant}].map(({l,v})=>(
                                <div key={l} style={{background:C.card,borderRadius:C.radiusSm,padding:"10px 12px",border:`1px solid ${C.border}`}}>
                                  <p style={{margin:0,fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>{l}</p>
                                  <p style={{margin:0,fontSize:12,fontWeight:500,color:C.text}}>{v}</p>
                                </div>
                              ))}
                            </div>
                            <p style={{margin:0,fontSize:12,color:C.textMuted,lineHeight:1.6,padding:"10px 12px",background:C.card,borderRadius:C.radiusSm,border:`1px solid ${C.border}`}}>{data.resume_strategie}</p>
                          </div>
                        )}
                        {step.id==="competitors"&&(
                          <div style={{display:"flex",flexDirection:"column",gap:10}}>
                            <p style={{margin:0,fontSize:12,color:C.text,lineHeight:1.6,fontStyle:"italic"}}>{data.recommandation}</p>
                            <div>
                              <p style={{margin:"0 0 6px",fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Requêtes conversationnelles</p>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {(data.requetes_conversationnelles||[]).slice(0,9).map((r,j)=><span key={j} style={{fontSize:11,padding:"3px 9px",background:C.card,border:`1px solid ${C.border}`,borderRadius:99,color:C.textMuted,fontWeight:500}}>{r}</span>)}
                              </div>
                            </div>
                            {(data.content_gaps||[]).length>0&&(
                              <div>
                                <p style={{margin:"0 0 6px",fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Content gaps</p>
                                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                  {data.content_gaps.slice(0,5).map((g,j)=><span key={j} style={{fontSize:11,padding:"3px 9px",background:C.yellowLight,border:`1px solid ${C.yellow}`,borderRadius:99,color:C.yellowDark,fontWeight:600}}>{g}</span>)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {step.id==="longtail"&&(
                          <div style={{display:"flex",flexDirection:"column",gap:10}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                              <div style={{background:C.card,borderRadius:C.radiusSm,padding:"10px 14px",border:`1.5px solid ${C.yellow}`}}>
                                <p style={{margin:0,fontSize:10,fontWeight:700,color:C.yellowDark,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>Mot-clé principal</p>
                                <p style={{margin:0,fontSize:14,fontWeight:700,color:C.text}}>{data.mot_cle_principal}</p>
                              </div>
                              <div style={{background:C.card,borderRadius:C.radiusSm,padding:"10px 14px",border:`1px solid ${C.border}`}}>
                                <p style={{margin:0,fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>Angle éditorial</p>
                                <p style={{margin:0,fontSize:13,fontWeight:600,color:C.text}}>{data.angle_editorial}</p>
                              </div>
                            </div>
                            <div>
                              <p style={{margin:"0 0 6px",fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Mots-clés secondaires</p>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {(data.mots_cles_secondaires||[]).map((m,j)=><span key={j} style={{fontSize:12,padding:"4px 11px",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:99,color:C.text,fontWeight:500}}>{m}</span>)}
                              </div>
                            </div>
                            <p style={{margin:0,fontSize:11,color:C.textMuted,fontStyle:"italic"}}>{data.justification_angle}</p>
                          </div>
                        )}
                        {step.id==="article"&&(
                          <div style={{display:"flex",flexDirection:"column",gap:10}}>
                            {data.hook_verite&&(
                              <div style={{background:C.yellowLight,borderRadius:C.radius,padding:"12px 16px",borderLeft:`4px solid ${C.yellow}`}}>
                                <p style={{margin:"0 0 3px",fontSize:10,fontWeight:700,color:C.yellowDark,textTransform:"uppercase",letterSpacing:"0.06em"}}>Hook vérité</p>
                                <p style={{margin:0,fontSize:13,fontStyle:"italic",color:C.text,fontWeight:500,lineHeight:1.5}}>"{data.hook_verite}"</p>
                              </div>
                            )}
                            {data.promesse_article&&<p style={{margin:0,fontSize:12,color:C.text,borderLeft:`3px solid ${C.border}`,paddingLeft:10,lineHeight:1.6}}><strong>Promesse :</strong> {data.promesse_article}</p>}
                            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                              {[{l:"Mots",v:data.word_count},{l:"Lecture",v:`${data.reading_time_minutes} min`},{l:"Score SEO",v:`${data.seo_score_estimate}/100`},{l:"Angle",v:data.angle_final}].map(m=>(
                                <div key={m.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:C.radiusSm,padding:"8px 10px",textAlign:"center"}}>
                                  <p style={{margin:0,fontSize:13,fontWeight:700,color:C.text}}>{m.v}</p>
                                  <p style={{margin:0,fontSize:10,color:C.textMuted,fontWeight:500,marginTop:1}}>{m.l}</p>
                                </div>
                              ))}
                            </div>
                            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:C.radiusSm,padding:"10px 12px"}}>
                              <p style={{margin:"0 0 3px",fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Métadonnées</p>
                              <p style={{margin:"0 0 2px",fontSize:12,color:C.text}}><strong>Titre WP :</strong> {data.wp_title}</p>
                              <p style={{margin:"0 0 2px",fontSize:12,color:C.text}}><strong>Meta title :</strong> {data.meta_title}</p>
                              <p style={{margin:0,fontSize:12,color:C.textMuted}}><strong>Meta desc :</strong> {data.meta_description}</p>
                            </div>
                            {(data.moments_signature_utilises||[]).length>0&&(
                              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:C.radiusSm,padding:"10px 12px"}}>
                                <p style={{margin:"0 0 6px",fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Moments signature ({data.moments_signature_utilises.length})</p>
                                {data.moments_signature_utilises.map((m,j)=><p key={j} style={{margin:"2px 0 0",fontSize:11,color:C.textMuted}}>▸ {m}</p>)}
                              </div>
                            )}
                            {(data.auto_correction_log||[]).length>0&&(
                              <div style={{background:C.greenLight,border:`1px solid #A7F3D0`,borderRadius:C.radiusSm,padding:"10px 12px"}}>
                                <p style={{margin:"0 0 6px",fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:"0.06em"}}>Auto-correction ({data.auto_correction_log.length} vérifications)</p>
                                {data.auto_correction_log.map((l,j)=><p key={j} style={{margin:"2px 0 0",fontSize:11,color:C.green}}>✓ {l}</p>)}
                              </div>
                            )}
                            {(data.ancres_maillage||[]).length>0&&(
                              <div>
                                <p style={{margin:"0 0 5px",fontSize:10,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Maillage interne</p>
                                {data.ancres_maillage.map((a,j)=><p key={j} style={{margin:"2px 0 0",fontSize:11,color:C.textMuted}}>→ "{a.ancre}" → {a.sujet_cible}</p>)}
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

            {/* PUBLISH STEP */}
            <div style={{background:C.card,border:`1px solid ${isDone?C.yellow+"66":C.border}`,borderRadius:C.radius,overflow:"hidden",boxShadow:C.shadow,opacity:isDone?1:0.5,transition:"all 0.4s"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px"}}>
                <div style={{width:36,height:36,borderRadius:C.radiusSm,background:wpStatus==="published"?C.yellowLight:C.bg,border:`1.5px solid ${wpStatus==="published"?C.yellow:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>
                  {wpStatus==="published"?"✓":wpStatus==="publishing"?<Spinner/>:"🚀"}
                </div>
                <div style={{flex:1}}>
                  <p style={{margin:0,fontSize:13,fontWeight:700,color:C.text}}>5. Publication WordPress</p>
                  <p style={{margin:0,fontSize:11,color:C.textMuted,marginTop:1}}>Publication automatique en brouillon</p>
                </div>
                {wpStatus==="published"&&<Pill status="published"/>}
                {wpStatus==="publishing"&&<Pill status="running"/>}
                {(wpStatus==="error_wp"||wpStatus==="no_site")&&<Pill status="error"/>}
              </div>
              {isDone&&(
                <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 16px",background:C.bg,display:"flex",flexDirection:"column",gap:10}}>
                  {wpStatus==="publishing"&&(
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <Spinner/><span style={{fontSize:12,color:C.textMuted}}>Publication sur {activeSite?.name}…</span>
                    </div>
                  )}
                  {wpStatus==="published"&&wpResult&&(
                    <div style={{background:C.greenLight,border:`1px solid #A7F3D0`,borderRadius:C.radius,padding:"12px 16px",animation:"rfadeIn 0.3s ease"}}>
                      <p style={{margin:0,fontSize:13,fontWeight:700,color:C.green}}>✓ Brouillon publié sur {activeSite?.name} !</p>
                      <p style={{margin:"4px 0 0",fontSize:12,color:C.green}}>Article #{wpResult.id} — <a href={wpResult.link} target="_blank" rel="noopener" style={{color:C.green,fontWeight:600}}>Voir dans WordPress ↗</a></p>
                    </div>
                  )}
                  {(wpStatus==="error_wp"||wpStatus==="no_site")&&(
                    <div style={{background:C.redLight,border:`1px solid #FECACA`,borderRadius:C.radius,padding:"12px 16px"}}>
                      <p style={{margin:0,fontSize:13,color:C.red,fontWeight:600}}>{wpStatus==="no_site"?"Aucun site configuré.":wpResult?.error}</p>
                    </div>
                  )}
                  <Btn variant="outline" onClick={()=>{const html=results["article"]?.html_content||"";const b=new Blob([html],{type:"text/html"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`article-${keyword.replace(/\s+/g,"-")}.html`;a.click();}} style={{alignSelf:"flex-start",height:34,fontSize:12}}>
                    ⬇ Télécharger HTML
                  </Btn>
                </div>
              )}
            </div>
          </>
        )}

        {/* QUEUE TAB */}
        {tab==="queue"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            {!activeSite&&(
              <div style={{background:"#FEF3C7",border:`1px solid ${C.yellow}`,borderRadius:C.radius,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>⚠️</span>
                <p style={{margin:0,fontSize:13,color:"#92400E",fontWeight:500}}>Sélectionne un site en haut pour accéder à son calendrier éditorial.</p>
              </div>
            )}
            {activeSite&&(
              <>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:C.radiusLg,padding:"1.25rem 1.5rem",boxShadow:C.shadow}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1rem"}}>
                    <div style={{width:28,height:28,borderRadius:C.radiusSm,background:C.yellowLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📝</div>
                    <p style={{margin:0,fontSize:14,fontWeight:700,color:C.text}}>{editingQIdx!==null?"Modifier l'article":"Planifier un article"}<span style={{fontSize:12,fontWeight:400,color:C.textMuted,marginLeft:6}}>— {activeSite.name}</span></p>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                    <Inp label="Sujet" style={{gridColumn:"1/-1"}} value={qForm.subject} onChange={e=>setQForm({...qForm,subject:e.target.value})} placeholder="ex: Comment créer un business en ligne"/>
                    <Inp label="Mot-clé principal" value={qForm.keyword} onChange={e=>setQForm({...qForm,keyword:e.target.value})} placeholder="ex: business en ligne"/>
                    <Inp label="Date de publication" hint="(optionnel)" type="date" value={qForm.date} onChange={e=>setQForm({...qForm,date:e.target.value})}/>
                    <Inp label="Longueur cible" type="number" min={800} max={3000} step={100} value={qForm.wordCount} onChange={e=>setQForm({...qForm,wordCount:Number(e.target.value)})} placeholder="1500"/>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <Btn variant="yellow" onClick={addToQueue} disabled={!qForm.subject||!qForm.keyword}>{editingQIdx!==null?"✓ Enregistrer":"+ Planifier cet article"}</Btn>
                    {editingQIdx!==null&&<Btn variant="outline" onClick={()=>{setEditingQIdx(null);setQForm({subject:"",keyword:"",wordCount:1500,date:""});}}>Annuler</Btn>}
                  </div>
                </div>

                {queueForSite.length===0?(
                  <div style={{textAlign:"center",padding:"3rem 1rem",background:C.card,border:`1px dashed ${C.border}`,borderRadius:C.radiusLg}}>
                    <p style={{fontSize:32,marginBottom:8}}>📅</p>
                    <p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>Aucun article planifié</p>
                    <p style={{margin:"4px 0 0",fontSize:12,color:C.textMuted}}>Ajoute des articles pour construire ton calendrier éditorial</p>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {queueForSite.map(item=>{
                      const realIdx=queue.findIndex(q=>q.id===item.id);
                      const dateObj=item.date?new Date(item.date):null;
                      return(
                        <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:C.card,border:`1px solid ${C.border}`,borderRadius:C.radius,boxShadow:C.shadow,transition:"all 0.15s"}}>
                          {dateObj?(
                            <div style={{textAlign:"center",minWidth:46,background:C.yellowLight,borderRadius:C.radiusSm,padding:"6px 8px",border:`1.5px solid ${C.yellow}`,flexShrink:0}}>
                              <p style={{margin:0,fontSize:9,fontWeight:800,color:C.yellowDark,letterSpacing:"0.08em"}}>{dateObj.toLocaleDateString("fr-FR",{month:"short"}).toUpperCase()}</p>
                              <p style={{margin:0,fontSize:20,fontWeight:800,color:C.text,lineHeight:1.1}}>{dateObj.getDate()}</p>
                            </div>
                          ):(
                            <div style={{textAlign:"center",minWidth:46,background:C.bg,borderRadius:C.radiusSm,padding:"6px 8px",border:`1.5px dashed ${C.border}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <span style={{fontSize:16,color:C.textFaint}}>—</span>
                            </div>
                          )}
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{margin:0,fontSize:13,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.subject}</p>
                            <p style={{margin:"2px 0 0",fontSize:11,color:C.textMuted}}>{item.keyword} · {item.wordCount||1500} mots{!item.date?" · sans date":""}</p>
                          </div>
                          <Pill status={item.status==="running"?"running":"queued"}/>
                          {item.status==="queued"&&editingQIdx!==realIdx&&(
                            <Btn variant="ghost" onClick={()=>startEditQueue(realIdx)} style={{height:30,fontSize:13,padding:"0 8px"}}>✎</Btn>
                          )}
                          {item.status==="queued"&&(
                            <Btn variant="primary" onClick={()=>handleRunFromQueue(realIdx)} disabled={running} style={{height:32,fontSize:12,padding:"0 14px"}}>▶ Générer</Btn>
                          )}
                          <Btn variant="danger" onClick={()=>removeFromQueue(realIdx)} style={{height:30,fontSize:12,padding:"0 8px"}}>✕</Btn>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
