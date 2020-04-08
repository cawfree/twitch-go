import "@babel/polyfill";

import express from "express";
import multer from "multer";
import cors from "cors";
import chalk from "chalk";
import { json } from "body-parser";
import { promises as fs, existsSync, mkdirSync } from "fs";
import { nanoid } from "nanoid";
import { exec } from "child_process";
import { config } from "dotenv";

config();

const dir = 'public';
const cameraPath = `${dir}/camera.webm`;
const desktopPath = `${dir}/desktop.webm`;

const {
  PORT,
  INGEST,
  TWITCH_SECRET,
} = process.env;

const startStreaming = () => Promise
  .resolve()
  .then(() => console.log(`👍`))
  .then(
    () => new Promise(
      (resolve, reject) => exec(
        `ffmpeg -re -stream_loop -1 -i ${dir}/list.txt -flush_packets 0 -framerate 25 -video_size 1280x720 -c:v libx264 -preset fast -ar 44100 -f flv ${INGEST}/${TWITCH_SECRET}`,
        (err, stdout, stderr) => {
          if (err) {
            return reject(err);
          }
          return resolve(stdout || stderr);
        },
      ),
    ),
  );

(async () => {
  let cnt = 0;
  // XXX: Ensure the temporary folder is ready to load data into.
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
  await fs.writeFile(
    `${dir}/list.txt`, `ffconcat version 1.0\nfile item_0.webm\nfile item_0.webm`,
  );
  if (isNaN(PORT) || PORT <= 0) {
    throw new Error(`Expected .env to contain a positive integer PORT, but encountered ${PORT}.`);
  } else if (typeof INGEST !== 'string' || INGEST.length <= 0) {
    throw new Error(`Expected .env to contain a Twitch ingest url, but encountered ${INGEST}. You can find a list of possible ingests here: https://stream.twitch.tv/ingests/`);
  } else if (typeof TWITCH_SECRET !== 'string' || TWITCH_SECRET.length <= 0) {
    throw new Error(`Expected .env to contain a valid Twitch secret key, but encountered ${TWITCH_SECRET}. You can find yours here: https://www.twitch.tv/settings/profile`);
  }
  await new Promise(
    resolve => express()
      .use(cors())
      .use(json({ limit: '50mb' }))
      .post('/desktop', multer().single('blob'), (req, res) => fs
        .writeFile(
          desktopPath,
          Buffer.from(new Uint8Array(req.file.buffer)),
        )
        .then(() => res.status(200).send())
        .then(() => console.log('got desk')),
      )
      .post('/camera', multer().single('blob'), (req, res) => fs
        .writeFile(
          cameraPath,
          Buffer.from(new Uint8Array(req.file.buffer)),
        )
        .then(() => res.status(200).send())
        .then(() => console.log('got cam')),
      )
      .listen(PORT, resolve),
  );
})();

//console.log(req.file.type);
//const shouldExec = cnt === 0;
//  .then(() => cnt++)
// XXX: After receiving the first file, start streaming.
//.then(() => (!!shouldExec) && startStreaming());
