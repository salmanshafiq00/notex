// Function to sanitize HTML for security
function sanitizeHtml(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove potentially dangerous elements
  const dangerousElements = ['script', 'iframe', 'object', 'embed', 'form', 'link', 'meta', 'base'];
  dangerousElements.forEach(tag => {
    const elements = tempDiv.getElementsByTagName(tag);
    for (let i = elements.length - 1; i >= 0; i--) {
      elements[i].parentNode.removeChild(elements[i]);
    }
  });
  
  // Remove on* attributes and javascript: URLs
  const allElements = tempDiv.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const attributes = allElements[i].attributes;
    for (let j = attributes.length - 1; j >= 0; j--) {
      const attrName = attributes[j].name.toLowerCase();
      const attrValue = attributes[j].value.toLowerCase();
      
      if (attrName.startsWith('on') || 
          (attrName === 'href' && attrValue.startsWith('javascript:')) ||
          (attrName === 'src' && attrValue.startsWith('javascript:')) ||
          attrName === 'xlink:href' ||
          attrName === 'data-' && attrValue.includes('javascript:')) {
        allElements[i].removeAttribute(attrName);
      }
    }
    
    // Remove style attributes that might contain JavaScript
    if (allElements[i].style && allElements[i].style.cssText) {
      const cssText = allElements[i].style.cssText.toLowerCase();
      if (cssText.includes('javascript:') || cssText.includes('expression(')) {
        allElements[i].removeAttribute('style');
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
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error retrieving settings:', chrome.runtime.lastError.message);
          showFeedback('Error saving content', 'error');
          resolve({ 
            success: false, 
            error: chrome.runtime.lastError.message 
          });
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
            console.error('Error sending message:', chrome.runtime.lastError.message);
            showFeedback('Error saving content', 'error');
            resolve({ 
              success: false, 
              error: chrome.runtime.lastError.message 
            });
          } else if (response && response.success) {
            showFeedback('Content clipped!', 'success');
            resolve({ 
              success: true,
              data: selectionData
            });
          } else if (response) {
            showFeedback('Error: ' + (response.error || 'Unknown error'), 'error');
            resolve({ 
              success: false,
              error: response.error || 'Unknown error'
            });
          } else {
            showFeedback('No response from extension', 'error');
            resolve({ 
              success: false,
              error: 'No response from extension'
            });
          }
        });
      });
    });
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
  try {
    const selection = window.getSelection();
    let top, left;
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      left = rect.left + rect.width/2 - 75;
      top = rect.top - 40;
    } else {
      // Default position if no selection range
      left = window.innerWidth / 2 - 75;
      top = 40;
    }
    
    // Clean up any existing feedback elements
    const existingFeedback = document.querySelectorAll('.notext-feedback');
    existingFeedback.forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    
    // Create a feedback element
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.className = 'notext-feedback';
    feedback.style.position = 'fixed';
    feedback.style.left = `${Math.max(10, Math.min(window.innerWidth - 160, left))}px`;
    feedback.style.top = `${Math.max(10, top)}px`;
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
  } catch (error) {
    console.error('Error showing feedback:', error);
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) {
    sendResponse({success: false, error: 'Invalid message'});
    return true;
  }
  
  if (message.action === "clipSelection") {
    const resultPromise = clipSelectedContent();
    
    // Handle both promise and direct return cases
    if (resultPromise instanceof Promise) {
      resultPromise.then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({success: false, error: error.message});
      });
    } else {
      sendResponse(resultPromise);
    }
    
    return true; // Keep the message channel open for the async response
  }
  
  sendResponse({success: false, error: 'Unknown action'});
  return true;
});

// Initialize the content script
function init() {
  try {
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
  } catch (error) {
    console.error("Error initializing content script:", error);
  }
}

// Run initialization
init();