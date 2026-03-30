import { useState, useRef, useEffect } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:"#FAFAF8",card:"#FFFFFF",border:"#E8E6E0",borderHover:"#D0CEC8",
  text:"#0F0F0E",textMuted:"#6B6860",textFaint:"#A8A49E",
  yellow:"#F3C05D",yellowLight:"#FEF3D0",yellowDark:"#C8950A",
  green:"#16A34A",greenLight:"#DCFCE7",red:"#DC2626",redLight:"#FEE2E2",
  purple:"#7C3AED",purpleLight:"#EDE9FE",blue:"#2563EB",blueLight:"#EFF6FF",
  shadow:"0 1px 3px rgba(15,15,14,0.08),0 1px 2px rgba(15,15,14,0.04)",
  shadowMd:"0 4px 12px rgba(15,15,14,0.10),0 2px 4px rgba(15,15,14,0.06)",
  shadowLg:"0 20px 48px rgba(15,15,14,0.14),0 8px 16px rgba(15,15,14,0.08)",
  radius:"10px",radiusSm:"6px",radiusLg:"14px",
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CURRENT_YEAR = 2026;
const LESMAKERS_SITE = "lesmakers.fr";
const IMAGE_PALETTE = ["#abcee3","#f3c05d","#dd6b76","#ed948f","#ce9aca"];

const ARTICLE_TYPES_LESMAKERS = [
  {id:"article_simple",  label:"Article simple",   icon:"📝", desc:"SEO classique, utile, naturel"},
  {id:"comparatif",      label:"Comparatif",        icon:"⚖️",  desc:"Intention d'achat, clics affiliés"},
  {id:"liste",           label:"Liste / Top X",     icon:"📋", desc:"Sélection qualitative d'outils"},
  {id:"review",          label:"Review",            icon:"⭐", desc:"Avis complet, aide à la décision"},
  {id:"versus",          label:"Versus",            icon:"🥊", desc:"Comparaison 2 outils, gagnant clair"},
  {id:"guide",           label:"Guide complet",     icon:"🗺️",  desc:"Référence longue, forte valeur"},
  {id:"statistiques",    label:"Statistiques",      icon:"📊", desc:"Chiffres, backlinks, référence"},
  {id:"vente_liens",     label:"Vente de liens",    icon:"🔗", desc:"Intégration naturelle de liens sponsorisés"},
];

const ARTICLE_TYPES_STANDARD = [
  {id:"article_simple",  label:"Article simple",   icon:"📝", desc:"SEO classique, bien structuré"},
  {id:"vente_liens",     label:"Vente de liens",    icon:"🔗", desc:"Liens sponsorisés intégrés naturellement"},
];

// ─── BRIEFS ───────────────────────────────────────────────────────────────────
const BRIEFS = {
  article_simple: `TYPE: article simple
OBJECTIF: Créer un article SEO classique, utile, naturel, bien structuré.
STRUCTURE: Hook → Introduction → Bloc réponse rapide → Développement en H2 naturels → FAQ si utile → Conclusion + CTA
RÈGLES: ton direct, humain, concret. Pas de keyword stuffing. Au moins 1 exemple ou donnée concrète par grande section.
INTERDIT: contenu générique, titres sur-optimisés, phrases artificielles.`,

  comparatif: `TYPE: comparatif
OBJECTIF: Article comparatif à forte intention d'achat. Aider le lecteur à choisir rapidement, générer des clics affiliés.
STRUCTURE:
1. Encart #1 AVANT l'introduction: "📢 Trop occupé pour tout lire ? Voici le meilleur [catégorie] : → 1 outil recommandé → bénéfice clair → CTA"
2. Introduction: contextualiser, expliquer qu'on a sélectionné les meilleures options.
3. Encart #2 APRÈS l'introduction: "🕰️ Pas le temps de tout lire ? Voici les meilleurs [catégorie] : → 3 à 7 outils max → 1 ligne par outil avec bénéfice clé"
4. Corps: regrouper par catégories si pertinent. Structure uniforme par outil:
   CAS outil/saas: Présentation | Fonctionnalités | Tarifs | Avantages | Inconvénients
   CAS affiliation: Présentation | Commission | Revenue share | Durée cookie | Disponibilité | Avantages | Inconvénients
   CAS formation: Présentation | À qui ça s'adresse | Ce qu'on a apprécié | Avantages | Inconvénients
5. Conclusion: aider à choisir selon profil, rappeler meilleurs choix, orienter vers l'action.
RÈGLES: chaque outil avec angle clair, titres différenciants, structure identique pour tous.
INTERDIT: lister sans analyser, titres génériques, structures différentes, contenu vague.
CHECK FINAL: encart avant intro ✓ résumé après intro ✓ structure uniforme ✓ aide réelle au choix ✓`,

  liste: `TYPE: liste / top X
OBJECTIF: Article top X avec sélection qualitative. Informer, proposer sélection utile, générer clics naturellement.
STRUCTURE:
1. Hook + positionnement: expliquer qu'on évite les listes inutiles, sélection réduite mais qualitative.
2. Introduction: contextualiser, expliquer comment la sélection a été faite.
3. Corps: regrouper par catégories si pertinent. Structure uniforme par item:
   H3: [Nom] : [positionnement différenciant]
   Présentation | Spécificité/pour qui | Avantages/points forts | Inconvénients/points faibles
4. Conclusion: rappeler meilleurs choix, aider à s'orienter, recommander 1-2 options si pertinent.
RÈGLES: qualité > quantité. Chaque outil expliqué, différencié et utile. Répondre à: quel outil est fait pour moi?
INTERDIT: liste brute, titres génériques, descriptions superficielles, effet liste de courses.
CHECK FINAL: sélection réduite et qualitative ✓ outils bien différenciés ✓ structure identique ✓`,

  review: `TYPE: review
OBJECTIF: Review complète permettant de prendre une décision d'achat. Convertir lecteur chaud, générer clics affiliés.
STRUCTURE:
1. Bloc "Résultat de notre test" AVANT l'introduction: note sur 5 | résumé 1-2 phrases | positionnement clair
   → Générer le composant review_header avec: nom_outil, note (X/5), resume (1-2 phrases), lien_affilie, logo_url (clearbit)
2. Introduction
3. Résumé rapide APRÈS introduction: "🕰️ Pas le temps de tout lire ? → 5 à 7 points clés"
4. Corps: Présentation | À qui s'adresse [outil] ? | Fonctionnalités clés | Tarifs | Avis utilisateurs/preuve sociale | Avantages et inconvénients | Notre avis | Alternatives | Comment utiliser [outil] ? (étapes H3)
5. Conclusion
RÈGLES: ton crédible, honnête, nuancé, orienté décision. Répondre à: est-ce que ça vaut le coup?
INTERDIT: ton trop promotionnel, contenu vague, copier site officiel, lister fonctionnalités sans explication.
CHECK FINAL: note présente ✓ résumé rapide ✓ preuve sociale ✓ verdict clair ✓ guide d'utilisation ✓`,

  versus: `TYPE: versus
OBJECTIF: Comparatif entre 2 outils pour aider à un choix clair. Capter intention commerciale forte, trancher rapidement.
STRUCTURE:
1. Bloc "Résultat de notre versus" AVANT l'introduction: annoncer le gagnant, expliquer en 2-3 phrases pourquoi.
2. Introduction
3. Présentation rapide des deux outils
4. À qui s'adresse chaque outil ?
5. Fonctionnalités: outil 1 vs outil 2
6. Tarifs: lequel est le plus rentable ?
7. Avantages et inconvénients des deux
8. Verdict final: lequel choisir ?
9. Alternatives si pertinent
10. Conclusion
RÈGLES: ton clair, direct, orienté décision. Éviter toute neutralité. Répondre à: lequel est le meilleur pour moi?
INTERDIT: présenter sans comparer, rester flou, copier descriptions officielles, listes interminables.
CHECK FINAL: gagnant dès le début ✓ vraie comparaison ✓ différences claires ✓ verdict actionnable ✓`,

  guide: `TYPE: guide complet
OBJECTIF: Guide à forte valeur ajoutée, positionné comme référence. Rank sur requêtes informationnelles, asseoir autorité.
STRUCTURE:
1. Hook + promesse
2. Introduction
3. Bloc réponse rapide
4. Corps structuré après analyse stratégique: bases du sujet → compréhension → cœur du guide en étapes → sections complémentaires → FAQ si pertinent
5. Conclusion
RÈGLES: structure logique et progressive. Chaque H2 répond à une intention précise. Style simple, pédagogique, accessible débutant. Chaque sous-partie contient exemple, donnée ou anecdote.
PROCESS SEO: analyser intention → identifier micro-intentions → analyser top 3 concurrents (structure, longueur, images, vidéos).
OBJECTIFS: longueur ≥ moyenne top 3. Nombre images ≥ meilleur concurrent. Vidéos ≤ 3.
INTERDIT: écrire sans plan, titres incohérents, contenu abstrait, jargon inutile, répétitions.
CHECK FINAL: plan cohérent ✓ chaque partie répond à intention ✓ compréhensible débutant ✓ concret partout ✓`,

  statistiques: `TYPE: statistiques
OBJECTIF: Article basé sur données chiffrées. Obtenir backlinks naturels, devenir source de référence, rank requêtes informationnelles.
STRUCTURE:
1. Hook + contexte: introduire importance du sujet, donner 1-2 chiffres marquants.
2. Bloc résumé juste après l'introduction: H2 "Les statistiques et chiffres à retenir sur [mot-clé]" → 9 statistiques minimum → 1 phrase = 1 statistique claire, pas d'explication longue.
3. Corps organisé par thèmes (exemples: nombre d'utilisateurs, croissance, revenus, usage, géographie, marché, créateurs/contenu). Chaque section: H2 très explicite | liste à puces avec chiffres clés | paragraphe explicatif en dessous.
4. Conclusion courte optionnelle.
RÈGLES: H2 ultra explicites. Chaque statistique claire, compréhensible seule et vérifiable. Chiffre d'abord, explication ensuite. Structure > style.
INTERDIT: phrases vagues, sections floues, stats douteuses, texte long sans chiffres, duplication.
CHECK FINAL: 9+ stats clés au début ✓ H2 navigables ✓ chiffres concrets partout ✓ article scannable ✓ potentiel de source ✓`,

  vente_liens: `TYPE: vente de liens
OBJECTIF: Intégrer des liens sponsorisés de manière naturelle. Respecter exigences client, conserver cohérence éditoriale.
STRUCTURE: Utiliser la structure normale d'un article simple, puis appliquer les contraintes spécifiques de vente de liens.
INPUTS: URL cible | ancre exacte ou partielle | emplacement demandé | nombre de liens | consignes de rédaction | paragraphe imposé si nécessaire.
RÈGLES: intégration naturelle, pas de sur-optimisation visible, conserver fluidité du texte, respecter exactement les contraintes fournies.
INTERDIT: ancre forcée et incohérente, ajout qui casse la lecture, optimisation SEO trop évidente.
CHECK FINAL: lien présent ✓ bonne ancre ✓ bon emplacement ✓ intégration naturelle ✓ aucune rupture éditoriale ✓`,
};

