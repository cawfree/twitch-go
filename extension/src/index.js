import "@babel/polyfill";

import React from "react";
import ReactDOM from "react-dom";
import ffmpeg from "ffmpeg.js/ffmpeg-mp4";

// ffmpeg -i howto.mp4 -framerate 30 -video_size 1280x720 -c:v libx264 -ar 44100 -f flv rtmp://live-lhr03.twitch.tv/app/live_106182096_kBSohhfylG2nCWSQSLX1nWACmsgDNp

ReactDOM.render(
  <>hello</>,
  document.getElementById("root"),
);

var desktop_sharing = false;
var local_stream = null;
function toggle() {
  if (!desktop_sharing) {
    chrome.desktopCapture.chooseDesktopMedia(["screen", "window"], onAccessApproved);
  } else {
    desktop_sharing = false;

    if (local_stream)
      local_stream.stop();
    local_stream = null;

    document.querySelector('button').innerHTML = "Enable Capture";
    console.log('Desktop sharing stopped...');
  }
}

function onAccessApproved(desktop_id) {
  if (!desktop_id) {
    console.log('Desktop Capture access rejected.');
    return;
  }
  desktop_sharing = true;
  document.querySelector('button').innerHTML = "Disable Capture";
  console.log("Desktop sharing started.. desktop_id:" + desktop_id);

  navigator.webkitGetUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: desktop_id,
        minWidth: 1280,
        maxWidth: 1280,
        minHeight: 720,
        maxHeight: 720
      }
    }
  }, gotStream, getUserMediaError);
}

function gotStream(stream) {
  local_stream = stream;
  const videoElem = document.querySelector('video');
  videoElem.srcObject = stream;

  const options = {mimeType: 'video/webm;codecs=h264'}; 
  const mediaRecorder = new MediaRecorder(stream, options);
  const recordedBlobs = [];

  mediaRecorder.onstop = async () => {
    console.log('got stop');
    const blob = new Blob(recordedBlobs, options);
    // XXX: Convert into Uint8.
    const data = await blob.arrayBuffer();

    console.log('webm video is',blob);
    console.log('data is',data);

    var stdout = "";
    var stderr = "";

    const result = ffmpeg({
      MEMFS: [{name: "test.webm", data }],
      stdin: () => null,
      arguments: ["-i", "test.webm", "-f", "mp4", "-codec", "copy", "out.mp4"],
      //arguments: ["-i", "test.webm", "-c:v", "libvpx", "-an", "out.mp4"],
      print: function(data) { stdout += data + "\n"; },
      printErr: function(data) { stderr += data + "\n"; },
      onExit: function(code) {
        console.log("Process exited with code " + code);
        console.log(stdout);
        console.log(stderr);
      },
    });
  };
  mediaRecorder.ondataavailable = (event) => {
    console.log('got data');
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
  };
  console.log('starting');
  mediaRecorder.start(1000);
  setTimeout(
    () => mediaRecorder.stop(),
    1000,
  );
}

function getUserMediaError(e) {
  console.log('getUserMediaError: ' + JSON.stringify(e, null, '---'));
}

document.querySelector('button').addEventListener('click', function(e) {
  toggle();
});
