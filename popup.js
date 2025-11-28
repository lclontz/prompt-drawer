// Popup script for Prompt Drawer
let snippets = [];
let savedPrompts = [];
let activeFilter = 'all';
let colorScheme = 'original';

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  await loadColorScheme();
  setupEventListeners();
  renderSnippets();
  renderSavedPrompts();
});

// Load data from storage
async function loadData() {
  const data = await chrome.storage.sync.get(['snippets', 'savedPrompts']);
  
  snippets = data.snippets || [
    { id: '1', text: 'Act as a [ROLE]', category: 'role', usageCount: 0 },
    { id: '2', text: 'No fluff!', category: 'brevity', usageCount: 0 },
    { id: '3', text: 'Be concise and direct', category: 'brevity', usageCount: 0 },
    { id: '4', text: 'Explain like I\'m 5', category: 'mood', usageCount: 0 },
    { id: '5', text: 'Use a professional tone', category: 'mood', usageCount: 0 },
    { id: '6', text: 'Be creative and playful', category: 'mood', usageCount: 0 },
    { id: '7', text: 'Act as a technical writer', category: 'role', usageCount: 0 },
    { id: '8', text: 'Act as a copywriter', category: 'role', usageCount: 0 },
    { id: '9', text: 'Output as JSON', category: 'format', usageCount: 0 },
    { id: '10', text: 'Use markdown formatting', category: 'format', usageCount: 0 },
    { id: '11', text: 'Show your reasoning step by step', category: 'meta', usageCount: 0 },
    { id: '12', text: 'Ask clarifying questions first', category: 'meta', usageCount: 0 }
  ];
  
  savedPrompts = data.savedPrompts || [];
}

// Load and apply color scheme
async function loadColorScheme() {
  const data = await chrome.storage.sync.get(['colorScheme']);
  colorScheme = data.colorScheme || 'sapphire';
  document.getElementById('color-scheme-selector').value = colorScheme;
  applyColorScheme(colorScheme);
}

// Setup event listeners
function setupEventListeners() {
  // Color scheme selector
  document.getElementById('color-scheme-selector').addEventListener('change', async (e) => {
    colorScheme = e.target.value;
    applyColorScheme(colorScheme);
    await chrome.storage.sync.set({ colorScheme });
  });
  
  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Category filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelector('.filter-btn.active').classList.remove('active');
      e.target.classList.add('active');
      activeFilter = e.target.dataset.category;
      renderSnippets();
    });
  });
  
  // Saved prompts dropdown
  document.getElementById('saved-prompts-dropdown').addEventListener('change', async (e) => {
    if (e.target.value) {
      const prompt = savedPrompts.find(p => p.id === e.target.value);
      if (prompt) {
        await insertText(prompt.text);
        // Update usage count
        prompt.usageCount = (prompt.usageCount || 0) + 1;
        await chrome.storage.sync.set({ savedPrompts });
        e.target.value = ''; // Reset dropdown
      }
    }
  });
}

