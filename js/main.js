import * as THREE from "three";
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const textureLoader = new THREE.TextureLoader();
const planetsData = await fetch('/assets/planetary_data.json').then(res => res.json())

const textures = {
  star: textureLoader.load("./image/stars.png"),
  sun: textureLoader.load("./image/sun.jpg"),
  mercury: textureLoader.load("./image/mercury.png"),
  venus: textureLoader.load("./image/venus.jpg"),
  earth: textureLoader.load("./image/earth.png"),
  mars: textureLoader.load("./image/mars.jpg"),
  jupiter: textureLoader.load("./image/jupiter.png"),
  saturn: textureLoader.load("./image/saturn.png"),
  uranus: textureLoader.load("./image/uranus.jpg"),
  neptune: textureLoader.load("./image/neptune.jpg"),
  pluto: textureLoader.load("./image/pluto.jpg"),
  saturnRing: textureLoader.load("./image/saturn_ring.png"),
  uranusRing: textureLoader.load("./image/uranus_ring.png"),
  asteroidBelt: textureLoader.load('./image/asteroid_belt.png')
};

const scene = new THREE.Scene();

scene.background = textures.star

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100000
);
const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 30, 150);
const sunLight = new THREE.PointLight(0xffffff, 4, 800, 1);

scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);


const sungeo = new THREE.SphereGeometry(15, 50, 50);
const sunMaterial = new THREE.MeshBasicMaterial({
  map: textures.sun,
});
const sun = new THREE.Mesh(sungeo, sunMaterial);
scene.add(sun);

const path_of_planets = [];
function createLineLoopWithMesh(radius, color, width, inclination = 0) {
  const material = new THREE.LineBasicMaterial({
    color: color,
    linewidth: width,
  });
  const geometry = new THREE.BufferGeometry();
  const lineLoopPoints = [];

  // Calculate points for the circular path
  const numSegments = 100; // Number of segments to create the circular path
  for (let i = 0; i <= numSegments; i++) {
    const angle = (i / numSegments) * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = radius * Math.sin(angle) * Math.sin(inclination * Math.PI / 180); // Apply inclination
    lineLoopPoints.push(x, y, z);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(lineLoopPoints, 3)
  );
  const lineLoop = new THREE.LineLoop(geometry, material);
  scene.add(lineLoop);
  path_of_planets.push(lineLoop);
}

const generatePlanet = (size, planetTexture, x, inclination = 0, axisTilt = 0, ring) => {
  const planetGeometry = new THREE.SphereGeometry(size, 50, 50);
  const planetMaterial = new THREE.MeshStandardMaterial({
    map: planetTexture,
  });
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  const planetObj = new THREE.Object3D();
  planet.position.set(x, 0, 0);
  
  const pivot = new THREE.Object3D();
  pivot.add(planetObj);
  pivot.rotation.x = -inclination * Math.PI / 180;
  
  if (ring) {
    const ringGeo = new THREE.RingGeometry(
      ring.innerRadius,
      ring.outerRadius,
      32
    );
    const ringMat = new THREE.MeshBasicMaterial({
      map: ring.ringmat,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    planetObj.add(ringMesh);
    ringMesh.position.set(x, 0, 0);
    ringMesh.rotation.x = axisTilt * Math.PI / 180 - 0.5 * Math.PI;
  }
  
  planet.rotation.x = axisTilt * Math.PI / 180;
  
  scene.add(pivot);
  planetObj.add(planet);
  
  createLineLoopWithMesh(x, 0xffffff, 3, inclination);
  
  return {
    planetObj: planetObj,
    planet: planet,
    pivot: pivot,
    inclination: inclination
  };
};
const earthData = planetsData.planets.find(x => x.name.toLowerCase() == 'earth')
const planets = planetsData.planets.map((planet) => {
  return {
    ...generatePlanet((planet.diameter_km/earthData.diameter_km)*10,textures[planet.name.toLowerCase()], planet.distance_from_sun_106_km, planet.orbital_inclination_degrees, planet.obliquity_to_orbit_degrees),
    rotating_speed_around_sun: planet.orbital_velocity_km_s / 10000,
    self_rotation_speed: (1/planet.rotation_period_hours)
  }
})

const generateAsteroidBelt = (innerRadius, outerRadius, texture) => {
  const asteroidBeltGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
  const asteroidBeltMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true
  });
  const asteroidBeltMesh = new THREE.Mesh(asteroidBeltGeometry, asteroidBeltMaterial);
  asteroidBeltMesh.rotation.x = Math.PI / 2;
  scene.add(asteroidBeltMesh);
  return asteroidBeltMesh;
};

const ast_belt = generateAsteroidBelt(400, 450, textures.asteroidBelt)

function animate() {
  sun.rotateY(0.004);
  planets.forEach(
    ({ pivot, planet, rotating_speed_around_sun, self_rotation_speed }) => {
      pivot.rotateY(rotating_speed_around_sun);
      planet.rotateY(self_rotation_speed);
    }
  );
  ast_belt.rotateZ(0.001)
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});