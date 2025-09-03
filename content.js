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
  return chrome.runtime.getURL(`videos/${videos[randomIndex]}`);
}

function getRandomDelay() {
  // return Math.random() * (300000 - 30000) + 30000;
  return 5000;
}

function playJumpscare() {
  if (!isExtensionEnabled) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'fnaf-jumpscare-overlay';
  
  const video = document.createElement('video');
  video.className = 'fnaf-jumpscare-video';
  video.src = getRandomVideo();
  video.autoplay = true;
  video.volume = 1.0;
  video.muted = false;
  
  overlay.appendChild(video);
  document.body.appendChild(overlay);
  
  video.addEventListener('ended', function() {
    document.body.removeChild(overlay);
    scheduleNextJumpscare();
  });
  
  video.addEventListener('error', function() {
    document.body.removeChild(overlay);
    scheduleNextJumpscare();
  });
}

function scheduleNextJumpscare() {
  if (!isExtensionEnabled) return;
  
  clearTimeout(jumpscareTimeout);
  const delay = getRandomDelay();
  jumpscareTimeout = setTimeout(playJumpscare, delay);
}

function startExtension() {
  isExtensionEnabled = true;
  scheduleNextJumpscare();
}

function stopExtension() {
  isExtensionEnabled = false;
  clearTimeout(jumpscareTimeout);
  
  const existingOverlay = document.querySelector('.fnaf-jumpscare-overlay');
  if (existingOverlay) {
    document.body.removeChild(existingOverlay);
  }
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
  }
});