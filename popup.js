document.addEventListener('DOMContentLoaded', function() {
  const enableSwitch = document.getElementById('enableSwitch');
  const statusText = document.getElementById('status');
  const minTimingSlider = document.getElementById('minTimingSlider');
  const maxTimingSlider = document.getElementById('maxTimingSlider');
  const currentValueText = document.getElementById('currentValue');
  const rangeFill = document.getElementById('rangeFill');
  const presetButtons = document.querySelectorAll('.preset-btn');
  const videoSelectionHeader = document.getElementById('videoSelectionHeader');
  const videoCheckboxContainer = document.getElementById('videoCheckboxContainer');
  const collapseArrow = document.getElementById('collapseArrow');
  const videoCount = document.getElementById('videoCount');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const videoCheckboxes = document.querySelectorAll('.video-checkbox-item input[type="checkbox"]');
  
  chrome.storage.sync.get(['extensionEnabled', 'minDelayMinutes', 'maxDelayMinutes', 'selectedVideos'], function(result) {
    const isEnabled = result.extensionEnabled || false;
    const minDelay = result.minDelayMinutes || 5;
    const maxDelay = result.maxDelayMinutes || 90;
    const selectedVideos = result.selectedVideos || [
      'Bonnie.mp4', 'Chika.mp4', 'Foxy.mp4', 'Freddy.mp4', 'Golden Freddy.mp4',
      'Mangle.mp4', 'Puppet.mp4', 'Toy Bonnie.mp4', 'Toy Chika.mp4', 'Toy Freddy.mp4'
    ];
    
    enableSwitch.checked = isEnabled;
    minTimingSlider.value = minDelay;
    maxTimingSlider.value = maxDelay;
    updateStatus(isEnabled);
    updateSliderState(isEnabled);
    updateCurrentValue(minDelay, maxDelay);
    updateRangeFill(minDelay, maxDelay);
    updateVideoSelection(selectedVideos);
    
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

  // Collapse/expand functionality
  videoSelectionHeader.addEventListener('click', function() {
    const isCollapsed = videoCheckboxContainer.classList.contains('collapsed');

    if (isCollapsed) {
      videoCheckboxContainer.classList.remove('collapsed');
      collapseArrow.classList.remove('collapsed');
    } else {
      videoCheckboxContainer.classList.add('collapsed');
      collapseArrow.classList.add('collapsed');
    }
  });

  // Video checkbox event listeners
  videoCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const selectedVideos = Array.from(videoCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      updateVideoCount(selectedVideos.length);
      updateSelectAllButton(selectedVideos.length);
      chrome.storage.sync.set({selectedVideos: selectedVideos});
    });
  });

  selectAllBtn.addEventListener('click', function() {
    const allChecked = Array.from(videoCheckboxes).every(cb => cb.checked);

    if (allChecked) {
      // Deselect all
      videoCheckboxes.forEach(cb => cb.checked = false);
      selectAllBtn.textContent = 'Select All';
      updateVideoCount(0);
      chrome.storage.sync.set({selectedVideos: []});
    } else {
      // Select all
      videoCheckboxes.forEach(cb => cb.checked = true);
      selectAllBtn.textContent = 'Deselect All';
      updateVideoCount(videoCheckboxes.length);
      const allVideos = Array.from(videoCheckboxes).map(cb => cb.value);
      chrome.storage.sync.set({selectedVideos: allVideos});
    }
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

    const width = Math.max(0, maxPercent - minPercent);

    rangeFill.style.left = minPercent + '%';
    rangeFill.style.width = width + '%';

    // Hide the fill when width is too small to prevent visual artifacts
    rangeFill.style.display = width < 0.5 ? 'none' : 'block';
  }

  function updateVideoSelection(selectedVideos) {
    videoCheckboxes.forEach(checkbox => {
      checkbox.checked = selectedVideos.includes(checkbox.value);
    });
    updateVideoCount(selectedVideos.length);
    updateSelectAllButton(selectedVideos.length);
  }

  function updateVideoCount(count) {
    videoCount.textContent = `${count} video${count === 1 ? '' : 's'} selected`;
  }

  function updateSelectAllButton(selectedCount) {
    const totalCount = videoCheckboxes.length;
    selectAllBtn.textContent = selectedCount === totalCount ? 'Deselect All' : 'Select All';
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