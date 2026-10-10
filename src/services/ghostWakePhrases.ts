export interface GhostWakeMatch {
  command: string;
}

export const isMeaningfulGhostTranscript = (transcript: string) =>
  /[\p{L}\p{N}]/u.test(transcript);

const ASSISTANT_NAMES = ['lily', 'lilli', 'ghost', 'gost', 'goast', 'लिली', 'लीली', 'घोस्ट', 'गोस्ट'];

export const matchGhostWakePhrase = (
  transcript: string,
  detectiveNames: string[] = [],
): GhostWakeMatch | null => {
  const name = [...ASSISTANT_NAMES, ...detectiveNames.filter(value => value.trim())]
    .map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const greetings = [
    String.raw`(?:hey|hi|hello|okay|ok|wake\s+up)\s*[,\s]*`,
    String.raw`(?:नमस्ते|नमस्कार|हाय|हे|जागो|उठो|उठ|जागा\s+हो)\s*[,\s]*`,
    String.raw`(?:namaste|namaskar|uth(?:o)?|jago|jaag(?:o)?)\s*[,\s]*`,
  ].join('|');
  const pattern = new RegExp(`^\\s*(?:${greetings})\\s*(?:${name})(?:\\s*[,!:،]?\\s*)(.*)$`, 'i');
  const match = transcript.trim().match(pattern);
  return match ? { command: match[1].trim() } : null;
};