// Render snippets
function renderSnippets() {
  const container = document.getElementById('snippets-list');
  
  // Filter snippets
  let filtered = activeFilter === 'all' 
    ? snippets 
    : snippets.filter(s => s.category === activeFilter);
  
  // Sort by usage count (most used first)
  filtered.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>📝 No snippets in this category</p>
        <p>Add some from the settings!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filtered.map(snippet => `
    <div class="snippet-item" data-id="${snippet.id}">
      <span class="snippet-text">${escapeHtml(snippet.text)}</span>
      <div class="snippet-meta">
        <span class="snippet-usage">${snippet.usageCount || 0}×</span>
        <span class="snippet-category">${snippet.category}</span>
      </div>
      <div class="snippet-actions">
        <button class="action-btn edit-btn" data-id="${snippet.id}" title="Edit">✏️</button>
        <button class="action-btn delete-btn" data-id="${snippet.id}" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');
  
  // Add click handlers for snippets
  container.querySelectorAll('.snippet-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      // Don't trigger on action button clicks
      if (e.target.classList.contains('action-btn')) return;
      
      const snippetId = item.dataset.id;
      const snippet = snippets.find(s => s.id === snippetId);
      if (snippet) {
        await insertText(snippet.text);
        // Update usage count
        snippet.usageCount = (snippet.usageCount || 0) + 1;
        await chrome.storage.sync.set({ snippets });
        renderSnippets(); // Re-render to update count display
      }
    });
  });
  
  // Add handlers for edit buttons
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      editSnippet(id);
    });
  });
  
  // Add handlers for delete buttons
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (confirm('Delete this snippet?')) {
        snippets = snippets.filter(s => s.id !== id);
        await chrome.storage.sync.set({ snippets });
        renderSnippets();
        showNotification('Snippet deleted');
      }
    });
  });
}

// Edit snippet inline
function editSnippet(id) {
  const snippet = snippets.find(s => s.id === id);
  if (!snippet) return;
  
  const item = document.querySelector(`.snippet-item[data-id="${id}"]`);
  item.classList.add('editing');
  item.innerHTML = `
    <input type="text" class="edit-input" value="${escapeHtml(snippet.text)}" />
    <div class="edit-controls">
      <button class="save-edit-btn">Save</button>
      <button class="cancel-edit-btn">Cancel</button>
    </div>
  `;
  
  const input = item.querySelector('.edit-input');
  input.focus();
  input.select();
  
  item.querySelector('.save-edit-btn').addEventListener('click', async () => {
    snippet.text = input.value;
    await chrome.storage.sync.set({ snippets });
    renderSnippets();
    showNotification('Snippet updated');
  });
  
  item.querySelector('.cancel-edit-btn').addEventListener('click', () => {
    renderSnippets();
  });
}

// Render saved prompts dropdown
function renderSavedPrompts() {
  const dropdown = document.getElementById('saved-prompts-dropdown');
  
  if (savedPrompts.length === 0) {
    dropdown.innerHTML = '<option value="">-- No saved prompts --</option>';
    return;
  }
  
  // Sort by usage count
  const sorted = [...savedPrompts].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  
  dropdown.innerHTML = '<option value="">-- Saved Prompts --</option>' +
    sorted.map(prompt => {
      const truncated = prompt.text.length > 40 
        ? prompt.text.substring(0, 40) + '...'
        : prompt.text;
      const usage = prompt.usageCount || 0;
      return `<option value="${prompt.id}">${truncated} (${usage}×)</option>`;
    }).join('');
}

// Insert text at cursor or copy to clipboard
async function insertText(text) {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Try to insert text using scripting API
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (textToInsert) => {
        // Find the active element
        const activeElement = document.activeElement;
        
        // Check if it's an input or textarea
        if (activeElement && 
            (activeElement.tagName === 'INPUT' || 
             activeElement.tagName === 'TEXTAREA' || 
             activeElement.contentEditable === 'true')) {
          
          if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            // For input/textarea elements
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const value = activeElement.value;
            
            activeElement.value = value.substring(0, start) + textToInsert + value.substring(end);
            activeElement.selectionStart = activeElement.selectionEnd = start + textToInsert.length;
            
            // Trigger events for frameworks like React
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            activeElement.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Focus the element
            activeElement.focus();
            return { success: true, method: 'direct' };
          } else if (activeElement.contentEditable === 'true') {
            // For contenteditable elements
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(textToInsert));
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Trigger input event
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            activeElement.focus();
            return { success: true, method: 'contenteditable' };
          }
        }
        
        // No suitable element found
        return { success: false, method: 'none' };
      },
      args: [text]
    });
    
    if (results[0].result.success) {
      showNotification('✅ Text inserted!');
    } else {
      // Fallback to clipboard
      await copyToClipboard(text);
    }
  } catch (error) {
    console.error('Error inserting text:', error);
    // Fallback to clipboard
    await copyToClipboard(text);
  }
}

// Copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('📋 Copied to clipboard! Press Ctrl/Cmd+V to paste.');
  } catch (error) {
    console.error('Failed to copy:', error);
    showNotification('❌ Failed to copy text');
  }
}

// Show notification
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
