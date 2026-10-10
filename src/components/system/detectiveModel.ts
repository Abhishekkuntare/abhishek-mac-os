export const DETECTIVE_CONFIG_KEY = 'arlo_os_detective_config_v1';
export const DETECTIVE_CONFIG_UPDATED_EVENT = 'arlo:detective-config-updated';

export const DETECTIVES = [
  { id: 'scout', name: 'Scout', shape: 'circle', color: '#3b82f6', role: 'Desktop operator', personality: 'Practical, attentive, and action-oriented.', description: 'Handles everyday desktop tasks and keeps workflows moving.', skills: ['Open apps', 'Organize desktop', 'Focus Mode'], permittedTools: ['open_app', 'close_app', 'create_desktop_item', 'rename_desktop_item', 'delete_desktop_item', 'show_desktop', 'get_local_time', 'get_battery_status', 'set_focus_mode', 'search_files', 'get_system_info', 'arrange_window', 'take_camera_photo', 'record_camera_video'] },
  { id: 'ember', name: 'Ember', shape: 'circle', color: '#f97316', role: 'Workflow automation', personality: 'Energetic, concise, and systematic.', description: 'Turns clear requests into reliable multi-step desktop workflows.', skills: ['Open apps', 'Create folders', 'Arrange windows'], permittedTools: ['open_app', 'close_app', 'create_desktop_item', 'show_desktop', 'set_focus_mode', 'arrange_window'] },
  { id: 'mint', name: 'Mint', shape: 'square', color: '#50b8a6', role: 'Researcher', personality: 'Curious, careful, and evidence-minded.', description: 'Finds information in the user-authorized locations and reports what it actually finds.', skills: ['Search authorized files', 'System information', 'Open apps'], permittedTools: ['open_app', 'search_files', 'get_system_info', 'get_local_time', 'get_battery_status'] },
  { id: 'ruby', name: 'Ruby', shape: 'pill', color: '#ef3d4b', role: 'File investigator', personality: 'Methodical, discreet, and detail-oriented.', description: 'Locates files in authorized folders and helps organize the virtual desktop.', skills: ['Search authorized files', 'Create folders', 'Open apps'], permittedTools: ['open_app', 'search_files', 'create_desktop_item', 'rename_desktop_item', 'delete_desktop_item', 'show_desktop'] },
  { id: 'petal', name: 'Petal', shape: 'triangle', color: '#ec4899', role: 'Creative assistant', personality: 'Warm, imaginative, and encouraging.', description: 'Helps with creative workflows while staying grounded in available ARLO OS actions.', skills: ['Open creative apps', 'Focus Mode', 'Arrange windows'], permittedTools: ['open_app', 'set_focus_mode', 'arrange_window', 'get_local_time'] },
  { id: 'violet', name: 'Violet', shape: 'gem', color: '#8b5cf6', role: 'Coding assistant', personality: 'Analytical, precise, and collaborative.', description: 'Helps launch development tools and arrange the coding workspace.', skills: ['Open Code Studio', 'System information', 'Arrange windows'], permittedTools: ['open_app', 'get_system_info', 'search_files', 'arrange_window'] },
  { id: 'sunny', name: 'Sunny', shape: 'cloud', color: '#f59e0b', role: 'Wellbeing guide', personality: 'Positive, calm, and supportive.', description: 'Helps create a calmer desktop routine and configure Focus Mode.', skills: ['Focus Mode', 'Time and battery', 'Open apps'], permittedTools: ['open_app', 'set_focus_mode', 'get_local_time', 'get_battery_status', 'show_desktop'] },
  { id: 'mocha', name: 'Mocha', shape: 'drop', color: '#9a7046', role: 'Desktop organizer', personality: 'Patient, tidy, and dependable.', description: 'Finds authorized files, creates desktop folders, and arranges open ARLO windows.', skills: ['Search authorized files', 'Create folders', 'Arrange windows'], permittedTools: ['open_app', 'search_files', 'create_desktop_item', 'rename_desktop_item', 'delete_desktop_item', 'show_desktop', 'arrange_window'] },
] as const;

