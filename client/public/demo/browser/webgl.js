let canvas = document.getElementById('webglCanvas');
let gl = canvas.getContext('webgl');
let micOn = false;
let audioStream = null;
window.buttonCoords = { x: 50, y: 50, width: 100, height: 100 }; // Coordinate pulsante

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Funzione per creare una texture da un canvas 2D
function createTextureFromCanvas2D(text) {
    let textCanvas = document.createElement('canvas');
    let textContext = textCanvas.getContext('2d');

    textCanvas.width = 256;  // Risoluzione del canvas
    textCanvas.height = 256;

    // Imposta il colore e lo stile del testo
    textContext.fillStyle = 'black';
    textContext.fillRect(0, 0, textCanvas.width, textCanvas.height); // Sfondo nero
    textContext.font = '48px Arial';
    textContext.fillStyle = 'white';  // Colore del testo
    textContext.textAlign = 'center';
    textContext.textBaseline = 'middle';
    textContext.fillText(text, textCanvas.width / 2, textCanvas.height / 2);

    // Crea una texture WebGL dal canvas 2D
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texture;
}

// Funzione per disegnare il testo nel canvas WebGL
function drawTextTexture(texture) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Imposta le coordinate per disegnare la texture
    let vertices = new Float32Array([
        -0.5, -0.5,
         0.5, -0.5,
        -0.5,  0.5,
         0.5,  0.5
    ]);

    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    let vertCode = `
        attribute vec2 coordinates;
        void main(void) {
            gl_Position = vec4(coordinates, 0.0, 1.0);
        }
    `;
    let fragCode = `
        precision mediump float;
        uniform sampler2D u_image;
        void main(void) {
            gl_FragColor = texture2D(u_image, gl_FragCoord.xy / vec2(512.0, 512.0));
        }
    `;

    gl.shaderSource(vertexShader, vertCode);
    gl.compileShader(vertexShader);

    gl.shaderSource(fragmentShader, fragCode);
    gl.compileShader(fragmentShader);

    let shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    let coord = gl.getAttribLocation(shaderProgram, "coordinates");
    gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    // Associa la texture del testo
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// Funzione per renderizzare il canvas
function render() {
    // Imposta il colore di sfondo del canvas
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Crea una texture con la scritta "ON" o "OFF"
    let text = micOn ? "ON" : "OFF";
    let texture = createTextureFromCanvas2D(text);

    // Disegna la texture del testo nel canvas WebGL
    drawTextTexture(texture);

    requestAnimationFrame(render);
}

// Avvia il rendering iniziale
render();
