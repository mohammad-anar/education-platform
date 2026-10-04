/**
 * Date and Time utility helpers
 */
export const dateHelper = {
  /**
   * Add minutes to a date
   */
  addMinutes: (minutes: number, date: Date = new Date()): Date => {
    return new Date(date.getTime() + minutes * 60 * 1000);
  },

  /**
   * Add hours to a date
   */
  addHours: (hours: number, date: Date = new Date()): Date => {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
  },

  /**
   * Add days to a date
   */
  addDays: (days: number, date: Date = new Date()): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Check if a date has passed
   */
  isExpired: (expiryDate: Date | string | number): boolean => {
    const date = new Date(expiryDate);
    return date.getTime() < Date.now();
  },

  /**
   * Get remaining seconds until a specific target date
   */
  getRemainingSeconds: (targetDate: Date | string | number): number => {
    const diffMs = new Date(targetDate).getTime() - Date.now();
    return Math.max(0, Math.floor(diffMs / 1000));
  },

  /**
   * Format date into readable string (YYYY-MM-DD HH:mm:ss)
   */
  formatDateTime: (date: Date = new Date()): string => {
    return date.toISOString().replace("T", " ").substring(0, 19);
  },
};

export default dateHelper;
