// Create the context menu on install
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
  initializeSettings();
});

// Initialize default settings if not present
function initializeSettings() {
  const defaultSettings = {
    syncStorage: false,
    theme: 'light',
    fontSize: 'medium',
    categories: ['General', 'Work', 'Personal', 'Research', 'Ideas']
  };
  
  chrome.storage.local.get(['settings'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving settings:', chrome.runtime.lastError.message);
      return;
    }
    
    if (!result.settings) {
      chrome.storage.local.set({ 'settings': defaultSettings }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving default settings:', chrome.runtime.lastError.message);
        }
      });
    } else {
      // Make sure required categories exist
      let modified = false;
      if (!result.settings.categories) {
        result.settings.categories = defaultSettings.categories;
        modified = true;
      } else if (!result.settings.categories.includes('General')) {
        result.settings.categories.unshift('General');
        modified = true;
      }
      
      if (modified) {
        chrome.storage.local.set({ 'settings': result.settings }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error updating settings:', chrome.runtime.lastError.message);
          }
        });
      }
    }
  });
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) {
    console.error('Invalid message received:', message);
    sendResponse({ success: false, error: 'Invalid message format' });
    return true;
  }
  
  try {
    if (message.action === "createContextMenu") {
      createContextMenu();
      sendResponse({ success: true });
    } else if (message.action === "openPopup") {
      if (!message.data || !message.data.html || !message.data.text) {
        throw new Error('Invalid selection data');
      }
      
      // Store the selection data temporarily
      const storage = message.useSync ? chrome.storage.sync : chrome.storage.local;
      storage.set({ "tempSelection": message.data }, () => {
        if (chrome.runtime.lastError) {
          throw new Error(`Error storing selection: ${chrome.runtime.lastError.message}`);
        }
        // Open the popup
        chrome.action.openPopup();
        sendResponse({ success: true });
      });
    } else if (message.action === "contentScriptLoaded") {
      // Just acknowledge receipt
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('Error processing message:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true;
});

// Create context menu for right-click functionality
function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.error('Error removing context menus:', chrome.runtime.lastError.message);
      return;
    }
    
    chrome.contextMenus.create({
      id: "clipContent",
      title: "Clip selected content",
      contexts: ["selection"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error creating context menu:', chrome.runtime.lastError.message);
      }
    });
  });
}

// Fixed error handling for tab communication
function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        // Check for error immediately after the callback
        const error = chrome.runtime.lastError;
        if (error) {
          console.error('Communication error:', error.message);
          resolve({ success: false, error: error.message });
        } else {
          resolve(response || { success: false, error: 'No response' });
        }
      });
    } catch (err) {
      console.error('Error sending message:', err);
      resolve({ success: false, error: err.message });
    }
  });
}

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "clipContent" && tab && tab.id) {
    const response = await sendMessageToTab(tab.id, { action: "clipSelection" });
    
    if (response && response.success) {
      // Store the selection data temporarily
      try {
        const result = await chrome.storage.local.get(['settings']);
        
        const isSync = result.settings?.syncStorage || false;
        const storage = isSync ? chrome.storage.sync : chrome.storage.local;
        
        await storage.set({ "tempSelection": response.data });
        // Open the popup
        chrome.action.openPopup();
      } catch (error) {
        console.error('Error processing selection:', error.message);
      }
    } else if (response) {
      console.error('Error clipping selection:', response.error);
    }
  }
});

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "clip-selection") {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tabs && tabs[0] && tabs[0].id) {
        const response = await sendMessageToTab(tabs[0].id, { action: "clipSelection" });
        
        if (response && response.success) {
          // Store the selection data temporarily
          const result = await chrome.storage.local.get(['settings']);
          
          const isSync = result.settings?.syncStorage || false;
          const storage = isSync ? chrome.storage.sync : chrome.storage.local;
          
          await storage.set({ "tempSelection": response.data });
          // Open the popup
          chrome.action.openPopup();
        } else if (response) {
          console.error('Error clipping selection:', response.error);
        }
      } else {
        console.error('No active tab found');
      }
    } catch (error) {
      console.error('Error processing keyboard shortcut:', error.message);
    }
  }
});