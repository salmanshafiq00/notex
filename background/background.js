// Create the context menu on install
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
  
  // Initialize default settings if not present
  const defaultSettings = {
    syncStorage: false,
    theme: 'light',
    fontSize: 'medium',
    categories: ['Work', 'Personal', 'Research', 'Ideas']
  };
  
  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({ 'settings': defaultSettings });
    }
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "createContextMenu") {
    createContextMenu();
  } else if (message.action === "openPopup") {
    // Store the selection data temporarily
    chrome.storage.local.set({ "tempSelection": message.data }, () => {
      // Open the popup
      chrome.action.openPopup();
    });
  }
  return true;
});

// Create context menu for right-click functionality
function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "clipContent",
      title: "Clip selected content",
      contexts: ["selection"]
    });
  });
}

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "clipContent") {
    chrome.tabs.sendMessage(tab.id, { action: "clipSelection" });
  }
});

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === "clip-selection") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "clipSelection" });
      }
    });
  }
});