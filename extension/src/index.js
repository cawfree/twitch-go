import React from "react";
import ReactDOM from "react-dom";
import ffmpeg from "ffmpeg.js";

ReactDOM.render(
  <>hello</>,
  document.getElementById("root"),
);

/*
Copyright 2014 Intel Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Dongseong Hwang (dongseong.hwang@intel.com)
*/

/**
 * Grabs the desktop capture feed from the browser, requesting
 * desktop capture. Requires the permissions
 * for desktop capture to be set in the manifest.
 *
 * @see https://developer.chrome.com/apps/desktopCapture
 */
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
    document.querySelector('video').srcObject = stream;

    var videoStream = document.querySelector('video').captureStream();

    let mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.onstop = () => console.log('got stop');
    mediaRecorder.start(5000);

    var stdout = "";
    var stderr = ""; 

    mediaRecorder.ondataavailable = (event) => {
      console.log('got data');
      console.log(event);
      if (event.data && event.data.size > 0) {
        console.log('got good data');
        // ffmpeg -f x11grab -s 1920x1200 -framerate 15 -i :0.0 -c:v libx264 -preset fast -pix_fmt yuv420p -s 1280x800 -threads 0 -f flv "rtmp://live.twitch.tv/app/live_********_******************************
        ffmpeg({
          MEMFS: [{
            name: "test.mp4",
            data: new Blob([event.data], { type: 'video/mp4' }),
          }],
          arguments: [
            "-f",
            "test.mp4",
            "-s",
            "1920x1200",
            "-framerate",
            "15",
            "-c:v",
            "libx264",
            //"-preset",
            //"fast",
            "-pix_fmt",
            "yuv420p",
            "-s",
            "1280x800",
            "-threads",
            "0",
            "-f",
            "flv",
            "\"rtmp://live-lhr03.twitch.tv/app/live_106182096_kBSohhfylG2nCWSQSLX1nWACmsgDNp\"",
            // --enable-demuxer=flv
            "--enable-demuxer=flv",
            //"flv",
            //"--enable-muxer=flv"
          ],
          //arguments: ["-version"],
          print: function(data) { stdout += data + "\n"; },
          printErr: function(data) { stderr += data + "\n"; },
          onExit: function(code) {
            console.log("Process exited with code " + code);
            console.log(stdout);
            console.log(stderr);
          },
        });
      }
    };

    stream.onended = function() {
      if (desktop_sharing) {
        toggle();
      }
    }
  }

function getUserMediaError(e) {
  console.log('getUserMediaError: ' + JSON.stringify(e, null, '---'));
}

/**
 * Click handler to init the desktop capture grab
 */
document.querySelector('button').addEventListener('click', function(e) {
  toggle();
});