// ─── EDITORIAL DEFAULTS ───────────────────────────────────────────────────────
const AUDIENCE = "Personnes qui souhaitent se lancer dans le business en ligne, ou qui sont dans les premières années de leur aventure entrepreneuriale.";
const CTA_DEFAULT = "s'abonner à la newsletter des Makers (lancer et développer son business en ligne)";
const TON_DEFAULT = "Enthousiaste et inspirant. Tutoyer le lecteur. On n'utilise pas le 'je' mais le 'nous' et le 'on'.";
const SIGNATURE_DEFAULT = `SIGNATURE ÉDITORIALE LES MAKERS — NON NÉGOCIABLE
Voix directe, lucide, orientée business. Pas neutre. Pas académique. Écrit par quelqu'un qui pratique.
HOOK VÉRITÉ (1ère phrase): casse une croyance. INTERDIT: "Dans cet article", "Bienvenue".
MOMENTS SIGNATURE (2-4/article): Vérité terrain | Erreur fréquente | Insight business | Test terrain.
PUNCHLINES: 1 par H2 minimum. CTA: bénéfice concret AVANT l'action.
RÈGLES: phrases courtes, concret > théorie, 1 idée/paragraphe. INTERDIT: phrases molles, jargon, ton neutre.`;

const DEFAULT_PROFILE = {
  signature:SIGNATURE_DEFAULT, shortcodeIntro:`[elementor-template id="22062"]`,
  shortcodeConclusion:`[elementor-template id="1148"]`, useYearVars:true,
  snippetBg:"#fdeecd", snippetEnabled:true, cta:CTA_DEFAULT, ton:TON_DEFAULT, geminiKey:"",
};

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const SITES_KEY="seo_pipeline_sites_v7",QUEUE_KEY="seo_pipeline_queue_v7",INSTR_KEY="seo_pipeline_instructions_v3";
const loadLS=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"null")??d}catch{return d}};
const saveLS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const DEFAULT_INSTRUCTIONS={"intention":"","competitors":"","longtail":"","article":""};

// ─── SYSTEM BASE ──────────────────────────────────────────────────────────────
const SYSTEM_BASE=(s)=>`Tu es un expert SEO et rédacteur web francophone spécialisé pour "${s}". Nous sommes en ${CURRENT_YEAR}. Tu réponds UNIQUEMENT en JSON valide, sans backticks, sans commentaires.`;

// ─── ARTICLE PROMPT BUILDER ───────────────────────────────────────────────────
function buildArticlePrompt(s,k,site,wc,instructions,prevData,profile,articleType,linkSaleConfig){
  const cta=profile?.cta||CTA_DEFAULT,ton=profile?.ton||TON_DEFAULT,sig=profile?.signature||"";
  const useYear=profile?.useYearVars!==false,scIntro=profile?.shortcodeIntro||"",scEnd=profile?.shortcodeConclusion||"";
  const snippetBg=profile?.snippetEnabled?(profile?.snippetBg||"#fdeecd"):null;
  const isLM=site.toLowerCase().includes("lesmakers");
  const brief=isLM&&articleType?BRIEFS[articleType]||"":"";
  const yearNote=useYear
    ?"⚠️ RÈGLE ANNÉE: remplacer TOUTE occurrence de l'année (2026, 2025, etc.) par le shortcode [current_date format=Y] — dans le corps, les H2, les H3, partout. Ne jamais écrire un chiffre d'année directement."
    :"Écrire l'année en toutes lettres si nécessaire.";
  const titleNote=useYear
    ?"wp_title: DOIT contenir [current_date format=Y] pour l'année — ex: 'Notion vs Google Sheets : Guide Comparatif [current_date format=Y]'. Le H1 dans html_content doit reprendre ce même titre avec [current_date format=Y]. meta_title: écrire le titre SANS aucune mention d'année (ni chiffre ni variable). meta_description: écrire sans aucune mention d'année (ni chiffre ni variable)."
    :"wp_title, meta_title, meta_description: sans variable d'année.";
  const snippetInstr=snippetBg
    ?`BLOC SNIPPET — utiliser EXACTEMENT ce bloc (ne rien changer à la structure):
<!-- wp:paragraph {"backgroundColor":"","style":{"elements":{"link":{"color":{"text":"var:preset|color|contrast"}}}}} -->
<p class="has-background" style="background-color:${snippetBg};padding:1em 1.2em;border-radius:6px">📌 <strong>Résumé :</strong> [réponse directe 40-60 mots, mot-clé dans les 10 premiers mots]</p>
<!-- /wp:paragraph -->`
    :`BLOC SNIPPET: <!-- wp:paragraph --><p>📌 <strong>Résumé :</strong> [réponse directe 40-60 mots]</p><!-- /wp:paragraph -->`;
  const linkSaleInstr=articleType==="vente_liens"&&linkSaleConfig?`
CONTRAINTES VENTE DE LIENS (PRIORITAIRES):
- URL cible: ${linkSaleConfig.url||"non spécifiée"}
- Ancre: ${linkSaleConfig.anchor||"non spécifiée"}
- Emplacement: ${linkSaleConfig.placement||"naturel dans le corps"}
- Nombre de liens: ${linkSaleConfig.count||1}
- Consignes client: ${linkSaleConfig.notes||"aucune"}
Le lien doit être intégré naturellement. Ancre exacte si spécifiée. Aucune rupture éditoriale.`:"";
  const reviewInstr=articleType==="review"?`
COMPOSANT REVIEW_HEADER (OBLIGATOIRE au début):
Générer dans review_header_data: {"nom_outil":"...","note":0.0,"resume":"...","lien_affilie":"...","logo_url":"https://logo.clearbit.com/[domaine-outil].com"}
Ce composant sera rendu en bloc Gutenberg structuré avant l'introduction.`:"";

  return {
    system:`Tu es le rédacteur éditorial senior de ${site}. ${CURRENT_YEAR}. ${isLM?"Voix directe, lucide, business Les Makers.":"Voix professionnelle et claire."} 3 phases obligatoires. JSON uniquement.`,
    user:`Rédige un article SEO de ${wc} mots sur: "${s}".

CONTEXTE SEO:
- Mot-clé principal: ${prevData?.longtail?.mot_cle_principal||k}
- Secondaires: ${(prevData?.longtail?.mots_cles_secondaires||[]).join(", ")||k}
- Intention: ${prevData?.longtail?.intention_dominante||"informationnelle"}
- Angle: ${prevData?.longtail?.angle_editorial||"guide pratique"}
- Audience: ${AUDIENCE}
- Ton: ${ton}
- CTA: ${cta}
- Requêtes: ${(prevData?.competitors?.requetes_conversationnelles||[]).slice(0,8).join(" / ")}
- Consignes: ${instructions}
${linkSaleInstr}
${reviewInstr}
${brief?`\n════ BRIEF OBLIGATOIRE — TYPE: ${articleType?.toUpperCase()} ════\n${brief}\n════ FIN BRIEF ════`:""}
${sig&&isLM?`\n════ SIGNATURE ÉDITORIALE ════\n${sig}\n════`:""}

PHASE 1 — PRÉPARATION:
mot_cle_principal_final, mots_cles_secondaires_final (5), intention_finale, angle_final, promesse_article, hook_verite${articleType==="review"?", review_header_data":""}

PHASE 2 — RÉDACTION GUTENBERG:
Blocs: § = <!-- wp:paragraph --><p>x</p><!-- /wp:paragraph --> | H2 = <!-- wp:heading {"level":2} --><h2>x</h2><!-- /wp:heading --> | H3 = <!-- wp:heading {"level":3} --><h3>x</h3><!-- /wp:heading --> | liste = <!-- wp:list --><ul><!-- wp:list-item --><li>x</li><!-- /wp:list-item --></ul><!-- /wp:list --> | punchline = <!-- wp:quote --><blockquote class="wp-block-quote"><p>x</p></blockquote><!-- /wp:quote --> | shortcode = <!-- wp:shortcode -->[x]<!-- /wp:shortcode -->
MÉTADONNÉES: ${titleNote} meta_description: 130-160 car, sans année.

ORDRE OBLIGATOIRE DU CONTENU (respecter strictement cette séquence):
[1] ${snippetInstr}
[2] INTRO (80 mots max): ${isLM?"hook vérité ligne 1 (jamais 'Dans cet article')":"accroche directe"}, contexte + mot-clé naturel. Dernière ligne de l'intro: <!-- wp:shortcode -->${scIntro}<!-- /wp:shortcode -->
⚠️ Le bloc [1] SNIPPET doit impérativement apparaître AVANT le bloc [2] INTRO dans html_content. JAMAIS après.
[3] CORPS: ${isLM?"H2 humains avec verbe, punchline/section, 2-4 moments signature, 1 stat concrète.":"H2 naturels, exemples concrets."} Paragraphes 3-4 lignes. Transitions fluides. ${yearNote}
[4] FAQ: 3 questions PAA, réponses 50-150 mots. ${useYear?"Si l'année est mentionnée dans une FAQ: [current_date format=Y]":""}
[5] CONCLUSION+CTA: ${isLM?"bénéfice concret AVANT l'action.":"CTA clair."} Fin: <!-- wp:shortcode -->${scEnd}<!-- /wp:shortcode -->
RAPPEL ANNÉE: ${useYear?"Vérifier que wp_title contient [current_date format=Y] et que html_content contient le H1 identique avec [current_date format=Y]. Aucune année en chiffres directs dans le contenu.":""}
ANTI-STUFFING: >5 mots mot-clé collé=INTERDIT.
SEO: densité 1-1.5%, sémantique 15+, entités nommées, 2-3 ancres maillage, EEAT.

PHASE 3 — AUTO-CORRECTION: phrases SEO artificielles? générique IA? H2 actionnable? hook tension? ${isLM?"moments signature (min 2)?":""} CTA orienté résultat?

JSON: {"mot_cle_principal_final":"...","mots_cles_secondaires_final":["..."],"angle_final":"...","promesse_article":"...","hook_verite":"...","meta_title":"...","meta_description":"...","wp_title":"...","html_content":"...","word_count":0,"reading_time_minutes":0,"seo_score_estimate":0,"champ_semantique":["..."],"ancres_maillage":[{"ancre":"...","sujet_cible":"..."}],"excerpt":"...","moments_signature_utilises":["..."],"auto_correction_log":["..."]${articleType==="review"?`,"review_header_data":{"nom_outil":"...","note":0,"resume":"...","lien_affilie":"...","logo_url":"..."}`:""}}`
  };
}

