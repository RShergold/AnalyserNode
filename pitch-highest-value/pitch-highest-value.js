var elStartButton = document.getElementById('start');
elStartButton.onclick = start;

function start() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(main)
    .catch(console.log);
}

function main(stream) {
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  var realAudioInput = audioCtx.createMediaStreamSource(stream);

  var analyser = audioCtx.createAnalyser();
  realAudioInput.connect(analyser);
  analyser.fftSize = 512;

  var bufferLength = analyser.frequencyBinCount;
  var frequencyData = new Uint8Array(bufferLength);

  var canvas = document.getElementsByTagName('canvas')[0];
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var canvasCtx = canvas.getContext('2d');

  //           c4  d4  e4  f4  g4  a4
  // var notes = [20, 19, 21, 11, 21, 5];
  var notes = [
    [14, 20], //[20, 19, 23, 14], // c4
    [3, 4, 19, 2], // d4
    [4, 3, 18, 17], // e4
    [23, 22, 19, 4], // f4
    [4, 5, 21, 3], // g4
    [5, 4, 6, 19], // a4
    [5, 27, 26, 6], // b4
    [6, 23, 5, 22], // c5
  ];
  var whiteKeyColor = '#9ea3a8'; // White

  function draw() {
    analyser.getByteFrequencyData(frequencyData);

    // var highestIndex = frequencyData.reduce(function (indexMax, value, index) {
    //   if (value > frequencyData[indexMax]) {
    //     return index;
    //   }
    //   return indexMax;
    // }, 0);
    var sortedFrequencyData = Array.from(frequencyData)
      .map(function (value, index) {
        return {
          value: value,
          index: index,
        };
      })
      .sort(function (a, b) {
        return b.value - a.value;
      });

    var foundIndex = notes.findIndex(function (note) {
      return (
        note.includes(sortedFrequencyData[0].index) &&
        note.includes(sortedFrequencyData[1].index) &&
        note.includes(sortedFrequencyData[2].index) &&
        note.includes(sortedFrequencyData[3].index)
      );
    });
    var activeKey = foundIndex == -1 ? undefined : foundIndex;

    // var activeKey = undefined;
    // var magnitude = undefined;
    // if (activeNote) {
    //   activeKey = activeNote.index;
    //   // activeKey = notes.indexOf(highestIndex);
    //   // magnitude = frequencyData[highestIndex];
    //   // console.log(activeKey);
    //   // console.log(magnitude);
    // }
    console.log(activeKey);

    shiftSpectrogram(activeKey, 255);
    drawPiano(activeKey);

    requestAnimationFrame(draw);
  }

  function shiftSpectrogram(activeKey, magnitude) {
    var spectrogramBottom = Math.floor(canvas.height * 0.66); // 2/3
    var imageData = canvasCtx.getImageData(
      0,
      0,
      canvas.width,
      spectrogramBottom + 1
    );

    if (activeKey !== undefined) {
      var whiteKeyWidth = Math.floor(canvas.width / 11);
      var xFrom = whiteKeyWidth * activeKey;
      var xTo = whiteKeyWidth * activeKey + whiteKeyWidth;
      // console.log(magnitude);

      var y = spectrogramBottom - 1;
      for (var x = xFrom; x < xTo; x++) {
        var offset = (y * imageData.width + x) * 4;
        imageData.data[offset] = 255; // Red
        imageData.data[offset + 1] = 255; // Green
        imageData.data[offset + 2] = 255; // Blue
        imageData.data[offset + 3] = magnitude; // Alpha
      }
    }

    canvasCtx.putImageData(imageData, 0, -1);
  }

  function drawPiano(activeKey) {
    var keyHeight = canvas.height / 3;
    var whiteKeyWidth = canvas.width / 11;
    var keyTop = canvas.height - keyHeight;

    // Clear piano
    canvasCtx.clearRect(0, keyTop, canvas.width, canvas.height);

    // white keys
    canvasCtx.fillStyle = whiteKeyColor;
    for (var key = 0; key < 11; key++) {
      if (activeKey === key) {
        canvasCtx.fillStyle = '#dc281f'; // Red
      }
      if (activeKey + 1 === key) {
        // Restore white color
        canvasCtx.fillStyle = whiteKeyColor;
      }

      canvasCtx.fillRect(
        whiteKeyWidth * key,
        keyTop,
        whiteKeyWidth - 1,
        keyHeight
      );
    }

    // black keys
    var blackKeyWidth = whiteKeyWidth / 2;
    var leftOffset = whiteKeyWidth * 0.75;
    keyHeight = keyHeight * 0.75;

    canvasCtx.fillStyle = '#22282f';
    for (var key = 0; key < 9; key++) {
      if (key !== 2 && key !== 6) {
        canvasCtx.fillRect(
          whiteKeyWidth * key + leftOffset,
          keyTop,
          blackKeyWidth,
          keyHeight
        );
      }
    }

    canvasCtx.stroke();
  }

  draw();
}
