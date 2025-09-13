let isExtensionEnabled = false;
const ALARM_NAME = 'fnafJumpscare';

const videos = [
  'Bonnie.mp4',
  'Chika.mp4', 
  'Foxy.mp4',
  'Freddy.mp4',
  'Golden Freddy.mp4',
  'Mangle.mp4',
  'Puppet.mp4',
  'Toy Bonnie.mp4',
  'Toy Chika.mp4',
  'Toy Freddy.mp4'
];

async function getRandomVideo() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['selectedVideos'], function(result) {
      const selectedVideos = result.selectedVideos || videos;

      // If no videos are selected, fall back to all videos
      const videosToUse = selectedVideos.length > 0 ? selectedVideos : videos;

      const randomIndex = Math.floor(Math.random() * videosToUse.length);
      const video = `videos/${videosToUse[randomIndex]}`;

      resolve(video);
    });
  });
}

async function getRandomDelayMinutes() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['minDelayMinutes', 'maxDelayMinutes'], function(result) {
      const minDelay = result.minDelayMinutes || 5;
      const maxDelay = result.maxDelayMinutes || 90;
      // Random delay between user-selected min and max
      const delayMinutes = Math.random() * (maxDelay - minDelay) + minDelay;
      resolve(delayMinutes);
    });
  });
}

async function triggerJumpscare() {
  if (!isExtensionEnabled) return;
  
  try {
    const tabs = await chrome.tabs.query({highlighted: true});
    
    if (tabs.length > 0) {
      const video = await getRandomVideo();
      
      // Always inject content script first to ensure it's available
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        });
        
        // Send message after ensuring content script is injected
        try {
          await chrome.tabs.sendMessage(tabs[0].id, {
            action: 'playJumpscare',
            video: video
          });
        } catch (error) {
          console.log('[Background] Failed to send jumpscare after injection:', error.message);
        }
      } catch (error) {
        console.log('[Background] Failed to inject content script:', error.message);
      }
    }
  } catch (error) {
    console.log('[Background] Failed to query tabs:', error.message);
  }
  
  scheduleNextJumpscare();
}

async function scheduleNextJumpscare() {
  if (!isExtensionEnabled) return;
  
  // Clear any existing alarm
  chrome.alarms.clear(ALARM_NAME);
  
  const delayMinutes = await getRandomDelayMinutes();
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: delayMinutes });
}

function startExtension() {
  isExtensionEnabled = true;
  scheduleNextJumpscare();
}

function stopExtension() {
  isExtensionEnabled = false;
  chrome.alarms.clear(ALARM_NAME);
}

async function initializeExtension() {
  chrome.storage.sync.get(['extensionEnabled'], async function(result) {
    if (result.extensionEnabled) {
      isExtensionEnabled = true;
      
      // Check if we already have an alarm running
      const existingAlarm = await chrome.alarms.get(ALARM_NAME);
      if (!existingAlarm) {
        // No alarm exists, schedule a new one
        await scheduleNextJumpscare();
      }
    }
  });
}

// Handle alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    // Ensure we're properly initialized before triggering
    const result = await chrome.storage.sync.get(['extensionEnabled']);
    if (result.extensionEnabled) {
      isExtensionEnabled = true;
      triggerJumpscare();
    }
  }
});

chrome.runtime.onStartup.addListener(initializeExtension);
chrome.runtime.onInstalled.addListener(initializeExtension);

initializeExtension();

chrome.runtime.onMessage.addListener(function(request, _sender, sendResponse) {
  if (request.action === 'toggleExtension') {
    if (request.enabled) {
      startExtension();
    } else {
      stopExtension();
    }
    sendResponse({success: true});
  }
});