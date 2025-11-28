// Options page script
let snippets = [];
let savedPrompts = [];

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupTabs();
  setupEventListeners();
  renderSnippets();
  renderPrompts();
});

// Load data from storage
async function loadData() {
  const data = await chrome.storage.sync.get(['snippets', 'savedPrompts']);
  snippets = data.snippets || [];
  savedPrompts = data.savedPrompts || [];
}

// Setup tab navigation
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Update active tab button
      document.querySelector('.tab-btn.active').classList.remove('active');
      e.target.classList.add('active');
      
      // Update active tab content
      document.querySelector('.tab-content.active').classList.remove('active');
      document.getElementById(`${e.target.dataset.tab}-tab`).classList.add('active');
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  // Add snippet
  document.getElementById('add-snippet-btn').addEventListener('click', addSnippet);
  document.getElementById('new-snippet-text').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSnippet();
  });
  
  // Add prompt
  document.getElementById('add-prompt-btn').addEventListener('click', addPrompt);
  
  // Export/Import
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-btn').addEventListener('click', importData);
  document.getElementById('reset-btn').addEventListener('click', resetData);
}

// Render snippets list
function renderSnippets() {
  const container = document.getElementById('snippets-list');
  
  if (snippets.length === 0) {
    container.innerHTML = '<div class="empty-state">No snippets yet. Add your first one above!</div>';
    return;
  }
  
  // Sort by usage count
  const sorted = [...snippets].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  
  container.innerHTML = sorted.map(snippet => `
    <div class="item" data-id="${snippet.id}">
      <div class="item-content">
        <span class="item-text">${escapeHtml(snippet.text)}</span>
        <span class="item-category">${snippet.category}</span>
        <span class="item-usage">Used ${snippet.usageCount || 0} times</span>
      </div>
      <div class="item-actions">
        <button class="edit-btn" data-id="${snippet.id}">Edit</button>
        <button class="delete-btn" data-id="${snippet.id}">Delete</button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editSnippet(btn.dataset.id));
  });
  
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteSnippet(btn.dataset.id));
  });
}

// Add new snippet
async function addSnippet() {
  const textInput = document.getElementById('new-snippet-text');
  const categoryInput = document.getElementById('new-snippet-category');
  
  if (!textInput.value.trim()) {
    showStatus('Please enter snippet text', true);
    return;
  }
  
  const newSnippet = {
    id: Date.now().toString(),
    text: textInput.value.trim(),
    category: categoryInput.value,
    usageCount: 0
  };
  
  snippets.push(newSnippet);
  await chrome.storage.sync.set({ snippets });
  
  textInput.value = '';
  renderSnippets();
  showStatus('Snippet added successfully!');
}

// Edit snippet
function editSnippet(id) {
  const snippet = snippets.find(s => s.id === id);
  if (!snippet) return;
  
  const item = document.querySelector(`.item[data-id="${id}"]`);
  item.classList.add('editing');
  
  item.innerHTML = `
    <div class="edit-form">
      <input type="text" class="edit-text" value="${escapeHtml(snippet.text)}" />
      <select class="edit-category">
        <option value="role" ${snippet.category === 'role' ? 'selected' : ''}>Role</option>
        <option value="mood" ${snippet.category === 'mood' ? 'selected' : ''}>Mood</option>
        <option value="brevity" ${snippet.category === 'brevity' ? 'selected' : ''}>Brevity</option>
        <option value="format" ${snippet.category === 'format' ? 'selected' : ''}>Format</option>
        <option value="meta" ${snippet.category === 'meta' ? 'selected' : ''}>Meta</option>
        <option value="custom" ${snippet.category === 'custom' ? 'selected' : ''}>Custom</option>
      </select>
      <button class="save-edit">Save</button>
      <button class="cancel-edit">Cancel</button>
    </div>
  `;
  
  item.querySelector('.save-edit').addEventListener('click', async () => {
    snippet.text = item.querySelector('.edit-text').value;
    snippet.category = item.querySelector('.edit-category').value;
    await chrome.storage.sync.set({ snippets });
    renderSnippets();
    showStatus('Snippet updated!');
  });
  
  item.querySelector('.cancel-edit').addEventListener('click', renderSnippets);
}

// Delete snippet
async function deleteSnippet(id) {
  if (!confirm('Delete this snippet?')) return;
  
  snippets = snippets.filter(s => s.id !== id);
  await chrome.storage.sync.set({ snippets });
  renderSnippets();
  showStatus('Snippet deleted');
}

// Render prompts list
function renderPrompts() {
  const container = document.getElementById('prompts-list');
  
  if (savedPrompts.length === 0) {
    container.innerHTML = '<div class="empty-state">No saved prompts yet. Add your first one above!</div>';
    return;
  }
  
  // Sort by usage count
  const sorted = [...savedPrompts].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  
  container.innerHTML = sorted.map(prompt => {
    const truncated = prompt.text.length > 100 
      ? prompt.text.substring(0, 100) + '...'
      : prompt.text;
    
    return `
      <div class="item" data-id="${prompt.id}">
        <div class="item-content">
          <span class="item-text">${escapeHtml(truncated)}</span>
          <span class="item-usage">Used ${prompt.usageCount || 0} times</span>
        </div>
        <div class="item-actions">
          <button class="edit-prompt-btn" data-id="${prompt.id}">Edit</button>
          <button class="delete-prompt-btn" data-id="${prompt.id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');
  
  // Add event listeners
  container.querySelectorAll('.edit-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => editPrompt(btn.dataset.id));
  });
  
  container.querySelectorAll('.delete-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => deletePrompt(btn.dataset.id));
  });
}

