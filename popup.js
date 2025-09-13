document.addEventListener('DOMContentLoaded', function() {
  const enableSwitch = document.getElementById('enableSwitch');
  const statusText = document.getElementById('status');
  const minHours = document.getElementById('minHours');
  const minMinutes = document.getElementById('minMinutes');
  const minSeconds = document.getElementById('minSeconds');
  const maxHours = document.getElementById('maxHours');
  const maxMinutes = document.getElementById('maxMinutes');
  const maxSeconds = document.getElementById('maxSeconds');
  const presetButtons = document.querySelectorAll('.preset-btn');
  const videoSelectionHeader = document.getElementById('videoSelectionHeader');
  const videoCheckboxContainer = document.getElementById('videoCheckboxContainer');
  const collapseArrow = document.getElementById('collapseArrow');
  const videoCount = document.getElementById('videoCount');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const videoCheckboxes = document.querySelectorAll('.video-checkbox-item input[type="checkbox"]');
  
  chrome.storage.sync.get(['extensionEnabled', 'minDelaySeconds', 'maxDelaySeconds', 'selectedVideos'], function(result) {
    const isEnabled = result.extensionEnabled || false;
    const minDelaySeconds = result.minDelaySeconds || 300; // 5 minutes
    const maxDelaySeconds = result.maxDelaySeconds || 5400; // 1.5 hours
    const selectedVideos = result.selectedVideos || [
      'Bonnie.mp4', 'Chika.mp4', 'Foxy.mp4', 'Freddy.mp4', 'Golden Freddy.mp4',
      'Mangle.mp4', 'Puppet.mp4', 'Toy Bonnie.mp4', 'Toy Chika.mp4', 'Toy Freddy.mp4'
    ];

    enableSwitch.checked = isEnabled;
    setTimeInputs('min', minDelaySeconds);
    setTimeInputs('max', maxDelaySeconds);
    updateStatus(isEnabled);
    updateTimeInputState(isEnabled);
    updateVideoSelection(selectedVideos);
    
    if (isEnabled) {
      checkActiveTimer();
    }
  });
  
  // Time input event listeners
  const timeInputs = [minHours, minMinutes, minSeconds, maxHours, maxMinutes, maxSeconds];
  timeInputs.forEach(input => {
    input.addEventListener('input', function() {
      validateAndSaveTimeInputs();
    });
  });

  // Add preset button event listeners
  presetButtons.forEach(button => {
    button.addEventListener('click', function() {
      const minH = parseInt(button.dataset.minH) || 0;
      const minM = parseInt(button.dataset.minM) || 0;
      const minS = parseInt(button.dataset.minS) || 0;
      const maxH = parseInt(button.dataset.maxH) || 0;
      const maxM = parseInt(button.dataset.maxM) || 0;
      const maxS = parseInt(button.dataset.maxS) || 0;

      minHours.value = minH;
      minMinutes.value = minM;
      minSeconds.value = minS;
      maxHours.value = maxH;
      maxMinutes.value = maxM;
      maxSeconds.value = maxS;

      validateAndSaveTimeInputs();
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
      updateTimeInputState(isEnabled);
      
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
  
  function updateTimeInputState(enabled) {
    timeInputs.forEach(input => {
      input.disabled = enabled;
    });
    presetButtons.forEach(button => {
      button.disabled = enabled;
    });
    videoCheckboxes.forEach(checkbox => {
      checkbox.disabled = enabled;
    });
  }
  
  function setTimeInputs(type, totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (type === 'min') {
      minHours.value = hours;
      minMinutes.value = minutes;
      minSeconds.value = seconds;
    } else {
      maxHours.value = hours;
      maxMinutes.value = minutes;
      maxSeconds.value = seconds;
    }
  }

  function getTimeInputSeconds(type) {
    if (type === 'min') {
      return (parseInt(minHours.value) || 0) * 3600 +
             (parseInt(minMinutes.value) || 0) * 60 +
             (parseInt(minSeconds.value) || 0);
    } else {
      return (parseInt(maxHours.value) || 0) * 3600 +
             (parseInt(maxMinutes.value) || 0) * 60 +
             (parseInt(maxSeconds.value) || 0);
    }
  }

  function validateAndSaveTimeInputs() {
    let minSeconds = getTimeInputSeconds('min');
    let maxSeconds = getTimeInputSeconds('max');

    // Ensure minimum delay is at least 10 seconds
    if (minSeconds < 10) {
      minSeconds = 10;
      setTimeInputs('min', minSeconds);
    }

    // Ensure maximum delay does not exceed 4 hours (14400 seconds)
    if (maxSeconds > 14400) {
      maxSeconds = 14400;
      setTimeInputs('max', maxSeconds);
    }

    // Ensure max is greater than min
    if (maxSeconds <= minSeconds) {
      maxSeconds = minSeconds + 1;
      // If this would exceed 4 hours, adjust min instead
      if (maxSeconds > 14400) {
        maxSeconds = 14400;
        minSeconds = maxSeconds - 1;
        setTimeInputs('min', minSeconds);
      }
      setTimeInputs('max', maxSeconds);
    }

    chrome.storage.sync.set({
      minDelaySeconds: minSeconds,
      maxDelaySeconds: maxSeconds
    });
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
        // console.log('[Popup] Timer end time:', endTime.toLocaleString());
        // console.log('[Popup] Time remaining:', Math.round((alarm.scheduledTime - Date.now()) / 1000 / 60), 'minutes');
      }
    } catch (error) {
      console.log('[Popup] Error checking timer:', error.message);
    }
  }
});