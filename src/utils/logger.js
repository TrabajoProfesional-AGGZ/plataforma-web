const activo = process.env.NODE_ENV !== 'production';

export const logger = {
  log: (...args) => { if (activo) console.log(...args); },
  warn: (...args) => { if (activo) console.warn(...args); },
  error: (...args) => { if (activo) console.error(...args); },
};
