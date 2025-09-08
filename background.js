let isExtensionEnabled = false;
let jumpscareTimeout = null;

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
  console.log('[Background] Selected video:', video);
  return video;
}

function getRandomDelay() {
  // const delay = Math.random() * (14400000 - 60000) + 60000;
  const delay = 5000; // 5 seconds for debugging
  console.log('[Background] Next jumpscare in:', Math.round(delay/1000), 'seconds');
  return delay;
}

function triggerJumpscare() {
  console.log('[Background] triggerJumpscare called, enabled:', isExtensionEnabled);
  if (!isExtensionEnabled) return;
  
  chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
    console.log('tabs query result:', tabs);
    console.log('[Background] Found active tabs:', tabs.length);
    if (tabs.length > 0) {
      const video = getRandomVideo();
      console.log('[Background] Sending jumpscare to tab:', tabs[0].id, 'video:', video);
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'playJumpscare',
        video: video
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.log('[Background] Failed to send jumpscare:', chrome.runtime.lastError.message);
          // Try to inject content script and retry
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
          }, () => {
            if (!chrome.runtime.lastError) {
              // Retry sending message after injection
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'playJumpscare',
                video: video
              });
            }
          });
        } else {
          console.log('[Background] Jumpscare message sent successfully');
        }
      });
    }
    scheduleNextJumpscare();
  });
}

function scheduleNextJumpscare() {
  console.log('[Background] scheduleNextJumpscare called, enabled:', isExtensionEnabled);
  if (!isExtensionEnabled) return;
  
  clearTimeout(jumpscareTimeout);
  const delay = getRandomDelay();
  jumpscareTimeout = setTimeout(triggerJumpscare, delay);
}

function startExtension() {
  isExtensionEnabled = true;
  scheduleNextJumpscare();
}

function stopExtension() {
  console.log('[Background] Stopping extension');
  isExtensionEnabled = false;
  clearTimeout(jumpscareTimeout);
}

chrome.storage.sync.get(['extensionEnabled'], function(result) {
  if (result.extensionEnabled) {
    startExtension();
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'toggleExtension') {
    if (request.enabled) {
      startExtension();
    } else {
      stopExtension();
    }
    sendResponse({success: true});
  }
});