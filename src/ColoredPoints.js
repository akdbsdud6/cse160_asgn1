// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program


var VSHADER_SOURCE =`
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    //gl_PointSize = 20.0;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`


/* const myPixelArt = [
    { x: -0.5, y:  0.3, size: 5, color: [1, 0, 0, 1] },
    { x: -0.3, y:  0.3, size: 5, color: [1, 1, 0, 1] },
    { x: -0.1, y:  0.3, size: 5, color: [0, 1, 1, 1] },
    // etc...
  ]; */

  let myPixelArt = []; // Store loaded pixel data

function loadPixelArt() {
    fetch("pixel_art.json") // Update with the correct URL if hosted elsewhere
        .then(response => response.json())
        .then(data => {
            myPixelArt = data;
            renderPixelArt();
        })
        .catch(error => console.error("Error loading pixel art:", error));
}

// GLobal Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor=[1.0, 1.0, 1.0, 1.0];
let g_selectedSize=5.0;
let g_selectedType = POINT;
let g_segments = 10;

function addActionsForHtmlUI() {
  document.getElementById('green').onclick = function() {g_selectedColor = [0.0, 1.0, 0.0, 1.0]};
  document.getElementById('red').onclick = function() {g_selectedColor = [1.0, 0.0, 0.0, 1.0]};
  document.getElementById('blue').onclick = function() {g_selectedColor = [0.0, 0.0, 1.0, 1.0]};
  document.getElementById('clearButton').onclick = function() {g_shapesList = []; renderAllShapes();};

  document.getElementById('pointButton').onclick = function() {g_selectedType = POINT;};
  document.getElementById('triButton').onclick = function() {g_selectedType = TRIANGLE;};
  document.getElementById('circleButton').onclick = function() {g_selectedType = CIRCLE;};
 
  document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; updateColorPreview();}); 
  document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; updateColorPreview();});
  document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; updateColorPreview();});

  document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_selectedSize = this.value; });
  document.getElementById('segmentSlide').addEventListener('mouseup', function() { g_segments = this.value; });
}

function main() {
  

  setupWebGL();

  connectVariablesToGLSL();

  addActionsForHtmlUI();

  
  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  
  //canvas.onmousemove = click;
  canvas.onmousemove = function(ev) { if(ev.buttons === 1) click(ev); };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

/* class Point{
  constructor(){
    this.type='point';
    this.position=[0.0, 0.0, 0.0];
    this.color=[1.0, 1.0, 1.0, 1.0];
    this.size=5.0;
  }

  render(){
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;

    // Pass the position of a point to a_Position variable
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    gl.uniform1f(u_Size, size);

    // Draw
    gl.drawArrays(gl.POINTS, 0, 1);
  }
} */

var g_shapesList = [];

/* var g_points = [];  // The array for the position of a mouse press
var g_colors = [];  // The array to store the color of a point
var g_sizes = []; */

function click(ev) {
  
  let [x, y] = convertCoordinatesEventToGL(ev);

  let point;

  let circleChecker = 0;

  if (g_selectedType === POINT) {
    point = new Point();
  } else if (g_selectedType === TRIANGLE) {
    point = new Triangle();
  } else{
    point = new Circle();
    circleChecker = 1;
  }

  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  if (circleChecker){
    point.segments = g_segments
  }
  g_shapesList.push(point);
/* 
  // Store the coordinates to g_points array
  g_points.push([x, y]);

  // Store the coordinates to g_points array
  g_colors.push(g_selectedColor.slice());

  g_sizes.push(g_selectedSize); */

  /* if (x >= 0.0 && y >= 0.0) {      // First quadrant
    g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
  } else if (x < 0.0 && y < 0.0) { // Third quadrant
    g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
  } else {                         // Others
    g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
  } */

  renderAllShapes();
  
}

function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x, y]);
}

function renderAllShapes(){

  var startTime = performance.now();
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  //var len = g_points.length;
  var len = g_shapesList.length;

  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + ", time: " + Math.floor(duration) + ", fps: " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID) {

  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }

  htmlElm.innerHTML = text;

}

function drawMyPixelArt() {
  loadPixelArt();
  for (let def of myPixelArt) {
    let cir = new Point();
    cir.position = [def.x, def.y];
    cir.color = def.color;
    cir.size = def.size;

    g_shapesList.push(cir);
  }
  renderAllShapes();
}

function updateColorPreview() {
  let r = g_selectedColor[0] * 255;
  let g = g_selectedColor[1] * 255;
  let b = g_selectedColor[2] * 255;
  document.getElementById('colorPreview').style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

