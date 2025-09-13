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
    
    // Ensure min doesn't get too close to max (minimum 1 minute gap)
    if (minDelay >= maxDelay) {
      maxDelay = minDelay + 1;
      // Don't exceed the maximum slider value
      if (maxDelay > 180) {
        maxDelay = 180;
        minDelay = 179;
        minTimingSlider.value = minDelay;
      }
      maxTimingSlider.value = maxDelay;
    }
    
    updateCurrentValue(minDelay, maxDelay);
    updateRangeFill(minDelay, maxDelay);
    
    chrome.storage.sync.set({minDelayMinutes: minDelay, maxDelayMinutes: maxDelay});
  });

  maxTimingSlider.addEventListener('input', function() {
    let minDelay = parseInt(minTimingSlider.value);
    let maxDelay = parseInt(maxTimingSlider.value);
    
    // Ensure max doesn't get too close to min (minimum 1 minute gap)
    if (maxDelay <= minDelay) {
      minDelay = maxDelay - 1;
      // Don't go below the minimum slider value
      if (minDelay < 1) {
        minDelay = 1;
        maxDelay = 2;
        maxTimingSlider.value = maxDelay;
      }
      minTimingSlider.value = minDelay;
    }
    
    updateCurrentValue(minDelay, maxDelay);
    updateRangeFill(minDelay, maxDelay);
    
    chrome.storage.sync.set({minDelayMinutes: minDelay, maxDelayMinutes: maxDelay});
  });

  // Add preset button event listeners
  presetButtons.forEach(button => {
    button.addEventListener('click', function() {
      let minDelay = parseInt(button.dataset.min);
      let maxDelay = parseInt(button.dataset.max);
      
      // Ensure preset respects minimum 1-minute gap (safety check)
      if (maxDelay <= minDelay) {
        maxDelay = minDelay + 1;
      }
      
      minTimingSlider.value = minDelay;
      maxTimingSlider.value = maxDelay;
      
      updateCurrentValue(minDelay, maxDelay);
      updateRangeFill(minDelay, maxDelay);
      
      chrome.storage.sync.set({minDelayMinutes: minDelay, maxDelayMinutes: maxDelay});
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
        // console.log('[Popup] Timer end time:', endTime.toLocaleString());
        // console.log('[Popup] Time remaining:', Math.round((alarm.scheduledTime - Date.now()) / 1000 / 60), 'minutes');
      } else {
        console.log('[Popup] No active timer found');
      }
    } catch (error) {
      console.log('[Popup] Error checking timer:', error.message);
    }
  }
});