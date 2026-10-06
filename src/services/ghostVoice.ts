export type GhostSpeechLanguage = 'en' | 'hi' | 'mr';

const FEMALE_VOICE_HINTS = [
  'aria', 'jenny', 'zira', 'sonia', 'hazel', 'kalpana', 'swara', 'aarohi',
  'female', 'natural', 'zira', 'susan', 'samantha', 'eva', 'sara', 'heera',
];
const NON_FEMALE_VOICE_HINTS = [
  'male', 'david', 'mark', 'guy', 'richard', 'ryan', 'james', 'george',
  'hemant', 'ravi', 'prabhat', 'madhur',
];

export const configureGhostUtterance = (
  utterance: SpeechSynthesisUtterance,
  language: GhostSpeechLanguage = 'en',
) => {
  const voices = window.speechSynthesis.getVoices();
  const languagePrefix = language === 'hi' ? 'hi' : language === 'mr' ? 'mr' : 'en';
  const isFemaleVoice = (candidate: SpeechSynthesisVoice) => {
    const name = candidate.name.toLocaleLowerCase();
    return FEMALE_VOICE_HINTS.some(hint => name.includes(hint)) &&
      !NON_FEMALE_VOICE_HINTS.some(hint => name.includes(hint));
  };
  const selected = voices.find(candidate =>
    isFemaleVoice(candidate) &&
    candidate.lang.toLocaleLowerCase().startsWith(languagePrefix),
  ) ?? voices.find(isFemaleVoice) ??
    voices.find(candidate =>
      candidate.lang.toLocaleLowerCase().startsWith(languagePrefix) &&
      !NON_FEMALE_VOICE_HINTS.some(hint => candidate.name.toLocaleLowerCase().includes(hint)),
    );

  if (selected) utterance.voice = selected;
  utterance.lang = selected?.lang ?? (language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US');
  utterance.rate = 0.98;
  utterance.pitch = 1.12;
};
