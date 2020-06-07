document.body.addEventListener('click', init);

function init() {
  document.body.removeEventListener('click', init);

  navigator.getUserMedia({ audio: true }, start, console.log);
}

function start(stream) {
  const audioCtx = new window.AudioContext();

  const realAudioInput = audioCtx.createMediaStreamSource(stream);
  // return;

  const analyser = audioCtx.createAnalyser();
  realAudioInput.connect(analyser);

  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  let frequencyData = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(frequencyData);

  const canvas = document.getElementById('spectrogram');
  canvas.style.width = `${bufferLength}px`;
  const canvasCtx = canvas.getContext('2d');

  function draw() {
    let imageData = canvasCtx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height + 1
    );
    let pixels = imageData.data;
    analyser.getByteFrequencyData(frequencyData);

    var y = canvas.height - 2;
    for (var x = 0; x < canvas.width; x++) {
      const off = (y * imageData.width + x) * 4;
      pixels[off] = 255; // Red
      pixels[off + 1] = 255; // Green
      pixels[off + 2] = 255; // Blue
      pixels[off + 3] = frequencyData[x]; // Alpha
    }

    canvasCtx.putImageData(imageData, 0, -1);

    // setTimeout(() => {
    requestAnimationFrame(draw);
    // }, 50);
  }

  draw();
}
