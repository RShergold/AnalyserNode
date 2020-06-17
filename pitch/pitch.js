var elStartButton = document.getElementById('start');
elStartButton.onclick = start;

function start() {
  elStartButton.parentElement.removeChild(elStartButton);

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(main)
    .catch(console.log);
}

function downsample(samples, ratio) {
  return samples.filter(function (_, index) {
    return (index + 1) % ratio === 0;
  });
}

function main(stream) {
  var audioCtx = new window.AudioContext();

  var realAudioInput = audioCtx.createMediaStreamSource(stream);

  var analyser = audioCtx.createAnalyser();
  realAudioInput.connect(analyser);
  analyser.fftSize = 1024; // 2048;
  analyser.minDecibels = -75;

  var bufferLength = analyser.frequencyBinCount;
  var frequencyData = new Uint8Array(bufferLength);

  var canvas = document.getElementsByTagName('canvas')[0];
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var canvasCtx = canvas.getContext('2d');

  var whiteKeyColor = '#9ea3a8'; // White
  var threshold = Math.pow(128, 5) / 4; // This is basically arbitrary
  var keys = [5, 9999, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  function draw() {
    analyser.getByteFrequencyData(frequencyData);

    var sample2 = downsample(frequencyData, 2); // Half
    var sample3 = downsample(frequencyData, 3); // Third
    var sample4 = downsample(frequencyData, 4); // Quarter
    var sample5 = downsample(frequencyData, 5); // Fifth

    var hps = [];
    for (var i = 0; i < sample5.length; i++) {
      hps[i] =
        frequencyData[i] * sample2[i] * sample3[i] * sample4[i] * sample5[i];
    }
    var highestIndex = hps.indexOf(Math.max.apply(Math, hps));
    var activeKey = undefined;

    if (hps[highestIndex] > threshold) {
      activeKey = keys.indexOf(highestIndex);
    }

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
