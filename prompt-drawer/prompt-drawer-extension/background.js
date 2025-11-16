// Background service worker for Prompt Drawer

// Initialize default prompts on install
chrome.runtime.onInstalled.addListener(async () => {
  const defaultPrompts = {
    snippets: [
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
    ],
    savedPrompts: []
  };

  const existing = await chrome.storage.sync.get(['snippets', 'savedPrompts']);
  if (!existing.snippets) {
    await chrome.storage.sync.set(defaultPrompts);
  }

  // Create context menus
  chrome.contextMenus.create({
    id: 'save-snippet',
    title: 'Save to Prompt Drawer (snippet)',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'save-prompt',
    title: 'Save to Prompt Drawer (full prompt)',
    contexts: ['selection']
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggleDrawer' });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const selectedText = info.selectionText;
  
  if (info.menuItemId === 'save-snippet' || info.menuItemId === 'save-prompt') {
    const isSnippet = info.menuItemId === 'save-snippet';
    
    // Get existing data
    const data = await chrome.storage.sync.get(['snippets', 'savedPrompts']);
    const snippets = data.snippets || [];
    const savedPrompts = data.savedPrompts || [];
    
    if (isSnippet) {
      // Add as a snippet
      const newSnippet = {
        id: Date.now().toString(),
        text: selectedText,
        category: 'custom',
        usageCount: 0
      };
      snippets.push(newSnippet);
      await chrome.storage.sync.set({ snippets });
    } else {
      // Add as a saved prompt
      const newPrompt = {
        id: Date.now().toString(),
        text: selectedText,
        usageCount: 0,
        createdAt: new Date().toISOString()
      };
      savedPrompts.push(newPrompt);
      await chrome.storage.sync.set({ savedPrompts });
    }
    
    // Notify the content script
    chrome.tabs.sendMessage(tab.id, { 
      action: 'itemSaved',
      type: isSnippet ? 'snippet' : 'prompt'
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openOptions') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});