// ─── REVIEW HEADER GUTENBERG BUILDER ─────────────────────────────────────────
function buildReviewHeaderBlock(data){
  if(!data)return "";
  const stars="★".repeat(Math.floor(data.note||0))+"☆".repeat(5-Math.floor(data.note||0));
  return `<!-- wp:group {"style":{"color":{"background":"#FAFAF8"},"border":{"width":"1px","color":"#E8E6E0","radius":"10px"},"spacing":{"padding":{"top":"1.5rem","bottom":"1.5rem","left":"1.5rem","right":"1.5rem"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group has-background" style="background-color:#FAFAF8;border:1px solid #E8E6E0;border-radius:10px;padding:1.5rem">
<!-- wp:columns -->
<div class="wp-block-columns">
<!-- wp:column {"width":"20%"} -->
<div class="wp-block-column" style="flex-basis:20%">
<!-- wp:image {"url":"${data.logo_url||`https://logo.clearbit.com/${data.nom_outil?.toLowerCase().replace(/\s/g,"")}.com`}","alt":"Logo ${data.nom_outil}","width":80,"height":80} -->
<figure class="wp-block-image"><img src="${data.logo_url||`https://logo.clearbit.com/${data.nom_outil?.toLowerCase().replace(/\s/g,"")}.com`}" alt="Logo ${data.nom_outil}" style="width:80px;height:80px;object-fit:contain"/></figure>
<!-- /wp:image -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"80%"} -->
<div class="wp-block-column" style="flex-basis:80%">
<!-- wp:heading {"level":3} --><h3><strong>Notre avis sur ${data.nom_outil}</strong></h3><!-- /wp:heading -->
<!-- wp:paragraph --><p><strong>Note :</strong> ${data.note}/5 — ${stars}</p><!-- /wp:paragraph -->
<!-- wp:paragraph --><p>${data.resume}</p><!-- /wp:paragraph -->
<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"black","textColor":"white"} --><div class="wp-block-button"><a class="wp-block-button__link has-white-color has-black-background-color has-text-color has-background" href="${data.lien_affilie||"#"}">Essayer ${data.nom_outil} →</a></div><!-- /wp:button --></div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->`;
}

// ─── PROMPTS ──────────────────────────────────────────────────────────────────
const PROMPTS = {
  intention:(s,k,site,wc,instr)=>({system:SYSTEM_BASE(site),user:`Expert SEO copywriting. Analyse "${k}" pour "${s}". Audience: ${AUDIENCE}. JSON: {"intention_type":"...","emotions_douleurs":["..."],"awareness_levels":{"inconscient":{"score":0,"raison":"..."},"conscient_pb":{"score":0,"raison":"..."},"comparaison":{"score":0,"raison":"..."}},"cta_par_etape":[{"etape":"...","cta":"...","placement":"..."}],"angle_differenciant":"...","resume_strategie":"..."}`}),
  competitors:(s,k,site,wc,instr)=>({system:SYSTEM_BASE(site),user:`Top 10 résultats Google FR ${CURRENT_YEAR} pour "${k}" / "${s}". 30 requêtes conversationnelles. Consignes: ${instr}. JSON: {"concurrents":[{"position":1,"titre":"...","angle":"...","nb_mots_estime":0,"points_forts":"..."}],"requetes_conversationnelles":["..."],"content_gaps":["..."],"recommandation":"..."}`}),
  longtail:(s,k,site,wc,instr)=>({system:SYSTEM_BASE(site),user:`Expert SEO 10 ans. Analyse stratégique "${s}" / "${k}". Audience: ${AUDIENCE}. Consignes: ${instr}
PARTIE 1: 1 mot-clé principal (2-4 mots), 5 secondaires propres (2-4 mots, naturels), intention dominante.
PARTIE 2: 15 requêtes longue traîne (requête, volume, concurrence, intention, funnel).
PARTIE 3: 1 angle éditorial (débutant/erreurs/étude de cas/méthode) + justification.
JSON: {"mot_cle_principal":"...","mots_cles_secondaires":["..."],"intention_dominante":"...","angle_editorial":"...","justification_angle":"...","mots_cles_longtail":[{"requete":"...","volume_estime":"...","concurrence":"Faible|Moyen|Élevé","intention":"...","funnel":"..."}],"liste_brute":"..."}`}),
};

// ─── API CALLERS ──────────────────────────────────────────────────────────────
async function callClaude(prompt,maxTokens=3000){
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:maxTokens,system:prompt.system,messages:[{role:"user",content:prompt.user}]})});
  if(!res.ok){const e=await res.json();throw new Error(e.error?.message||`HTTP ${res.status}`);}
  const data=await res.json();if(data.error)throw new Error(data.error.message);
  if(data.stop_reason==="max_tokens")throw new Error("Réponse tronquée (max_tokens atteint) — réduis la longueur de l'article ou réessaie");
  const text=data.content?.map(b=>b.text||"").join("")||"";if(!text)throw new Error("Réponse vide");
  const clean=text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
  const s=clean.indexOf("{"),e2=clean.lastIndexOf("}");
  if(s===-1||e2===-1)throw new Error("JSON introuvable dans la réponse");
  try{return JSON.parse(clean.slice(s,e2+1));}
  catch(e){throw new Error(`JSON invalide: ${e.message} — réessaie ou réduis la longueur`);}
}

async function generateImageGemini(subject,geminiKey,paletteColor){
  if(!geminiKey)throw new Error("Clé API Gemini manquante dans le profil éditorial du site");
  const colorNames={"#abcee3":"light pastel blue","#f3c05d":"warm golden yellow","#dd6b76":"soft rose red","#ed948f":"salmon pink","#ce9aca":"soft lavender purple"};
  const colorDesc=colorNames[paletteColor.toLowerCase()]||"soft pastel";
  const prompt=`Create a featured blog image for an article about: "${subject}".
Style: modern flat editorial illustration, minimalist, clean lines.
Composition: main subject centered, occupying 60-75% of the image.
Background: solid uniform ${colorDesc} color, completely plain with no gradient and no texture.
IMPORTANT: absolutely NO text, NO hex codes, NO labels, NO numbers, NO logo, NO watermark, NO photorealism.
Format: horizontal 16:9 landscape ratio, sharp and clean.`;
  const res=await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiKey}`,
    {method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({
       contents:[{parts:[{text:prompt}]}],
       generationConfig:{
         responseModalities:["IMAGE"],
         imageConfig:{aspectRatio:"16:9"}
       }
     })
    }
  );
  if(!res.ok){const e=await res.json();throw new Error(e.error?.message||`Gemini HTTP ${res.status}`);}
  const data=await res.json();
  const parts=data.candidates?.[0]?.content?.parts||[];
  const imgPart=parts.find(p=>p.inlineData?.data);
  if(!imgPart?.inlineData?.data){
    const reason=data.candidates?.[0]?.finishReason||"unknown";
    const safety=data.candidates?.[0]?.safetyRatings?.map(r=>`${r.category}:${r.probability}`).join(",")||"";
    throw new Error(`Gemini n'a pas retourné d'image — finishReason: ${reason}${safety?" | safety: "+safety:""}`);
  }
  return{base64:imgPart.inlineData.data,mimeType:imgPart.inlineData.mimeType||"image/png"};
}

function buildImageFilename(subject){
  const stopwords=new Set(["comment","pour","les","des","une","avec","dans","sur","par","que","qui","quoi","est","son","ses","tout","plus","bien","mais","sans","pas","comme","aux","ces","cet","cette","nous","vous","leur","leurs","mon","ton","le","la","de","du","en","et","ou","un","au","ce","se","si","ni","ne","ya","via"]);
  const words=subject.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z\s]/g,"")
    .split(/\s+/)
    .filter(w=>w.length>2&&!stopwords.has(w))
    .slice(0,3);
  return(words.length>0?words.join("-"):"article")+".jpg";
}

async function uploadImageToWordPress(profile,imageBase64,mimeType,filename){
  const creds=btoa(`${profile.wpUser}:${profile.appPassword}`);
  const url=profile.wpUrl.replace(/\/$/,"");
  const byteString=atob(imageBase64);
  const ab=new ArrayBuffer(byteString.length);
  const ia=new Uint8Array(ab);
  for(let i=0;i<byteString.length;i++)ia[i]=byteString.charCodeAt(i);
  const blob=new Blob([ab],{type:mimeType});
  const formData=new FormData();
  formData.append("file",blob,filename);
  const res=await fetch(`${url}/wp-json/wp/v2/media`,{method:"POST",headers:{Authorization:`Basic ${creds}`},body:formData});
  if(!res.ok){const e=await res.json();throw new Error(e.message||`WP Media HTTP ${res.status}`);}
  return await res.json();
}

async function publishToWordPress(profile,articleData,featuredMediaId){
  const creds=btoa(`${profile.wpUser}:${profile.appPassword}`);
  const url=profile.wpUrl.replace(/\/$/,"");
  const useYear=profile?.editorial?.useYearVars!==false;
  const seoTitle=useYear&&articleData.meta_title
    ?(articleData.meta_title.includes("%%currentyear%%")?articleData.meta_title:`${articleData.meta_title} %%currentyear%%`)
    :articleData.meta_title;
  const body={title:articleData.wp_title||articleData.meta_title,content:articleData.html_content,excerpt:articleData.excerpt,status:"draft",meta:{_seopress_titles_title:seoTitle,_seopress_titles_desc:articleData.meta_description||""}};
  if(featuredMediaId)body.featured_media=featuredMediaId;
  const res=await fetch(`${url}/wp-json/wp/v2/posts`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Basic ${creds}`},body:JSON.stringify(body)});
  if(!res.ok){const e=await res.json();throw new Error(e.message||`HTTP ${res.status}`);}
  return await res.json();
}

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
const Spinner=()=><span style={{display:"inline-block",width:14,height:14,border:`2px solid ${C.border}`,borderTop:`2px solid ${C.textMuted}`,borderRadius:"50%",animation:"rspin 0.8s linear infinite",flexShrink:0}}/>;

