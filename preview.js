import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

let compass;
let preview;
let second_compass;
let canvas;

const scene = new THREE.Scene();

const envTexture = new THREE.CubeTextureLoader()
  .setPath("textures/environment/")
  .load([
    "city.jpg",
    "front.jpg",
    "top.jpg",
    "bottom.jpg",
    "back.jpg",
    "left.jpg",
  ]);

scene.background = new THREE.Color(0x484848);

const aoTexture = new THREE.TextureLoader().load(
  "textures/aoMaps/Compass AO.png"
);
aoTexture.flipY = false;

const w = window.innerWidth - window.windowSize;
// const h = window.windowSize;

// const aspect = Math.max(w, h) / Math.min(w, h);

const camera = new THREE.PerspectiveCamera(
  45,
  1,
  //   window.innerWidth / window.innerHeight,
  1,
  2000
);

const renderer = new THREE.WebGLRenderer();
console.log(window.canvasSize);

export const addToDom = () => {
  //   print(window.innerWidth);
  const w =
    document.getElementById("canvas_container").clientWidth - window.canvasSize;
  const h = Math.min(window.innerHeight, window.canvasSize);
  const aspect = w / h;
  renderer.setSize(w, h);
  document.getElementById("canvas_container").appendChild(renderer.domElement);

  camera.aspect = aspect;
  camera.updateProjectionMatrix();
};
// // document.onreadystatechange = fub
// document.addEventListener("DOMContentLoaded", () => {});

const controls = new OrbitControls(camera, renderer.domElement); //controls.update() must be called after any manual changes to the camera's transform camera.position.set( 0, 20, 100 ); controls.update(); function animate() { requestAnimationFrame( animate ); // required if controls.enableDamping or controls.autoRotate are set to true controls.update(); renderer.render( scene, camera ); }

const light = new THREE.DirectionalLight(0xaaaaaa, 5); // soft white light
light.position.set(0, 15, 5);
scene.add(light);

camera.position.z = 15;

loader.load(
  "models/compass.glb",
  function (gltf) {
    compass = gltf.scene;
    scene.add(compass);
    // geometry.attributes.uv2 = geometry.attributes.uv;
    compass = compass.children[0];
    compass.material.envMap = envTexture;
    compass.material.aoMap = aoTexture;
    compass.material.envMapIntensity = 1.6;
    // compass.material.needsUpdate = true;
    // compass.material.metallness = 1;
    compass.material.roughness = 0.3;
    // compass.material.roughnessMap = null;
    // console.log(compass.material);

    second_compass = compass.clone();

    window.second_compass = second_compass;

    scene.add(second_compass);
    // second_compass.position.x = 1;
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

export const change2CompassTexture = (canvas) => {
  canvas = canvas.elt;
  const cnvTexture = new THREE.CanvasTexture(canvas);

  const overlay_mat = new THREE.MeshBasicMaterial({
    // color: 0x00ff00,
    transparent: true,
    // opacity: 0.3,
  });
  second_compass.material = overlay_mat;

  // canvas = document.getElementById("offscreen");
  // print(canvas);
  //   const cnvTexture = new THREE.CanvasTexture(canvas);
  overlay_mat.map = cnvTexture;
  overlay_mat.needsUpdate = true;
  cnvTexture.flipY = false;
};

const animate = function () {
  requestAnimationFrame(animate);
  // 	cube.rotation.x += 0.01;
  // 	cube.rotation.y += 0.01;
  //   stats.update();
  if (second_compass) {
    second_compass.material.needsUpdate = true;
    second_compass.material.map.needsUpdate = true;
  }
  renderer.render(scene, camera);
};

animate();
