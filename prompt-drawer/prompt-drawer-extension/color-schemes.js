// Color schemes based on Subaru Crosstrek colorways
const COLOR_SCHEMES = {
  'sapphire-blue': {
    name: 'Sapphire Blue Pearl',
    primary: '#0C4B8E',
    secondary: '#154A7C',
    accent: '#E8F2F9'
  },
  'magnetite-gray': {
    name: 'Magnetite Gray Metallic',
    primary: '#4A4A4A',
    secondary: '#2D2D2D',
    accent: '#E8E8E8'
  },
  'crystal-white': {
    name: 'Crystal White Pearl',
    primary: '#E8E8E8',
    secondary: '#CECECE',
    accent: '#F5F5F5',
    dark: true // White scheme needs dark text
  },
  'ice-silver': {
    name: 'Ice Silver Metallic',
    primary: '#A8B5BF',
    secondary: '#8A96A0',
    accent: '#E5EDF2'
  },
  'crystal-black': {
    name: 'Crystal Black Silica',
    primary: '#1A1A1A',
    secondary: '#0A0A0A',
    accent: '#333333'
  },
  'venetian-red': {
    name: 'Venetian Red Pearl',
    primary: '#7D1F1F',
    secondary: '#5A1414',
    accent: '#F2E5E5'
  },
  'plasma-yellow': {
    name: 'Plasma Yellow Pearl',
    primary: '#E6A500',
    secondary: '#C28900',
    accent: '#FFF4D6',
    dark: true // Yellow scheme needs dark text
  },
  'desert-khaki': {
    name: 'Desert Khaki',
    primary: '#8B7355',
    secondary: '#6B5840',
    accent: '#F0EBE5'
  },
  'cool-gray': {
    name: 'Cool Gray Khaki',
    primary: '#6B7C7E',
    secondary: '#4F5E60',
    accent: '#E5ECEC'
  },
  'cascade-green': {
    name: 'Cascade Green Silica',
    primary: '#2C5C4F',
    secondary: '#1E443A',
    accent: '#E0EBE8'
  },
  'horizon-blue': {
    name: 'Horizon Blue Pearl',
    primary: '#4A7C9E',
    secondary: '#345A75',
    accent: '#E5F0F7'
  },
  'pure-red': {
    name: 'Pure Red',
    primary: '#C72A2A',
    secondary: '#9E2121',
    accent: '#FFE5E5'
  }
};

// Get the current color scheme from storage
async function getCurrentColorScheme() {
  const data = await chrome.storage.sync.get(['colorScheme']);
  return data.colorScheme || 'sapphire-blue';
}

// Set the color scheme
async function setColorScheme(schemeId) {
  await chrome.storage.sync.set({ colorScheme: schemeId });
}

// Apply color scheme to elements
function applyColorScheme(schemeId) {
  const scheme = COLOR_SCHEMES[schemeId];
  if (!scheme) return;

  const root = document.documentElement;
  root.style.setProperty('--primary-color', scheme.primary);
  root.style.setProperty('--secondary-color', scheme.secondary);
  root.style.setProperty('--accent-color', scheme.accent);
  root.style.setProperty('--text-color', scheme.dark ? '#333333' : '#FFFFFF');
  root.style.setProperty('--text-color-secondary', scheme.dark ? '#666666' : 'rgba(255, 255, 255, 0.8)');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COLOR_SCHEMES, getCurrentColorScheme, setColorScheme, applyColorScheme };
}
