// Options page script

let snippets = [];
let savedPrompts = [];
let editingSnippetId = null;
let editingPromptId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Apply saved color scheme
  const currentScheme = await getCurrentColorScheme();
  applyColorScheme(currentScheme);
  
  await loadData();
  renderColorSchemes();
  renderSnippets();
  renderPrompts();
  setupEventListeners();
});

async function loadData() {
  const data = await chrome.storage.sync.get(['snippets', 'savedPrompts']);
  snippets = data.snippets || [];
  savedPrompts = data.savedPrompts || [];
}

async function renderColorSchemes() {
  const container = document.getElementById('color-schemes');
  const currentScheme = await getCurrentColorScheme();
  
  container.innerHTML = Object.entries(COLOR_SCHEMES).map(([id, scheme]) => `
    <div class="color-scheme-card ${id === currentScheme ? 'active' : ''}" data-scheme="${id}" style="${id === currentScheme ? `border-color: ${scheme.primary}; background: ${scheme.accent};` : ''}">
      <div class="color-scheme-preview ${scheme.dark ? 'dark-text' : ''}" style="background: linear-gradient(135deg, ${scheme.primary} 0%, ${scheme.secondary} 100%);">
        ${id === currentScheme ? '✓' : ''}
      </div>
      <div class="color-scheme-name">${scheme.name}</div>
    </div>
  `).join('');
  
  // Add click handlers
  container.querySelectorAll('.color-scheme-card').forEach(card => {
    card.addEventListener('click', async () => {
      const schemeId = card.dataset.scheme;
      await setColorScheme(schemeId);
      await renderColorSchemes();
      applyColorScheme(schemeId);
      showNotification(`Color scheme changed to ${COLOR_SCHEMES[schemeId].name}!`);
    });
  });
}

async function saveData() {
  await chrome.storage.sync.set({ snippets, savedPrompts });
}

function setupEventListeners() {
  // Add buttons
  document.getElementById('add-snippet-btn').addEventListener('click', () => {
    openSnippetModal();
  });
  
  document.getElementById('add-prompt-btn').addEventListener('click', () => {
    openPromptModal();
  });

  // Modal forms
  document.getElementById('snippet-form').addEventListener('submit', handleSnippetSubmit);
  document.getElementById('prompt-form').addEventListener('submit', handlePromptSubmit);
  
  document.getElementById('cancel-snippet').addEventListener('click', closeSnippetModal);
  document.getElementById('cancel-prompt').addEventListener('click', closePromptModal);

  // Action buttons
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', importData);
  document.getElementById('reset-btn').addEventListener('click', resetToDefaults);

  // Close modals on background click
  document.getElementById('snippet-modal').addEventListener('click', (e) => {
    if (e.target.id === 'snippet-modal') closeSnippetModal();
  });
  document.getElementById('prompt-modal').addEventListener('click', (e) => {
    if (e.target.id === 'prompt-modal') closePromptModal();
  });
}

function renderSnippets() {
  const container = document.getElementById('snippets-list');
  
  if (snippets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">No snippets yet. Add your first one!</div>
      </div>
    `;
    return;
  }

  // Sort by usage count
  const sortedSnippets = [...snippets].sort((a, b) => b.usageCount - a.usageCount);

  container.innerHTML = sortedSnippets.map(snippet => `
    <div class="item-card">
      <div class="item-content">
        <div class="item-text">${escapeHtml(snippet.text)}</div>
        <div class="item-meta">
          <span class="category-badge">${snippet.category}</span>
          <span class="usage-count">📊 Used ${snippet.usageCount} times</span>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-small snippet-edit-btn" data-id="${snippet.id}">Edit</button>
        <button class="btn btn-danger btn-small snippet-delete-btn" data-id="${snippet.id}">Delete</button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  container.querySelectorAll('.snippet-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editSnippet(btn.dataset.id));
  });
  container.querySelectorAll('.snippet-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteSnippet(btn.dataset.id));
  });
}

function renderPrompts() {
  const container = document.getElementById('prompts-list');
  
  if (savedPrompts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💾</div>
        <div class="empty-state-text">No saved prompts yet. Add your first one!</div>
      </div>
    `;
    return;
  }

  // Sort by usage count
  const sortedPrompts = [...savedPrompts].sort((a, b) => b.usageCount - a.usageCount);

  container.innerHTML = sortedPrompts.map(prompt => {
    const preview = prompt.text.length > 100 ? prompt.text.substring(0, 100) + '...' : prompt.text;
    return `
      <div class="item-card">
        <div class="item-content">
          <div class="item-text">${escapeHtml(preview)}</div>
          <div class="item-meta">
            <span class="usage-count">📊 Used ${prompt.usageCount} times</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn btn-secondary btn-small prompt-edit-btn" data-id="${prompt.id}">Edit</button>
          <button class="btn btn-danger btn-small prompt-delete-btn" data-id="${prompt.id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');
  
  // Add event listeners
  container.querySelectorAll('.prompt-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editPrompt(btn.dataset.id));
  });
  container.querySelectorAll('.prompt-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deletePrompt(btn.dataset.id));
  });
}

