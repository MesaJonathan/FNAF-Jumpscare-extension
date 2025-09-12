document.addEventListener('DOMContentLoaded', function() {
  const enableSwitch = document.getElementById('enableSwitch');
  const statusText = document.getElementById('status');
  const minTimingSlider = document.getElementById('minTimingSlider');
  const maxTimingSlider = document.getElementById('maxTimingSlider');
  const currentValueText = document.getElementById('currentValue');
  const rangeFill = document.getElementById('rangeFill');
  const presetButtons = document.querySelectorAll('.preset-btn');
  
  chrome.storage.sync.get(['extensionEnabled', 'minDelayMinutes', 'maxDelayMinutes'], function(result) {
    const isEnabled = result.extensionEnabled || false;
    const minDelay = result.minDelayMinutes || 5;
    const maxDelay = result.maxDelayMinutes || 90;
    
    enableSwitch.checked = isEnabled;
    minTimingSlider.value = minDelay;
    maxTimingSlider.value = maxDelay;
    updateStatus(isEnabled);
    updateSliderState(isEnabled);
    updateCurrentValue(minDelay, maxDelay);
    updateRangeFill(minDelay, maxDelay);
    
    if (isEnabled) {
      checkActiveTimer();
    }
  });
  
  minTimingSlider.addEventListener('input', function() {
    let minDelay = parseInt(minTimingSlider.value);
    let maxDelay = parseInt(maxTimingSlider.value);
    
    // Ensure min doesn't exceed max
    if (minDelay > maxDelay) {
      maxDelay = minDelay;
      maxTimingSlider.value = maxDelay;
    }
    
    updateCurrentValue(minDelay, maxDelay);
    updateRangeFill(minDelay, maxDelay);
    
    chrome.storage.sync.set({minDelayMinutes: minDelay, maxDelayMinutes: maxDelay}, function() {
      console.log('[Popup] Saved min delay:', minDelay, 'max delay:', maxDelay, 'minutes');
    });
  });

  maxTimingSlider.addEventListener('input', function() {
    let minDelay = parseInt(minTimingSlider.value);
    let maxDelay = parseInt(maxTimingSlider.value);
    
    // Ensure max doesn't go below min
    if (maxDelay < minDelay) {
      minDelay = maxDelay;
      minTimingSlider.value = minDelay;
    }
    
    updateCurrentValue(minDelay, maxDelay);
    updateRangeFill(minDelay, maxDelay);
    
    chrome.storage.sync.set({minDelayMinutes: minDelay, maxDelayMinutes: maxDelay}, function() {
      console.log('[Popup] Saved min delay:', minDelay, 'max delay:', maxDelay, 'minutes');
    });
  });

  // Add preset button event listeners
  presetButtons.forEach(button => {
    button.addEventListener('click', function() {
      const minDelay = parseInt(button.dataset.min);
      const maxDelay = parseInt(button.dataset.max);
      
      minTimingSlider.value = minDelay;
      maxTimingSlider.value = maxDelay;
      
      updateCurrentValue(minDelay, maxDelay);
      updateRangeFill(minDelay, maxDelay);
      
      chrome.storage.sync.set({minDelayMinutes: minDelay, maxDelayMinutes: maxDelay}, function() {
        console.log('[Popup] Applied preset:', minDelay, '-', maxDelay, 'minutes');
      });
    });
  });

  enableSwitch.addEventListener('change', function() {
    const isEnabled = enableSwitch.checked;
    
    chrome.storage.sync.set({extensionEnabled: isEnabled}, function() {
      updateStatus(isEnabled);
      updateSliderState(isEnabled);
      
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
  
  function updateSliderState(enabled) {
    minTimingSlider.disabled = enabled;
    maxTimingSlider.disabled = enabled;
    presetButtons.forEach(button => {
      button.disabled = enabled;
    });
  }
  
  function updateCurrentValue(minDelay, maxDelay) {
    function formatTime(minutes) {
      if (minutes < 60) {
        return `${minutes} min${minutes === 1 ? '' : 's'}`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) {
          return `${hours}h`;
        } else {
          return `${hours}h ${remainingMinutes}m`;
        }
      }
    }
    
    const minText = formatTime(minDelay);
    const maxText = formatTime(maxDelay);
    currentValueText.textContent = `${minText} - ${maxText}`;
  }
  
  function updateRangeFill(minDelay, maxDelay) {
    const minPercent = ((minDelay - 1) / (180 - 1)) * 100;
    const maxPercent = ((maxDelay - 1) / (180 - 1)) * 100;
    
    rangeFill.style.left = minPercent + '%';
    rangeFill.style.width = (maxPercent - minPercent) + '%';
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