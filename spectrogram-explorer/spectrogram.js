var elKnobs = document.getElementById('knobs');
var elFftSize = document.getElementById('fftSize');
var elMinDecibels = document.getElementById('minDecibels');
var elMaxDecibels = document.getElementById('maxDecibels');
var elSmoothingTimeConstant = document.getElementById('smoothingTimeConstant');
var elStartButton = document.getElementById('start');

var elRunning = document.getElementById('running');
var elStopButton = document.getElementById('stop');

var elExplorer = document.getElementById('explorer');

elStartButton.addEventListener('click', start);

function start() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(function (stream) {
      elKnobs.style.display = 'none';
      elRunning.style.display = 'initial';
      init(stream);
    })
    .catch(console.log);
}

function init(stream) {
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  var realAudioInput = audioCtx.createMediaStreamSource(stream);

  var analyser = audioCtx.createAnalyser();
  realAudioInput.connect(analyser);
  analyser.fftSize = parseInt(elFftSize.value);
  analyser.minDecibels = parseInt(elMinDecibels.value);
  analyser.maxDecibels = parseInt(elMaxDecibels.value);
  analyser.smoothingTimeConstant = parseFloat(elSmoothingTimeConstant.value);

  var bufferLength = analyser.frequencyBinCount;
  var frequencyData = new Uint8Array(bufferLength);

  var canvas = document.getElementsByTagName('canvas')[0];

  canvas.width = bufferLength;
  canvas.style.width = bufferLength + 'px';
  canvas.height = window.innerHeight;
  canvas.style.height = window.innerHeight + 'px';
  var canvasCtx = canvas.getContext('2d');

  isRunning = true;
  var stoppedImageData;

  document.getElementById('stop').onclick = function () {
    elRunning.style.display = 'none';
    elExplorer.style.display = 'initial';
    stoppedImageData = canvasCtx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    document.getElementById('panX').value = Math.floor(canvas.width / 2);
    document.getElementById('panY').value = canvas.height - 50;
    isRunning = false;
  };

  function draw() {
    if (isRunning) {
      shiftSpectrogram();
    } else {
      renderExplorer();
    }

    requestAnimationFrame(draw);
  }

  function shiftSpectrogram() {
    var imageData = canvasCtx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height + 1
    );
    analyser.getByteFrequencyData(frequencyData);

    var y = canvas.height - 1;
    for (var x = 0; x < bufferLength; x++) {
      var offset = (y * imageData.width + x) * 4;
      imageData.data[offset] = 255; // Red
      imageData.data[offset + 1] = 255; // Green
      imageData.data[offset + 2] = 255; // Blue
      imageData.data[offset + 3] = frequencyData[x]; // Alpha
    }

    canvasCtx.putImageData(imageData, 0, -1);
  }

  var lastPanX = 0;
  var lastPanY = 0;

  function renderExplorer() {
    var panX = parseInt(document.getElementById('panX').value);
    var panY = parseInt(document.getElementById('panY').value);

    // Render spectrogram
    canvasCtx.putImageData(stoppedImageData, 0, 0);

    // Render curser
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, panY);
    canvasCtx.lineTo(canvas.width, panY);

    canvasCtx.moveTo(panX, 0);
    canvasCtx.lineTo(panX, canvas.height);
    canvasCtx.strokeStyle = '#dc281e';
    canvasCtx.stroke();

    if (lastPanY != panY || lastPanX != panX) {
      lastPanY = panY;
      lastPanX = panX;

      // Get values for row
      var rowStart = panY * stoppedImageData.width * 4;
      var rowEnd = (panY + 1) * stoppedImageData.width * 4;
      var row = stoppedImageData.data
        .slice(rowStart, rowEnd)
        .filter(function (value, index) {
          return index % 4 === 3;
        });

      // Sorted row
      var sortedRow = Array.from(row)
        .map(function (value, index) {
          return {
            index: index,
            value: value,
          };
        })
        .sort(function (a, b) {
          return b.value - a.value;
        });

      console.clear();
      console.log(row);
      console.log('x value:', row[panX]);
      console.log(JSON.stringify(sortedRow.slice(0, 10), null, 2));
    }
  }

  draw();
}