// Snippet Modal
function openSnippetModal(snippet = null) {
  editingSnippetId = snippet?.id || null;
  const modal = document.getElementById('snippet-modal');
  const title = document.getElementById('snippet-modal-title');
  const form = document.getElementById('snippet-form');
  
  title.textContent = snippet ? 'Edit Snippet' : 'Add Snippet';
  
  if (snippet) {
    document.getElementById('snippet-text').value = snippet.text;
    document.getElementById('snippet-category').value = snippet.category;
  } else {
    form.reset();
  }
  
  modal.classList.add('active');
}

function closeSnippetModal() {
  document.getElementById('snippet-modal').classList.remove('active');
  editingSnippetId = null;
}

async function handleSnippetSubmit(e) {
  e.preventDefault();
  
  const text = document.getElementById('snippet-text').value.trim();
  const category = document.getElementById('snippet-category').value;
  
  if (editingSnippetId) {
    // Edit existing
    const snippet = snippets.find(s => s.id === editingSnippetId);
    if (snippet) {
      snippet.text = text;
      snippet.category = category;
    }
  } else {
    // Add new
    snippets.push({
      id: Date.now().toString(),
      text,
      category,
      usageCount: 0
    });
  }
  
  await saveData();
  renderSnippets();
  closeSnippetModal();
  showNotification(editingSnippetId ? 'Snippet updated!' : 'Snippet added!');
}

function editSnippet(id) {
  const snippet = snippets.find(s => s.id === id);
  if (snippet) openSnippetModal(snippet);
}

async function deleteSnippet(id) {
  if (!confirm('Are you sure you want to delete this snippet?')) return;
  
  snippets = snippets.filter(s => s.id !== id);
  await saveData();
  renderSnippets();
  showNotification('Snippet deleted!');
};

// Prompt Modal
function openPromptModal(prompt = null) {
  editingPromptId = prompt?.id || null;
  const modal = document.getElementById('prompt-modal');
  const title = document.getElementById('prompt-modal-title');
  const form = document.getElementById('prompt-form');
  
  title.textContent = prompt ? 'Edit Prompt' : 'Add Prompt';
  
  if (prompt) {
    document.getElementById('prompt-text').value = prompt.text;
  } else {
    form.reset();
  }
  
  modal.classList.add('active');
}

function closePromptModal() {
  document.getElementById('prompt-modal').classList.remove('active');
  editingPromptId = null;
}

async function handlePromptSubmit(e) {
  e.preventDefault();
  
  const text = document.getElementById('prompt-text').value.trim();
  
  if (editingPromptId) {
    // Edit existing
    const prompt = savedPrompts.find(p => p.id === editingPromptId);
    if (prompt) {
      prompt.text = text;
    }
  } else {
    // Add new
    savedPrompts.push({
      id: Date.now().toString(),
      text,
      usageCount: 0,
      createdAt: new Date().toISOString()
    });
  }
  
  await saveData();
  renderPrompts();
  closePromptModal();
  showNotification(editingPromptId ? 'Prompt updated!' : 'Prompt added!');
}

function editPrompt(id) {
  const prompt = savedPrompts.find(p => p.id === id);
  if (prompt) openPromptModal(prompt);
}

async function deletePrompt(id) {
  if (!confirm('Are you sure you want to delete this prompt?')) return;
  
  savedPrompts = savedPrompts.filter(p => p.id !== id);
  await saveData();
  renderPrompts();
  showNotification('Prompt deleted!');
}

// Export/Import/Reset
function exportData() {
  const data = {
    snippets,
    savedPrompts,
    exportedAt: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompt-drawer-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('Data exported successfully!');
}

async function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.snippets && !data.savedPrompts) {
      throw new Error('Invalid backup file');
    }
    
    const confirmed = confirm('This will replace all your current data. Continue?');
    if (!confirmed) return;
    
    snippets = data.snippets || [];
    savedPrompts = data.savedPrompts || [];
    
    await saveData();
    renderSnippets();
    renderPrompts();
    showNotification('Data imported successfully!');
  } catch (error) {
    alert('Error importing data: ' + error.message);
  }
  
  e.target.value = ''; // Reset file input
}

async function resetToDefaults() {
  const confirmed = confirm('This will reset all data to defaults. Are you sure?');
  if (!confirmed) return;
  
  snippets = [
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
  savedPrompts = [];
  
  await saveData();
  renderSnippets();
  renderPrompts();
  showNotification('Reset to defaults!');
}

// Utility
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}
