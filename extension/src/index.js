import "@babel/polyfill";

import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";

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

async function gotStream(stream) {
  local_stream = stream;
  const videoElem = document.querySelector('video');
  videoElem.srcObject = stream;
  while (true) {
    await new Promise(
      (resolve) => {
        const blobs = [];
        const options = {mimeType: 'video/webm;codecs=h264'}; 
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorder.onstop = async (event) => {
          if (blobs.length > 0) {
            const blob = new Blob(blobs, options);
            const formData = new FormData();
            formData.append('blob', blob, 'blob');
            console.log('sending');
            await axios({
              url: 'http://localhost:3000/blob',
              method: 'post',
              headers: {
                ['Content-Type']: 'multipart/form-data',
              },
              data: formData,
            })
              // TODO: Implement error handling.
              .then(resolve)
              .catch(
                (e) => {
                  console.error(e);
                  resolve();
                },
              );
          }
        };
        mediaRecorder.ondataavailable = async (event) => {
          if (event.data && event.data.size > 0) {
            blobs.push(event.data); 
          }
        }
        mediaRecorder.start(250);
        // XXX:  One-second slices.
        // TODO: Definitions via API would be great.
        setTimeout(() => mediaRecorder.stop(), 1000);
      },
    );
  }
}

function getUserMediaError(e) {
  console.log('getUserMediaError: ' + JSON.stringify(e, null, '---'));
}

document.querySelector('button').addEventListener('click', function(e) {
  toggle();
});
