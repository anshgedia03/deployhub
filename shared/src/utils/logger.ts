export class Logger {
  static info(context: string, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] [${context}] ${message}`, meta || '');
  }

  static error(context: string, message: string, error?: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] [${context}] ${message}`, error || '');
  }

  static warn(context: string, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] [${context}] ${message}`, meta || '');
  }
}
