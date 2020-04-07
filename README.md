# Twitch a Gooooooooooooooo!*

<p align="center">
  <a href="https://twitch.com">
    <img style="height:150px;" src="https://blog.twitch.tv/assets/uploads/generic-email-header-1.jpg" alt="twitch"/>
  </a>
</p>

🎮 A desktop streaming utility for Twitch which is compatible with [chromebooks](https://www.google.com/intl/en_uk/chromebook/shop/?gclid=Cj0KCQjwybD0BRDyARIsACyS8muo3qfeKIJWHwOoFbmLGwCfeMXNERYLXMupIJj7iA9Y2lbPjjP-ndUaAsDjEALw_wcB&gclsrc=aw.ds). Now you can share your online adventures (or lonely isolation) with the rest of the gaming world.

## 1. about

Twitch is a video streaming service where both competitive gamers and filthy causals come together as one to share high-quality gaming footage, fight for speed running world records and compete with one-another for _epic loot_.

This repository aims to help Chromebook users to get involved, by enabling their Chrome desktop to be streamed directly to [Twitch]() with low latency, with the help of a little extension.

## 2. installing

Installation is split into two main pieces. The first is configuring the media transcoding server (it just _sounds_ difficult) and the second is compiling the extension to install to your Chrome browser.

### 2.1 preparing your environment

Your development environment will be used to host the barebones media server, written using [express]() and backed by [ffmpeg](). This doesn't have to be on your Chromebook; it can be any accessible IP on your network. However, this works just as fine directly on the same Chromebook from within the [crouton]() shell.

The extension will be compiled from this project and then installed to [Chrome]().

**Note:**

> Originally, this repository was aiming at accomplishing everything using just a single extension. There have been some [truly great strides]() towards embedding [ffpmeg in JavaScript]() and [WebAssembly](), however it does not at this time seem possible to hit the [TCP/IP-based]() `rtmp://` protocol directly from [emscripten](). In the future, we may see implementations using [WebRTC](), or potential workarounds with open-source [`swf`]() playback.

  1. First, ensure you have the latest version of [ffmpeg]() installed.
     ([apt-get](https://tecadmin.net/install-ffmpeg-on-linux/)) ([brew](https://formulae.brew.sh/formula/ffmpeg))
  2. Next, you need to have [the Node.js runtime installed](https://nodejs.org/en/download/).
  3. Then, you need to clone this repo.
     `git clone https://github.com/cawfree/twitch-go`
  4. `cd` into the downloaded repo and hit `npm install`. This will download all of the required dependencies.
  5. Finally, inside the project directory you will need to create a [`.env`]() file to store your Twitch access credentials. These will look like the following:

```env
PORT=8080
INGEST=rtmp://live-lhr03.twitch.tv/app
TWITCH_SECRET=live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

You can then run your server with a call to `npm run-script serve`. 

### 2.2 building  your extension

  1. Once your server is configured, you can build your shiny new Chrome extension by running `npm run-script build`. This will create your extension in a new `dist/` directory inside the project folder.
  2. In the Chrome browser, head to [chrome://extensions](chrome://extensions).
  3. Click on **Load Unpacked**.
  4. Navigate to the `dist/` folder and select to install.

## License
[MIT](https://opensource.org/licenses/MIT)

<sub>
* if you read in a mario voice then you win
</sub>
