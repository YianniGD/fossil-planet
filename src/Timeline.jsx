import React, { useEffect, useRef, useCallback, useState } from 'react';
import { renderToString } from 'react-dom/server';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

const Timeline = ({ speciesData, showSpeciesPage }) => {
    const canvasRef = useRef();
    const scrollTargetRef = useRef();
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const composerRef = useRef(null);
    const pathRef = useRef(null);
    const species3DMarkersRef = useRef([]);
    const mathUtilsRef = useRef(null);
    const cameraRotationProxyX = useRef(3.14159);
    const cameraRotationProxyY = useRef(0);
    const [popover, setPopover] = useState({ visible: false, content: '', x: 0, y: 0 });
    const [timelineData, setTimelineData] = useState(null);

    useEffect(() => {
        const loadTimelineData = async () => {
            try {
                const response = await fetch('json/timeline.json');
                const data = await response.json();
                setTimelineData(data);
            } catch (error) {
                console.error("Failed to load timeline data:", error);
            }
        };
        loadTimelineData();
    }, []);

    const handleMouseMove = useCallback((evt) => {
        // Camera rotation logic
        if (mathUtilsRef.current) {
            cameraRotationProxyX.current = mathUtilsRef.current.map(evt.clientX, 0, window.innerWidth, 3.24, 3.04);
            cameraRotationProxyY.current = mathUtilsRef.current.map(evt.clientY, 0, window.innerHeight, -0.1, 0.1);
        }

        // Popover logic
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;

        if (cameraRef.current && species3DMarkersRef.current.length > 0) {
            raycaster.setFromCamera(mouse, cameraRef.current);

            const intersects = raycaster.intersectObjects(species3DMarkersRef.current.map(m => m.group), true);

            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                if (intersectedObject.userData.id) {
                    const species = speciesData.find(s => s.id === intersectedObject.userData.id);
                    if (species) {
                        setPopover({
                            visible: true,
                            content: species.id,
                            x: evt.clientX,
                            y: evt.clientY,
                        });
                    }
                    return;
                }
            }
        }
        
        setPopover(p => p.visible ? { ...p, visible: false } : p);

    }, [speciesData]);

    const handleResize = useCallback(() => {
        if (cameraRef.current && rendererRef.current && composerRef.current) {
            const width = window.innerWidth;
            const height = window.innerHeight;
            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(width, height);
            composerRef.current.setSize(width, height);
        }
    }, []);

    const handleCanvasClick = useCallback((event) => {
        console.log("Canvas clicked");
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        console.log("Mouse coordinates:", mouse);

        raycaster.params.Line.threshold = 0.5; // Adjust threshold for line intersections
        raycaster.params.Points.threshold = 0.5; // Adjust threshold for points intersections

        raycaster.setFromCamera(mouse, cameraRef.current);

        const intersects = raycaster.intersectObjects(species3DMarkersRef.current.map(m => m.group), true);
        console.log("Intersects:", intersects);

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            if (intersectedObject.userData.id) {
                showSpeciesPage(intersectedObject.userData.id);
            }
        }
    }, [showSpeciesPage]);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        mathUtilsRef.current = {
            normalize: function($value, $min, $max) {
                return ($value - $min) / ($max - $min);
            },
            interpolate: function($normValue, $min, $max) {
                return $min + ($max - $min) * $normValue;
            },
            map: function($value, $min1, $max1, $min2, $max2) {
                if ($value < $min1) {
                    $value = $min1;
                }
                if ($value > $max1) {
                    $value = $max1;
                }
                var res = this.interpolate(this.normalize($value, $min1, $max1), $min2, $max2);
                return res;
            }
        };

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x194794, 0, 100);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.001, 200);
        cameraRef.current = camera;
        var c = new THREE.Group();
        c.position.z = 400;
        c.add(camera);
        scene.add(c);

        const renderScene = new RenderPass(scene, camera);
        const composer = new EffectComposer(renderer);
        composer.setSize(window.innerWidth, window.innerHeight);
        composer.addPass(renderScene);
        composerRef.current = composer;

        var points = [
            [10, 89, 0], [50, 88, 10], [76, 139, 20], [126, 141, 12], [150, 112, 8],
            [157, 73, 0], [180, 44, 5], [207, 35, 10], [232, 36, 0]
        ];

        for (var i = 0; i < points.length; i++) {
            points[i] = new THREE.Vector3(points[i][0], points[i][2], points[i][1]);
        }
        const path = new THREE.CatmullRomCurve3(points);
        path.tension = 0.5;
        pathRef.current = path;

        var geometry = new THREE.TubeGeometry(path, 300, 6, 32, false);
        var textureLoader = new THREE.TextureLoader();

        var texture = textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/68819/3d_space_5.jpg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(15, 2);
        });

        var mapHeight = textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/68819/waveform-bump3.jpg', function(texture){
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(15, 2);
        });

        var material = new THREE.MeshPhongMaterial({
            side: THREE.BackSide,
            map: texture,
            shininess: 20,
            bumpMap: mapHeight,
            bumpScale: -0.03,
            specular: 0x0b2349
        });

        var tube = new THREE.Mesh(geometry, material);
        scene.add(tube);

        const lineGeometry = new THREE.TubeGeometry(path, 150, 0.2, 32, false);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, visible: false });
        const glowingLine = new THREE.Mesh(lineGeometry, lineMaterial);
        scene.add(glowingLine);

        var light = new THREE.PointLight(0xffffff, 0.35, 4, 0);
        scene.add(light);

        function updateCameraPercentage(percentage) {
            if (!pathRef.current) return;
            const p1 = pathRef.current.getPointAt(percentage);
            const p2 = pathRef.current.getPointAt(percentage + 0.03);
            c.position.set(p1.x, p1.y, p1.z);
            c.lookAt(p2);
            light.position.set(p2.x, p2.y, p2.z);
        }
        updateCameraPercentage(0);

        var tubePerc = { percent: 0 };
        gsap.timeline({
            scrollTrigger: {
                trigger: scrollTargetRef.current,
                start: "top top",
                end: "bottom 100%",
                scrub: 1,
            }
        }).to(tubePerc, {
            percent: 0.96,
            ease: 'none',
            duration: 10,
            onUpdate: () => {
                updateCameraPercentage(tubePerc.percent);
            }
        });

        let render = function () {
            if (cameraRef.current && composerRef.current) {
                cameraRef.current.rotation.y += (cameraRotationProxyX.current - cameraRef.current.rotation.y) / 15;
                cameraRef.current.rotation.x += (cameraRotationProxyY.current - cameraRef.current.rotation.x) / 15;
                composerRef.current.render();


            }
            requestAnimationFrame(render);
        }
        render();

    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('click', handleCanvasClick);
            return () => canvas.removeEventListener('click', handleCanvasClick);
        }
    }, [handleCanvasClick]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('mousemove', handleMouseMove);
            return () => canvas.removeEventListener('mousemove', handleMouseMove);
        }
    }, [handleMouseMove]);

    useEffect(() => {
        if (!speciesData || !pathRef.current || !mathUtilsRef.current) {
            return;
        }

        if (!Array.isArray(speciesData) || speciesData.length === 0) {
            return;
        }

        const livedFromValues = speciesData.map(s => s.time_period.lived_from_ma);
        const maxMa = Math.max(...livedFromValues);
        const minMa = Math.min(...livedFromValues);

        const textureLoader = new THREE.TextureLoader();

        const loadIcon = async (species, index) => {
            if (!species.time_period || typeof species.time_period.lived_from_ma === 'undefined') {
                console.warn('Skipping species due to missing time_period data:', species.id);
                return null;
            }

                        const iconPath = import.meta.env.BASE_URL + `${species.icon || 'slice2.webp'}`;


            const speciesMa = species.time_period.lived_from_ma;
            const pathPercentage = 1 - mathUtilsRef.current.normalize(speciesMa, minMa, maxMa);

            if (!pathRef.current) return null;
            const finalPosition = pathRef.current.getPointAt(pathPercentage);

            const goldenAngle = Math.PI * (3 - Math.sqrt(5));
            const angle = index * goldenAngle;
            const radius = 3.5;
            const offset = new THREE.Vector3(
                0,
                radius * Math.cos(angle),
                radius * Math.sin(angle)
            );

            finalPosition.add(offset);

            const material = new THREE.SpriteMaterial({ color: 0xffffff });
            const sprite = new THREE.Sprite(material);

            textureLoader.load(iconPath, (texture) => {
                material.map = texture;
                material.needsUpdate = true;
                const aspect = texture.image.naturalWidth / texture.image.naturalHeight;
                let scale = 0.5 + (species.size.meters / 10);
                if (['Jawless Fishes', 'Chimeras', 'Lungfishes'].some(category => species.category.includes(category))) {
                    scale *= 0.5;
                }
                sprite.scale.set(scale * aspect, scale, 1);
            });

            sprite.userData.id = species.id; // Add this
            const group = new THREE.Group();
            group.add(sprite);

            group.userData.id = species.id; // Associate species ID with the group
            group.position.copy(finalPosition);
            sceneRef.current.add(group);

            return {
                position: finalPosition,
                id: species.id,
                group: group
            };
        }

        const loadAllIcons = async () => {
            const promises = speciesData.map((species, index) => loadIcon(species, index));
            const results = await Promise.all(promises);
            species3DMarkersRef.current = results.filter(r => r !== null);
        }

        loadAllIcons();

    }, [speciesData]);

    useEffect(() => {
        if (!timelineData || !pathRef.current || !sceneRef.current || !mathUtilsRef.current) {
            return;
        }

        const maxMa = 541; // Paleozoic Era start
        const minMa = 0; // Present day

        timelineData.eras.forEach(era => {
            era.periods.forEach(period => {
                const details = period.details;
                const matches = details.match(/\((\d+)/);
                if (matches && matches[1]) {
                    const periodStartMa = parseInt(matches[1], 10);
                    const pathPercentage = 1 - mathUtilsRef.current.normalize(periodStartMa, minMa, maxMa);
                    if (pathRef.current) {
                        const point = pathRef.current.getPointAt(pathPercentage);

                        const spriteMaterial = new THREE.SpriteMaterial({ 
                            map: new THREE.CanvasTexture(createTextTexture(period.name)),
                            transparent: true
                        });
                        const sprite = new THREE.Sprite(spriteMaterial);
                        sprite.position.copy(point);
                        sprite.scale.set(10, 5, 1);
                        sceneRef.current.add(sprite);
                    }
                }
            });
        });

        function createTextTexture(text) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 128;
            context.font = '20px Arial';
            context.fillStyle = 'white';
            context.fillText(text, 10, 50);
            return canvas;
        }

    }, [timelineData]);

    return (
        <div>
            <canvas ref={canvasRef} className="experience"></canvas>
            <div ref={scrollTargetRef} className="scrollTarget"></div>
            <div className="vignette-radial"></div>
            {popover.visible && (
                <div
                    style={{
                        position: 'fixed',
                        left: popover.x,
                        top: popover.y,
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        pointerEvents: 'none',
                        transform: 'translate(10px, -20px)',
                    }}
                >
                    {popover.content}
                </div>
            )}
        </div>
    );
};

export default Timeline;