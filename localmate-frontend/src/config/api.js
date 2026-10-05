const rawUrl = import.meta.env.VITE_API_URL;
let apiUrl = (rawUrl && typeof rawUrl === 'string' && rawUrl.trim() !== '') 
  ? rawUrl.trim().replace(/\/+$/, '') 
  : 'http://localhost:8080';

// If the page is hosted on HTTPS but API URL is HTTP (non-localhost), auto-upgrade to prevent Mixed Content block
if (typeof window !== 'undefined') {
  if (window.location.protocol === 'https:' && apiUrl.startsWith('http://') && !apiUrl.includes('localhost')) {
    apiUrl = apiUrl.replace(/^http:\/\//, 'https://');
  }
}

export const API_BASE_URL = apiUrl;
export default API_BASE_URL;
