/**
 * Timezone utilities to ensure consistent IST (Asia/Kolkata) handling across the application.
 */

/**
 * Returns the current date (or a specific date) formatted as YYYY-MM-DD in Indian Standard Time.
 * This is crucial because new Date().toISOString().split('T')[0] returns the UTC date,
 * which is inaccurate for India between 12:00 AM and 5:30 AM.
 * 
 * @param {Date|string|number} [dateInput] - Optional date to format. Defaults to current time.
 * @returns {string} YYYY-MM-DD format based on IST.
 */
export const getISTDateString = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  
  // Format to string precisely in Asia/Kolkata
  const istFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return istFormatter.format(date);
};

/**
 * Returns the time formatted as HH:MM AM/PM in Indian Standard Time.
 * 
 * @param {Date|string|number} [dateInput] - Optional date to format. Defaults to current time.
 * @returns {string} e.g. "09:30 AM" based on IST.
 */
export const getISTTimeString = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toUpperCase();
};

/**
 * Returns a human readable date formatted as DD Month YYYY in IST.
 * 
 * @param {Date|string|number} [dateInput] - Optional date to format. Defaults to current time.
 * @returns {string} e.g. "6 June 2026" based on IST.
 */
export const getISTDisplayDate = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Calculates days remaining from today to a future date, considering IST dates.
 */
export const getDaysDifferenceIST = (futureDateStr) => {
  const todayISTStr = getISTDateString();
  const today = new Date(todayISTStr);
  const future = new Date(futureDateStr);
  
  return Math.ceil((future - today) / (1000 * 60 * 60 * 24));
};

/**
 * Returns the date of Sunday for the current week based on IST.
 */
export const getStartOfWeekIST = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return getISTDateString(date);
};

/**
 * Returns a short human readable date formatted as DD MMM YYYY in IST.
 * 
 * @param {Date|string|number} [dateInput] - Optional date to format. Defaults to current time.
 * @returns {string} e.g. "10 Jul 2026" based on IST.
 */
export const getISTShortDisplayDate = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).replace(/,/, '');
};