export const SCOUT_COLORS = [
  { id: 'black', label: 'Black', swatch: '#1f2937', idleFile: 'black' },
  { id: 'blue', label: 'Blue', swatch: '#3b82f6', idleFile: 'blue' },
  { id: 'green', label: 'Green', swatch: '#22a06b', idleFile: 'green' },
  { id: 'orange', label: 'Orange', swatch: '#f97316', idleFile: 'orange' },
  { id: 'pink', label: 'Pink', swatch: '#ec4899', idleFile: 'pink' },
  { id: 'purple', label: 'Purple', swatch: '#8b5cf6', idleFile: 'voilet' },
  { id: 'red', label: 'Red', swatch: '#ef4444', idleFile: 'red' },
  { id: 'white', label: 'White', swatch: '#e5e7eb', idleFile: 'white' },
  { id: 'yellow', label: 'Yellow', swatch: '#eab308', idleFile: 'yellow' },
] as const;

export const EMBER_COLORS = [
  { id: 'black', label: 'Black', swatch: '#1f2937', idleFile: 'black' },
  { id: 'blue', label: 'Blue', swatch: '#3b82f6', idleFile: 'blue' },
  { id: 'green', label: 'Green', swatch: '#22a06b', idleFile: 'green' },
  { id: 'orange', label: 'Orange', swatch: '#f97316', idleFile: 'organge' },
  { id: 'pink', label: 'Pink', swatch: '#ec4899', idleFile: 'pink' },
  { id: 'purple', label: 'Purple', swatch: '#8b5cf6', idleFile: 'purple' },
  { id: 'white', label: 'White', swatch: '#e5e7eb', idleFile: 'white' },
  { id: 'yellow', label: 'Yellow', swatch: '#eab308', idleFile: 'yellow' },
] as const;

export const MINT_COLORS = [
  { id: 'black', label: 'Black', swatch: '#1f2937', animationFile: 'black' },
  { id: 'blue', label: 'Blue', swatch: '#3b82f6', animationFile: 'blue' },
  { id: 'green', label: 'Green', swatch: '#22a06b', animationFile: 'green' },
  { id: 'orange', label: 'Orange', swatch: '#f97316', animationFile: 'orange' },
  { id: 'pink', label: 'Pink', swatch: '#ec4899', animationFile: 'purple-pink' },
  { id: 'purple', label: 'Purple', swatch: '#8b5cf6', animationFile: 'purple' },
  { id: 'red', label: 'Red', swatch: '#ef4444', animationFile: 'red' },
  { id: 'white', label: 'White', swatch: '#e5e7eb', animationFile: 'white' },
  { id: 'yellow', label: 'Yellow', swatch: '#eab308', animationFile: 'yellow' },
] as const;

export const RUBY_COLORS = [
  { id: 'black', label: 'Black', swatch: '#1f2937' },
  { id: 'blue', label: 'Blue', swatch: '#3b82f6' },
  { id: 'green', label: 'Green', swatch: '#22a06b' },
  { id: 'orange', label: 'Orange', swatch: '#f97316' },
  { id: 'pink', label: 'Pink', swatch: '#ec4899' },
  { id: 'purple', label: 'Purple', swatch: '#8b5cf6' },
  { id: 'red', label: 'Red', swatch: '#ef4444' },
  { id: 'white', label: 'White', swatch: '#e5e7eb' },
  { id: 'yellow', label: 'Yellow', swatch: '#eab308' },
] as const;

export const PETAL_COLORS = [
  { id: 'black', label: 'Black', swatch: '#1f2937' },
  { id: 'blue', label: 'Blue', swatch: '#3b82f6' },
  { id: 'green', label: 'Green', swatch: '#22a06b' },
  { id: 'orange', label: 'Orange', swatch: '#f97316' },
  { id: 'pink', label: 'Pink', swatch: '#ec4899' },
  { id: 'purple', label: 'Purple', swatch: '#8b5cf6' },
  { id: 'red', label: 'Red', swatch: '#ef4444' },
  { id: 'white', label: 'White', swatch: '#e5e7eb' },
  { id: 'yellow', label: 'Yellow', swatch: '#eab308' },
] as const;

