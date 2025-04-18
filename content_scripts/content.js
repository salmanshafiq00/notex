// Function to clip the selected content with styles
function clipSelectedContent() {
  const selection = window.getSelection();
  
  if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
    // No valid selection
    return { success: false };
  }
  
  // Get the selected range
  const range = selection.getRangeAt(0);
  
  // Create a temporary container to hold the selected content with styles
  const container = document.createElement('div');
  container.appendChild(range.cloneContents());
  
  // Capture the original styles
  const selectedHTML = container.innerHTML;
  const selectedText = selection.toString();
  
  // Get storage preference
  chrome.storage.local.get(['settings'], (result) => {
    const isSync = result.settings?.syncStorage || false;
    
    // Send the selection data to background script
    chrome.runtime.sendMessage({
      action: "openPopup",
      useSync: isSync,
      data: {
        html: selectedHTML,
        text: selectedText
      }
    });
  });
  
  return { 
    success: true,
    data: {
      html: selectedHTML,
      text: selectedText
    }
  };
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "clipSelection") {
    const result = clipSelectedContent();
    sendResponse(result);

    // Always send a response
    sendResponse({success: true, data: selectionData});
    return true;
  }
  return true;
});

// Initialize the content script
function init() {
  console.log("Content Clipper content script initialized");
  
  // Add keyboard shortcut listener
  document.addEventListener('keydown', (event) => {
    // Check for Ctrl+Shift+S or Command+Shift+S (Mac)
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 's') {
      event.preventDefault();
      const result = clipSelectedContent();
      if (result.success) {
        // Visual feedback for successful clip
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Create a feedback element
          const feedback = document.createElement('div');
          feedback.textContent = 'Content clipped!';
          feedback.style.position = 'fixed';
          feedback.style.left = `${rect.left + rect.width/2 - 75}px`;
          feedback.style.top = `${rect.top - 40}px`;
          feedback.style.backgroundColor = 'rgba(74, 134, 232, 0.95)';
          feedback.style.color = 'white';
          feedback.style.padding = '8px 16px';
          feedback.style.borderRadius = '4px';
          feedback.style.zIndex = '10000';
          feedback.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
          feedback.style.fontFamily = 'Arial, sans-serif';
          feedback.style.fontSize = '14px';
          feedback.style.transition = 'opacity 0.3s';
          
          document.body.appendChild(feedback);
          
          setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
              document.body.removeChild(feedback);
            }, 300);
          }, 1500);
        }
      }
    }
  });
}

init();