const elKnobs = document.getElementById('knobs');
const elFftSize = document.getElementById('fftSize');
const elMinDecibels = document.getElementById('minDecibels');
const elMaxDecibels = document.getElementById('maxDecibels');
const elStartButton = document.getElementById('start');
const elSmoothingTimeConstant = document.getElementById(
  'smoothingTimeConstant'
);

elStartButton.onclick = init;

function init() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(start)
    .catch(console.log);
}

function start(stream) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const realAudioInput = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  realAudioInput.connect(analyser);
  analyser.fftSize = parseInt(elFftSize.value);
  analyser.minDecibels = parseInt(elMinDecibels.value);
  analyser.maxDecibels = parseInt(elMaxDecibels.value);
  analyser.smoothingTimeConstant = parseFloat(elSmoothingTimeConstant.value);

  const bufferLength = analyser.frequencyBinCount;
  let frequencyData = new Uint8Array(bufferLength);

  const canvas = document.getElementById('spectrogram');
  canvas.width = bufferLength;
  canvas.height = window.innerHeight;

  const canvasCtx = canvas.getContext('2d');

  function draw() {
    let imageData = canvasCtx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height + 1
    );
    analyser.getByteFrequencyData(frequencyData);

    var y = canvas.height - 1;
    for (var x = 0; x < bufferLength; x++) {
      const offset = (y * imageData.width + x) * 4;
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
