/**
 * Calculate end date from current date and term in months while preserving the day
 * @param {number} term - Loan term in months
 * @param {string|Date} startDate - Starting date (optional, defaults to current date)
 * @returns {Date} - End date
 */
export const calculateEndDate = (term, startDate) => {
  if (!term || isNaN(term)) {
    term = 0;
  }
  
  // Use provided start date or current date
  const start = startDate ? new Date(startDate) : new Date();
  
  // Create a new date object to avoid modifying the original
  const endDate = new Date(start);
  
  // Get the current day to preserve it
  const day = start.getDate();
  
  // Add the months
  endDate.setMonth(start.getMonth() + term);
  
  // Handle month length differences (e.g., Jan 31 + 1 month should be Feb 28/29)
  // If the day changed, it means the month doesn't have that day, set to last day
  if (endDate.getDate() !== day) {
    // Set to the 1st of the next month
    endDate.setDate(1);
    // Then go back 1 day to get the last day of the current month
    endDate.setDate(0);
  }
  
  return endDate;
};

/**
 * Format date as YYYY-MM-DD for input elements
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDateForInput = (date) => {
  if (!date) return "";
  
  // If date is a string, convert to Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if valid date
  if (isNaN(dateObj.getTime())) return "";
  
  const year = dateObj.getFullYear();
  // getMonth() is 0-indexed, so add 1
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Calculate term in months between two dates while preserving the day
 * @param {string|Date} endDate - End date
 * @param {string|Date} startDate - Starting date (optional, defaults to current date)
 * @returns {number} - Term in months
 */
export const calculateTermFromEndDate = (endDate, startDate) => {
  if (!endDate) return 0;
  
  // Use provided start date or current date
  const start = startDate ? new Date(startDate) : new Date();
  const end = new Date(endDate);
  
  // If invalid date, return 0
  if (isNaN(end.getTime())) return 0;
  
  // Calculate months difference (years * 12 + months)
  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months += end.getMonth() - start.getMonth();
  
  // Adjust for day differences
  // If end day is earlier in the month than start day, subtract 1 month
  // If end day is later in the month than start day, add no adjustment
  if (end.getDate() < start.getDate()) {
    months--;
  }
  
  // If same day of month, no adjustment needed
  
  // Ensure at least 0 for past dates
  return Math.max(0, months);
};