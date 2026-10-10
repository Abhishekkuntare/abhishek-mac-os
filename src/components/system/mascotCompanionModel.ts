export const MASCOT_COMPANION_CONFIG_KEY = 'arlo_os_mascot_companion_v1';
export const MASCOT_COMPANION_CHANGE_EVENT = 'arlo:mascot-companion-change';

export type MascotActionMotion =
  | 'sport'
  | 'work'
  | 'creative'
  | 'reading'
  | 'relax'
  | 'movement'
  | 'greeting'
  | 'music'
  | 'everyday'
  | 'imagination';

export interface MascotAction {
  id: string;
  label: string;
  category: string;
  motion: MascotActionMotion;
}

const ACTION_GROUPS: Array<{
  category: string;
  motion: MascotActionMotion;
  actions: string[];
}> = [
  {
    category: 'Sports',
    motion: 'sport',
    actions: ['Playing football', 'Practicing cricket', 'Shooting a basketball', 'Playing tennis', 'Playing badminton', 'Skipping rope', 'Doing yoga', 'Boxing practice', 'Riding a skateboard', 'Celebrating a goal'],
  },
  {
    category: 'Work',
    motion: 'work',
    actions: ['Writing code', 'Typing a document', 'Joining a video call', 'Planning the day', 'Checking a checklist', 'Building a project', 'Studying a lesson', 'Solving a puzzle', 'Reviewing notes', 'Organizing a workspace'],
  },
  {
    category: 'Creative',
    motion: 'creative',
    actions: ['Painting a picture', 'Sketching a portrait', 'Taking a photograph', 'Playing with colors', 'Designing an idea', 'Writing a story', 'Composing a tune', 'Making a paper plane', 'Crafting a model', 'Drawing on a tablet'],
  },
  {
    category: 'Reading',
    motion: 'reading',
    actions: ['Reading a book', 'Reading a newspaper', 'Reading a tablet', 'Turning a page', 'Studying a map', 'Looking through a magazine', 'Reading a letter', 'Learning a language', 'Browsing a recipe', 'Reading before bed'],
  },
  {
    category: 'Relaxing',
    motion: 'relax',
    actions: ['Taking a nap', 'Sipping warm tea', 'Watching the clouds', 'Breathing calmly', 'Stretching gently', 'Enjoying a quiet moment', 'Waving hello softly', 'Thinking of an idea', 'Resting under a blanket', 'Watching a screensaver'],
  },
  {
    category: 'Movement',
    motion: 'movement',
    actions: ['Walking in place', 'Going for a run', 'Doing a happy dance', 'Skipping along', 'Marching proudly', 'Hopping with joy', 'Taking a little stroll', 'Stretching arms', 'Practicing a spin', 'Waving while walking'],
  },
  {
    category: 'Greetings',
    motion: 'greeting',
    actions: ['Waving hello', 'Saying hi excitedly', 'Giving a thumbs-up', 'Bowing politely', 'Sending a heart', 'Clapping happily', 'Doing a friendly salute', 'Cheering you on', 'Blowing a kiss', 'Introducing themself'],
  },
  {
    category: 'Music',
    motion: 'music',
    actions: ['Playing the guitar', 'Drumming a beat', 'Playing the piano', 'Singing a tune', 'Listening with headphones', 'Conducting an orchestra', 'Playing the violin', 'Dancing to music', 'Playing a trumpet', 'Enjoying a music break'],
  },
  {
    category: 'Everyday',
    motion: 'everyday',
    actions: ['Checking a phone', 'Answering a call', 'Drinking water', 'Eating a snack', 'Tying shoelaces', 'Watering a plant', 'Feeding a pet', 'Packing a bag', 'Looking at a notification', 'Wearing headphones'],
  },
  {
    category: 'Imagination',
    motion: 'imagination',
    actions: ['Flying like a superhero', 'Exploring outer space', 'Riding a friendly dragon', 'Sailing a tiny boat', 'Discovering treasure', 'Building a sandcastle', 'Exploring a forest', 'Visiting the moon', 'Riding a magic cloud', 'Dreaming of an adventure'],
  },
];

export const MASCOT_ACTIONS: MascotAction[] = ACTION_GROUPS.flatMap(({ category, motion, actions }) =>
  actions.map((label, index) => ({
    id: `${motion}-${index + 1}`,
    label,
    category,
    motion,
  })),
);

export interface MascotCompanionConfig {
  name: string;
  visible: boolean;
  x: number;
  y: number;
  size: number;
  actionId: string;
  paused: boolean;
  hair: 'soft' | 'spiky' | 'curly' | 'none';
  outfit: 'classic' | 'hoodie' | 'sport' | 'formal';
  accessory: 'none' | 'glasses' | 'headphones' | 'crown';
}

export const defaultMascotCompanionConfig = (): MascotCompanionConfig => ({
  name: 'Arlo',
  visible: true,
  x: Math.max(16, window.innerWidth - 136),
  y: Math.max(72, window.innerHeight - 188),
  size: 104,
  actionId: 'greeting-1',
  paused: false,
  hair: 'soft',
  outfit: 'classic',
  accessory: 'none',
});

export const loadMascotCompanionConfig = (): MascotCompanionConfig => {
  const fallback = defaultMascotCompanionConfig();
  try {
    const stored = localStorage.getItem(MASCOT_COMPANION_CONFIG_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as Partial<MascotCompanionConfig>;
    const validAction = MASCOT_ACTIONS.some(action => action.id === parsed.actionId);
    return {
      ...fallback,
      ...parsed,
      name: typeof parsed.name === 'string' ? parsed.name.slice(0, 24) : fallback.name,
      visible: parsed.visible === true,
      x: typeof parsed.x === 'number' && Number.isFinite(parsed.x) ? parsed.x : fallback.x,
      y: typeof parsed.y === 'number' && Number.isFinite(parsed.y) ? parsed.y : fallback.y,
      size: typeof parsed.size === 'number' && Number.isFinite(parsed.size)
        ? Math.max(72, Math.min(180, parsed.size))
        : fallback.size,
      actionId: validAction ? parsed.actionId! : fallback.actionId,
      paused: parsed.paused === true,
      hair: ['soft', 'spiky', 'curly', 'none'].includes(parsed.hair ?? '') ? parsed.hair! : fallback.hair,
      outfit: ['classic', 'hoodie', 'sport', 'formal'].includes(parsed.outfit ?? '') ? parsed.outfit! : fallback.outfit,
      accessory: ['none', 'glasses', 'headphones', 'crown'].includes(parsed.accessory ?? '') ? parsed.accessory! : fallback.accessory,
    };
  } catch (error) {
    console.warn('[Mascot] Could not load companion preferences:', error);
    return fallback;
  }
};

export const updateMascotCompanionConfig = (patch: Partial<MascotCompanionConfig>) => {
  const next = { ...loadMascotCompanionConfig(), ...patch };
  localStorage.setItem(MASCOT_COMPANION_CONFIG_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(MASCOT_COMPANION_CHANGE_EVENT, { detail: patch }));
};