export const VIOLET_COLORS = [
  { id: 'black', label: 'Black', swatch: '#1f2937' },
  { id: 'blue', label: 'Blue', swatch: '#3b82f6' },
  { id: 'green', label: 'Green', swatch: '#22a06b' },
  { id: 'orange', label: 'Orange', swatch: '#f97316' },
  { id: 'pink', label: 'Pink', swatch: '#ec4899' },
  { id: 'purple', label: 'Purple', swatch: '#8b5cf6' },
  { id: 'red', label: 'Red', swatch: '#ef4444' },
  { id: 'white', label: 'White', swatch: '#e5e7eb' },
  { id: 'yellow', label: 'Yellow', swatch: '#eab308' },
] as const;

export const SUNNY_COLORS = [
  { id: 'black', label: 'Black', swatch: '#1f2937' },
  { id: 'blue', label: 'Blue', swatch: '#3b82f6' },
  { id: 'green', label: 'Green', swatch: '#22a06b' },
  { id: 'orange', label: 'Orange', swatch: '#f97316' },
  { id: 'pink', label: 'Pink', swatch: '#ec4899' },
  { id: 'purple', label: 'Purple', swatch: '#8b5cf6' },
  { id: 'red', label: 'Red', swatch: '#ef4444' },
  { id: 'white', label: 'White', swatch: '#e5e7eb' },
  { id: 'yellow', label: 'Yellow', swatch: '#eab308' },
] as const;

export const MOCHA_COLORS = [
  { id: 'black', label: 'Black', swatch: '#1f2937' },
  { id: 'blue', label: 'Blue', swatch: '#3b82f6' },
  { id: 'green', label: 'Green', swatch: '#22a06b' },
  { id: 'orange', label: 'Orange', swatch: '#f97316' },
  { id: 'pink', label: 'Pink', swatch: '#ec4899' },
  { id: 'purple', label: 'Purple', swatch: '#8b5cf6' },
  { id: 'red', label: 'Red', swatch: '#ef4444' },
  { id: 'white', label: 'White', swatch: '#e5e7eb' },
  { id: 'yellow', label: 'Yellow', swatch: '#eab308' },
] as const;

export type DetectiveId = (typeof DETECTIVES)[number]['id'];
export type DetectiveShape = (typeof DETECTIVES)[number]['shape'];
export const SUPPORTED_DETECTIVE_TOOLS = [
  'open_app',
  'close_app',
  'create_desktop_item',
  'show_desktop',
  'get_local_time',
  'get_battery_status',
  'set_focus_mode',
  'search_files',
  'get_system_info',
  'arrange_window',
  'rename_desktop_item',
  'delete_desktop_item',
  'take_camera_photo',
  'record_camera_video',
] as const;
export type DetectiveToolName = (typeof SUPPORTED_DETECTIVE_TOOLS)[number];
export type ScoutColor = (typeof SCOUT_COLORS)[number]['id'];
export type EmberColor = (typeof EMBER_COLORS)[number]['id'];
export type MintColor = (typeof MINT_COLORS)[number]['id'];
export type RubyColor = (typeof RUBY_COLORS)[number]['id'];
export type PetalColor = (typeof PETAL_COLORS)[number]['id'];
export type VioletColor = (typeof VIOLET_COLORS)[number]['id'];
export type SunnyColor = (typeof SUNNY_COLORS)[number]['id'];
export type MochaColor = (typeof MOCHA_COLORS)[number]['id'];

export interface CustomDetective {
  id: string;
  name: string;
  instructions: string;
  description: string;
  avatarId: DetectiveId;
  permittedTools: DetectiveToolName[];
}

export interface DetectiveConfig {
  selectedId: string;
  scoutColor: ScoutColor;
  emberColor: EmberColor;
  mintColor: MintColor;
  rubyColor: RubyColor;
  petalColor: PetalColor;
  violetColor: VioletColor;
  sunnyColor: SunnyColor;
  mochaColor: MochaColor;
  customDetectives: CustomDetective[];
  colors: Record<DetectiveId, string>;
}

