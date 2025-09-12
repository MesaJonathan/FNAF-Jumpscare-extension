document.addEventListener('DOMContentLoaded', function() {
  const enableSwitch = document.getElementById('enableSwitch');
  const statusText = document.getElementById('status');
  
  chrome.storage.sync.get(['extensionEnabled'], function(result) {
    const isEnabled = result.extensionEnabled || false;
    enableSwitch.checked = isEnabled;
    updateStatus(isEnabled);
    
    if (isEnabled) {
      checkActiveTimer();
    }
  });
  
  enableSwitch.addEventListener('change', function() {
    const isEnabled = enableSwitch.checked;
    
    chrome.storage.sync.set({extensionEnabled: isEnabled}, function() {
      updateStatus(isEnabled);
      
      chrome.runtime.sendMessage({
        action: 'toggleExtension',
        enabled: isEnabled
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.log('[Popup] Background script error:', chrome.runtime.lastError.message);
        }
        
        if (isEnabled) {
          checkActiveTimer();
        }
      });
    });
  });
  
  function updateStatus(enabled) {
    statusText.textContent = enabled ? 'Enabled' : 'Disabled';
    statusText.style.color = enabled ? '#4CAF50' : '#ff6b35';
  }
  
  async function checkActiveTimer() {
    try {
      const alarm = await chrome.alarms.get('fnafJumpscare');
      if (alarm) {
        const endTime = new Date(alarm.scheduledTime);
        console.log('[Popup] Timer end time:', endTime.toLocaleString());
        console.log('[Popup] Time remaining:', Math.round((alarm.scheduledTime - Date.now()) / 1000 / 60), 'minutes');
      } else {
        console.log('[Popup] No active timer found');
      }
    } catch (error) {
      console.log('[Popup] Error checking timer:', error.message);
    }
  }
});