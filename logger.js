import { sendErrorLog } from './utils/errorLogger.js';

export function logError(error, context = {}) {
  console.error(error);
  sendErrorLog(error, context).catch(() => {});
}

export default logError;