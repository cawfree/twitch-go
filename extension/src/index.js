import "@babel/polyfill";

import React from "react";
import ReactDOM from "react-dom";

const { createWorker } = FFmpeg;

//import { createWorker } from "@ffmpeg/ffmpeg";
//
//const worker = createWorker({
//  corePath: './ffmpeg-core.js',
//  logger: m => console.log(m)
//});

//import Worker from './ffmpeg.worker.js';
//const ffmpeg = new Worker('./ffmpeg.js', { type: 'module' });

//ffmpeg.onmessage = e => console.log(e.data);

//ffmpeg.postMessage({ hello: 'world' });

// ffmpeg -i howto.mp4 -framerate 30 -video_size 1280x720 -c:v libx264 -ar 44100 -f flv rtmp://live-lhr03.twitch.tv/app/live_106182096_kBSohhfylG2nCWSQSLX1nWACmsgDNp
// webm:
// ffmpeg -i test.webm -framerate 30 -video_size 1280x720 -c:v libx264 -ar 44100 -f flv rtmp://live-lhr03.twitch.tv/app/live_106182096_kBSohhfylG2nCWSQSLX1nWACmsgDNp

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

  const options = {mimeType: 'video/webm;codecs=h264'}; 
  const mediaRecorder = new MediaRecorder(stream, options);

  const worker = createWorker({
    logger: ({ message }) => console.log(message),
  });
  await worker.load();

  console.log('worker has loaded...');
  
  const recordedBlobs = [];

  mediaRecorder.onstop = async () => {
    console.log('was stopped');
    const blob = new Blob(recordedBlobs, options);
    const data = await blob.arrayBuffer();

    console.log('got data');

    await worker.write('test.webm', data);
    console.log('written test data');

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('running...');
    // XXX: So that works?
    //await worker.run("-i test.webm -s 1920x1080 output.mp4");
    await worker.run(
      '-i test.webm -d 10000 -ar 44100 out.flv',
    );
    console.log('did it');

      //'-i test.webm -d 10000 -ar 44100 -f flv rtmp://live-lhr03.twitch.tv/app/live_106182096_kBSohhfylG2nCWSQSLX1nWACmsgDNp',
    //await worker.run(
    //  '-i test.webm -framerate 30 -video_size 1280x720 -c:v libx264 -ar 44100 -f flv rtmp://live-lhr03.twitch.tv/app/live_106182096_kBSohhfylG2nCWSQSLX1nWACmsgDNp',
    //);
  };

  mediaRecorder.ondataavailable = async (event) => {
    if (event.data && event.data.size > 0) {
      recordedBlobs.push(event.data);
    }
  };

  mediaRecorder.start(1000);

  setTimeout(
    () => mediaRecorder.stop(),
    10000,
  );
}

function getUserMediaError(e) {
  console.log('getUserMediaError: ' + JSON.stringify(e, null, '---'));
}

document.querySelector('button').addEventListener('click', function(e) {
  toggle();
});
