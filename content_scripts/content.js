// Function to sanitize HTML for security
function sanitizeHtml(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove potentially dangerous elements/attributes
  const scripts = tempDiv.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove on* attributes
  const allElements = tempDiv.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const attributes = allElements[i].attributes;
    for (let j = attributes.length - 1; j >= 0; j--) {
      const attrName = attributes[j].name;
      if (attrName.startsWith('on') || attrName === 'href' && attributes[j].value.startsWith('javascript:')) {
        allElements[i].removeAttribute(attrName);
      }
    }
  }
  
  return tempDiv.innerHTML;
}

// Function to clip the selected content with styles
function clipSelectedContent() {
  try {
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
      return { 
        success: false, 
        error: 'No text selected'
      };
    }
    
    // Get the selected range
    const range = selection.getRangeAt(0);
    
    // Create a temporary container to hold the selected content with styles
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    
    // Capture and sanitize the content
    const selectedHTML = sanitizeHtml(container.innerHTML);
    const selectedText = selection.toString();
    
    // Validate the content isn't empty after sanitization
    if (!selectedHTML.trim() || !selectedText.trim()) {
      return {
        success: false,
        error: 'Selected content is empty after sanitization'
      };
    }
    
    const selectionData = {
      html: selectedHTML,
      text: selectedText,
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    };
    
    // Get storage preference and send the data
    chrome.storage.local.get(['settings'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error retrieving settings:', chrome.runtime.lastError);
        showFeedback('Error saving content', 'error');
        return;
      }
      
      const isSync = result.settings?.syncStorage || false;
      
      // Send the selection data to background script
      chrome.runtime.sendMessage({
        action: "openPopup",
        useSync: isSync,
        data: selectionData
      }, response => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          showFeedback('Error saving content', 'error');
        } else if (response && response.success) {
          showFeedback('Content clipped!', 'success');
        } else if (response) {
          showFeedback('Error: ' + (response.error || 'Unknown error'), 'error');
        }
      });
    });
    
    return { 
      success: true,
      data: selectionData
    };
  } catch (error) {
    console.error('Error clipping content:', error);
    showFeedback('Error clipping content', 'error');
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to show visual feedback
function showFeedback(message, type = 'success') {
  const selection = window.getSelection();
  let top, left;
  
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    left = rect.left + rect.width/2 - 75;
    top = rect.top - 40;
  } else {
    // Default position if no selection range
    left = window.innerWidth / 2 - 75;
    top = 40;
  }
  
  // Create a feedback element
  const feedback = document.createElement('div');
  feedback.textContent = message;
  feedback.style.position = 'fixed';
  feedback.style.left = `${left}px`;
  feedback.style.top = `${top}px`;
  feedback.style.backgroundColor = type === 'success' ? 'rgba(74, 134, 232, 0.95)' : 'rgba(232, 74, 74, 0.95)';
  feedback.style.color = 'white';
  feedback.style.padding = '8px 16px';
  feedback.style.borderRadius = '4px';
  feedback.style.zIndex = '2147483647'; // Max z-index
  feedback.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  feedback.style.fontFamily = 'Arial, sans-serif';
  feedback.style.fontSize = '14px';
  feedback.style.transition = 'opacity 0.3s';
  feedback.style.pointerEvents = 'none'; // Don't interfere with page interaction
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.style.opacity = '0';
    setTimeout(() => {
      if (feedback.parentNode) {
        document.body.removeChild(feedback);
      }
    }, 300);
  }, 1500);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) {
    sendResponse({success: false, error: 'Invalid message'});
    return true;
  }
  
  if (message.action === "clipSelection") {
    const result = clipSelectedContent();
    sendResponse(result);
    return true;
  }
  
  sendResponse({success: false, error: 'Unknown action'});
  return true;
});

// Initialize the content script
function init() {
  console.log("Content Clipper content script initialized");
  
  // Add keyboard shortcut listener
  document.addEventListener('keydown', (event) => {
    // Check for Ctrl+Shift+S or Command+Shift+S (Mac)
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      clipSelectedContent();
    }
  });
  
  // Let the background script know the content script is loaded
  chrome.runtime.sendMessage({
    action: "contentScriptLoaded"
  }).catch(error => {
    // This is normal when the background page isn't actively running
    console.log("Background page may not be active:", error);
  });
}

// Run initialization
init();