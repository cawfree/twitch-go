import "@babel/polyfill";

import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";

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

const recordSegment = (stream, duration) => new Promise(
  (resolve, reject) => {
    const blobs = [];
    const options = {
      mimeType: 'video/webm;codecs=h264',
    }; 
    const mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.onstop = async (event) => {
      if (blobs.length > 0) {
        const blob = new Blob(blobs, options);
        const formData = new FormData();
        formData.append('blob', blob, 'blob');
        try {
          axios({
            url: `http://localhost:${process.env.PORT}/blob`,
            method: 'post',
            headers: {
              ['Content-Type']: 'multipart/form-data',
            },
            data: formData,
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
    mediaRecorder.start(Math.floor(duration * 0.25));
    // XXX:  One-second slices.
    // TODO: Definitions via API would be great.
    setTimeout(() => mediaRecorder.stop(), duration);
  },
);

const TwitchGo = ({ duration, ...extraProps }) => {
  const ref = useRef();
  const [stream, setStream] = useState(null);
  useEffect(
    () => attemptDesktopCapture()
      .then(stream => setStream(stream)) && undefined,
    [],
  );
  useEffect(
    () => {
      if (!!stream) {
        ref.current.srcObject = stream;
        ref.current.play();
        const i = setInterval(
          () => recordSegment(stream, duration),
          duration,
        );
        return () => clearInterval(i);
      }
    },
    [stream],
  );
  return (
    <div
      style={{
        width: 760,
        height: 440,
        backgroundColor: '#9146FF',
      }}
    >
      <video
        ref={ref}
        style={{
          width: '100%',
          height: '100%',
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
