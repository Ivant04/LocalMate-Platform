/**
 * Utility functions for currency formatting in VND
 */

export const formatVND = (amount, fallback = '0 ₫') => {
  if (amount === undefined || amount === null || amount === '') return fallback;
  let num = Number(amount);
  if (isNaN(num)) return fallback;
  // Auto-convert old small USD values if encountered
  if (num > 0 && num < 1000) {
    num = Math.round(num * 25000);
  }
  return Math.round(num).toLocaleString('vi-VN') + ' ₫';
};

export const formatRateVND = (amount, fallback = '0 ₫/giờ') => {
  if (amount === undefined || amount === null || amount === '') return fallback;
  let num = Number(amount);
  if (isNaN(num)) return fallback;
  if (num > 0 && num < 1000) {
    num = Math.round(num * 25000);
  }
  return Math.round(num).toLocaleString('vi-VN') + ' ₫/giờ';
};

export const parseVND = (str) => {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const cleaned = String(str).replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
};
