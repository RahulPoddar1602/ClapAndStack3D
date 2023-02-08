let color;
let camera, scene, renderer; // 3js global variables, responsible for 3d world
let lastTime; // Last timestamp of animation
let stack; // as you know by name
let boxHeight = 0.5; // Height of each box
const originalBoxSize = 3; // starting height and width of box
let autopilot;
let gameEnded;
let robotPrecision; // Determines how precise the game is on autopilot
let colori=Math.random()*360;
let speed=0.008;
let nameInput;
var mic;
var t;
var clapping=false;
var value=0;  
var resultRank= document.getElementById("resultRank")
function setup() {//p5.js setup to take mic input
  createCanvas(0, 0);
  mic= new p5.AudioIn();
  mic.start();
  getAudioContext().resume();
}
function touchStarted() {
  getAudioContext().resume(); 
}
function draw() {//mic input function in p5.js
  var vol = mic.getLevel();
  if(vol>0.2 && !clapping)
  {
    console.log(vol)
    clapping=true;
    eventHandler();
  }
  else if(vol<0.1)
  {
    clapping=false;
  }
}

const scoreElement = document.getElementById("score");
const scoreResult = document.getElementById("scoreResult");
const speedElement = document.getElementById("speed");
const instructionsElement = document.getElementById("instructions");
const resultsElement = document.getElementById("results");
const cameraC = document.getElementById("orthographicC");

// Determines how precise the game is on autopilot
function setRobotPrecision() {//works in background of the game
  robotPrecision = Math.random()*0.5;
}

function init() {
  autopilot = true;
  gameEnded = false;
  lastTime = 0;
  stack = [];
  // overhangs = [];
  setRobotPrecision();
  
  // Initialize ThreeJs
  const aspect = window.innerWidth / window.innerHeight;
  const width = 10;
  const height = width / aspect;
  console.log(cameraC.checked)
  if(cameraC.checked)
  {
    camera = new THREE.OrthographicCamera(
        width / -2, // left
        width / 2, // right
        height / 2, // top
        height / -2, // bottom
        0, // near plane
        100 // far plane
      );

  }
  else
  {
    // If you want to use perspective camera instead, uncomment these lines
    camera = new THREE.PerspectiveCamera(
        45, // field of view
        aspect, // aspect ratio
        1, // near plane
        100 // far plane
        );
  }
      camera.position.set(4, 4, 4);
      camera.lookAt(0, 0, 0);
      scene = new THREE.Scene();
      // Foundation
      addLayer(0, 0, originalBoxSize, originalBoxSize);
      // First layer
      addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");
    // Set up lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 0);
  scene.add(dirLight);
  // Set up renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  document.body.appendChild(renderer.domElement);
}

function startGame() {
  nameInput = document.getElementById("name");
  if(nameInput.value == ""){
  alert("Please enter your name");
  return;
}
console.log(nameInput.value);
  autopilot = false;
  gameEnded = false;
  lastTime = 0;
  stack = [];
  
  if (instructionsElement) instructionsElement.style.display = "none";
  if (resultsElement) resultsElement.style.display = "none";
  if (scoreElement) scoreElement.innerText = 0;
  
  if (scene) {
    // Remove every Mesh from the scene
    while (scene.children.find((c) => c.type == "Mesh")) {
      const mesh = scene.children.find((c) => c.type == "Mesh");
      scene.remove(mesh);
    }
    
    // Foundation
    addLayer(0, 0, originalBoxSize, originalBoxSize);
    
    // First layer
    addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");
  }
  
  if (camera) {
    camera.position.set(4, 4, 4);
    camera.lookAt(0, 0, 0);
  }
}

function addLayer(x, z, width, depth, direction) {
  const y = boxHeight * stack.length; // Add the new box one layer higher
  const layer = generateBox(x, y, z, width, depth, false);
  layer.direction = direction;
  stack.push(layer);
}
function generateBox(x, y, z, width, depth, falls) {
  colori+=49;
  const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
  color = new THREE.Color(`hsl(${colori}, 100%, 50%)`);
  scene.background = new THREE.Color(`hsl(${colori+120}, 100%, 50%)`);
  
  const material = new THREE.MeshLambertMaterial({ color , opacity:0, transparent:falls });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  
  return {
    threejs: mesh,
    width,
    depth
  };
}

function cutBox(topLayer, overlap, size, delta) {
  const direction = topLayer.direction;
  const newWidth = direction == "x" ? overlap : topLayer.width;
  const newDepth = direction == "z" ? overlap : topLayer.depth;
  // Update metadata
  topLayer.width = newWidth;
  topLayer.depth = newDepth;
  // Update ThreeJS model
  topLayer.threejs.scale[direction] = overlap / size;
  topLayer.threejs.position[direction] -= delta / 2;
}

window.addEventListener("keydown", function (event) {
  if (event.key == " ") {
    event.preventDefault();
    eventHandler();
    return;
  }
});

function eventHandler() {
  if (autopilot) startGame();
  else splitBlockAndAddNextOneIfOverlaps();
}

