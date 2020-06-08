var elKnobs = document.getElementById('knobs');
var elFftSize = document.getElementById('fftSize');
var elMinDecibels = document.getElementById('minDecibels');
var elMaxDecibels = document.getElementById('maxDecibels');
var elStartButton = document.getElementById('start');
var elsmoothingTimeConstant = document.getElementById('smoothingTimeConstant');

elStartButton.addEventListener('click', init);

function init() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(start)
    .catch(console.log);
}

function start(stream) {
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  var realAudioInput = audioCtx.createMediaStreamSource(stream);

  var analyser = audioCtx.createAnalyser();
  realAudioInput.connect(analyser);
  analyser.fftSize = parseInt(elFftSize.value);
  analyser.minDecibels = parseInt(elMinDecibels.value);
  analyser.maxDecibels = parseInt(elMaxDecibels.value);
  analyser.smoothingTimeConstant = parseFloat(elsmoothingTimeConstant.value);

  var bufferLength = analyser.frequencyBinCount;
  var frequencyData = new Uint8Array(bufferLength);

  var canvas = document.getElementById('spectrogram');
  canvas.width = bufferLength;
  canvas.style.width = bufferLength + 'px';
  canvas.height = window.innerHeight;
  canvas.style.height = window.innerHeight + 'px';
  var canvasCtx = canvas.getContext('2d');

  function draw() {
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

    requestAnimationFrame(draw);
  }

  draw();
}
