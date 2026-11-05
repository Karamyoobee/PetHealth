import { Linking, Platform } from "react-native";

const EMERGENCY_PATTERNS = [
  /\b(cant|cannot|not|stopped|struggling to|trouble|difficulty|unable to) breath(e|ing)?\b/i,
  /\b(gasping|choking|unconscious|unresponsive|collapsed|collapsing|seizures?|convulsions?)\b/i,
  /\b(wont|will not|doesnt|does not|cant|cannot|not|unable to) (wake( up)?|waking( up)?|respond(ing)?)\b/i,
  /\b(cant|cannot|unable to) (wake|rouse)\b|\bnot moving\b/i,
  /\b(poison(ed|ing)?|antifreeze|rat bait|rat poison|heat ?stroke|paralysis|paralyzed|paralysed)\b/i,
  /\b(ate|eaten|swallowed|ingested)\b.{0,35}\b(chocolate|grapes|raisins|xylitol|human medicine|batter(y|ies))\b/i,
  /\b(hit|run over) by (a |an )?(car|truck|vehicle)\b/i,
  /\b(severe|heavy|uncontrolled) bleeding\b|\bbleeding (heavily|wont stop|will not stop)\b/i,
  /\b(cant|cannot|unable to|not able to) (urinate|pee|pass urine)\b/i,
  /\b(swollen|bloated|distended) (abdomen|stomach|belly|tummy)\b/i,
  /\b(severe|extreme|unbearable|excruciating|terrible) pain\b|\bin (a lot of|so much) pain\b|\b(screaming|crying) in pain\b/i,
  /\b(cant|cannot|unable to) (stand|walk|get up)\b|\b(sudden|suddenly) (weakness|weak|paralysis)\b/i,
  /\b(blue|white|pale) gums\b|\b(vomiting|vomit|coughing|cough) blood\b/i,
  /\b(trying to|tries to|attempting to) vomit\b.{0,30}\b(nothing|cannot|cant)\b/i,
];

export function possibleEmergency(message: string) {
  // Handle common typing mistakes before checking for urgent descriptions.
  const corrections: Record<string, string> = {
    brath: "breath", breth: "breath", brething: "breathing", breathng: "breathing",
    waeku: "wake", wakeup: "wake up", seizur: "seizure", seziure: "seizure",
  };
  const text = message.toLowerCase().replace(/\u2019/g, "'").replace(/'/g, "")
    .replace(/\b\w+\b/g, (word) => corrections[word] ?? word).replace(/\s+/g, " ");
  return EMERGENCY_PATTERNS.some((pattern) => {
    const matches = text.matchAll(new RegExp(pattern.source, "gi"));
    for (const match of matches) {
      const prefix = text.slice(0, match.index);
      if (/\b(no|not|without|isnt|not having|not in|no signs of|no sign of|no longer|no longer having|isnt having|never had)\s+$/.test(prefix)) continue;
      if (/\b(prevent|preventing|prevention of|avoid|avoiding)\s+(?:\w+\s+){0,2}$/.test(prefix)) continue;
      return true;
    }
    return false;
  });
}

export function vetSearchRequest(message: string): "nearby" | "emergency" | null {
  const mentionsVet = /\b(vets?|veterinar\w*|veterin\w*|vetn\w*|animal (hospital|clinic)|pet clinic)\b/i.test(message);
  const wantsSearch = /\b(find|search|recommend|best|nearby|near me|nearest|local|looking for|need|book|booking|schedule)\b/i.test(message);
  const wantsAppointment = /\b(book|booking|schedule|make)\b.*\bappointment\b/i.test(message);
  if (!(mentionsVet && wantsSearch) && !wantsAppointment) return null;
  return /\bemergency\b/i.test(message) ? "emergency" : "nearby";
}

export async function findVet(emergency = false) {
  // Try the phone's Maps app first and use the browser if it cannot open.
  const query = encodeURIComponent(emergency ? "emergency veterinarian near me" : "veterinarian near me");
  const browserUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  const mapsUrl = Platform.OS === "android" ? `geo:0,0?q=${query}`
    : Platform.OS === "ios" ? `https://maps.apple.com/?q=${query}` : browserUrl;
  try {
    await Linking.openURL(mapsUrl);
  } catch {
    await Linking.openURL(browserUrl);
  }
}

export async function findEmergencyVet() {
  await findVet(true);
}
