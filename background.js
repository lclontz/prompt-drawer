// Background service worker for Prompt Drawer

// Initialize default data on install
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
  
  // Check if data already exists
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
      
      // Show notification
      showTabNotification(tab.id, '✅ Snippet saved to Prompt Drawer!');
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
      
      // Show notification
      showTabNotification(tab.id, '✅ Prompt saved to Prompt Drawer!');
    }
  }
});

// Show notification in the tab
async function showTabNotification(tabId, message) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (msg) => {
        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = msg;
        notification.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #1565c0 0%, #64b5f6 100%);
          color: white;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 999999;
          animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `;
        document.head.appendChild(style);
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
          notification.style.animation = 'slideIn 0.3s ease-out reverse';
          setTimeout(() => {
            notification.remove();
            style.remove();
          }, 300);
        }, 3000);
      },
      args: [message]
    });
  } catch (error) {
    console.error('Could not show notification:', error);
  }
}
