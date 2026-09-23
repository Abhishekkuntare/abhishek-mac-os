declare global {
  interface Window {
    electronAPI?: {
      minimize: () => Promise<void>;
      maximize: () => Promise<boolean>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      openExternal: (url: string) => Promise<unknown>;
      platform: () => Promise<string>;
      version: () => Promise<string>;
    };
  }
}
export {};