const Pill=({status,label})=>{
  const m={idle:{bg:C.bg,color:C.textFaint,label:"En attente"},running:{bg:"#FEF3C7",color:"#92400E",label:"En cours…"},done:{bg:C.greenLight,color:C.green,label:"Terminé"},error:{bg:C.redLight,color:C.red,label:"Erreur"},published:{bg:C.greenLight,color:C.green,label:"Publié ✓"},queued:{bg:C.purpleLight,color:C.purple,label:"Planifié"},pending:{bg:"#EDE9FE",color:C.purple,label:"En attente…"}}[status]||{bg:C.bg,color:C.textFaint,label:status};
  return <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,background:m.bg,color:m.color,fontWeight:600,letterSpacing:"0.01em",whiteSpace:"nowrap"}}>{label||m.label}</span>;
};

const Inp=({label,hint,...props})=>(
  <div>
    {label&&<label style={{display:"block",fontSize:11,fontWeight:700,color:C.textMuted,marginBottom:5,letterSpacing:"0.04em",textTransform:"uppercase"}}>{label}{hint&&<span style={{fontWeight:400,textTransform:"none",marginLeft:4,color:C.textFaint}}>{hint}</span>}</label>}
    <input {...props} style={{width:"100%",boxSizing:"border-box",height:40,padding:"0 12px",border:`1.5px solid ${C.border}`,borderRadius:C.radiusSm,background:C.card,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",transition:"border-color 0.15s",...(props.style||{})}} onFocus={e=>{e.target.style.borderColor=C.yellow;e.target.style.boxShadow=`0 0 0 3px ${C.yellowLight}`}} onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none"}}/>
  </div>
);

const Btn=({children,variant="outline",disabled,onClick,style={}})=>{
  const base={display:"inline-flex",alignItems:"center",gap:6,padding:"0 18px",height:38,border:"none",borderRadius:C.radiusSm,fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",transition:"all 0.15s",opacity:disabled?0.45:1,fontFamily:"inherit",...style};
  const variants={primary:{background:C.text,color:"#fff",boxShadow:C.shadow},yellow:{background:C.yellow,color:C.text,boxShadow:C.shadow},outline:{background:C.card,color:C.text,border:`1.5px solid ${C.border}`},ghost:{background:"transparent",color:C.textMuted,padding:"0 10px"},danger:{background:C.redLight,color:C.red,border:`1.5px solid #FECACA`}};
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
      <div style={{background:C.card,borderRadius:C.radiusLg,width:"100%",maxWidth:600,maxHeight:"90vh",overflowY:"auto",boxShadow:C.shadowLg,border:`1px solid ${C.border}`}}>
        <div style={{padding:"1.25rem 1.5rem",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.card,borderRadius:`${C.radiusLg} ${C.radiusLg} 0 0`,zIndex:1}}>
          <div><h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.text}}>Sites WordPress</h3><p style={{margin:0,fontSize:12,color:C.textMuted,marginTop:1}}>Connexion, profil éditorial et clé Gemini</p></div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:C.radiusSm,border:`1.5px solid ${C.border}`,background:C.bg,color:C.textMuted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"1.25rem 1.5rem"}}>
          {local.length>0&&(
            <div style={{marginBottom:"1.5rem"}}>
              <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:C.textMuted,letterSpacing:"0.06em",textTransform:"uppercase"}}>Sites configurés</p>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {local.map((site,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.bg,borderRadius:C.radius,border:`1.5px solid ${C.border}`}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:C.green,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{margin:0,fontSize:13,fontWeight:600,color:C.text}}>{site.name}</p>
                      <p style={{margin:0,fontSize:11,color:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{site.wpUrl}{site.editorial?.geminiKey?" · 🎨 Gemini OK":""}</p>
                    </div>
                    <Btn variant="outline" onClick={()=>onSelect(site)} style={{height:30,fontSize:12,padding:"0 12px"}}>Choisir</Btn>
                    <Btn variant="ghost" onClick={()=>startEdit(i)} style={{height:30,fontSize:13}}>✎</Btn>
                    <Btn variant="danger" onClick={()=>{const u=local.filter((_,idx)=>idx!==i);setLocal(u);onDelete(u);}} style={{height:30,fontSize:13,padding:"0 8px"}}>✕</Btn>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"1.25rem"}}>
            <p style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:C.text}}>{editIdx!==null?"Modifier le site":"Nouveau site"}</p>
            <div style={{display:"flex",background:C.bg,borderRadius:C.radiusSm,padding:3,gap:2,marginBottom:"1.25rem",border:`1.5px solid ${C.border}`}}>
              {[{id:"connexion",label:"🔌 Connexion WP"},{id:"editorial",label:"✏️ Profil éditorial"},{id:"image",label:"🎨 Image & Gemini"}].map(t=>(
                <button key={t.id} onClick={()=>setMTab(t.id)} style={{flex:1,padding:"7px 8px",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:mTab===t.id?700:400,background:mTab===t.id?C.card:"transparent",color:mTab===t.id?C.text:C.textMuted,boxShadow:mTab===t.id?C.shadow:"none",transition:"all 0.15s",fontFamily:"inherit"}}>{t.label}</button>
              ))}
            </div>
            {mTab==="connexion"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                {[{k:"name",l:"Nom du site",p:"lesmakers.fr",t:"text"},{k:"url",l:"URL WordPress",p:"https://lesmakers.fr",t:"url"},{k:"user",l:"Identifiant WP",p:"admin",t:"text"},{k:"password",l:"Application Password",p:"xxxx xxxx xxxx xxxx",t:"password"}].map(f=>(
                  <Inp key={f.k} label={f.l} type={f.t} value={conn[f.k]} onChange={e=>setConn({...conn,[f.k]:e.target.value})} placeholder={f.p}/>
                ))}
              </div>
            )}
            {mTab==="editorial"&&(
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Inp label="Shortcode intro" value={prof.shortcodeIntro||""} onChange={e=>setProf({...prof,shortcodeIntro:e.target.value})} placeholder="[elementor-template id=22062]"/>
                  <Inp label="Shortcode conclusion" value={prof.shortcodeConclusion||""} onChange={e=>setProf({...prof,shortcodeConclusion:e.target.value})} placeholder="[elementor-template id=1148]"/>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:14,padding:"12px 14px",background:C.bg,borderRadius:C.radiusSm,border:`1.5px solid ${C.border}`}}>
                  {[{k:"useYearVars",l:"Variables d'année (SEOPress)"},{k:"snippetEnabled",l:"Bloc rich snippet coloré"}].map(({k,l})=>(
                    <label key={k} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,fontWeight:500,color:C.text,cursor:"pointer"}}>
                      <input type="checkbox" checked={!!prof[k]} onChange={e=>setProf({...prof,[k]:e.target.checked})} style={{width:15,height:15,accentColor:C.yellow}}/>{l}
                    </label>
                  ))}
                  {prof.snippetEnabled&&(
                    <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:C.text}}>
                      Couleur snippet:
                      <input type="color" value={prof.snippetBg||"#fdeecd"} onChange={e=>setProf({...prof,snippetBg:e.target.value})} style={{width:36,height:28,border:`1.5px solid ${C.border}`,cursor:"pointer",borderRadius:4,padding:2}}/>
                      <span style={{fontSize:11,color:C.textFaint,fontFamily:"monospace"}}>{prof.snippetBg}</span>
                    </label>
                  )}
                </div>
                <Inp label="CTA de l'article" value={prof.cta||""} onChange={e=>setProf({...prof,cta:e.target.value})} placeholder={CTA_DEFAULT}/>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:700,color:C.textMuted,marginBottom:5,letterSpacing:"0.04em",textTransform:"uppercase"}}>Signature éditoriale</label>
                  <textarea value={prof.signature||""} onChange={e=>setProf({...prof,signature:e.target.value})} rows={6} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.border}`,borderRadius:C.radiusSm,padding:"10px 12px",fontSize:11,fontFamily:"monospace",resize:"vertical",background:C.bg,color:C.text,outline:"none"}}/>
                </div>
              </div>
            )}
            {mTab==="image"&&(
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
                <div style={{background:C.yellowLight,border:`1.5px solid ${C.yellow}`,borderRadius:C.radius,padding:"12px 14px"}}>
                  <p style={{margin:0,fontSize:12,fontWeight:600,color:C.yellowDark}}>🎨 Génération d'image automatique avec Gemini</p>
                  <p style={{margin:"4px 0 0",fontSize:11,color:C.yellowDark}}>L'image à la une sera générée automatiquement et uploadée sur WordPress à chaque article.</p>
                </div>
                <Inp label="Clé API Gemini" type="password" value={prof.geminiKey||""} onChange={e=>setProf({...prof,geminiKey:e.target.value})} placeholder="AIzaSy..."/>
                <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:C.radiusSm,padding:"10px 12px"}}>
                  <p style={{margin:"0 0 6px",fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.05em"}}>Palette de couleurs (rotation automatique)</p>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {IMAGE_PALETTE.map((c,i)=>(
                      <div key={i} style={{width:32,height:32,borderRadius:C.radiusSm,background:c,border:`2px solid ${C.border}`,title:c}}/>
                    ))}
                  </div>
                  <p style={{margin:"6px 0 0",fontSize:11,color:C.textFaint}}>Les couleurs alternent automatiquement selon l'index de l'article.</p>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              <Btn variant="primary" onClick={handleSave} disabled={!canSave}>{editIdx!==null?"Enregistrer":"+ Ajouter ce site"}</Btn>
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
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"1rem"}}>
          <div style={{width:36,height:36,borderRadius:C.radiusSm,background:C.yellow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🌐</div>
          <div><h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.text}}>Choisir un site</h3><p style={{margin:0,fontSize:12,color:C.textMuted}}>Sur quel site travailles-tu aujourd'hui ?</p></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:"1rem"}}>
          {sites.map((site,i)=>(
            <button key={i} onClick={()=>onSelect(site)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:C.radius,cursor:"pointer",textAlign:"left",transition:"all 0.15s",fontFamily:"inherit"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:C.green,flexShrink:0}}/>
              <div style={{flex:1}}><p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>{site.name}</p><p style={{margin:0,fontSize:11,color:C.textMuted}}>{site.wpUrl}</p></div>
              <span style={{color:C.textFaint,fontSize:16}}>→</span>
            </button>
          ))}
        </div>
        <Btn variant="outline" onClick={onManage} style={{width:"100%",justifyContent:"center",height:36,fontSize:12}}>+ Ajouter un nouveau site</Btn>
      </div>
    </div>
  );
}

// ─── ARTICLE TYPE SELECTOR ────────────────────────────────────────────────────
function ArticleTypeSelector({isLesmakersActive,selected,onChange}){
  const types=isLesmakersActive?ARTICLE_TYPES_LESMAKERS:ARTICLE_TYPES_STANDARD;
  return(
    <div>
      <label style={{display:"block",fontSize:11,fontWeight:700,color:C.textMuted,marginBottom:8,letterSpacing:"0.04em",textTransform:"uppercase"}}>
        Type d'article {isLesmakersActive&&<span style={{fontSize:10,background:C.yellowLight,color:C.yellowDark,padding:"1px 6px",borderRadius:99,fontWeight:600,marginLeft:4}}>Les Makers</span>}
      </label>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
        {types.map(t=>(
          <button key={t.id} onClick={()=>onChange(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"flex-start",padding:"8px 10px",background:selected===t.id?C.yellowLight:C.bg,border:`1.5px solid ${selected===t.id?C.yellow:C.border}`,borderRadius:C.radiusSm,cursor:"pointer",textAlign:"left",transition:"all 0.15s",fontFamily:"inherit"}}>
            <span style={{fontSize:16,marginBottom:2}}>{t.icon}</span>
            <span style={{fontSize:11,fontWeight:700,color:selected===t.id?C.yellowDark:C.text,lineHeight:1.2}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── LINK SALE CONFIG ─────────────────────────────────────────────────────────
function LinkSaleConfig({config,onChange}){
  return(
    <div style={{background:C.purpleLight,border:`1.5px solid ${C.purple}44`,borderRadius:C.radius,padding:"1rem 1.25rem"}}>
      <p style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:C.purple}}>🔗 Configuration vente de liens</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Inp label="URL cible" type="url" value={config.url||""} onChange={e=>onChange({...config,url:e.target.value})} placeholder="https://example.com/page"/>
        <Inp label="Ancre exacte" value={config.anchor||""} onChange={e=>onChange({...config,anchor:e.target.value})} placeholder="texte du lien"/>
        <Inp label="Emplacement souhaité" value={config.placement||""} onChange={e=>onChange({...config,placement:e.target.value})} placeholder="ex: 3e paragraphe"/>
        <Inp label="Nombre de liens" type="number" min={1} max={5} value={config.count||1} onChange={e=>onChange({...config,count:Number(e.target.value)})}/>
      </div>
      <div style={{marginTop:10}}>
        <label style={{display:"block",fontSize:11,fontWeight:700,color:C.textMuted,marginBottom:5,letterSpacing:"0.04em",textTransform:"uppercase"}}>Consignes client</label>
        <textarea value={config.notes||""} onChange={e=>onChange({...config,notes:e.target.value})} rows={2} placeholder="Paragraphe imposé, contraintes spécifiques..." style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${C.border}`,borderRadius:C.radiusSm,padding:"8px 10px",fontSize:12,fontFamily:"inherit",resize:"vertical",background:C.card,color:C.text,outline:"none"}}/>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const PIPELINE_STEPS=[
  {id:"intention",  label:"Intention & Conversion",icon:"🎯",desc:"Décryptage intention + angles CTA"},
  {id:"competitors",label:"Concurrents",           icon:"🔍",desc:"Top 10 SERP + requêtes conversationnelles"},
  {id:"longtail",   label:"Longue traîne",          icon:"📊",desc:"Stratégie mots-clés + angle éditorial"},
  {id:"article",    label:"Article SEO",            icon:"✍️", desc:"Rédaction complète Gutenberg"},
  {id:"image",      label:"Image à la une",         icon:"🎨",desc:"Génération Gemini + upload WordPress"},
];

