// Helper Functions

// Normalize price - treat 1 as 0 (complimentary item indicator)
export const normalizePrice = (price) => {
  return price === 1 ? 0 : price;
};

// Format currency
export const formatCurrency = (amount, symbol = '₹') => {
  return `${symbol}${normalizePrice(amount).toFixed(2)}`;
};

// Format currency without decimals
export const formatCurrencyShort = (amount, symbol = '₹') => {
  return `${symbol}${Math.round(normalizePrice(amount))}`;
};

// Natural sort for table numbers (T-1, T-2, T-10, etc.)
export const naturalSortKey = (a, b) => {
  const regex = /(\d+)/g;
  const aParts = a.split(regex);
  const bParts = b.split(regex);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || '';
    const bPart = bParts[i] || '';
    
    const aNum = parseInt(aPart, 10);
    const bNum = parseInt(bPart, 10);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) return aNum - bNum;
    } else {
      if (aPart !== bPart) return aPart.localeCompare(bPart);
    }
  }
  return 0;
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default {
  normalizePrice,
  formatCurrency,
  formatCurrencyShort,
  naturalSortKey,
  truncateText,
};
