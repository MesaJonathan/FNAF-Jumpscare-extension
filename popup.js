document.addEventListener('DOMContentLoaded', function() {
  const enableSwitch = document.getElementById('enableSwitch');
  const statusText = document.getElementById('status');
  
  chrome.storage.sync.get(['extensionEnabled'], function(result) {
    const isEnabled = result.extensionEnabled || false;
    enableSwitch.checked = isEnabled;
    updateStatus(isEnabled);
  });
  
  enableSwitch.addEventListener('change', function() {
    const isEnabled = enableSwitch.checked;
    
    chrome.storage.sync.set({extensionEnabled: isEnabled}, function() {
      updateStatus(isEnabled);
      
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleExtension',
          enabled: isEnabled
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.log('Content script not ready:', chrome.runtime.lastError.message);
          }
        });
      });
    });
  });
  
  function updateStatus(enabled) {
    statusText.textContent = enabled ? 'Enabled' : 'Disabled';
    statusText.style.color = enabled ? '#4CAF50' : '#ff6b35';
  }
});