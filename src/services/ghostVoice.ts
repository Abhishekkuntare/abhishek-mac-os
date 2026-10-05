export type GhostVoice = 'brad' | 'lily';
export type GhostSpeechLanguage = 'en' | 'hi' | 'mr';

const VOICE_NAME_HINTS: Record<GhostVoice, string[]> = {
  brad: ['brad', 'david', 'mark', 'guy', 'richard', 'hemant', 'ravi', 'prabhat', 'madhur', 'male'],
  lily: ['lily', 'aria', 'jenny', 'zira', 'sonia', 'hazel', 'kalpana', 'swara', 'aarohi', 'female'],
};

export const configureGhostUtterance = (
  utterance: SpeechSynthesisUtterance,
  voice: GhostVoice,
  language: GhostSpeechLanguage = 'en',
) => {
  const voices = window.speechSynthesis.getVoices();
  const hints = VOICE_NAME_HINTS[voice];
  const languagePrefix = language === 'hi' ? 'hi' : language === 'mr' ? 'mr' : 'en';
  const preferred = voices.find(candidate =>
    hints.some(hint => candidate.name.toLocaleLowerCase().includes(hint)) &&
    candidate.lang.toLocaleLowerCase().startsWith(languagePrefix),
  );
  const localized = voices.find(candidate => candidate.lang.toLocaleLowerCase().startsWith(languagePrefix));
  const fallback = voices.find(candidate => candidate.lang.toLocaleLowerCase().startsWith('en'));
  const selected = preferred ?? localized ?? (language === 'en' ? fallback : undefined);

  if (selected) utterance.voice = selected;
  utterance.lang = selected?.lang ?? (language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US');
  utterance.rate = 0.96;
  utterance.pitch = voice === 'lily' ? 1.08 : 0.94;
};
