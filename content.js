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
}

function stopJumpscares() {
  const existingOverlay = document.querySelector('.fnaf-jumpscare-overlay');
  if (existingOverlay) {
    document.body.removeChild(existingOverlay);
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'playJumpscare') {
    playJumpscare(request.video);
  } else if (request.action === 'stopJumpscares') {
    stopJumpscares();
  }
});