document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const titleInput = document.getElementById('title');
  const categorySelect = document.getElementById('category');
  const tagsInput = document.getElementById('tags');
  const contentPreview = document.getElementById('content-preview');
  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const backBtn = document.getElementById('back-btn');
  const savedContent = document.getElementById('saved-content');
  const savedItems = document.getElementById('saved-items');
  const formView = document.getElementById('form-view');
  const dashboardView = document.getElementById('dashboard-view');
  const searchInput = document.getElementById('search-input');
  const filterCategory = document.getElementById('filter-category');
  const expandPreviewBtn = document.getElementById('expand-preview');
  const exportPdfBtn = document.getElementById('export-pdf');
  const fullscreenModal = document.getElementById('fullscreen-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');
  const modalCategory = document.getElementById('modal-category');
  const modalDate = document.getElementById('modal-date');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalPdfBtn = document.getElementById('modal-pdf-btn');
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsBtnForm = document.getElementById('settings-btn-form');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsBackBtn = document.getElementById('settings-back-btn');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const syncStorage = document.getElementById('sync-storage');
  const themeSelector = document.getElementById('theme-selector');
  const fontSizeSelector = document.getElementById('font-size');
  const categoryList = document.getElementById('category-list');
  const newCategoryInput = document.getElementById('new-category-input');
  const saveCategoryBtn = document.getElementById('save-category-btn');
  const addCategoryBtn = document.getElementById('add-category-btn');
  const addCategoryBtnSmall = document.getElementById('add-category-btn-small');
  const categoryModal = document.getElementById('category-modal');
  const categoryModalInput = document.getElementById('category-modal-input');
  const confirmCategoryBtn = document.getElementById('confirm-category-btn');
  const cancelCategoryBtn = document.getElementById('cancel-category-btn');
  const exportAllBtn = document.getElementById('export-all-btn');
  const importBtn = document.getElementById('import-btn');
  const fileInput = document.getElementById('file-input');
  const categoryCounts = document.getElementById('category-counts');
  const recentItemsContainer = document.getElementById('recent-items');
  const newClipBtn = document.getElementById('new-clip-btn');
  const viewAllBtn = document.getElementById('view-all-btn');
  const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
  const newClipFloatingBtn = document.getElementById('new-clip-floating-btn');
  
  // State variables
  let currentSelection = null;
  let currentZoom = 1;
  let currentItem = null;
  let isStorageSync = false;
  let categories = ['General', 'Work', 'Personal', 'Research', 'Ideas'];
  let defaultSettings = {
    syncStorage: false,
    theme: 'light',
    fontSize: 'medium',
    categories: categories
  };
  
  // Initialize settings
  function initSettings() {
    getStorage().get(['settings'], (result) => {
      const settings = result.settings || defaultSettings;
      
      // Apply settings
      syncStorage.checked = settings.syncStorage;
      isStorageSync = settings.syncStorage;
      themeSelector.value = settings.theme;
      fontSizeSelector.value = settings.fontSize;
      categories = settings.categories || categories;
      
      // Apply theme
      applyTheme(settings.theme);
      
      // Apply font size
      applyFontSize(settings.fontSize);
      
      // Update category lists
      updateCategorySelects();
      renderCategoryList();
    });
  }
  
  // Get the correct storage type (sync or local)
  function getStorage() {
    return isStorageSync ? chrome.storage.sync : chrome.storage.local;
  }
  
  // Apply theme
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
      document.body.classList.remove('dark-theme');
    } else if (theme === 'system') {
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    }
  }
  
  // Apply font size
  function applyFontSize(size) {
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${size}`);
  }
  
  // Update category selects
  function updateCategorySelects() {
    // Clear existing options
    categorySelect.innerHTML = '';
    filterCategory.innerHTML = '<option value="">All Categories</option>';
    
    // Add categories
    categories.forEach(category => {
      const option1 = document.createElement('option');
      option1.value = category;
      option1.textContent = category;
      categorySelect.appendChild(option1);
      
      const option2 = document.createElement('option');
      option2.value = category;
      option2.textContent = category;
      filterCategory.appendChild(option2);
    });
  }
  
  // Render category list in settings
  function renderCategoryList() {
    categoryList.innerHTML = '';
    
    categories.forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';
      categoryItem.innerHTML = `
        <span>${category}</span>
        <i class="fas fa-times" data-category="${category}"></i>
      `;
      categoryList.appendChild(categoryItem);
    });
    
    // Add event listeners
    document.querySelectorAll('.category-item i').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        removeCategory(category);
      });
    });
  }
  
  // Remove a category
  function removeCategory(category) {
    // Don't remove if it's one of the default categories
    if (['General', 'Work', 'Personal', 'Research', 'Ideas'].includes(category) && categories.length <= 5) {
      alert("Cannot remove default categories. You must have at least one category.");
      return;
    }
    
    categories = categories.filter(c => c !== category);
    renderCategoryList();
    updateCategorySelects();
    
    // Save settings
    getStorage().get(['settings'], (result) => {
      const settings = result.settings || defaultSettings;
      settings.categories = categories;
      getStorage().set({ 'settings': settings });
    });
  }
  
  // Format date for display
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Load any selected content from the page
  function loadSelectedContent() {
    getStorage().get(['tempSelection'], (result) => {
      if (result.tempSelection) {
        currentSelection = result.tempSelection;
        contentPreview.innerHTML = result.tempSelection.html;
        
        // Enable save button
        saveBtn.disabled = false;
        
        // Focus on title input
        setTimeout(() => {
          titleInput.focus();
        }, 100);
        
        // Clear the temp storage
        getStorage().remove(['tempSelection']);
      } else {
        contentPreview.innerHTML = '<i>No content selected. Select text on a webpage first.</i>';
        saveBtn.disabled = true;
      }
    });
  }
  
  // Save the current selection
  function saveCurrentSelection() {
    if (!currentSelection) return;
    
    const tagsList = tagsInput.value.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);
    
    const newItem = {
      id: Date.now(),
      title: titleInput.value || 'Untitled',
      category: categorySelect.value || 'General',
      tags: tagsList,
      html: currentSelection.html,
      text: currentSelection.text,
      timestamp: new Date().toISOString()
    };
    
    // Get existing saved items
    getStorage().get(['savedItems'], (result) => {
      const savedItems = result.savedItems || [];
      savedItems.push(newItem);
      
      // Save the updated list
      getStorage().set({ 'savedItems': savedItems }, () => {
        // Show feedback
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
          saveBtn.textContent = 'Save';
          // Clear form
          titleInput.value = '';
          categorySelect.value = 'General';
          tagsInput.value = '';
          contentPreview.innerHTML = '<i>Content saved. Select more text to clip.</i>';
          currentSelection = null;
          saveBtn.disabled = true;
          
          // Go back to dashboard
          showDashboard();
        }, 1500);
      });
    });
  }
  
  // Load saved items with filtering and search
  function loadSavedItems() {
    getStorage().get(['savedItems'], (result) => {
      const items = result.savedItems || [];
      const searchTerm = searchInput.value.toLowerCase();
      const categoryFilter = filterCategory.value;
      
      // Filter items
      let filteredItems = items;
      
      if (categoryFilter) {
        filteredItems = filteredItems.filter(item => item.category === categoryFilter);
      }
      
      if (searchTerm) {
        filteredItems = filteredItems.filter(item => 
          item.title.toLowerCase().includes(searchTerm) || 
          item.text.toLowerCase().includes(searchTerm) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
      }
      
      savedItems.innerHTML = '';
      
      if (filteredItems.length === 0) {
        savedItems.innerHTML = '<div class="no-items">No saved content found.</div>';
        return;
      }
      
      // Sort by most recent first
      filteredItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      filteredItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'saved-item';
        itemElement.dataset.id = item.id;
        
        // Create tag elements
        const tagsHtml = item.tags && item.tags.length 
          ? `<div class="saved-item-tags">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` 
          : '';
        
        // Add category badge
        const categoryBadge = `<span class="category-badge category-badge-${item.category}">${item.category}</span>`;
        
        itemElement.innerHTML = `
          <div class="saved-item-title">
            ${item.title}
            ${categoryBadge}
          </div>
          <div class="saved-item-preview">${item.text.substring(0, 100)}${item.text.length > 100 ? '...' : ''}</div>
          ${tagsHtml}
          <div class="saved-item-meta">
            <span class="saved-item-date">${formatDate(item.timestamp)}</span>
            <div class="item-actions">
              <button class="pdf-btn" title="Export as PDF" data-id="${item.id}"><i class="fas fa-file-pdf"></i></button>
              <button class="delete-btn" title="Delete" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        `;
        
        // View details on click
        itemElement.addEventListener('click', (e) => {
          if (!e.target.closest('.item-actions')) {
            showItemDetails(item);
          }
        });
        
        savedItems.appendChild(itemElement);
      });
      
      // Add event listeners to action buttons
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const itemId = parseInt(e.target.closest('.delete-btn').dataset.id);
          deleteItem(itemId);
        });
      });
      
      document.querySelectorAll('.pdf-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const itemId = parseInt(e.target.closest('.pdf-btn').dataset.id);
          exportItemAsPdf(itemId);
        });
      });
    });
  }
  
  // Show item details in fullscreen modal
  function showItemDetails(item) {
    currentItem = item;
    
    modalTitle.textContent = item.title;
    modalContent.innerHTML = item.html;
    modalCategory.textContent = item.category || 'General';
    modalDate.textContent = formatDate(item.timestamp);
    
    fullscreenModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Reset zoom
    currentZoom = 1;
    modalContent.style.transform = `scale(${currentZoom})`;
  }
  
  // Export item as PDF
  function exportItemAsPdf(itemId) {
    getStorage().get(['savedItems'], (result) => {
      const items = result.savedItems || [];
      const item = items.find(i => i.id === itemId);
      
      if (!item) return;
      
      generatePdf(item);
    });
  }
  
  // Generate PDF using html2canvas and jsPDF
  function generatePdf(item) {
    // Create a temporary container for the content
    const tempContainer = document.createElement('div');
    tempContainer.style.width = '700px';
    tempContainer.style.padding = '20px';
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    
    // Add title and metadata
    tempContainer.innerHTML = `
      <h1 style="margin-bottom: 10px; font-size: 24px;">${item.title}</h1>
      <div style="margin-bottom: 20px; color: #666; font-size: 12px;">
        ${item.category ? `Category: ${item.category} • ` : ''}
        Saved on: ${formatDate(item.timestamp)}
        ${item.tags && item.tags.length ? `• Tags: ${item.tags.join(', ')}` : ''}
      </div>
      <div style="border-top: 1px solid #ddd; padding-top: 15px;">
        ${item.html}
      </div>
    `;
    
    document.body.appendChild(tempContainer);
    
    // Use html2canvas to capture the content
    window.html2canvas(tempContainer).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new window.jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
      });
      
      // Calculate the PDF dimensions based on canvas
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add image to PDF (potentially across multiple pages)
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Download the PDF
      pdf.save(`${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_content.pdf`);
      
      // Remove the temporary container
      document.body.removeChild(tempContainer);
    });
  }
  
  // Delete an item
  function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    getStorage().get(['savedItems'], (result) => {
      let items = result.savedItems || [];
      items = items.filter(item => item.id !== itemId);
      
      getStorage().set({ 'savedItems': items }, () => {
        loadSavedItems();
        showCategoryStats(); // Update dashboard stats
      });
    });
  }
  
  // Export all saved items as JSON
  function exportAllItems() {
    getStorage().get(['savedItems'], (result) => {
      const items = result.savedItems || [];
      
      if (items.length === 0) {
        alert('No saved items to export.');
        return;
      }
      
      const dataStr = JSON.stringify(items, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `content_clipper_export_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    });
  }
  
  // Import items from JSON file
  function importItems(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const importedItems = JSON.parse(e.target.result);
        
        if (!Array.isArray(importedItems)) {
          throw new Error('Invalid format');
        }
        
        // Validate each item
        importedItems.forEach(item => {
          if (!item.id || !item.title || !item.html || !item.timestamp) {
            throw new Error('Invalid item format');
          }
        });
        
        // Get current items and merge
        getStorage().get(['savedItems'], (result) => {
          const currentItems = result.savedItems || [];
          
          // Remove duplicates by ID
          const existingIds = new Set(currentItems.map(item => item.id));
          const newItems = importedItems.filter(item => !existingIds.has(item.id));
          
          const mergedItems = [...currentItems, ...newItems];
          
          getStorage().set({ 'savedItems': mergedItems }, () => {
            alert(`Successfully imported ${newItems.length} items.`);
            loadSavedItems();
            showCategoryStats(); // Update dashboard stats
          });
        });
      } catch (error) {
        alert('Error importing file: ' + error.message);
      }
    };
    
    reader.readAsText(file);
  }
  
  // Add a new category
  function addNewCategory(categoryName) {
    if (!categoryName) return;
    
    // Check if category already exists
    if (categories.includes(categoryName)) {
      alert('This category already exists.');
      return;
    }
    
    // Add to categories
    categories.push(categoryName);
    
    // Update UI
    renderCategoryList();
    updateCategorySelects();
    
    // Save settings
    getStorage().get(['settings'], (result) => {
      const settings = result.settings || defaultSettings;
      settings.categories = categories;
      getStorage().set({ 'settings': settings });
    });
    
    // Update dashboard
    showCategoryStats();
  }
  
  // Save settings
  function saveSettings() {
    const newSettings = {
      syncStorage: syncStorage.checked,
      theme: themeSelector.value,
      fontSize: fontSizeSelector.value,
      categories: categories
    };
    
    // Save settings
    getStorage().set({ 'settings': newSettings }, () => {
      // If storage type changed, migrate data
      if (isStorageSync !== newSettings.syncStorage) {
        migrateData(isStorageSync, newSettings.syncStorage);
      } else {
        // Apply settings immediately
        applySettings(newSettings);
        alert('Settings saved!');
        settingsPanel.classList.add('hidden');
      }
    });
  }
  
  // Migrate data between storage types
  function migrateData(fromSync, toSync) {
    const fromStorage = fromSync ? chrome.storage.sync : chrome.storage.local;
    const toStorage = toSync ? chrome.storage.sync : chrome.storage.local;
    
    fromStorage.get(['savedItems'], (result) => {
      const items = result.savedItems || [];
      
      toStorage.set({ 'savedItems': items }, () => {
        // Clear old storage
        fromStorage.remove(['savedItems'], () => {
          // Update current state
          isStorageSync = toSync;
          
          // Apply other settings
          getStorage().get(['settings'], (result) => {
            const settings = result.settings;
            applySettings(settings);
            alert('Settings saved and data migrated!');
            settingsPanel.classList.add('hidden');
          });
        });
      });
    });
  }
  
  // Apply settings
  function applySettings(settings) {
    isStorageSync = settings.syncStorage;
    applyTheme(settings.theme);
    applyFontSize(settings.fontSize);
  }
  
  // Show dashboard view
  function showDashboard() {
    formView.classList.add('hidden');
    savedContent.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    showCategoryStats();
  }
  
  // Show form view
  function showForm() {
    dashboardView.classList.add('hidden');
    savedContent.classList.add('hidden');
    formView.classList.remove('hidden');
    loadSelectedContent();
  }
  
  // Show saved content view
  function showSavedContent() {
    dashboardView.classList.add('hidden');
    formView.classList.add('hidden');
    savedContent.classList.remove('hidden');
    loadSavedItems();
  }
  
  // Show category stats
  function showCategoryStats() {
    getStorage().get(['savedItems'], (result) => {
      const items = result.savedItems || [];
      const categoryStats = {};
      
      // Initialize counts for all categories
      categories.forEach(category => {
        categoryStats[category] = 0;
      });
      
      // Count items
      items.forEach(item => {
        const category = item.category || 'General';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });
      
      // Render category cards
      categoryCounts.innerHTML = '';
      categories.forEach(category => {
        const div = document.createElement('div');
        div.className = `category-count-item category-${category.toLowerCase()}`;
        div.innerHTML = `
          <h3>${category}</h3>
          <div class="count">${categoryStats[category] || 0}</div>
        `;
        div.addEventListener('click', () => showCategoryItems(category));
        categoryCounts.appendChild(div);
      });
      
      // Show recent items (last 5)
      const recentItems = items
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
        
      recentItemsContainer.innerHTML = '';
      
      if (recentItems.length === 0) {
        recentItemsContainer.innerHTML = '<div class="no-items">No items yet. Click "New Clip" to create one.</div>';
        return;
      }
      
      recentItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'recent-item';
        div.innerHTML = `
          <div class="recent-item-title">${item.title}</div>
          <div class="recent-item-meta">
            <span class="category-badge category-badge-${item.category.toLowerCase().replace(/\s+/g, '-')}">${item.category}</span>
            <span class="date">${formatDate(item.timestamp)}</span>
          </div>
        `;
        div.addEventListener('click', () => {
          showItemDetails(item);
        });
        recentItemsContainer.appendChild(div);
      });
    });
  }
  
  // Show category items
  function showCategoryItems(category) {
    showSavedContent();
    filterCategory.value = category;
    loadSavedItems();
  }
  
  // Register keyboard shortcut for content selection
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "keyboardShortcut") {
      // If shortcut triggered, show form view
      showForm();
    }
  });
  
  // Initialize
  initSettings();
  
  // Reset views - Update this section
  formView.classList.add('hidden');
  savedContent.classList.add('hidden');
  settingsPanel.classList.add('hidden');
  categoryModal.classList.add('hidden'); // Make sure modal is hidden
  dashboardView.classList.remove('hidden'); // Show dashboard by default

  // Load data
  getStorage().get(['tempSelection'], (result) => {
    if (result.tempSelection) {
      showForm();
    } else {
      showCategoryStats(); // Load category cards and recent items
    }
  });
  
  // Event Listeners
  saveBtn.addEventListener('click', saveCurrentSelection);
  
  cancelBtn.addEventListener('click', () => {
    showDashboard();
  });
  
  backBtn.addEventListener('click', showDashboard);
  
  newClipBtn.addEventListener('click', showForm);
  
  newClipFloatingBtn.addEventListener('click', showForm);
  
  viewAllBtn.addEventListener('click', showSavedContent);
  
  backToDashboardBtn.addEventListener('click', showDashboard);
  
  searchInput.addEventListener('input', loadSavedItems);
  
  filterCategory.addEventListener('change', loadSavedItems);
  
  expandPreviewBtn.addEventListener('click', () => {
    if (currentSelection) {
      showItemDetails({
        id: 'preview',
        title: titleInput.value || 'Preview',
        category: categorySelect.value || 'General',
        html: currentSelection.html,
        text: currentSelection.text,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  exportPdfBtn.addEventListener('click', () => {
    if (currentSelection) {
      generatePdf({
        id: 'preview',
        title: titleInput.value || 'Untitled',
        category: categorySelect.value || 'General',
        html: currentSelection.html,
        text: currentSelection.text,
        timestamp: new Date().toISOString(),
        tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag)
      });
    }
  });
  
  closeModalBtn.addEventListener('click', () => {
    fullscreenModal.classList.add('hidden');
    document.body.style.overflow = '';
  });
  
  modalPdfBtn.addEventListener('click', () => {
    if (currentItem) {
      generatePdf(currentItem);
    }
  });
  
  zoomInBtn.addEventListener('click', () => {
    currentZoom += 0.1;
    modalContent.style.transform = `scale(${currentZoom})`;
  });
  
  zoomOutBtn.addEventListener('click', () => {
    currentZoom = Math.max(0.5, currentZoom - 0.1);
    modalContent.style.transform = `scale(${currentZoom})`;
  });
  
  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('hidden');
  });
  
  settingsBtnForm.addEventListener('click', () => {
    settingsPanel.classList.remove('hidden');
  });
  
  settingsBackBtn.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
  });
  
  saveSettingsBtn.addEventListener('click', saveSettings);
  
  saveCategoryBtn.addEventListener('click', () => {
    const categoryName = newCategoryInput.value.trim();
    if (categoryName) {
      addNewCategory(categoryName);
      newCategoryInput.value = '';
    }
  });
  
  addCategoryBtn.addEventListener('click', () => {
    categoryModal.classList.remove('hidden');
    setTimeout(() => {
      categoryModalInput.focus();
    }, 100);
  });
  
  addCategoryBtnSmall.addEventListener('click', () => {
    categoryModal.classList.remove('hidden');
    setTimeout(() => {
      categoryModalInput.focus();
    }, 100);
  });
  
  confirmCategoryBtn.addEventListener('click', () => {
    const categoryName = categoryModalInput.value.trim();
    if (categoryName) {
      addNewCategory(categoryName);
      categoryModalInput.value = '';
      categoryModal.classList.add('hidden');
    }
  });
  
  cancelCategoryBtn.addEventListener('click', () => {
    categoryModal.classList.add('hidden');
    categoryModalInput.value = '';
    
    // Make sure dashboard is visible
    if (!dashboardView.classList.contains('hidden')) {
      showCategoryStats(); // Refresh dashboard
    }
  });
  
  exportAllBtn.addEventListener('click', exportAllItems);
  
  importBtn.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      importItems(e.target.files[0]);
      // Reset file input
      e.target.value = '';
    }
  });
  
  // Close category modal on outside click
  window.addEventListener('click', (e) => {
    if (e.target === categoryModal) {
      categoryModal.classList.add('hidden');
      categoryModalInput.value = '';
    }
  });
       
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape key closes modals
    if (e.key === 'Escape') {
      if (!fullscreenModal.classList.contains('hidden')) {
        fullscreenModal.classList.add('hidden');
        document.body.style.overflow = '';
      } else if (!categoryModal.classList.contains('hidden')) {
        categoryModal.classList.add('hidden');
      } else if (!settingsPanel.classList.contains('hidden')) {
        settingsPanel.classList.add('hidden');
      }
    }
    
    // Ctrl+S saves the current selection
    if (e.ctrlKey && e.key === 's' && !formView.classList.contains('hidden') && !saveBtn.disabled) {
      e.preventDefault();
      saveCurrentSelection();
    }
  });
});