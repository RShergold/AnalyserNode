/*
  Taken from
  https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
*/

var elStartButton = document.getElementById('start');
elStartButton.onclick = init;

function init() {
  elStartButton.parentElement.removeChild(elStartButton);

  if (navigator.getUserMedia) {
    navigator.getUserMedia({ audio: true }, start, console.log);
  } else {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(start)
      .catch(console.log);
  }
}

function start(stream) {
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  var realAudioInput = audioCtx.createMediaStreamSource(stream);
  // return;

  var analyser = audioCtx.createAnalyser();
  realAudioInput.connect(analyser);

  // ...

  analyser.fftSize = 2048;
  var bufferLength = analyser.frequencyBinCount;
  var timeDomainData = new Uint8Array(bufferLength);
  var frequencyData = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(timeDomainData);
  analyser.getByteFrequencyData(frequencyData);

  // Get a canvas defined with ID "oscilloscope"
  var canvas = document.getElementById('oscilloscope');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  var canvasCtx = canvas.getContext('2d');

  // draw an oscilloscope of the current audio source

  function draw() {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = 'rgb(255, 255, 255)';

    canvasCtx.beginPath();

    var sliceWidth = (canvas.width * 1.0) / bufferLength;
    var x = 0;

    analyser.getByteTimeDomainData(timeDomainData);

    for (var i = 0; i < bufferLength; i++) {
      var v = timeDomainData[i] / 128.0;
      var y = (v * canvas.height) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();

    //bars
    var barWidth = (canvas.width / bufferLength) * 2.5;
    var barHeight;
    x = 0;
    analyser.getByteFrequencyData(frequencyData);

    for (var i = 0; i < bufferLength; i++) {
      barHeight = frequencyData[i] * 2;

      canvasCtx.fillStyle = 'rgb(220, 40, 30)';
      canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);

      x += barWidth + 1;
    }

    requestAnimationFrame(draw);
  }

  draw();
}