export const defaultDetectiveConfig = (): DetectiveConfig => ({
  selectedId: DETECTIVES[0].id,
  scoutColor: 'blue',
  emberColor: 'orange',
  mintColor: 'green',
  rubyColor: 'red',
  petalColor: 'pink',
  violetColor: 'purple',
  sunnyColor: 'yellow',
  mochaColor: 'orange',
  customDetectives: [],
  colors: Object.fromEntries(DETECTIVES.map(detective => [detective.id, detective.color])) as Record<DetectiveId, string>,
});

export const getScoutAnimationPath = (color: ScoutColor) =>
  `./detectives/scout/scoutAnimations/scout-${color}.gif`;

export const getScoutIdlePath = (color: ScoutColor) => {
  const variant = SCOUT_COLORS.find(option => option.id === color) ?? SCOUT_COLORS[1];
  return `./detectives/scout/scoutIdile/scout-idile-${variant.idleFile}.gif`;
};

export const getEmberAnimationPath = (color: EmberColor) =>
  `./detectives/ember/emberAnimations/ember-${color}.gif`;

export const getEmberIdlePath = (color: EmberColor) => {
  const variant = EMBER_COLORS.find(option => option.id === color) ?? EMBER_COLORS[3];
  return `./detectives/ember/emberIdile/ember-${variant.idleFile}-idile.gif`;
};

export const getMintAnimationPath = (color: MintColor) => {
  const variant = MINT_COLORS.find(option => option.id === color) ?? MINT_COLORS[2];
  return `./detectives/mint/mintAnimations/mint-${variant.animationFile}.gif`;
};

export const getMintIdlePath = (color: MintColor) =>
  `./detectives/mint/mintIdile/mint-${color}-idile.gif`;

export const getRubyAnimationPath = (color: RubyColor) =>
  `./detectives/ruby/rubyAnimations/ruby-${color}.gif`;

export const getRubyIdlePath = (color: RubyColor) =>
  `./detectives/ruby/rubyIdile/ruby-${color}-idile.gif`;

export const getPetalAnimationPath = (color: PetalColor) =>
  `./detectives/petal/petalAnimations/petal-${color}.gif`;

export const getPetalIdlePath = (color: PetalColor) =>
  `./detectives/petal/petalIdile/petal-${color}-idile.gif`;

export const getVioletAnimationPath = (color: VioletColor) =>
  `./detectives/violet/violetAnimations/violet-${color}.gif`;

export const getVioletIdlePath = (color: VioletColor) =>
  `./detectives/violet/violetIdile/violet-${color}-idile.gif`;

export const getSunnyAnimationPath = (color: SunnyColor) =>
  `./detectives/sunny/sunnyAnimations/sunny-${color}.gif`;

export const getSunnyIdlePath = (color: SunnyColor) =>
  `./detectives/sunny/sunnyIdile/sunny-${color}-idile.gif`;

export const getMochaAnimationPath = (color: MochaColor) =>
  `./detectives/mocha/mochaAnimations/mocha-${color}.gif`;

export const getMochaIdlePath = (color: MochaColor) =>
  `./detectives/mocha/mochaIdile/mocha-${color}-idile.gif`;

export const isScoutColor = (value: unknown): value is ScoutColor =>
  SCOUT_COLORS.some(option => option.id === value);

export const isEmberColor = (value: unknown): value is EmberColor =>
  EMBER_COLORS.some(option => option.id === value);

export const isMintColor = (value: unknown): value is MintColor =>
  MINT_COLORS.some(option => option.id === value);

export const isRubyColor = (value: unknown): value is RubyColor =>
  RUBY_COLORS.some(option => option.id === value);

export const isPetalColor = (value: unknown): value is PetalColor =>
  PETAL_COLORS.some(option => option.id === value);

export const isVioletColor = (value: unknown): value is VioletColor =>
  VIOLET_COLORS.some(option => option.id === value);

export const isSunnyColor = (value: unknown): value is SunnyColor =>
  SUNNY_COLORS.some(option => option.id === value);

export const isMochaColor = (value: unknown): value is MochaColor =>
  MOCHA_COLORS.some(option => option.id === value);

const isDetectiveToolName = (value: unknown): value is DetectiveToolName =>
  typeof value === 'string' && (SUPPORTED_DETECTIVE_TOOLS as readonly string[]).includes(value);

