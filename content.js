function playJumpscare(videoPath) {
  
  const overlay = document.createElement('div');
  overlay.className = 'fnaf-jumpscare-overlay';
  
  const video = document.createElement('video');
  video.className = 'fnaf-jumpscare-video';
  const videoUrl = chrome.runtime.getURL(videoPath);
  video.src = videoUrl;
  video.autoplay = true;
  video.volume = 1.0;
  video.muted = false;
  
  overlay.appendChild(video);
  document.body.appendChild(overlay);
  
  video.addEventListener('ended', function() {
    document.body.removeChild(overlay);
  });
  
  video.addEventListener('error', function(e) {
    document.body.removeChild(overlay);
  });
  
  video.addEventListener('loadstart', function() {
    console.log('[Content] Video load started');
  });
  
  video.addEventListener('canplay', function() {
    console.log('[Content] Video can play');
  });
  
  video.addEventListener('play', function() {
    console.log('[Content] Video playing');
  });
}

function stopJumpscares() {
  const existingOverlay = document.querySelector('.fnaf-jumpscare-overlay');
  if (existingOverlay) {
    console.log('[Content] Removing existing overlay');
    document.body.removeChild(existingOverlay);
  } else {
    console.log('[Content] No existing overlay found');
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'playJumpscare') {
    console.log('[Content] Playing jumpscare with video:', request.video);
    playJumpscare(request.video);
  } else if (request.action === 'stopJumpscares') {
    console.log('[Content] Stopping jumpscares');
    stopJumpscares();
  }
});