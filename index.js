document.body.addEventListener('click', init);

function init() {
  document.body.removeEventListener('click', init);

  navigator.getUserMedia({ audio: true }, start, console.log);
}

function start(stream) {
  console.log(stream);
  var audioCtx = new window.AudioContext();

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
  var canvasCtx = canvas.getContext('2d', { alpha: false });

  // draw an oscilloscope of the current audio source

  function draw() {
    requestAnimationFrame(draw);

    // canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    // canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

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
      barHeight = frequencyData[i] / 2;

      canvasCtx.fillStyle = 'rgb(255, 0, 0)';
      canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);

      x += barWidth + 1;
    }
  }

  draw();
}
