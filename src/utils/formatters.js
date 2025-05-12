/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  /**
   * Format a number as a percentage
   * @param {number} value - The value to format as percentage
   * @param {number} decimalPlaces - Number of decimal places to show
   * @returns {string} - Formatted percentage string
   */
  export const formatPercentage = (value, decimalPlaces = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(value / 100);
  };
  
  /**
   * Format a date as a string
   * @param {Date} date - The date to format
   * @param {string} format - Format string ('short', 'medium', 'long')
   * @returns {string} - Formatted date string
   */
  export const formatDate = (date, format = 'medium') => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: format
    }).format(new Date(date));
  };
  
  /**
   * Format a number with commas
   * @param {number} number - The number to format
   * @param {number} decimalPlaces - Number of decimal places to show
   * @returns {string} - Formatted number string
   */
  export const formatNumber = (number, decimalPlaces = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(number);
  };