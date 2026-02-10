const prefix = (level: string) => `[timegen:${level}]`;

export const logger = {
  info: (...args: any[]) => console.log(prefix('info'), ...args),
  warn: (...args: any[]) => console.warn(prefix('warn'), ...args),
  error: (...args: any[]) => console.error(prefix('error'), ...args)
};

export default logger;
