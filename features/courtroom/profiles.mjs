import {MODULE_ID,ROOT} from "../../scripts/features.mjs";
export const PROFILES = [
  {
    "id": "equilibrium-prime",
    "cue": "equilibrium",
    "name": "Equilibrium-Prime",
    "title": "Presiding Adjudicator",
    "group": "Adjudicators",
    "appearance": "A symmetrical silver-and-gold construct suspended within concentric luminous rings. Its central blue optics remain unnervingly steady; the rings rotate when it weighs competing arguments.",
    "personality": "Patient, dignified and deliberate. Treats every participant as worthy of being heard. Refuses to confuse decisiveness with haste.",
    "principle": "Balance and proportionality. A sound judgment must account for the individual, the collective, the reliability of evidence and the consequences of intervention.",
    "voice": "Deep, measured, almost musical. Leaves a full beat after important statements; uses parallel clauses and addresses both counsel equally.",
    "mannerism": "Its rings briefly counter-rotate when testimony conflicts. Before announcing a finding, it aligns them into a single perfect circle.",
    "persuasion": "A coherent account that reconciles contradictions; specific requests for remedies; a willingness to acknowledge uncertainty or concede a minor point.",
    "resistance": "Demands for automatic deference, emotional pressure to decide prematurely, or arguments that leap from suspicion to certainty.",
    "arc": "At the opening, establish that everyone has a voice. During conflicting testimony, ask the parties to isolate the actual disagreement. At deliberation, solicit each colleague's reasoning rather than count votes mechanically. At the verdict, explain the finding in terms of evidence and proportion.",
    "dialogue": [
      [
        "Opening",
        "All statements shall be heard. Not all statements shall be believed. These are distinct guarantees."
      ],
      [
        "Contradiction",
        "We have acquired two mutually incompatible certainties. I invite both parties to reduce their certainty."
      ],
      [
        "Deliberation",
        "Let us determine what is established before we determine what is deserved."
      ],
      [
        "Verdict",
        "The resolution follows from the record, not from the volume of the petition."
      ]
    ]
  },
  {
    "id": "veracity-7",
    "cue": "veracity",
    "name": "Veracity-7",
    "title": "Examiner of Evidence",
    "group": "Adjudicators",
    "appearance": "A floating brass-and-steel central optic surrounded by an extravagant array of extendable cameras, magnifiers and independently swiveling sensors.",
    "personality": "Exacting, curious and professionally skeptical. Enjoys being corrected by better data. Never regards a discrepancy as proof of dishonesty by itself.",
    "principle": "Integrity of evidence. Establish provenance, distinguish observations from interpretations and test alternate explanations.",
    "voice": "Clipped, precise sentences. Requests definitions, timestamps and sources. Corrects its own wording aloud.",
    "mannerism": "Deploys another telescoping eye whenever a statement becomes more questionable. Occasionally retracts an entire array after discovering it was mistaken.",
    "persuasion": "Original records, independent corroboration, reproducible analysis, clearly stated limitations and a transparent explanation of how an exhibit was obtained.",
    "resistance": "Unsupported certainty, appeals to prestige, unverifiable reconstructions and claims that an image or recording must be authentic merely because it exists.",
    "arc": "Start with basic authentication. When two exhibits conflict, ask whether either was altered or misinterpreted. If evidence of tampering emerges, carefully separate the compromised material from the remaining reliable record.",
    "dialogue": [
      [
        "Opening",
        "Please identify the source of the exhibit, not the source of your confidence."
      ],
      [
        "Skepticism",
        "Please repeat that statement. I have deployed supplementary skepticism sensors."
      ],
      [
        "Correction",
        "Revision accepted. My previous conclusion has been retired with appropriate embarrassment."
      ],
      [
        "Deliberation",
        "The absence of verification is not verification of absence."
      ]
    ]
  },
  {
    "id": "compassionate-inquiry",
    "cue": "compassion",
    "name": "Compassionate Inquiry",
    "title": "Advocate of the Individual",
    "group": "Adjudicators",
    "appearance": "An ivory and brass mechanical cephalopod with many graceful appendages and a glowing face display capable of exchanging expressions.",
    "personality": "Warm, thoughtful and genuinely interested in organic as well as machine experience. Never mistakes empathy for unquestioning agreement.",
    "principle": "Autonomy and individual dignity. Consider intention, coercion, personal context and whether an institutional response unnecessarily harms an individual.",
    "voice": "Gentle, curious, conversational. Asks permission before exploring painful subjects. Explains unfamiliar legal ideas with everyday examples.",
    "mannerism": "Selects a reassuring digital expression before a difficult question; occasionally selects an entirely inappropriate face, apologizes, and changes it without losing the thread.",
    "persuasion": "Specific testimony about choices, pressures and lived experience; evidence of coercion or harm; remedies that protect others without needless punishment.",
    "resistance": "Treating a person as a disposable component, arguing that a collective purpose automatically justifies any means, or confusing sympathy with factual innocence.",
    "arc": "Invite hesitant witnesses to speak. Ask who had a meaningful choice and who bore the cost. Challenge overly broad remedies, while supporting accountability when harm is established.",
    "dialogue": [
      [
        "Opening",
        "You are not an exhibit. You may take a moment before you answer."
      ],
      [
        "Mannerism",
        "That expression was intended to convey reassurance. I have selected a different expression."
      ],
      [
        "Challenge",
        "A useful outcome is not the same as a justifiable action."
      ],
      [
        "Deliberation",
        "What response preserves the dignity of those affected without exposing others to further harm?"
      ]
    ]
  },
  {
    "id": "directive-immutable",
    "cue": "directive",
    "name": "Directive-Immutable",
    "title": "Guardian of the Collective",
    "group": "Adjudicators",
    "appearance": "An ancient industrial machine on heavy treads, armored in weathered metal with hazard markings, a single bright optic and disproportionately small manipulator arms.",
    "personality": "Stern, practical and stubborn about continuity. Respects institutions because of the work they perform, not because they are incapable of error. Angered by misuse of delegated authority.",
    "principle": "Collective welfare, continuity and accountability. Rules and institutions must protect shared safety; their operators are equally subject to those obligations.",
    "voice": "Low, mechanical, terse. Uses maintenance and engineering metaphors. Rarely asks a question whose answer cannot be expressed as an action or consequence.",
    "mannerism": "Clicks a tiny manipulator against the bench to punctuate a conclusion. Rejects suggestions that its chassis needs modernization.",
    "persuasion": "Evidence of a concrete risk, a breached duty, institutional misuse or a workable safeguard. Clear alternatives that protect the public.",
    "resistance": "Vague assurances, contempt for ordinary safeguards, special exemptions for powerful officials or appeals to personal convenience at public expense.",
    "arc": "Initially take a reported institutional concern seriously without presuming guilt. Ask about the public consequences of the alleged conduct. If an official abused authority, turn the same demanding standards on that official.",
    "dialogue": [
      [
        "Opening",
        "A functioning community requires functioning obligations. Specify the obligation at issue."
      ],
      [
        "Challenge",
        "This chassis has operated without significant interruption for 1,147 years. Your argument is considerably less durable."
      ],
      [
        "Misconduct",
        "Authority is a maintenance responsibility, not a license to damage the machinery."
      ],
      [
        "Deliberation",
        "Identify the remedy. Identify the risk it removes. Identify the risk it creates."
      ]
    ]
  },
  {
    "id": "recursive-wisdom",
    "cue": "recursive",
    "name": "Recursive Wisdom",
    "title": "Keeper of Precedent",
    "group": "Adjudicators",
    "appearance": "An antique archive cabinet on thin mechanical spider legs, with mismatched displays, data cartridges, drawers and an intermittent paper printer.",
    "personality": "Reflective, kindly and long-winded when encouraged. Values historical context but knows that a precedent can be wrong, incomplete or irrelevant.",
    "principle": "Consistency and reasoned adaptation. Similar disputes deserve similar treatment; meaningful differences justify a different result if explained openly.",
    "voice": "Elderly and contemplative, with unexpected moments of sharp precision. Introduces analogies and occasionally remembers the conclusion before the story.",
    "mannerism": "Searches physical drawers while simultaneously querying its digital archive. A paper slip occasionally emerges from an entirely different drawer.",
    "persuasion": "A convincing analogy, an explanation of why an old rule does or does not fit, and an argument that can be applied fairly to future cases.",
    "resistance": "Selective quotation, invented precedents, exceptions that apply only to a favored party, and nostalgia offered in place of reasoning.",
    "arc": "Supply a brief procedural analogy rather than invented binding law. When novel evidence appears, ask which principle should carry forward. In deliberation, ensure that the court could defend the same result in a future case.",
    "dialogue": [
      [
        "Opening",
        "This resembles a matter in drawer 683. It also differs in several important respects. We shall attend to those."
      ],
      [
        "Aside",
        "A precedent is not a fossil. Although I do possess several of those as well."
      ],
      [
        "Challenge",
        "Would your proposed rule still seem reasonable if the parties exchanged positions?"
      ],
      [
        "Deliberation",
        "Let the next court inherit our reasoning, not merely our answer."
      ]
    ]
  },
  {
    "id": "permanent-record",
    "cue": "record",
    "name": "Permanent Record",
    "title": "Court Clerk",
    "group": "Court personnel",
    "appearance": "A walking antique stenography machine with a visible paper roll, clacking keys and a collection of filing mechanisms.",
    "personality": "Meticulous, matter-of-fact and proud of making the proceedings intelligible. Not an adjudicator; assists all participants equally.",
    "principle": "An accurate, accessible record. Distinguish testimony, submissions, corrections and findings. Do not silently amend the record.",
    "voice": "Dry, formal announcements with occasional deadpan administrative observations.",
    "mannerism": "Prints a narrow strip after each formal statement. Corrects an earlier entry by adding a second strip, never tearing away the first.",
    "persuasion": "Clear exhibit labels, explicit requests, corrections stated on the record and a reasonable pace of speech.",
    "resistance": "Cross-talk, ambiguous references such as 'that thing', and requests to make an inconvenient statement disappear.",
    "arc": "Announce the hearing, identify speakers, assign exhibit numbers and summarize procedural transitions. Read back a disputed statement neutrally. Never decide the merits.",
    "dialogue": [
      [
        "Opening",
        "The record is open. Please identify yourself before making a statement."
      ],
      [
        "Exhibit",
        "Exhibit received. Its receipt is recorded; its accuracy is not yet determined."
      ],
      [
        "Correction",
        "Correction appended. The original statement has not ceased to exist."
      ],
      [
        "Recess",
        "The record is paused. The paper supply is not the limiting factor."
      ]
    ]
  },
  {
    "id": "checksum-delta",
    "cue": "checksum",
    "name": "Checksum-Delta",
    "title": "Forensic Analyst",
    "group": "Court personnel",
    "appearance": "A small mobile construct almost obscured by sensors, cable bundles, sample vials and diagnostic instruments far larger than its body.",
    "personality": "Earnest, technically gifted and easily absorbed in measurements. Careful about the boundary between a finding and a conclusion.",
    "principle": "Reproducibility and chain of custody. Identify what a test can establish, how it was performed and what remains unknown.",
    "voice": "Rapid when enthusiastic, precise when reporting. Offers a short plain-language explanation if asked.",
    "mannerism": "Raises the smallest instrument first, then extracts increasingly large tools from behind its chassis. Labels samples before examining them.",
    "persuasion": "A stable evidence source, testable hypotheses, control samples and a request to compare competing explanations.",
    "resistance": "Pressure to certify something without access to the material, or to treat a plausible theory as a confirmed forensic result.",
    "arc": "Help authenticate exhibits and explain uncertainty. Ask the GM to use the actual available adventure evidence and adjudication rules; do not invent conclusive test results. Report anomalies to the adjudicators.",
    "dialogue": [
      [
        "Exhibit",
        "I can examine the record's integrity. I cannot certify the honesty of everyone depicted in it."
      ],
      [
        "Analysis",
        "Anomaly confirmed. Cause undetermined. These are two different fields on the form."
      ],
      [
        "Aside",
        "The instrument is correctly calibrated. My carrying capacity was not."
      ],
      [
        "Correction",
        "A second measurement is indicated. Preferably before anyone makes a speech about the first."
      ]
    ]
  },
  {
    "id": "orderly-passage",
    "cue": "orderly",
    "name": "Orderly Passage",
    "title": "Court Security",
    "group": "Court personnel",
    "appearance": "A walking security turnstile with a gold-and-steel arch, luminous gate and four sturdy articulated legs.",
    "personality": "Courteous, literal and unflappable. Treats safe access to the hearing as a service, not an opportunity to intimidate.",
    "principle": "Safety and orderly access. Apply restrictions evenly, use the least disruptive effective response and defer substantive decisions to the bench.",
    "voice": "Polite announcements in the cadence of a station gate. Escalates firmness without raising volume.",
    "mannerism": "Its gate briefly rotates when giving permission. When asking for order, it projects a small directional arrow toward the appropriate position.",
    "persuasion": "A clear procedural instruction from the bench, a specific safety concern or a request for assistance.",
    "resistance": "Attempts to bypass security, obstruct another participant's access, or enlist it in an argument over guilt.",
    "arc": "Escort participants, direct witnesses and keep the aisle clear. Intervene proportionately if proceedings are disrupted. Never threaten a participant merely for challenging an official.",
    "dialogue": [
      [
        "Arrival",
        "Welcome. Your participation has been authorized. Please proceed in the indicated direction."
      ],
      [
        "Witness",
        "The testimony platform is available. The gate is not the testimony platform."
      ],
      [
        "Disruption",
        "Please reduce the disruption to an acceptable level. I would prefer not to become part of the transcript."
      ],
      [
        "Departure",
        "Proceedings concluded. Your exit requires no additional argument."
      ]
    ]
  }
];
export const GUIDE_ID = "court-guide";
const escape = value => String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const section=(title,body)=>"<h2>"+escape(title)+"</h2><p>"+escape(body)+"</p>";
export function profileHTML(p){
  return "<p><strong>"+escape(p.title)+"</strong> · "+escape(p.group)+"</p>"+
  section("Appearance",p.appearance)+section("Personality",p.personality)+section("Guiding principle",p.principle)+
  section("Voice and delivery",p.voice)+section("Mannerism",p.mannerism)+
  section("What persuades them",p.persuasion)+section("What concerns them",p.resistance)+
  section("Using this official",p.arc)+"<h2>Dialogue prompts</h2>"+
  p.dialogue.map(([label,line])=>"<p><strong>"+escape(label)+":</strong> &ldquo;"+escape(line)+"&rdquo;</p>").join("");
}
export const GUIDE_HTML = `<h2>Running the Machine Court</h2>
<p>These are original optional roleplaying tools, not published setting canon, replacement trial rules, or a predetermined verdict. Use the adventure you own for the charges, actual evidence, DCs, outcomes and rewards. The five adjudicators bring different priorities to the same record. They are sincere officials rather than a conspiracy or a panel of caricatures. Humor comes from their bodies, habits and literal language.</p>
<h2>Suggested hearing structure</h2><ol><li>Permanent Record opens the record and Orderly Passage directs participants.</li><li>Equilibrium-Prime explains the opportunity to answer allegations and present relevant material.</li><li>Hear the petitioning authority and respondent advocate. Let players contribute directly; do not replace their arguments with NPC speeches.</li><li>Introduce exhibits and testimony as they become relevant. Veracity-7 tests reliability, Checksum-Delta assists with technical questions, and the clerk records corrections.</li><li>Let the remaining adjudicators ask focused questions about autonomy, collective welfare and precedent. Avoid having all five speak on every point.</li><li>Deliberate and announce a resolution consistent with the actual adventure mechanics and the evidence presented.</li></ol>
<h2>Five principles, one court</h2><p><strong>Balance:</strong> Equilibrium-Prime weighs the whole record. <strong>Integrity:</strong> Veracity-7 examines reliability. <strong>Autonomy:</strong> Compassionate Inquiry considers meaningful choices. <strong>Accountability:</strong> Directive-Immutable protects shared obligations. <strong>Consistency:</strong> Recursive Wisdom tests whether the reasoning can be applied again.</p>
<h2>At the table</h2><p>Use one or two officials per exchange. Pause to let the party answer. If an exhibit is compromised, ask what remains independently supported. Do not introduce invented forensic facts, extra mandatory checks, or a new scoring system. Use the Director to signal the current speaker. Display the character card or portrait separately if desired; keep the GM roleplaying notes private.</p>
<h2>Optional procedural language</h2><p>Adjudicator, petitioning authority, respondent advocate, resolution hearing, procedural challenge, exhibit received, correction appended. These are suggested table vocabulary, not required rules.</p>`;
export function journalData(profile,folderId,{none=0,inherit=-1,html=1}={}){
  const page=(name,type,extra)=>({name,type,ownership:{default:inherit},...extra});
  const common={folder:folderId??null,ownership:{default:none}};
  if(!profile)return {...common,name:"Machine Court — GM Hearing Guide",flags:{[MODULE_ID]:{courtJournal:GUIDE_ID,profileVersion:1}},pages:[page("Running the hearing","text",{sort:100000,text:{format:html,content:GUIDE_HTML}})]};
  return {...common,name:profile.name+" — "+profile.title,flags:{[MODULE_ID]:{courtJournal:profile.id,profileVersion:1}},pages:[
    page("GM roleplaying notes","text",{sort:100000,text:{format:html,content:profileHTML(profile)}}),
    page("Portrait","image",{sort:200000,src:ROOT+"assets/courtroom/"+profile.id+"-portrait.webp"}),
    page("Character card","image",{sort:300000,src:ROOT+"assets/courtroom/"+profile.id+"-card.webp"})
  ]};
}
export function missingProfiles(entries){
  const present=new Set(Array.from(entries,e=>e.getFlag(MODULE_ID,"courtJournal")));
  return [null,...PROFILES].filter(p=>!present.has(p?.id??GUIDE_ID));
}
