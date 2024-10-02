import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import WebGL from 'three/addons/capabilities/WebGL.js'

const {planets} = await fetch('/assets/planetary_data.json').then(res => res.json())

if (!WebGL.isWebGL2Available()) {
    const warning = WebGL.getWebGL2ErrorMessage();
    document.body.appendChild(warning);
    throw new Error(warning)
}

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const textures = new THREE.TextureLoader()
const textMap = {
    stars: textures.load('./image/stars.png'),
    sun: textures.load('./image/sun.jpg'),
    mercury: textures.load('./image/mercury.jpg'),
    venus: textures.load('./image/venus.jpg'),
    earth: textures.load('./image/earth.jpg'),
    mars: textures.load('./image/mars.jpg'),
    jupiter: textures.load('./image/jupiter.jpg'),
    saturn: textures.load('./image/saturn.jpg'),
    saturnRing: textures.load('./image/saturn_ring.png'),
    uranus: textures.load('./image/uranus.jpg'),
    uranusRing: textures.load('./image/uranus_ring.png'),
    neptune: textures.load('./image/neptune.jpg'),
    pluto: textures.load('./image/pluto.jpg')
}
scene.background = textMap.stars
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(-50, 90, 150)
const orbit = new OrbitControls(camera, renderer.domElement)
function addRing(geo, ringObj, pos) {
    const ringGeo = new THREE.RingGeometry(ringObj.innerRadius, ringObj.outerRadius, 32);
    const skin = new THREE.MeshBasicMaterial({ map: ringObj.mat, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, skin);
    ring.rotation.x = -0.5 * Math.PI;
    ring.position.set(pos, 0, 0);
    geo.add(ring);
}
const sunObject = new THREE.SphereGeometry(15, 50, 50),
    sunMat = new THREE.MeshBasicMaterial({ map: textMap.sun }),
    sunMesh = new THREE.Mesh(sunObject, sunMat)
scene.add(sunMesh);
const outlight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(outlight)
const sunlight = new THREE.PointLight(0xffffff, 10, 200, 1);
scene.add(sunlight);

let orbits = [];
function createOrbit(radius, color, width) {
    const material = new THREE.LineBasicMaterial({ color, linewidth: width });
    const geometry = new THREE.BufferGeometry();
    const numSegments = 100;
    
    // Create points for the circular path
    const lineLoopPoints = Array.from({ length: numSegments + 1 }, (_, i) => {
      const angle = (i / numSegments) * Math.PI * 2;
      return [radius * Math.cos(angle), 0, radius * Math.sin(angle)];
    }).flat();
  
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(lineLoopPoints, 3));
    
    const lineLoop = new THREE.LineLoop(geometry, material);
    scene.add(lineLoop);
    orbits.push(lineLoop);
}

function makePlanet(size = 0, texture, pos = 0, ring) {
    const shape = new THREE.SphereGeometry(size, 50, 50);
    const skin = new THREE.MeshStandardMaterial({ map: texture });
    const planet = new THREE.Mesh(shape, skin);
    
    const planet3d = new THREE.Object3D();
    planet3d.position.set(pos, 0, 0);
    planet3d.add(planet);

    if (ring) {
        addRing(planet3d, ring, pos);
    }

    scene.add(planet3d);
    console.log("Creating orbit for radius:", pos);
createOrbit(pos, 0xffffff, 3);
    return {
        planet: planet3d,
        planetObj: planet
    }
}

function calculateRotationalSpeed(diameter_km, rotation_period_hours) {
    const radius_km = diameter_km / 2;
    const circumference_km = 2 * Math.PI * radius_km; // Circumference of the planet
    const rotationalSpeed_kmh = circumference_km / rotation_period_hours; // Speed in km/h
    return rotationalSpeed_kmh;
}
const earthDia = planets.find(x => x.name === 'Earth').diameter
const planetSystem = planets.map(x => ({
    ...makePlanet(x.diameter/earthDia, textMap[x.name.toLowerCase()], x.distance_from_sun_106_km, x.ring ? (x.name == "Saturn" ? {innerRadius:x.diameter/earthDia, outerRadius: 28.2, mat: textMap.saturnRing} : {innerRadius:x.diameter/earthDia, outerRadius: 23, mat: textMap.uranusRing}) : undefined),
    orbiting_speed: x.orbital_velocity_km_s/1000,
    self_rotation: calculateRotationalSpeed(x.diameter, x.rotation_period_hours)/10000
}))

const animate = () => {
    sunMesh.rotateY(0.004)
    planetSystem.forEach(({ planet, orbiting_speed, self_rotation }) => {
        planet.rotateY(orbiting_speed)
        planet.rotateY(self_rotation)
    })
    renderer.render(scene, camera)
}

renderer.setAnimationLoop(animate)