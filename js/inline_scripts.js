
    function captureFrame() {
      try {
        const video = document.getElementById("player");
        
        if (!video) {
          alert('Video element not found');
          return;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current frame
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob and download
        canvas.toBlob(function(blob) {
          // Create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          a.href = url;
          a.download = `frame-capture-${timestamp}.png`;
          a.click();
          
          // Show premium preview
          const preview = document.getElementById('capture-preview');
          const capturedImg = document.getElementById('captured-image');
          capturedImg.src = url;
          preview.classList.add('show');
          
          // Hide preview after 2.5 seconds
          setTimeout(() => {
            preview.classList.remove('show');
            setTimeout(() => {
              URL.revokeObjectURL(url);
            }, 300);
          }, 2500);
        }, 'image/png');
        
      } catch (error) {
        console.error('Error capturing frame:', error);
        alert('Error capturing frame. Please try again.');
      }
    }

    document.addEventListener("DOMContentLoaded", function () {

      const params = new URLSearchParams(window.location.search);
      const streamUrl = params.get("url") || "https://rumble.com/live-hls-dvr/6z4aec/playlist.m3u8?level=1";

      const video = document.getElementById("player");
      const source = streamUrl;

      const defaultOptions = {
        autoplay: true,
        controls: [
          'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'
        ],
        settings: ['quality']
      };

      if (Hls.isSupported()) {
        const hls = new Hls({ autoStartLoad: true });

        hls.loadSource(source);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const availableQualities = data.levels.map(l => l.height).sort((a,b) => b - a);

          const player = new Plyr(video, {
            ...defaultOptions,
            quality: {
              default: availableQualities[0],
              options: availableQualities,
              forced: true,
              onChange: q => {
                hls.levels.forEach((level, index) => {
                  if (level.height === q) hls.currentLevel = index;
                });
              }
            }
          });

          // Add custom capture button after player is ready
          player.on('ready', () => {
            addCaptureButton(player);
          });
        });

      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        video.addEventListener("loadedmetadata", () => video.play());
        const player = new Plyr(video, defaultOptions);
        
        player.on('ready', () => {
          addCaptureButton(player);
        });
      }
    });

    function addCaptureButton(player) {
      // Find the controls container
      const controls = document.querySelector('.plyr__controls');
      if (!controls) return;

      // Create capture button
      const captureBtn = document.createElement('button');
      captureBtn.className = 'plyr__controls__item plyr__control';
      captureBtn.setAttribute('type', 'button');
      captureBtn.setAttribute('data-plyr', 'capture');
      captureBtn.setAttribute('aria-label', 'Capture Frame');
      captureBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      `;
      
      captureBtn.addEventListener('click', captureFrame);

      // Insert before fullscreen button
      const fullscreenBtn = controls.querySelector('[data-plyr="fullscreen"]');
      if (fullscreenBtn) {
        controls.insertBefore(captureBtn, fullscreenBtn);
      } else {
        controls.appendChild(captureBtn);
      }
    }
  