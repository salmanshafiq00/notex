// Listen for the keyboard shortcut via background script message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "clipSelection") {
    clipSelectedContent();
  }
  return true;
});

// Function to clip the selected content with styles
function clipSelectedContent() {
  const selection = window.getSelection();
  
  if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
    // No valid selection
    return;
  }
  
  // Get the selected range
  const range = selection.getRangeAt(0);
  
  // Create a temporary container to hold the selected content with styles
  const container = document.createElement('div');
  container.appendChild(range.cloneContents());
  
  // Capture the original styles
  const selectedHTML = container.innerHTML;
  const selectedText = selection.toString();
  
  // Open the popup with the selected content
  chrome.runtime.sendMessage({
    action: "openPopup",
    data: {
      html: selectedHTML,
      text: selectedText
    }
  });
}

// Add a context menu item
chrome.runtime.sendMessage({ action: "createContextMenu" });

// Listen for clicks on our custom context menu
document.addEventListener('click', (event) => {
  // Add any custom click handling if needed
});