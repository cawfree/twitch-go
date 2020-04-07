import "@babel/polyfill";

import express from "express";
import multer from "multer";
import { json } from "body-parser";
import cors from "cors";
import { promises as fs } from "fs";
import { nanoid } from "nanoid";
import { exec } from "child_process";
import { config } from "dotenv";

config();

const dir = 'public';

const {
  PORT,
  INGEST,
  TWITCH_SECRET,
} = process.env;

(async () => {
  await fs.writeFile(
    `${dir}/list.txt`, `ffconcat version 1.0\nfile item_0.webm\nfile item_0.webm`,
  );
  const cmd = `ffmpeg -re -stream_loop -1 -i ${dir}/list.txt -flush_packets 0 -framerate 25 -video_size 1280x720 -c:v libx264 -preset fast -ar 44100 -f flv ${INGEST}/${TWITCH_SECRET}`;
  exec(cmd);
  await new Promise(
    resolve => express()
      .use(cors())
      .use(json({ limit: '50mb' }))
      .post('/blob', multer().single('blob'), (req, res) => {
        const path = `${dir}/item_0.webm`;
        return fs.writeFile(
          path,
          Buffer.from(new Uint8Array(req.file.buffer)),
        )
          .then(() => res.status(200).send());
      })
      .listen(PORT, resolve),
  );
})();
