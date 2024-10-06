import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("orrery").appendChild(renderer.domElement);
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
  asteroidBelt: textureLoader.load('./image/asteroid_belt.png'),
  luna: textureLoader.load('./image/moon.png'),
  asteroid: textureLoader.load('./image/asteroid.jpg')
};

const scene = new THREE.Scene();

scene.background = textures.star

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  20,
  25000
);
const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 30, 150);
const sunLight = new THREE.PointLight(0xffffff, 4, 800, 1);

scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const earthData = planetsData.planets.find(x => x.name.toLowerCase() == 'earth')
const sungeo = new THREE.SphereGeometry(35, 50, 50);
const sunMaterial = new THREE.MeshBasicMaterial({
  map: textures.sun,
});
const sun = new THREE.Mesh(sungeo, sunMaterial);
scene.add(sun);

const path_of_planets = [];
function createOrbit(radius, color, width, inclination = 0) {
  const material = new THREE.LineBasicMaterial({ color, linewidth: width });
  const geometry = new THREE.BufferGeometry();
  const lineLoopPoints = Array.from({ length: 101 }, (_, i) => {
    const angle = (i / 100) * Math.PI * 2;
    return [radius * Math.cos(angle), radius * Math.sin(angle) * Math.sin(inclination * Math.PI / 180), radius * Math.sin(angle)];
  }).flat();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(lineLoopPoints, 3)
  );

  const lineLoop = new THREE.LineLoop(geometry, material);
  scene.add(lineLoop);
  path_of_planets.push(lineLoop);
}

function createMoon(planet, name, size, distanceFromPlanet, selfRotation = 0, orbitSpeedAroundPlanet = 0, inclination = 0) {
  if (!textures[name.toLowerCase()]) {
    console.error("Texture not found for moon:", name);
    return;
  }
  const moonGeometry = new THREE.SphereGeometry(size, 20, 20);
  const moonMaterial = new THREE.MeshBasicMaterial({ map: textures[name.toLowerCase()] });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.x = distanceFromPlanet;
  moon.rotation.x = selfRotation * Math.PI / 180;
  const moonOrbitPivot = new THREE.Object3D();
  moonOrbitPivot.rotation.z = orbitSpeedAroundPlanet * Math.PI / 180;
  moonOrbitPivot.add(moon);

  const moonInclinationPivot = new THREE.Object3D();
  moonInclinationPivot.rotation.x = inclination * Math.PI / 180;
  moonInclinationPivot.add(moonOrbitPivot);
  planet.add(moonInclinationPivot);
}

const options = {
  "Realistic": true,
  "Show Orbits": true,
  "Planet Scale": 1,
  "Speed": 1,
  "Playing": true
};
const generatePlanet = (
  size, 
  planetTexture, 
  x, 
  inclination = 0, 
  axisTilt = 0, 
  ring,
  moons = []
) => {
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(size, 50, 50),
    new THREE.MeshStandardMaterial({ map: planetTexture })
  );
  planet.position.set(x, 0, 0);
  planet.rotation.x = axisTilt * Math.PI / 180;

  const planetObj = new THREE.Object3D();
  planetObj.add(planet);

  const pivot = new THREE.Object3D();
  pivot.rotation.x = -inclination * Math.PI / 180;
  pivot.add(planetObj);
  scene.add(pivot);
  if (ring) {
    const ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 32),
      new THREE.MeshBasicMaterial({
        map: ring.ringmat,
        side: THREE.DoubleSide
      })
    );
    ringMesh.position.set(x, 0, 0);
    ringMesh.rotation.x = (axisTilt - 90) * Math.PI / 180;
    planetObj.add(ringMesh);
  }

  if (moons) {
    for (const moon of moons) {
      createMoon(planet, "luna", moon.size, moon.distance_from_planet, moon.self_rotation_speed, moon.rotating_speed_around_planet, moon.orbital_inclination_degrees);
    }
  }

  createOrbit(x, 0xffffff, 1, inclination);

  return {
    planetObj,
    planet,
    pivot,
    inclination,
  };
};



const planets = planetsData.planets.map((planet) => {
  return {
    ...generatePlanet((planet.diameter_km/earthData.diameter_km),textures[planet.name.toLowerCase()], planet.distance_from_sun_106_km, planet.orbital_inclination_degrees, planet.obliquity_to_orbit_degrees, planet.name == "Saturn" ? {ringmat:planet.name == "Saturn" ? textures.saturnRing : planet.name == "Uranus" ? textures.uranusRing : null,innerRadius: (planet.diameter_km/earthData.diameter_km)+50, outerRadius: (planet.diameter_km/earthData.diameter_km)+100} : planet.name == "Uranus" ? {ringmat:planet.name == "Saturn" ? textures.saturnRing : planet.name == "Uranus" ? textures.uranusRing : null,innerRadius: (planet.diameter_km/earthData.diameter_km)+50, outerRadius: (planet.diameter_km/earthData.diameter_km)+100} : null, planet.moons),
    rotating_speed_around_sun: planet.orbital_velocity_km_s / 10000,
    self_rotation_speed: (1/planet.rotation_period_hours)
  }
})

const generateAsteroidBelt = (innerRadius, outerRadius, texture) => {
  const asteroidBeltMesh = new THREE.Mesh(
    new THREE.RingGeometry(innerRadius, outerRadius, 32),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    })
  );
  
  asteroidBeltMesh.rotation.x = Math.PI / 2;
  scene.add(asteroidBeltMesh);

  return asteroidBeltMesh;
};


const ast_belt = generateAsteroidBelt(300, 500, textures.asteroidBelt)
var GUI = dat.gui.GUI;
const gui = new GUI({name:"Controls"});

gui.add(options, "Realistic").onChange((e) => {
  ambientLight.intensity = e ? 0 : 0.5;
});
gui.add(options, "Show Orbits").onChange((e) => {
  path_of_planets.forEach((dpath) => {
    dpath.visible = e;
  });
});
gui.add(options, "Speed", 1, 10)
gui.add(options, "Planet Scale", 1, 5).onChange((e) => {
  planets.forEach(({planet}) => {
    planet.scale.set(e, e, e)
  })
})

function animate() {
  sun.rotateY(0.004);
  planets.forEach(
    ({ pivot, planet, rotating_speed_around_sun, self_rotation_speed }) => {
      pivot.rotateY(options.Speed * rotating_speed_around_sun);
      planet.rotateY(options.Speed * self_rotation_speed);
    }
  );
  ast_belt.rotateZ(0.001)
  orbit.update()
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate)
gui.add(options, "Playing").onChange((e) => {
  if(e) {
    renderer.setAnimationLoop(animate)
  } else {
    renderer.setAnimationLoop(() => renderer.render(scene, camera))
  }
})

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});