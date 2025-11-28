// Subaru Crosstrek-inspired color schemes
const colorSchemes = {
  original: {
    name: 'Original Blue',
    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
    primary: '#1976d2',
    secondary: '#42a5f5'
  },
  wilderness: {
    name: 'Wilderness Green',
    background: 'linear-gradient(135deg, #2d5016 0%, #7cb342 100%)',
    primary: '#2d5016',
    secondary: '#7cb342'
  },
  autumn: {
    name: 'Autumn Blaze',
    background: 'linear-gradient(135deg, #d84315 0%, #ff8a65 100%)',
    primary: '#d84315',
    secondary: '#ff8a65'
  },
  desert: {
    name: 'Desert Khaki',
    background: 'linear-gradient(135deg, #8d6e63 0%, #bcaaa4 100%)',
    primary: '#8d6e63',
    secondary: '#bcaaa4'
  },
  ocean: {
    name: 'Ocean Blue',
    background: 'linear-gradient(135deg, #0277bd 0%, #29b6f6 100%)',
    primary: '#0277bd',
    secondary: '#29b6f6'
  },
  magnetite: {
    name: 'Magnetite Gray',
    background: 'linear-gradient(135deg, #37474f 0%, #78909c 100%)',
    primary: '#37474f',
    secondary: '#78909c'
  },
  crimson: {
    name: 'Crimson Red',
    background: 'linear-gradient(135deg, #c62828 0%, #ef5350 100%)',
    primary: '#c62828',
    secondary: '#ef5350'
  },
  sunset: {
    name: 'Sunset Orange',
    background: 'linear-gradient(135deg, #ef6c00 0%, #ffb74d 100%)',
    primary: '#ef6c00',
    secondary: '#ffb74d'
  },
  cool: {
    name: 'Cool Gray Khaki',
    background: 'linear-gradient(135deg, #546e7a 0%, #90a4ae 100%)',
    primary: '#546e7a',
    secondary: '#90a4ae'
  },
  crystal: {
    name: 'Crystal White',
    background: 'linear-gradient(135deg, #cfd8dc 0%, #eceff1 100%)',
    primary: '#cfd8dc',
    secondary: '#eceff1',
    textColor: '#37474f'
  },
  sapphire: {
    name: 'Sapphire Blue',
    background: 'linear-gradient(135deg, #1565c0 0%, #64b5f6 100%)',
    primary: '#1565c0',
    secondary: '#64b5f6'
  },
  black: {
    name: 'Crystal Black',
    background: 'linear-gradient(135deg, #212121 0%, #616161 100%)',
    primary: '#212121',
    secondary: '#616161'
  }
};

// Function to apply a color scheme
function applyColorScheme(scheme) {
  const root = document.documentElement;
  const schemeData = colorSchemes[scheme];
  
  if (schemeData) {
    root.style.setProperty('--drawer-bg', schemeData.background);
    root.style.setProperty('--primary-color', schemeData.primary);
    root.style.setProperty('--secondary-color', schemeData.secondary);
    
    // Handle text color for light themes
    if (schemeData.textColor) {
      document.body.style.color = schemeData.textColor;
      // Update all text elements
      document.querySelectorAll('.drawer-header h3, .snippet-text, .filter-btn, #saved-prompts-dropdown, #color-scheme-selector').forEach(el => {
        el.style.color = schemeData.textColor;
      });
    } else {
      document.body.style.color = 'white';
      // Reset text elements to white
      document.querySelectorAll('.drawer-header h3, .snippet-text, .filter-btn, #saved-prompts-dropdown, #color-scheme-selector').forEach(el => {
        el.style.color = 'white';
      });
    }
  }
}
