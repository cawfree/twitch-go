import "@babel/polyfill";

import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";

const attemptCameraCapture = () => new Promise(
  (resolve, reject) => navigator.webkitGetUserMedia(
    {
      video: true,
      audio: true,
    },
    resolve,
    reject,
  ),
);

const attemptDesktopCapture = () => new Promise(
  resolve => chrome.desktopCapture.chooseDesktopMedia(
    ["screen", "window"],
    resolve,
  ),
)
  .then(
    (chromeMediaSourceId) => {
      if (chromeMediaSourceId) {
        return new Promise(
          (resolve, reject) => navigator.webkitGetUserMedia(
            {
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId,
                  minWidth: 1280,
                  maxWidth: 1280,
                  minHeight: 720,
                  maxHeight: 720,
                },
              },
            },
            resolve,
            reject,
          ),
        );

      }
      return Promise.reject(`User cancelled selection.`);
    },
  );

const recordSegment = (type, stream, duration) => new Promise(
  (resolve, reject) => {
    const blobs = [];
    const options = {
      mimeType: 'video/webm;codecs=h264',
    }; 
    const mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.onstop = async (event) => {
      if (blobs.length > 0) {
        const blob = new Blob(blobs, options);
        const data = new FormData();
        data.append('blob', blob, 'blob');
        try {
          axios({
            url: `http://localhost:${process.env.PORT}/${type}`,
            method: 'post',
            headers: {
              ['Content-Type']: 'multipart/form-data',
            },
            data,
          })
          resolve();
        } catch (e) {
          reject(e);
        }
      }
    };
    mediaRecorder.ondataavailable = event => (event.data && event.data.size > 0) && (
      blobs.push(event.data)
    );
    mediaRecorder.start();
    // XXX:  One-second slices.
    // TODO: Definitions via API would be great.
    setTimeout(() => mediaRecorder.stop(), duration);
  },
);

const startStreaming = (ref, type, stream, duration) => {
  ref.current.srcObject = stream;
  ref.current.play();
  ref.current.volume = 0;
  ref.current.muted = true;
  const i = setInterval(
    () => recordSegment(type, stream, duration),
    duration,
  );
  return () => clearInterval(i);
};

const TwitchGo = ({ duration, ...extraProps }) => {
  const cameraRef = useRef();
  const desktopRef = useRef();
  const [cameraStream, setCameraStream] = useState(null);
  const [desktopStream, setDesktopStream] = useState(null);
  useEffect(
    () => attemptCameraCapture()
      .then(stream => setCameraStream(stream))
      .then(() => attemptDesktopCapture())
      .then(stream => setDesktopStream(stream)) && undefined,
    [],
  );
  useEffect(
    () => {
      if (!!cameraStream) {
        return startStreaming(cameraRef, 'camera', cameraStream, duration);
      }
    },
    [cameraStream],
  );
  useEffect(
    () => {
      if (!!desktopStream) {
        return startStreaming(desktopRef, 'desktop', desktopStream, duration);
      }
    },
    [desktopStream],
  );
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#9146FF',
      }}
    >
      <video
        ref={desktopRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
      <video
        ref={cameraRef}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '25%',
          height: '25%',
        }}
      />
    </div>
  );
};

ReactDOM.render(
  <TwitchGo
    duration={1000}
  />,
  document.getElementById("root"),
);
