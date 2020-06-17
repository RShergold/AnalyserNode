var elStartButton = document.getElementById('start');

elStartButton.onclick = function () {
  elStartButton.parentElement.removeChild(elStartButton);

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(start)
    .catch(console.log);
};

function start(stream) {
  var audioCtx = new window.AudioContext(); //new (window.AudioContext || window.webkitAudioContext)();
  var realAudioInput = audioCtx.createMediaStreamSource(stream);

  var analyser = audioCtx.createAnalyser();
  realAudioInput.connect(analyser);

  analyser.fftSize = 1024; // 2048;
  analyser.minDecibels = -75;
  var bufferLength = analyser.frequencyBinCount;
  var frequencyData = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(frequencyData);

  var canvas = document.getElementsByTagName('canvas')[0];
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  rowHeight = Math.floor(canvas.height / 6);
  var canvasCtx = canvas.getContext('2d');

  function draw() {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 1;
    analyser.getByteFrequencyData(frequencyData);

    var sliceWidth = (canvas.width * 1) / bufferLength;

    // Initial sample
    drawHorizontalLine(rowHeight);
    drawRowLabel('FFT', rowHeight, 1);
    drawGraph(frequencyData, sliceWidth, rowHeight, rowHeight);

    // Half sample
    var sampleHalf = frequencyData.filter(function (_, index) {
      return (index + 1) % 2 == 0;
    });
    drawHorizontalLine(rowHeight * 2);
    drawRowLabel('Downsample 1/2', rowHeight, 2);
    drawGraph(sampleHalf, sliceWidth, rowHeight, rowHeight * 2);

    // Third sample
    var sampleThird = frequencyData.filter(function (_, index) {
      return (index + 1) % 3 == 0;
    });
    drawHorizontalLine(rowHeight * 3);
    drawRowLabel('Downsample 1/3', rowHeight, 3);
    drawGraph(sampleThird, sliceWidth, rowHeight, rowHeight * 3);

    // Quarter sample
    var sampleQuarter = frequencyData.filter(function (_, index) {
      return (index + 1) % 4 == 0;
    });
    drawHorizontalLine(rowHeight * 4);
    drawRowLabel('Downsample 1/4', rowHeight, 4);
    drawGraph(sampleQuarter, sliceWidth, rowHeight, rowHeight * 4);

    // Fifth sample
    var sampleFifth = frequencyData.filter(function (_, index) {
      return (index + 1) % 5 == 0;
    });
    drawHorizontalLine(rowHeight * 5);
    drawRowLabel('Downsample 1/5', rowHeight, 5);
    drawGraph(sampleFifth, sliceWidth, rowHeight, rowHeight * 5);

    var product = Array(sampleFifth.length)
      .fill()
      .map(function (_, index) {
        return (
          frequencyData[index] *
          sampleHalf[index] *
          sampleThird[index] *
          sampleQuarter[index] *
          sampleFifth[index]
        );
      });
    var max = Math.pow(128, 5);
    drawGraph(product, sliceWidth, rowHeight, rowHeight * 6, max);

    // Highest frequency
    var highestIndex = product.indexOf(Math.max.apply(Math, product));
    drawRowLabel('Harmonic Product Spectrum', rowHeight, 6);
    if (product[highestIndex] > max / 4) {
      var x = highestIndex * sliceWidth;
      canvasCtx.strokeStyle = 'rgba(220, 40, 30, 0.75)';
      canvasCtx.beginPath();
      canvasCtx.moveTo(x, 0);
      canvasCtx.lineTo(x, canvas.height);
      canvasCtx.stroke();
    }

    requestAnimationFrame(draw);
  }

  function drawHorizontalLine(y) {
    canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, y);
    canvasCtx.lineTo(canvas.width, y);
    canvasCtx.stroke();
  }

  function drawRowLabel(Label, rowHeight, row) {
    canvasCtx.fillStyle = 'rgb(255, 255, 255)';
    canvasCtx.font = '13px sans-serif';
    canvasCtx.textAlign = 'right';
    canvasCtx.fillText(Label, canvas.width - 20, rowHeight * row - 20);
  }

  function drawGraph(points, sliceWidth, rowHeight, rowY, max = 128) {
    canvasCtx.strokeStyle = 'rgb(255, 255, 255)';
    canvasCtx.beginPath();
    var x = 0;
    var length = points.length;

    for (var i = 0; i < length; i++) {
      var v = points[i] / max;
      var y = (v * rowHeight) / 2;

      if (i == 0) {
        canvasCtx.moveTo(x, rowY - y);
      } else {
        canvasCtx.lineTo(x, rowY - y);
      }

      x += sliceWidth;
    }
    canvasCtx.stroke();
  }

  draw();
}
