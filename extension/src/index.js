import "@babel/polyfill";

import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import VideoStreamMerger from "video-stream-merger";
import { useWindowSize } from "react-use";

const width = window.screen.width;
const height = window.screen.height;

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
                  minWidth: width,
                  maxWidth: width,
                  minHeight: height,
                  maxHeight: height,
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

const streamChunk = async (type, stream, duration) => {
  const blobs = [];
  const options = { mimeType: 'video/webm;codecs=h264' };
  const mediaRecorder = new MediaRecorder(
    stream,
    options,
  );
  const blob = await new Promise(
    (resolve) => {
      mediaRecorder.ondataavailable = e => (e.data && e.data.size > 0) && blobs.push(e.data);
      mediaRecorder.onstop = () => resolve(new Blob(blobs, options));
      mediaRecorder.start(250);
      setTimeout(() => mediaRecorder.stop(), duration);
    },
  );
  const data = new FormData();
  data.append('blob', blob, 'blob');
  return data;
};

const startStreaming = (type, stream, duration) => {
  const t = setInterval(
    () => streamChunk(type, stream, duration)
      .then(data => axios({
        url: `http://localhost:${process.env.PORT}/${type}`,
        method: 'post',
        headers: {
          ['Content-Type']: 'multipart/form-data',
        },
        data,
      })),
    duration,
  );
  return () => clearInterval(t);
};

const TwitchGo = ({ duration, ...extraProps }) => {
  const ref = useRef();
  const [cameraStream, setCameraStream] = useState(null);
  const [desktopStream, setDesktopStream] = useState(null);
  const [merger, setMerger] = useState(null);
  const windowSize = useWindowSize();

  useEffect(
    () => attemptCameraCapture()
      .then(stream => setCameraStream(stream))
      .then(() => attemptDesktopCapture())
      .then(stream => setDesktopStream(stream)) && undefined,
    [],
  );
  useEffect(
    () => {
      if (!!cameraStream && !!desktopStream) {
        const scale = 1;
        const merger = new VideoStreamMerger({
          width: width * scale,
          height: height * scale,
          fps: process.env.FRAME_RATE,
        });
        const size = width * scale * 0.25;
        merger.addStream(
          desktopStream,
          {
            x: 0,
            y: 0,
            width: merger.width,
            height: merger.height,
            mute: true,
          },
        );
        merger.addStream(
          cameraStream,
          {
            x: merger.width - size,
            y: merger.height - size,
            width: size,
            height: size,
            mute: false,
          },
        );
        setMerger(merger);
      }
    },
    [cameraStream, desktopStream],
  );
  useEffect(
    () => {
      if (merger) {
        merger.start();
        const { result: srcObject } = merger;
        ref.current.srcObject = srcObject;
        ref.current.volume = 0;
        ref.current.muted = true;
        ref.current.play();
        return startStreaming('desktop', srcObject, duration);
      }
    },
    [merger],
  );
  return (
    <video
      ref={ref}
      style={windowSize}
    />
  );
};

ReactDOM.render(
  <TwitchGo
    duration={process.env.DURATION}
  />,
  document.getElementById("root"),
);
