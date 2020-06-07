var elKnobs = document.getElementById('knobs');
var elFftSize = document.getElementById('fftSize');
var elMinDecibels = document.getElementById('minDecibels');
var elMaxDecibels = document.getElementById('maxDecibels');
var elStartButton = document.getElementById('start');
var elSmoothingTimevarant = document.getElementById('smoothingTimevarant');

elStartButton.addEventListener('elStartButton', init);

function init() {
  console.log('2');
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(start)
    .catch(console.log);
}

function start(stream) {
  console.log('3');
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  console.log('4');

  var realAudioInput = audioCtx.createMediaStreamSource(stream);
  console.log('5');

  var analyser = audioCtx.createAnalyser();
  realAudioInput.connect(analyser);
  console.log('6');
  analyser.fftSize = parseInt(elFftSize.value);
  analyser.minDecibels = parseInt(elMinDecibels.value);
  analyser.maxDecibels = parseInt(elMaxDecibels.value);
  analyser.smoothingTimevarant = parseFloat(elSmoothingTimevarant.value);
  console.log('7');

  var bufferLength = analyser.frequencyBinCount;
  var frequencyData = new Uint8Array(bufferLength);

  var canvas = document.getElementById('spectrogram');
  canvas.width = bufferLength;
  canvas.height = window.innerHeight;
  var canvasCtx = canvas.getContext('2d');

  function draw() {
    var imageData = canvasCtx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height + 1
    );
    analyser.getByteFrequencyData(frequencyData);
    console.log(frequencyData);

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
