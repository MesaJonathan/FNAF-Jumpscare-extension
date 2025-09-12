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

function getRandomVideo() {
  const randomIndex = Math.floor(Math.random() * videos.length);
  const video = `videos/${videos[randomIndex]}`;

  return video;
}

function getRandomDelayMinutes() {
  // Convert to minutes: 5 minutes to 3 hours (180 minutes)
  const delayMinutes = Math.random() * (180 - 5) + 5;
  // const delayMinutes = 1;
  return delayMinutes;
}

async function triggerJumpscare() {
  if (!isExtensionEnabled) return;
  
  try {
    const tabs = await chrome.tabs.query({highlighted: true});
    
    if (tabs.length > 0) {
      const video = getRandomVideo();
      
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

function scheduleNextJumpscare() {
  if (!isExtensionEnabled) return;
  
  // Clear any existing alarm
  chrome.alarms.clear(ALARM_NAME);
  
  const delayMinutes = getRandomDelayMinutes();
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
        scheduleNextJumpscare();
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