const sanitizeCustomDetectives = (value: unknown): CustomDetective[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const candidate = item as Partial<CustomDetective>;
    const avatarId = DETECTIVES.find(detective => detective.id === candidate.avatarId)?.id ?? DETECTIVES[0].id;
    const id = typeof candidate.id === 'string' && /^custom-[\w-]{1,40}$/.test(candidate.id)
      ? candidate.id
      : `custom-${index + 1}`;
    if (typeof candidate.name !== 'string' || !candidate.name.trim() || candidate.name.length > 32) return [];
    return [{
      id,
      name: candidate.name.trim(),
      instructions: typeof candidate.instructions === 'string' ? candidate.instructions.slice(0, 1000) : '',
      description: typeof candidate.description === 'string' ? candidate.description.slice(0, 160) : '',
      avatarId,
      permittedTools: Array.isArray(candidate.permittedTools)
        ? [...new Set(candidate.permittedTools.filter(isDetectiveToolName))]
        : [],
    }];
  }).slice(0, 12);
};

const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);

export const loadDetectiveConfig = (): DetectiveConfig => {
  const fallback = defaultDetectiveConfig();
  try {
    const stored = localStorage.getItem(DETECTIVE_CONFIG_KEY);
    if (!stored) return fallback;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return fallback;
    const value = parsed as Partial<DetectiveConfig>;
    const colors = typeof value.colors === 'object' && value.colors !== null
      ? value.colors as Partial<Record<DetectiveId, unknown>>
      : {};
    return {
      selectedId: typeof value.selectedId === 'string' &&
        (DETECTIVES.some(detective => detective.id === value.selectedId) ||
          sanitizeCustomDetectives(value.customDetectives).some(detective => detective.id === value.selectedId))
        ? value.selectedId
        : fallback.selectedId,
      scoutColor: SCOUT_COLORS.some(option => option.id === value.scoutColor)
        ? value.scoutColor!
        : fallback.scoutColor,
      emberColor: isEmberColor(value.emberColor) ? value.emberColor : fallback.emberColor,
      mintColor: isMintColor(value.mintColor) ? value.mintColor : fallback.mintColor,
      rubyColor: isRubyColor(value.rubyColor) ? value.rubyColor : fallback.rubyColor,
      petalColor: isPetalColor(value.petalColor) ? value.petalColor : fallback.petalColor,
      violetColor: isVioletColor(value.violetColor) ? value.violetColor : fallback.violetColor,
      sunnyColor: isSunnyColor(value.sunnyColor) ? value.sunnyColor : fallback.sunnyColor,
      mochaColor: isMochaColor(value.mochaColor) ? value.mochaColor : fallback.mochaColor,
      customDetectives: sanitizeCustomDetectives(value.customDetectives),
      colors: Object.fromEntries(DETECTIVES.map(detective => [
        detective.id,
        isHexColor(colors[detective.id]) ? colors[detective.id] : fallback.colors[detective.id],
      ])) as Record<DetectiveId, string>,
    };
  } catch (error) {
    console.warn('[Detectives] Could not load detective preferences:', error);
    return fallback;
  }
};

export const saveDetectiveConfig = (config: DetectiveConfig) => {
  try {
    localStorage.setItem(DETECTIVE_CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(DETECTIVE_CONFIG_UPDATED_EVENT, { detail: config }));
  } catch (error) {
    console.error('[Detectives] Could not save detective preferences:', error);
  }
};

export const getDetective = (config: DetectiveConfig) => {
  const custom = config.customDetectives.find(detective => detective.id === config.selectedId);
  if (custom) {
    const avatar = DETECTIVES.find(detective => detective.id === custom.avatarId) ?? DETECTIVES[0];
    return {
      ...avatar,
      ...custom,
      color: config.colors[avatar.id],
      role: 'Custom detective',
      personality: custom.instructions || 'A user-configured ARLO OS assistant.',
      skills: custom.permittedTools,
    };
  }
  return DETECTIVES.find(detective => detective.id === config.selectedId) ?? DETECTIVES[0];
};