// Add new prompt
async function addPrompt() {
  const textInput = document.getElementById('new-prompt-text');
  
  if (!textInput.value.trim()) {
    showStatus('Please enter prompt text', true);
    return;
  }
  
  const newPrompt = {
    id: Date.now().toString(),
    text: textInput.value.trim(),
    usageCount: 0,
    createdAt: new Date().toISOString()
  };
  
  savedPrompts.push(newPrompt);
  await chrome.storage.sync.set({ savedPrompts });
  
  textInput.value = '';
  renderPrompts();
  showStatus('Prompt saved successfully!');
}

// Edit prompt
function editPrompt(id) {
  const prompt = savedPrompts.find(p => p.id === id);
  if (!prompt) return;
  
  const item = document.querySelector(`#prompts-list .item[data-id="${id}"]`);
  item.classList.add('editing');
  
  item.innerHTML = `
    <div class="edit-form">
      <textarea class="edit-text" rows="3">${escapeHtml(prompt.text)}</textarea>
      <button class="save-edit">Save</button>
      <button class="cancel-edit">Cancel</button>
    </div>
  `;
  
  item.querySelector('.save-edit').addEventListener('click', async () => {
    prompt.text = item.querySelector('.edit-text').value;
    await chrome.storage.sync.set({ savedPrompts });
    renderPrompts();
    showStatus('Prompt updated!');
  });
  
  item.querySelector('.cancel-edit').addEventListener('click', renderPrompts);
}

// Delete prompt
async function deletePrompt(id) {
  if (!confirm('Delete this saved prompt?')) return;
  
  savedPrompts = savedPrompts.filter(p => p.id !== id);
  await chrome.storage.sync.set({ savedPrompts });
  renderPrompts();
  showStatus('Prompt deleted');
}

// Export data
function exportData() {
  const data = {
    snippets,
    savedPrompts,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompt-drawer-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showStatus('Data exported successfully!');
}

// Import data
function importData() {
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];
  
  if (!file) {
    showStatus('Please select a file to import', true);
    return;
  }
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!data.snippets || !data.savedPrompts) {
        throw new Error('Invalid backup file format');
      }
      
      snippets = data.snippets;
      savedPrompts = data.savedPrompts;
      
      await chrome.storage.sync.set({ snippets, savedPrompts });
      
      renderSnippets();
      renderPrompts();
      showStatus('Data imported successfully!');
      fileInput.value = '';
    } catch (error) {
      showStatus('Failed to import: ' + error.message, true);
    }
  };
  
  reader.readAsText(file);
}

// Reset data
async function resetData() {
  if (!confirm('Are you sure? This will delete ALL custom snippets and saved prompts!')) return;
  
  const defaultSnippets = [
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
  
  snippets = defaultSnippets;
  savedPrompts = [];
  
  await chrome.storage.sync.set({ snippets, savedPrompts });
  
  renderSnippets();
  renderPrompts();
  showStatus('Reset to defaults complete');
}

// Show status message
function showStatus(message, isError = false) {
  const status = document.getElementById('status-message');
  status.textContent = message;
  status.classList.add('show');
  
  if (isError) {
    status.classList.add('error');
  } else {
    status.classList.remove('error');
  }
  
  setTimeout(() => {
    status.classList.remove('show');
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