export default function App(){
  const [tab,setTab]=useState("pipeline");
  const [subject,setSubject]=useState("");
  const [keyword,setKeyword]=useState("");
  const [wordCount,setWordCount]=useState(1500);
  const [articleType,setArticleType]=useState("article_simple");
  const [linkSaleConfig,setLinkSaleConfig]=useState({url:"",anchor:"",placement:"",count:1,notes:""});
  const [instructions,setInstructions]=useState(DEFAULT_INSTRUCTIONS);
  const [showInstructions,setShowInstructions]=useState(false);
  const [activeInstrTab,setActiveInstrTab]=useState("intention");
  const [sites,setSites]=useState([]);
  const [activeSite,setActiveSite]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [showSelector,setShowSelector]=useState(false);
  const [results,setResults]=useState({});
  const [stepStatus,setStepStatus]=useState({});
  const [running,setRunning]=useState(false);
  const [wpStatus,setWpStatus]=useState(null);
  const [wpResult,setWpResult]=useState(null);
  const [imageStatus,setImageStatus]=useState(null);
  const [imagePreview,setImagePreview]=useState(null);
  const [expandedStep,setExpandedStep]=useState(null);
  const [queue,setQueue]=useState([]);
  const [qForm,setQForm]=useState({subject:"",keyword:"",wordCount:1500,date:"",articleType:"article_simple"});
  const [editingQIdx,setEditingQIdx]=useState(null);
  const [selectedIds,setSelectedIds]=useState(new Set());
  const [batchRunning,setBatchRunning]=useState(false);
  const execQueueRef=useRef([]); // IDs waiting to run
  const isProcessingRef=useRef(false);
  const paletteIdxRef=useRef(0);
  const abortRef=useRef(false);

  useEffect(()=>{
    const s=loadLS(SITES_KEY,[]);const instr=loadLS(INSTR_KEY,DEFAULT_INSTRUCTIONS);let q=loadLS(QUEUE_KEY,[]);
    // Migrate legacy items without siteId: assign to first site if only one, otherwise drop
    if(q.some(item=>!item.siteId)){
      if(s.length===1){
        q=q.map(item=>item.siteId?item:{...item,siteId:s[0].name});
        saveLS(QUEUE_KEY,q);
      } else {
        // Multiple sites: drop orphan items to avoid mixing — user will re-add them
        q=q.filter(item=>item.siteId);
        saveLS(QUEUE_KEY,q);
      }
    }
    setSites(s);setInstructions(instr);setQueue(q);
    if(s.length===1)setActiveSite(s[0]);else if(s.length>1)setShowSelector(true);
  },[]);

  const isLesmakersActive=activeSite?.name?.toLowerCase().includes("lesmakers")||activeSite?.wpUrl?.toLowerCase().includes("lesmakers");
  const saveInstr=(u)=>{setInstructions(u);saveLS(INSTR_KEY,u);};
  const handleSiteSave=(u)=>{setSites(u);saveLS(SITES_KEY,u);if(!activeSite&&u.length>0)setActiveSite(u[0]);};
  const handleSiteSelect=(s)=>{setActiveSite(s);setShowModal(false);setShowSelector(false);};
  const handleSiteDelete=(u)=>{setSites(u);saveLS(SITES_KEY,u);if(activeSite&&!u.find(s=>s.name===activeSite.name))setActiveSite(u[0]||null);};

  const isReady=subject.trim()&&keyword.trim()&&activeSite;
  const isDone=stepStatus["article"]==="done";
  const completedCount=PIPELINE_STEPS.filter(s=>stepStatus[s.id]==="done").length;
  const setStatus=(id,s)=>setStepStatus(prev=>({...prev,[id]:s}));

  async function runPipelineFor(subj,kw,wc,site,atype,lsc,autoPublish=false){
    abortRef.current=false;setRunning(true);setResults({});setStepStatus({});setWpStatus(null);setWpResult(null);setImageStatus(null);setImagePreview(null);
    const acc={};const siteName=site?.name||"mon site";const profile=site?.editorial||DEFAULT_PROFILE;
    const cfgs=[
      {id:"intention",  tokens:2000,build:()=>PROMPTS.intention(subj,kw,siteName,wc,instructions.intention||"")},
      {id:"competitors",tokens:3000,build:()=>PROMPTS.competitors(subj,kw,siteName,wc,instructions.competitors||"")},
      {id:"longtail",   tokens:2500,build:()=>PROMPTS.longtail(subj,kw,siteName,wc,instructions.longtail||"")},
      {id:"article",    tokens:8000,build:()=>buildArticlePrompt(subj,kw,siteName,wc,instructions.article||"",acc,profile,atype,lsc)},
    ];
    try{
      for(const cfg of cfgs){
        if(abortRef.current)break;setStatus(cfg.id,"running");
        try{
          const data=await callClaude(cfg.build(),cfg.tokens);
          // Inject review_header into html_content if present
          if(cfg.id==="article"&&data.review_header_data){
            const headerBlock=buildReviewHeaderBlock(data.review_header_data);
            data.html_content=headerBlock+"\n"+(data.html_content||"");
          }
          acc[cfg.id]=data;setResults(prev=>({...prev,[cfg.id]:data}));setStatus(cfg.id,"done");
        }catch(e){setStatus(cfg.id,"error");acc[cfg.id]={error:e.message};setResults(prev=>({...prev,[cfg.id]:{error:e.message}}));}
      }

      // Image generation
      if(!abortRef.current&&acc.article&&!acc.article.error&&profile.geminiKey){
        setStatus("image","running");
        try{
          const paletteColor=IMAGE_PALETTE[paletteIdxRef.current%IMAGE_PALETTE.length];
          paletteIdxRef.current++;
          const{base64,mimeType}=await generateImageGemini(subj,profile.geminiKey,paletteColor);
          setImagePreview(`data:${mimeType};base64,${base64}`);
          acc.imageBase64=base64;acc.imageMimeType=mimeType;acc.imagePaletteColor=paletteColor;
          setResults(prev=>({...prev,image:{base64,mimeType,paletteColor}}));
          setStatus("image","done");
        }catch(e){setStatus("image","error");setResults(prev=>({...prev,image:{error:e.message}}));}
      }else if(!profile.geminiKey){
        setStatus("image","error");setResults(prev=>({...prev,image:{error:"Clé Gemini non configurée dans le profil du site"}}));
      }

      // Auto-publish
      if(autoPublish&&acc.article&&!acc.article.error&&site){
        setWpStatus("publishing");
        try{
          let featuredMediaId=null;
          if(acc.imageBase64){
            try{
              const filename=buildImageFilename(subj);
              const media=await uploadImageToWordPress(site,acc.imageBase64,acc.imageMimeType||"image/jpeg",filename);
              featuredMediaId=media.id;
            }catch(e){console.warn("Image upload failed:",e.message);}
          }
          const r=await publishToWordPress(site,acc.article,featuredMediaId);
          setWpResult(r);setWpStatus("published");
        }catch(e){setWpStatus("error_wp");setWpResult({error:e.message});}
      }
    }finally{setRunning(false);}
  }

  const handleRunPipeline=async()=>{if(!isReady)return;setTab("pipeline");await runPipelineFor(subject,keyword,wordCount,activeSite,articleType,linkSaleConfig,true);};

  async function processExecQueue(){
    if(isProcessingRef.current)return;
    isProcessingRef.current=true;
    setBatchRunning(true);
    abortRef.current=false;
    try{
      while(execQueueRef.current.length>0){
        if(abortRef.current)break;
        const itemId=execQueueRef.current[0];
        // Get fresh item from queue state
        const item=queue.find(q=>q.id===itemId)||loadLS(QUEUE_KEY,[]).find(q=>q.id===itemId);
        if(!item){execQueueRef.current.shift();continue;}
        const site=activeSite;if(!site){execQueueRef.current.shift();continue;}
        setSubject(item.subject);setKeyword(item.keyword);setWordCount(item.wordCount||1500);setArticleType(item.articleType||"article_simple");
        setQueue(prev=>{const u=prev.map(q=>q.id===itemId?{...q,status:"running"}:q);saveLS(QUEUE_KEY,u);return u;});
        await runPipelineFor(item.subject,item.keyword,item.wordCount||1500,site,item.articleType||"article_simple",{},true);
        setQueue(prev=>{const u=prev.filter(q=>q.id!==itemId);saveLS(QUEUE_KEY,u);return u;});
        execQueueRef.current.shift();
      }
    }finally{isProcessingRef.current=false;setBatchRunning(false);abortRef.current=false;}
  }

  function handleRunFromQueue(idx){
    const item=queue[idx];if(!item||!activeSite)return;
    // If already in exec queue, ignore
    if(execQueueRef.current.includes(item.id))return;
    execQueueRef.current.push(item.id);
    // Show as "pending" in list
    setQueue(prev=>{const u=prev.map(q=>q.id===item.id?{...q,status:"pending"}:q);saveLS(QUEUE_KEY,u);return u;});
    if(!isProcessingRef.current)processExecQueue();
  }

  function handleRunSelected(){
    if(!activeSite||selectedIds.size===0)return;
    const toRun=queue.filter(q=>selectedIds.has(q.id)&&q.status==="queued");
    setSelectedIds(new Set());
    // Add all to exec queue
    for(const item of toRun){
      if(!execQueueRef.current.includes(item.id)){
        execQueueRef.current.push(item.id);
        setQueue(prev=>{const u=prev.map(q=>q.id===item.id?{...q,status:"pending"}:q);saveLS(QUEUE_KEY,u);return u;});
      }
    }
    if(!isProcessingRef.current)processExecQueue();
  }

  function sortQueue(q){return[...q].sort((a,b)=>{if(a.date&&b.date)return new Date(a.date)-new Date(b.date);if(a.date&&!b.date)return-1;if(!a.date&&b.date)return 1;return 0;});}
  function addToQueue(){
    if(!qForm.subject||!qForm.keyword)return;
    const siteId=activeSite?.name||"";
    if(editingQIdx!==null){
      const u=queue.map((q,i)=>i===editingQIdx?{...q,...qForm,siteId}:q);const s=sortQueue(u);setQueue(s);saveLS(QUEUE_KEY,s);setEditingQIdx(null);
    }else{
      const entry={...qForm,siteId,id:Date.now(),status:"queued",createdAt:new Date().toLocaleDateString("fr-FR")};
      const s=sortQueue([...queue,entry]);setQueue(s);saveLS(QUEUE_KEY,s);
    }
    setQForm({subject:"",keyword:"",wordCount:1500,date:"",articleType:"article_simple"});
  }
  function startEditQueue(idx){const item=queue[idx];setQForm({subject:item.subject,keyword:item.keyword,wordCount:item.wordCount||1500,date:item.date||"",articleType:item.articleType||"article_simple"});setEditingQIdx(idx);}
  function removeFromQueue(idx){const u=queue.filter((_,i)=>i!==idx);setQueue(u);saveLS(QUEUE_KEY,u);}

  const queueForSite=sortQueue(queue.filter(q=>q.siteId===activeSite?.name));
  const pendingCount=queueForSite.filter(q=>q.status==="queued").length;
  const typesMeta=isLesmakersActive?ARTICLE_TYPES_LESMAKERS:ARTICLE_TYPES_STANDARD;

  const navStyle=(t)=>({display:"flex",alignItems:"center",gap:7,padding:"0 16px",height:46,border:"none",background:"none",cursor:"pointer",fontSize:13,fontWeight:tab===t?700:500,color:tab===t?C.text:C.textMuted,borderBottom:tab===t?`2.5px solid ${C.yellow}`:"2.5px solid transparent",transition:"all 0.15s",fontFamily:"inherit",marginBottom:-1});

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:'"Inter",-apple-system,BlinkMacSystemFont,sans-serif'}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box}@keyframes rspin{to{transform:rotate(360deg)}}@keyframes rfadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}input:focus,textarea:focus{outline:none}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:99px}`}</style>

      {showSelector&&sites.length>0&&!showModal&&<SiteSelector sites={sites} onSelect={handleSiteSelect} onManage={()=>{setShowSelector(false);setShowModal(true);}}/>}
      {showModal&&<SiteModal sites={sites} onSave={handleSiteSave} onSelect={handleSiteSelect} onDelete={handleSiteDelete} onClose={()=>setShowModal(false)}/>}

      {/* HEADER */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:860,margin:"0 auto",padding:"0 1.5rem",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
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
              <button onClick={()=>setShowSelector(true)} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:C.radiusSm,cursor:"pointer",fontSize:12,fontWeight:600,color:C.text,fontFamily:"inherit"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:C.green,display:"inline-block",flexShrink:0}}/>
                {activeSite.name}
                {isLesmakersActive&&<span style={{fontSize:9,background:C.yellowLight,color:C.yellowDark,padding:"1px 5px",borderRadius:99,fontWeight:700,marginLeft:2}}>LM</span>}
                <span style={{color:C.textFaint,fontSize:10}}>▾</span>
              </button>
            ):(
              <Btn variant="yellow" onClick={()=>setShowModal(true)} style={{height:34,fontSize:12}}>+ Ajouter un site</Btn>
            )}
            <Btn variant="ghost" onClick={()=>setShowModal(true)} style={{height:34,fontSize:12,color:C.textMuted}}>⚙ Sites</Btn>
          </div>
        </div>
      </div>

      {/* NAV */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:860,margin:"0 auto",padding:"0 1.5rem",display:"flex",gap:0}}>
          {[{id:"pipeline",label:"✍️ Générer un article"},{id:"queue",label:"📅 Calendrier éditorial",count:pendingCount}].map(t=>(
            <button key={t.id} style={navStyle(t.id)} onClick={()=>setTab(t.id)}>
              {t.label}
              {t.count>0&&<span style={{background:C.yellow,color:C.text,borderRadius:99,padding:"1px 7px",fontSize:10,fontWeight:700}}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{maxWidth:860,margin:"0 auto",padding:"1.5rem"}}>

        {/* ── PIPELINE TAB ── */}
        {tab==="pipeline"&&(
          <>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:C.radiusLg,padding:"1.5rem",marginBottom:"1rem",boxShadow:C.shadow}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                <Inp label="Sujet de l'article" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="ex: Comment créer un business en ligne" disabled={running}/>
                <Inp label="Mot-clé principal" value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="ex: business en ligne" disabled={running}/>
              </div>

              <div style={{marginBottom:16}}>
                <ArticleTypeSelector isLesmakersActive={isLesmakersActive} selected={articleType} onChange={setArticleType}/>
              </div>

              {articleType==="vente_liens"&&(
                <div style={{marginBottom:16}}>
                  <LinkSaleConfig config={linkSaleConfig} onChange={setLinkSaleConfig}/>
                </div>
              )}

              <div style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <label style={{fontSize:11,fontWeight:700,color:C.textMuted,letterSpacing:"0.04em",textTransform:"uppercase"}}>Longueur</label>
                  <span style={{fontSize:13,fontWeight:700,color:C.text,background:C.yellowLight,padding:"2px 10px",borderRadius:99,border:`1px solid ${C.yellow}`}}>{wordCount} mots</span>
                </div>
                <input type="range" min={800} max={3000} step={100} value={wordCount} onChange={e=>setWordCount(Number(e.target.value))} disabled={running} style={{width:"100%",accentColor:C.yellow}}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.textFaint,marginTop:4,fontWeight:500}}><span>800</span><span>1 500</span><span>3 000</span></div>
              </div>

              <div style={{marginBottom:16}}>
                <button onClick={()=>setShowInstructions(!showInstructions)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:`1px solid ${C.border}`,borderRadius:C.radiusSm,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:500,color:C.textMuted,fontFamily:"inherit"}}>
                  <span style={{display:"inline-block",transition:"transform 0.15s",transform:showInstructions?"rotate(90deg)":"rotate(0)"}}> ▶</span>
                  Consignes par étape
                </button>
                {showInstructions&&(
                  <div style={{marginTop:10,background:C.bg,borderRadius:C.radius,border:`1px solid ${C.border}`,padding:"1rem",animation:"rfadeIn 0.2s ease"}}>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                      {PIPELINE_STEPS.filter(s=>s.id!=="image").map(step=>(
                        <button key={step.id} onClick={()=>setActiveInstrTab(step.id)} style={{padding:"5px 12px",border:`1.5px solid ${activeInstrTab===step.id?C.yellow:C.border}`,borderRadius:C.radiusSm,cursor:"pointer",fontSize:12,fontWeight:activeInstrTab===step.id?700:500,background:activeInstrTab===step.id?C.yellowLight:C.card,color:activeInstrTab===step.id?C.yellowDark:C.textMuted,transition:"all 0.15s",fontFamily:"inherit"}}>
                          {step.icon} {step.label}
                        </button>
                      ))}
                    </div>
                    {PIPELINE_STEPS.filter(s=>s.id!=="image").map(step=>activeInstrTab===step.id&&(
                      <textarea key={step.id} value={instructions[step.id]||""} onChange={e=>saveInstr({...instructions,[step.id]:e.target.value})} placeholder={`Consignes pour "${step.label}"…`} rows={3} style={{width:"100%",border:`1.5px solid ${C.border}`,borderRadius:C.radiusSm,padding:"10px 12px",fontSize:12,background:C.card,color:C.text,resize:"vertical",fontFamily:"inherit",outline:"none"}}/>
                    ))}
                  </div>
                )}
              </div>

              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Btn variant="primary" onClick={handleRunPipeline} disabled={!isReady||running} style={{height:42,fontSize:14,padding:"0 24px"}}>
                  {running?<><Spinner/> En cours…</>:<>▶ Lancer le pipeline</>}
                </Btn>
                {running&&<Btn variant="outline" onClick={()=>{abortRef.current=true;setRunning(false);}} style={{height:42,fontSize:12,color:C.red,borderColor:C.red}}>Arrêter</Btn>}
                {!running&&completedCount>0&&<span style={{fontSize:12,color:C.textMuted,fontWeight:500}}>{completedCount}/{PIPELINE_STEPS.length} étapes</span>}
              </div>
            </div>

            {/* PROGRESS */}
            {(running||completedCount>0)&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:C.radius,padding:"12px 16px",marginBottom:"1rem",boxShadow:C.shadow}}>
                <div style={{height:5,background:C.bg,borderRadius:99,overflow:"hidden",border:`1px solid ${C.border}`,marginBottom:12}}>
                  <div style={{height:"100%",width:`${(completedCount/PIPELINE_STEPS.length)*100}%`,background:`linear-gradient(90deg,${C.yellow},${C.yellowDark})`,borderRadius:99,transition:"width 0.6s cubic-bezier(0.4,0,0.2,1)"}}/>
                </div>
                <div style={{display:"flex",gap:4}}>
                  {PIPELINE_STEPS.map((step,i)=>{
                    const st=stepStatus[step.id]||"idle";
                    return(
                      <div key={step.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:st==="done"?C.yellow:st==="running"?C.yellowLight:st==="error"?C.redLight:C.bg,border:`2px solid ${st==="done"?C.yellowDark:st==="running"?C.yellow:st==="error"?C.red:C.border}`,transition:"all 0.3s",fontSize:12}}>
                          {st==="done"?"✓":st==="running"?<Spinner/>:st==="error"?"!":step.icon}
                        </div>
                        <span style={{fontSize:9,fontWeight:600,color:st==="done"?C.yellowDark:C.textFaint,textAlign:"center"}}>{step.label.split(" ")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP RESULTS */}
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:"1rem"}}>
              {PIPELINE_STEPS.map((step,i)=>{
                const status=stepStatus[step.id]||"idle";
                const data=results[step.id];
                const isExp=expandedStep===step.id;
                const isDoneStep=status==="done";
                return(
                  <div key={step.id} style={{background:C.card,border:`1px solid ${isDoneStep?C.yellow+"44":C.border}`,borderRadius:C.radius,overflow:"hidden",boxShadow:C.shadow,transition:"all 0.3s",animation:isDoneStep?"rfadeIn 0.3s ease":"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:data&&!data.error?"pointer":"default"}} onClick={()=>data&&!data.error&&setExpandedStep(isExp?null:step.id)}>
                      <div style={{width:36,height:36,borderRadius:C.radiusSm,background:status==="done"?C.yellowLight:C.bg,border:`1.5px solid ${status==="done"?C.yellow:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>
                        {status==="done"?"✓":status==="running"?<Spinner/>:step.icon}
                      </div>
                      <div style={{flex:1}}>
                        <p style={{margin:0,fontSize:13,fontWeight:700,color:C.text}}>{i+1}. {step.label}</p>
                        <p style={{margin:0,fontSize:11,color:C.textMuted,marginTop:1}}>{step.desc}</p>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {data?.error&&<span style={{fontSize:11,color:C.red,fontWeight:500}} title={data.error}>⚠ {data.error.slice(0,40)}</span>}
                        <Pill status={status}/>
                        {data&&!data.error&&<span style={{color:C.textFaint,fontSize:11}}>{isExp?"▲":"▼"}</span>}
                      </div>
                    </div>
                    {isExp&&data&&!data.error&&(
                      <div style={{borderTop:`1px solid ${C.border}`,padding:"14px 16px",background:C.bg,animation:"rfadeIn 0.2s ease"}}>
                        {step.id==="intention"&&(
                          <div style={{display:"flex",flexDirection:"column",gap:8}}>
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
                            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                              {(data.requetes_conversationnelles||[]).slice(0,9).map((r,j)=><span key={j} style={{fontSize:11,padding:"3px 9px",background:C.card,border:`1px solid ${C.border}`,borderRadius:99,color:C.textMuted,fontWeight:500}}>{r}</span>)}
                            </div>
                            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                              {(data.content_gaps||[]).slice(0,5).map((g,j)=><span key={j} style={{fontSize:11,padding:"3px 9px",background:C.yellowLight,border:`1px solid ${C.yellow}`,borderRadius:99,color:C.yellowDark,fontWeight:600}}>Gap: {g}</span>)}
                            </div>
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
                            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                              {(data.mots_cles_secondaires||[]).map((m,j)=><span key={j} style={{fontSize:12,padding:"4px 11px",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:99,color:C.text,fontWeight:500}}>{m}</span>)}
                            </div>
                          </div>
                        )}
                        {step.id==="article"&&(
                          <div style={{display:"flex",flexDirection:"column",gap:10}}>
                            {data.hook_verite&&(
                              <div style={{background:C.yellowLight,borderRadius:C.radius,padding:"12px 16px",borderLeft:`4px solid ${C.yellow}`}}>
                                <p style={{margin:"0 0 3px",fontSize:10,fontWeight:700,color:C.yellowDark,textTransform:"uppercase",letterSpacing:"0.06em"}}>Hook vérité</p>
                                <p style={{margin:0,fontSize:13,fontStyle:"italic",color:C.text,fontWeight:500}}>"{data.hook_verite}"</p>
                              </div>
                            )}
                            {data.review_header_data&&(
                              <div style={{background:C.blueLight,borderRadius:C.radius,padding:"10px 14px",border:`1px solid ${C.blue}33`}}>
                                <p style={{margin:"0 0 4px",fontSize:10,fontWeight:700,color:C.blue,textTransform:"uppercase",letterSpacing:"0.06em"}}>Review Header généré</p>
                                <p style={{margin:0,fontSize:12,color:C.text}}>{data.review_header_data.nom_outil} · Note: {data.review_header_data.note}/5</p>
                              </div>
                            )}
                            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                              {[{l:"Mots",v:data.word_count},{l:"Lecture",v:`${data.reading_time_minutes} min`},{l:"Score SEO",v:`${data.seo_score_estimate}/100`}].map(m=>(
                                <div key={m.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:C.radiusSm,padding:"8px 10px",textAlign:"center"}}>
                                  <p style={{margin:0,fontSize:14,fontWeight:700,color:C.text}}>{m.v}</p>
                                  <p style={{margin:0,fontSize:10,color:C.textMuted,fontWeight:500,marginTop:1}}>{m.l}</p>
                                </div>
                              ))}
                            </div>
                            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:C.radiusSm,padding:"10px 12px"}}>
                              <p style={{margin:"0 0 4px",fontSize:12,color:C.text}}><strong>Titre WP :</strong> {data.wp_title}</p>
                              <p style={{margin:"0 0 2px",fontSize:12,color:C.text}}><strong>Meta :</strong> {data.meta_title}</p>
                              <p style={{margin:0,fontSize:11,color:C.textMuted}}>{data.meta_description}</p>
                            </div>
                            {(data.auto_correction_log||[]).length>0&&(
                              <div style={{background:C.greenLight,border:`1px solid #A7F3D0`,borderRadius:C.radiusSm,padding:"10px 12px"}}>
                                <p style={{margin:"0 0 4px",fontSize:10,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:"0.06em"}}>Auto-correction</p>
                                {data.auto_correction_log.map((l,j)=><p key={j} style={{margin:"2px 0 0",fontSize:11,color:C.green}}>✓ {l}</p>)}
                              </div>
                            )}
                          </div>
                        )}
                        {step.id==="image"&&data.base64&&(
                          <div style={{display:"flex",flexDirection:"column",gap:10}}>
                            <img src={`data:${data.mimeType};base64,${data.base64}`} alt="Image générée" style={{width:"100%",borderRadius:C.radiusSm,border:`1px solid ${C.border}`,maxHeight:200,objectFit:"cover"}}/>
                            <div style={{display:"flex",gap:6,alignItems:"center"}}>
                              <div style={{width:20,height:20,borderRadius:4,background:data.paletteColor,border:`1px solid ${C.border}`}}/>
                              <span style={{fontSize:11,color:C.textMuted}}>Couleur: {data.paletteColor}</span>
                            </div>
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
                  <p style={{margin:0,fontSize:13,fontWeight:700,color:C.text}}>6. Publication WordPress</p>
                  <p style={{margin:0,fontSize:11,color:C.textMuted,marginTop:1}}>Article + image à la une → brouillon automatique</p>
                </div>
                {wpStatus==="published"&&<Pill status="published"/>}
                {wpStatus==="publishing"&&<Pill status="running"/>}
                {(wpStatus==="error_wp"||wpStatus==="no_site")&&<Pill status="error"/>}
              </div>
              {isDone&&(
                <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 16px",background:C.bg,display:"flex",flexDirection:"column",gap:10}}>
                  {wpStatus==="publishing"&&<div style={{display:"flex",alignItems:"center",gap:8}}><Spinner/><span style={{fontSize:12,color:C.textMuted}}>Publication sur {activeSite?.name}…</span></div>}
                  {wpStatus==="published"&&wpResult&&(
                    <div style={{background:C.greenLight,border:`1px solid #A7F3D0`,borderRadius:C.radius,padding:"12px 16px",animation:"rfadeIn 0.3s ease"}}>
                      <p style={{margin:0,fontSize:13,fontWeight:700,color:C.green}}>✓ Brouillon publié sur {activeSite?.name} !</p>
                      <p style={{margin:"4px 0 0",fontSize:12,color:C.green}}>Article #{wpResult.id} · Image à la une {wpResult.featured_media?"attachée ✓":"non attachée"} · <a href={wpResult.link} target="_blank" rel="noopener" style={{color:C.green,fontWeight:600}}>Voir dans WP ↗</a></p>
                    </div>
                  )}
                  {(wpStatus==="error_wp"||wpStatus==="no_site")&&(
                    <div style={{background:C.redLight,border:`1px solid #FECACA`,borderRadius:C.radius,padding:"12px 16px"}}>
                      <p style={{margin:0,fontSize:13,color:C.red,fontWeight:600}}>{wpResult?.error}</p>
                    </div>
                  )}
                  <Btn variant="outline" onClick={()=>{const html=results["article"]?.html_content||"";const b=new Blob([html],{type:"text/html"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`article-${keyword.replace(/\s+/g,"-")}.html`;a.click();}} style={{alignSelf:"flex-start",height:34,fontSize:12}}>⬇ Télécharger HTML</Btn>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── QUEUE TAB ── */}
        {tab==="queue"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            {!activeSite&&(
              <div style={{background:"#FEF3C7",border:`1px solid ${C.yellow}`,borderRadius:C.radius,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                <span>⚠️</span><p style={{margin:0,fontSize:13,color:"#92400E",fontWeight:500}}>Sélectionne un site pour accéder à son calendrier.</p>
              </div>
            )}
            {activeSite&&(
              <>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:C.radiusLg,padding:"1.25rem 1.5rem",boxShadow:C.shadow}}>
                  <p style={{margin:"0 0 1rem",fontSize:14,fontWeight:700,color:C.text}}>{editingQIdx!==null?"Modifier":"Planifier un article"} <span style={{fontSize:12,fontWeight:400,color:C.textMuted}}>— {activeSite.name}</span></p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                    <div style={{gridColumn:"1/-1"}}><Inp label="Sujet" value={qForm.subject} onChange={e=>setQForm({...qForm,subject:e.target.value})} placeholder="ex: Comment créer un business en ligne"/></div>
                    <Inp label="Mot-clé principal" value={qForm.keyword} onChange={e=>setQForm({...qForm,keyword:e.target.value})} placeholder="ex: business en ligne"/>
                    <Inp label="Date de publication" hint="(optionnel)" type="date" value={qForm.date} onChange={e=>setQForm({...qForm,date:e.target.value})}/>
                    <Inp label="Longueur" type="number" min={800} max={3000} step={100} value={qForm.wordCount} onChange={e=>setQForm({...qForm,wordCount:Number(e.target.value)})}/>
                    <div>
                      <label style={{display:"block",fontSize:11,fontWeight:700,color:C.textMuted,marginBottom:5,letterSpacing:"0.04em",textTransform:"uppercase"}}>Type d'article</label>
                      <select value={qForm.articleType} onChange={e=>setQForm({...qForm,articleType:e.target.value})} style={{width:"100%",height:40,padding:"0 12px",border:`1.5px solid ${C.border}`,borderRadius:C.radiusSm,background:C.card,color:C.text,fontSize:13,fontFamily:"inherit",outline:"none"}}>
                        {typesMeta.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <Btn variant="yellow" onClick={addToQueue} disabled={!qForm.subject||!qForm.keyword}>{editingQIdx!==null?"✓ Enregistrer":"+ Planifier"}</Btn>
                    {editingQIdx!==null&&<Btn variant="outline" onClick={()=>{setEditingQIdx(null);setQForm({subject:"",keyword:"",wordCount:1500,date:"",articleType:"article_simple"});}}>Annuler</Btn>}
                  </div>
                </div>
                {queueForSite.length===0?(
                  <div style={{textAlign:"center",padding:"3rem 1rem",background:C.card,border:`1px dashed ${C.border}`,borderRadius:C.radiusLg}}>
                    <p style={{fontSize:32,marginBottom:8}}>📅</p>
                    <p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>Calendrier vide</p>
                    <p style={{margin:"4px 0 0",fontSize:12,color:C.textMuted}}>Planifie tes articles pour {activeSite.name}</p>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {/* BATCH TOOLBAR */}
                    {(queueForSite.filter(q=>q.status==="queued").length>0||batchRunning)&&(
                      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:batchRunning?C.yellowLight:C.card,border:`1px solid ${batchRunning?C.yellow:C.border}`,borderRadius:C.radius,boxShadow:C.shadow,flexWrap:"wrap"}}>
                        {!batchRunning&&(
                          <>
                            <label style={{display:"flex",alignItems:"center",gap:7,fontSize:12,fontWeight:600,color:C.text,cursor:"pointer"}}>
                              <input type="checkbox"
                                checked={queueForSite.filter(q=>q.status==="queued").length>0&&queueForSite.filter(q=>q.status==="queued").every(q=>selectedIds.has(q.id))}
                                onChange={e=>{
                                  if(e.target.checked){setSelectedIds(new Set(queueForSite.filter(q=>q.status==="queued").map(q=>q.id)));}
                                  else{setSelectedIds(new Set());}
                                }}
                                style={{width:15,height:15,accentColor:C.yellow}}
                              />
                              Tout sélectionner
                            </label>
                            <span style={{color:C.border,fontSize:12}}>|</span>
                            <span style={{fontSize:12,color:C.textMuted}}>{selectedIds.size} sélectionné{selectedIds.size>1?"s":""}</span>
                          </>
                        )}
                        {batchRunning&&(
                          <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                            <Spinner/>
                            <span style={{fontSize:12,fontWeight:600,color:C.yellowDark}}>
                              Génération en cours — {queueForSite.filter(q=>q.status==="running").map(q=>q.subject)[0]||"…"}
                            </span>
                          </div>
                        )}
                        {selectedIds.size>0&&!batchRunning&&(
                          <Btn variant="yellow" onClick={handleRunSelected} style={{marginLeft:"auto",height:34,fontSize:12}}>
                            ▶ Lancer {selectedIds.size} article{selectedIds.size>1?"s":""} en séquence
                          </Btn>
                        )}
                        {batchRunning&&(
                          <Btn variant="outline" onClick={()=>{abortRef.current=true;setBatchRunning(false);}} style={{marginLeft:"auto",height:34,fontSize:12,color:C.red,borderColor:C.red}}>Arrêter</Btn>
                        )}
                      </div>
                    )}

                    {/* LIST */}
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {queueForSite.map(item=>{
                      const realIdx=queue.findIndex(q=>q.id===item.id);
                      const dateObj=item.date?new Date(item.date):null;
                      const typeMeta=typesMeta.find(t=>t.id===item.articleType)||typesMeta[0];
                      const isSelected=selectedIds.has(item.id);
                      const isRunningItem=item.status==="running";
                      return(
                        <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:isSelected?C.yellowLight:C.card,border:`1px solid ${isSelected?C.yellow:isRunningItem?"#86EFAC":C.border}`,borderRadius:C.radius,boxShadow:C.shadow,transition:"all 0.15s"}}>
                          {/* CHECKBOX */}
                          {item.status==="queued"&&(
                            <input type="checkbox" checked={isSelected}
                              onChange={e=>{
                                const s=new Set(selectedIds);
                                if(e.target.checked)s.add(item.id);else s.delete(item.id);
                                setSelectedIds(s);
                              }}
                              style={{width:15,height:15,accentColor:C.yellow,flexShrink:0,cursor:"pointer"}}
                            />
                          )}
                          {item.status==="running"&&<Spinner/>}

                          {/* DATE */}
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
                            <p style={{margin:"2px 0 0",fontSize:11,color:C.textMuted}}>
                              {item.keyword} · <span style={{background:C.bg,padding:"1px 6px",borderRadius:99,border:`1px solid ${C.border}`}}>{typeMeta?.icon} {typeMeta?.label}</span> · {item.wordCount||1500} mots
                            </p>
                          </div>

                          <Pill status={isRunningItem?"running":item.status==="pending"?"pending":"queued"}/>
                          {item.status==="queued"&&editingQIdx!==realIdx&&<Btn variant="ghost" onClick={()=>startEditQueue(realIdx)} style={{height:30,fontSize:13,padding:"0 8px"}}>✎</Btn>}
                          {(item.status==="queued")&&<Btn variant="primary" onClick={()=>handleRunFromQueue(realIdx)} style={{height:32,fontSize:12,padding:"0 14px"}}>▶</Btn>}
                          {item.status==="pending"&&<span style={{fontSize:11,color:C.purple,fontWeight:600,padding:"0 6px"}}>En file…</span>}
                          {item.status!=="running"&&item.status!=="pending"&&<Btn variant="danger" onClick={()=>removeFromQueue(realIdx)} style={{height:30,fontSize:12,padding:"0 8px"}}>✕</Btn>}
                          {item.status==="pending"&&<Btn variant="ghost" onClick={()=>{execQueueRef.current=execQueueRef.current.filter(id=>id!==item.id);setQueue(prev=>{const u=prev.map(q=>q.id===item.id?{...q,status:"queued"}:q);saveLS(QUEUE_KEY,u);return u;});}} style={{height:30,fontSize:11,padding:"0 8px",color:C.textFaint}}>✕</Btn>}
                        </div>
                      );
                    })}
                    </div>
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
