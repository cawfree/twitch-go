chrome.app.runtime.onLaunched.addListener(
  () => chrome.app.window.create(
    'index.html',
    {
      id: "desktopCaptureID",
      bounds: {
        width: 1024,
        height: 768,
      },
    },
  ),
);
