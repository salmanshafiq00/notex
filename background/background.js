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
      console.error('Error retrieving settings:', chrome.runtime.lastError);
      return;
    }
    
    if (!result.settings) {
      chrome.storage.local.set({ 'settings': defaultSettings }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving default settings:', chrome.runtime.lastError);
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
            console.error('Error updating settings:', chrome.runtime.lastError);
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
      console.error('Error removing context menus:', chrome.runtime.lastError);
      return;
    }
    
    chrome.contextMenus.create({
      id: "clipContent",
      title: "Clip selected content",
      contexts: ["selection"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error creating context menu:', chrome.runtime.lastError);
      }
    });
  });
}

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "clipContent") {
    chrome.tabs.sendMessage(tab.id, { action: "clipSelection" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Communication error:", chrome.runtime.lastError.message);
        return;
      }
      
      if (response && response.success) {
        // Store the selection data temporarily
        chrome.storage.local.get(['settings'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error retrieving settings:', chrome.runtime.lastError);
            return;
          }
          
          const isSync = result.settings?.syncStorage || false;
          const storage = isSync ? chrome.storage.sync : chrome.storage.local;
          
          storage.set({ "tempSelection": response.data }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error storing selection:', chrome.runtime.lastError);
              return;
            }
            // Open the popup
            chrome.action.openPopup();
          });
        });
      } else if (response) {
        console.error('Error clipping selection:', response.error);
      }
    });
  }
});

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === "clip-selection") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('Error querying active tab:', chrome.runtime.lastError);
        return;
      }
      
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "clipSelection" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Communication error:", chrome.runtime.lastError.message);
            return;
          }
          
          if (response && response.success) {
            // Store the selection data temporarily
            chrome.storage.local.get(['settings'], (result) => {
              if (chrome.runtime.lastError) {
                console.error('Error retrieving settings:', chrome.runtime.lastError);
                return;
              }
              
              const isSync = result.settings?.syncStorage || false;
              const storage = isSync ? chrome.storage.sync : chrome.storage.local;
              
              storage.set({ "tempSelection": response.data }, () => {
                if (chrome.runtime.lastError) {
                  console.error('Error storing selection:', chrome.runtime.lastError);
                  return;
                }
                // Open the popup
                chrome.action.openPopup();
              });
            });
          } else if (response) {
            console.error('Error clipping selection:', response.error);
          }
        });
      } else {
        console.error('No active tab found');
      }
    });
  }
});