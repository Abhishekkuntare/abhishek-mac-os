import type { GhostVoice } from './ghostVoice';

export interface GhostWakeMatch {
  command: string;
}

const VOICE_NAMES: Record<GhostVoice, string[]> = {
  brad: ['brad', 'ब्रैड', 'ब्रैड'],
  lily: ['lily', 'लिली', 'लीली'],
};

export const matchGhostWakePhrase = (
  transcript: string,
  voice: GhostVoice,
): GhostWakeMatch | null => {
  const names = ['ghost', 'gost', 'goast', 'घोस्ट', 'गोस्ट', ...VOICE_NAMES[voice]];
  const name = names
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
