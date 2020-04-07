//import ffmpeg from "@ffmpeg/core";

onmessage = (e) => {
  const { data } = e;

  //console.log('launching...');
  //const x = ffmpeg({
  //  arguments: ["-version"],
  //  print: console.log,
  //  printErr: console.error,
  //});

  //console.log(data);
  //console.log(x);


//  const result = ffmpeg({
//    ...data,
////    print: console.log,
////    printErr: console.log,
////    stdin: () => null,
////    stdout: console.log,
////    stderr: console.log,
//    //stdin: () => null,
//    //arguments: ["-i", "test.webm", "-f", "mp4", "-codec", "copy", "out.mp4"],
//    //arguments: ["-i", "test.webm", "-c:v", "libvpx", "-an", "out.mp4"],
//    //print: function(data) {
//    //  console.log('print',data);
//    //},
//    //printErr: function(data) {
//    //  console.log('printErr', data);
//    //},
//    //onExit: function(code) {
//    //  console.log("Process exited with code " + code);
//    //  //console.log(stdout);
//    //  //console.log(stderr);
//    //},
//  });
//  console.log('result is', result);
};

//setTimeout(
//  () => postMessage("i have done something"),
//  1000,
//);
