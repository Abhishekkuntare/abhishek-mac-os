export const resolveGeminiApiKey = (environmentKey, dotenvKey) =>
  environmentKey?.trim() || dotenvKey?.trim() || '';