function splitBlockAndAddNextOneIfOverlaps() {
  if (gameEnded) return;
  
  const topLayer = stack[stack.length - 1];
  const previousLayer = stack[stack.length - 2];
  
  const direction = topLayer.direction;
  
  const size = direction == "x" ? topLayer.width : topLayer.depth;
  const delta =
  topLayer.threejs.position[direction] -
  previousLayer.threejs.position[direction];
  const overhangSize = Math.abs(delta);
  const overlap = size - overhangSize;
  if (overlap > 0) {
    cutBox(topLayer, overlap, size, delta);
    // Next layer
    const nextX = direction == "x" ? topLayer.threejs.position.x : -10;
    const nextZ = direction == "z" ? topLayer.threejs.position.z : -10;
    const newWidth = topLayer.width; // New layer has the same size as the cut top layer
    const newDepth = topLayer.depth; // New layer has the same size as the cut top layer
    const nextDirection = direction == "x" ? "z" : "x";
    if (scoreElement) scoreElement.innerText = stack.length - 1;
    addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
    speed=Math.random()*0.004+0.008;
    speedElement.innerText=parseInt(10000*speed-20)+"mph";
  } else {
    missedTheSpot();
  }
}

function missedTheSpot() {
  scoreResult.innerText=scoreElement.innerText;
  fetch('https://stackleaderboard-a1510-default-rtdb.firebaseio.com/score.json', {
    method: 'POST',
    body: JSON.stringify({
        name: nameInput.value,
        score: parseInt(scoreResult.innerText)
    }),
    headers: {
        'Content-Type': 'application/json'
    }
})
    .then(response => response.json());

setTimeout(() => {
    fetch('https://stackleaderboard-a1510-default-rtdb.firebaseio.com/score.json', {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            const dataArr = Object.entries(data);
            dataArr.sort((a, b) => b[1].score - a[1].score);
            console.log(dataArr);
            list.innerHTML = "";
            let a=1;
            dataArr.forEach((item) => {
                resultRank.innerHTML += `<div class="item">
        <span class="rank">${a}</span>
        <span class="name">${item[1].name}</span>
        <span class="score">${item[1].score}</span>
    </div>`;
    a++;
            })

        })
}, 1000);

  console.log(scoreResult);
  const topLayer = stack[stack.length - 1];
  
  // Turn to top layer into an overhang and let it fall down
  // addOverhang(
  //   topLayer.threejs.position.x,
  //   topLayer.threejs.position.z,
  //   topLayer.width,
  //   topLayer.depth
  //   );
    // world.remove(topLayer.cannonjs);
    scene.remove(topLayer.threejs);
    
    gameEnded = true;
    if (resultsElement && !autopilot) resultsElement.style.display = "flex";
  }
  
  function animation(time) {
    if (lastTime) {
      const timePassed = time - lastTime;
      // const speed = 0.008;
      console.log(speed);
      
      const topLayer = stack[stack.length - 1];
      const previousLayer = stack[stack.length - 2];
      
      // The top level box should move if the game has not ended AND
      // it's either NOT in autopilot or it is in autopilot and the box did not yet reach the robot position
      const boxShouldMove =
      !gameEnded &&
      (!autopilot ||
        (autopilot &&
          topLayer.threejs.position[topLayer.direction] <
          previousLayer.threejs.position[topLayer.direction] +
          robotPrecision));
          
          if (boxShouldMove) {
            // Keep the position visible on UI and the position in the model in sync
            topLayer.threejs.position[topLayer.direction] += speed * timePassed;
            // topLayer.cannonjs.position[topLayer.direction] += speed * timePassed;
            
            // If the box went beyond the stack then show up the fail screen
            if (topLayer.threejs.position[topLayer.direction] > 10) {
              missedTheSpot();
            }
          } else {
            // If it shouldn't move then is it because the autopilot reached the correct position?
            // Because if so then next level is coming
            if (autopilot) {
              splitBlockAndAddNextOneIfOverlaps();
              setRobotPrecision();
            }
          }
          
          // 4 is the initial camera height
          if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
            camera.position.y += speed * timePassed;
          }
          
          // updatePhysics(timePassed);
          renderer.render(scene, camera);
        }
        lastTime = time;
      }
      window.addEventListener("resize", () => {
        // Adjust camera
        console.log("resize", window.innerWidth, window.innerHeight);
        const aspect = window.innerWidth / window.innerHeight;
        const width = 10;
        const height = width / aspect;
        
        camera.top = height / 2;
        camera.bottom = height / -2;
        
        // Reset renderer
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.render(scene, camera);
      });

      const initial = () => {
        fetch('https://stackleaderboard-a1510-default-rtdb.firebaseio.com/score.json', {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                const dataArr = Object.entries(data);
                dataArr.sort((a, b) => b[1].score - a[1].score);
                console.log(dataArr);
                list.innerHTML = "";
                let a =1;
                dataArr.forEach((item) => {
                    list.innerHTML += `<div class="item">
                        <span class="rank">${a}</span>
                <span class="name">${item[1].name}</span>
                <span class="score">${item[1].score}</span>
            </div>`;
            a++;
                })

            })
    }
  initial()
    function hide()
    {
      document.getElementById("cameraType").style.display="none";
    }
    const valueHeight = document.querySelector("#valueHeight")
    const input = document.querySelector("#height_input")
    input.addEventListener("input", (event) => {
      console.log(input.value)
      valueHeight.textContent = event.target.value
      boxHeight = event.target.value
    })
