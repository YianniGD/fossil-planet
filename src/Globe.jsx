import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as d3 from 'd3';
import RegionControls from './RegionControls';

// --- ANIMATION CUSTOMIZATION ---

// Easing function for the initial globe scaling.
// Try: d3.easeCubicOut, d3.easeBounceOut, d3.easeElasticOut.period(0.6), d3.easeBackOut.overshoot(1.7)
const globeScaleEasing = d3.easeCubicOut;

// Keyframes for globe position animation. Each keyframe has a position `pos` and an `ease` function
// for the transition *to* that keyframe.
const positionKeyframes = [
    { pos: [0, 0], ease: d3.easeCubicInOut },      // Start at center
    { pos: [50, -20], ease: d3.easeCubicInOut },   // Interval 1
    { pos: [20, -30], ease: d3.easeCubicInOut },   // Interval 2
    { pos: [0, 0], ease: d3.easeBackInOut.overshoot(1.7) }        // Interval 3 (overshoot)
];

const Globe = ({ locationsData, regions, currentRegionIndex, geoData, onSelectRegion, showDigSitePage }) => {
    const canvasRef = useRef(null);
    const svgRef = useRef(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [markers, setMarkers] = useState([]);
    const [isProjectionReady, setIsProjectionReady] = useState(false);
    const [globeAnimationState, setGlobeAnimationState] = useState('idle');
    const [markerAnimationState, setMarkerAnimationState] = useState('idle');
    const [markerScale, setMarkerScale] = useState(0);
    const [currentViewIndex, setCurrentViewIndex] = useState(0);
    const [globeScale, setGlobeScale] = useState(0);
    const [translateOffset, setTranslateOffset] = useState([0, 0]);
    const [initialAnimationDone, setInitialAnimationDone] = useState(false);
    const drawGlobeRef = useRef();
    
    // Memoize graticule to avoid re-creation
    const graticule = useMemo(() => d3.geoGraticule10(), []);

    // Stabilize complex props that might be re-created on each render by the parent.
    // This prevents infinite loops in useEffect hooks by creating a stable reference.
    const stableGeoData = useMemo(() => geoData, [JSON.stringify(geoData)]);
    const stableRegions = useMemo(() => regions, [JSON.stringify(regions)]);
    const stableLocationsData = useMemo(() => locationsData, [JSON.stringify(locationsData)]);

    const handleViewChange = useCallback((index) => {
        setCurrentViewIndex(index);
        setMarkerAnimationState('fadingOut');
    }, []);

    // Memoize projection to avoid re-creation
    const projection = useMemo(() => d3.geoOrthographic().rotate([100, -40]), []);

    // Set markers
    useEffect(() => {
        if (stableLocationsData) {
            const locationMarkers = stableLocationsData.map((location, index) => {
                if (!location.Coordinates) return null;
                const randomImageId = Math.floor(Math.random() * 6) + 1;
                return {
                    id: `loc-${index}`,
                    coords: [location.Coordinates.lng, location.Coordinates.lat],
                    name: location.Location_Name,
                    description: location.description,
                    isLocation: true,
                    imageUrl: import.meta.env.BASE_URL + `images/site_${randomImageId}.webp`
                };
            }).filter(Boolean);
            setMarkers(locationMarkers);
        }
    }, [stableLocationsData]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            const container = canvasRef.current.parentElement;
            setSize({ width: container.offsetWidth, height: container.offsetHeight });
            setIsProjectionReady(false); // Reset projection ready state on resize
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const drawGlobe = useCallback(() => {
        if (!canvasRef.current) return;
        const context = canvasRef.current.getContext('2d');
        const path = d3.geoPath(projection, context);

        context.clearRect(0, 0, size.width, size.height);
        context.fillStyle = '#0f1526';
        context.fillRect(0, 0, size.width, size.height);

        // Globe sphere
        context.beginPath();
        path({ type: 'Sphere' });
        context.fillStyle = '#1c2a4f';
        context.fill();

        // Graticule
        context.beginPath();
        path(graticule);
        context.strokeStyle = 'rgba(119, 119, 119, 0.2)';
        context.lineWidth = 0.5;
        context.stroke();

        // Land
        if (stableGeoData) {
            context.beginPath();
            // Assuming stableGeoData is a FeatureCollection or GeometryCollection that d3.geoPath can handle directly.
            // This is significantly faster than iterating over features and drawing them one by one.
            path(stableGeoData);
            context.fillStyle = '#95AB63';
            context.fill();
            context.strokeStyle = '#1c2a4f';
            context.lineWidth = 0.5;
            context.stroke();
        }
    }, [size, stableGeoData, projection, graticule]);
    drawGlobeRef.current = drawGlobe;

    // Initial globe animation
    useEffect(() => {
        const enlargeDuration = 1500; // Longer for a smoother effect
        const shrinkDuration = 800;  // Adjusted for a gentle settle
        const totalDuration = enlargeDuration + shrinkDuration;
        let timer;

        const initialRotation = projection.rotate();
        const rotationInterpolator = d3.interpolate(
            [initialRotation[0] - 15, initialRotation[1] - 5],
            initialRotation
        );

        const baseScale = Math.min(size.width, size.height) / 2;

        const timeout = setTimeout(() => {
            timer = d3.timer((elapsed) => {
                let currentGlobeScale = globeScale;
                let currentTranslateOffset = translateOffset;

                if (elapsed < totalDuration) {
                    const t = elapsed / totalDuration;
                    const easedT = d3.easeCubicInOut(t); // Smoother easing for rotation
                    projection.rotate(rotationInterpolator(easedT));
                }

                if (elapsed < enlargeDuration) {
                    const t = elapsed / enlargeDuration;
                    const easedScaleT = globeScaleEasing(t);
                    currentGlobeScale = easedScaleT * 1.1; // Slightly smaller overshoot

                    // Animate translation using keyframes
                    const keyframeT = t * (positionKeyframes.length - 1);
                    const startIndex = Math.floor(keyframeT);
                    const endIndex = Math.min(startIndex + 1, positionKeyframes.length - 1);
                    const intervalT = keyframeT - startIndex;

                    const startFrame = positionKeyframes[startIndex];
                    const endFrame = positionKeyframes[endIndex];
                    
                    const intervalEase = endFrame.ease;
                    const easedIntervalT = intervalEase(intervalT);

                    const startPos = startFrame.pos;
                    const endPos = endFrame.pos;

                    const currentX = d3.interpolate(startPos[0], endPos[0])(easedIntervalT);
                    const currentY = d3.interpolate(startPos[1], endPos[1])(easedIntervalT);
                    currentTranslateOffset = [currentX, currentY];

                } else if (elapsed < totalDuration) {
                    const t = (elapsed - enlargeDuration) / shrinkDuration;
                    const easedT = d3.easeCubicOut(t); 
                    currentGlobeScale = 1.1 - easedT * 0.1;
                    currentTranslateOffset = [0, 0]; // Ensure it settles at the center
                } else {
                    if(timer) timer.stop();
                    setGlobeScale(1);
                    setTranslateOffset([0, 0]);
                    projection.rotate(initialRotation);
                    setInitialAnimationDone(true);
                    setTimeout(() => {
                        setMarkerAnimationState('fadingIn');
                    }, 500);
                }

                projection
                    .scale(baseScale * currentGlobeScale)
                    .translate([size.width / 2 + currentTranslateOffset[0], size.height / 2 + currentTranslateOffset[1]]);

                if(drawGlobeRef.current) {
                    drawGlobeRef.current();
                }
            });
        }, 500);

        return () => {
            clearTimeout(timeout);
            if(timer) timer.stop();
        };
    }, [projection, size.width, size.height]);

    // Main drawing and interaction effect
    useEffect(() => {
        if (!size.width || !stableGeoData) return;

        const baseScale = Math.min(size.width, size.height) / 2;
        projection
            .scale(baseScale * globeScale)
            .translate([size.width / 2 + translateOffset[0], size.height / 2 + translateOffset[1]]);

        if (drawGlobeRef.current) {
            drawGlobeRef.current();
        }
        setIsProjectionReady(true);

    }, [size, stableGeoData, projection, globeScale, translateOffset]);

    // Animation sequence
    useEffect(() => {
        if (initialAnimationDone && currentRegionIndex === null && globeScale !== 1) {
            const zoomOutDuration = 1000;
            const initialScale = globeScale;
            const targetScale = 1;
            const scaleInterpolator = d3.interpolate(initialScale, targetScale);

            const timer = d3.timer((elapsed) => {
                const t = Math.min(elapsed / zoomOutDuration, 1);
                const easedT = d3.easeCubicInOut(t);
                setGlobeScale(scaleInterpolator(easedT));

                if (t >= 1) {
                    timer.stop();
                }
            });

            return () => timer.stop();
        }
    }, [initialAnimationDone, currentRegionIndex, globeScale]);

    useEffect(() => {
        if (currentRegionIndex !== null) {
            setMarkerAnimationState('fadingOut');
        }
    }, [currentRegionIndex]);

    useEffect(() => {
        if (markerAnimationState === 'fadingOut') {
            const enlargeDuration = 200;
            const shrinkDuration = 300;
            const totalDuration = enlargeDuration + shrinkDuration;

            const timer = d3.timer((elapsed) => {
                if (elapsed < enlargeDuration) {
                    const t = elapsed / enlargeDuration;
                    const easedT = d3.easeCubicOut(t);
                    setMarkerScale(1 + easedT * 0.2);
                } else if (elapsed < totalDuration) {
                    const t = (elapsed - enlargeDuration) / shrinkDuration;
                    const easedT = d3.easeCubicIn(t);
                    setMarkerScale(1 - easedT * 1);
                } else {
                    timer.stop();
                    setMarkerScale(0);
                    setMarkerAnimationState('idle');
                    setGlobeAnimationState('rotating');
                }
            });
            return () => timer.stop();
        }
    }, [markerAnimationState]);

    useEffect(() => {
        if (globeAnimationState === 'rotating' && stableRegions && projection && isProjectionReady && currentRegionIndex !== null) {
            const region = stableRegions[currentRegionIndex];
            if (!region) return;

            let targetRotation;
            if (region.views && region.views.length > 0) {
                const view = region.views[currentViewIndex];
                targetRotation = [-view.Coordinates.lng, -view.Coordinates.lat];
            } else {
                targetRotation = [-region.Coordinates.lng, -region.Coordinates.lat];
            }

            const startRotation = projection.rotate();
            const interpolator = d3.interpolate(startRotation, targetRotation);

            const startScale = globeScale;
            const targetScale = 2.2;
            let scaleInterpolator;

            if (startScale > 1) { // Already zoomed in, so dip it
                const dipScale = 1.8;
                const ease = d3.easeCubicInOut;
                scaleInterpolator = (t) => {
                    if (t < 0.5) {
                        return d3.interpolate(startScale, dipScale)(ease(t * 2));
                    } else {
                        return d3.interpolate(dipScale, targetScale)(ease((t - 0.5) * 2));
                    }
                };
            } else {
                scaleInterpolator = (t) => d3.interpolate(startScale, targetScale)(d3.easeCubicInOut(t));
            }

            const anticipationOvershoot = -0.1;
            const anticipationDuration = 200;
            const mainRotationDuration = 2000;
            const totalDuration = anticipationDuration + mainRotationDuration;
            
            const fadeInTime = anticipationDuration + mainRotationDuration * 0.7;
            let fadeInStarted = false;

            const timer = d3.timer((elapsed) => {
                let t;
                if (elapsed < anticipationDuration) {
                    const anticipationProgress = elapsed / anticipationDuration;
                    t = d3.easeCubicOut(anticipationProgress) * anticipationOvershoot;
                } else if (elapsed < totalDuration) {
                    const mainProgress = (elapsed - anticipationDuration) / mainRotationDuration;
                    const elasticEase = d3.easeElasticOut.amplitude(1.2).period(0.5);
                    const easedMainProgress = elasticEase(mainProgress);
                    t = anticipationOvershoot + easedMainProgress * (1 - anticipationOvershoot);
                } else {
                    t = 1;
                }
                
                const scaleT = d3.easeCubicInOut(Math.min(elapsed / totalDuration, 1));
                const newScale = scaleInterpolator(scaleT);
                setGlobeScale(newScale);

                projection.rotate(interpolator(t));

                // We remove explicit drawGlobeRef.current() here because setGlobeScale triggers a re-render.
                // The re-render triggers the useEffect that calls drawGlobeRef.current().
                // However, if newScale is identical to previous scale (which happens at end of animation), 
                // React might not re-render.
                // But rotation changes every frame.
                // If we rely purely on useEffect, we might miss rotation updates if scale doesn't change.
                // But wait, setGlobeScale is async. The projection.rotate happens synchronously here.
                // When useEffect runs, it uses the current projection state.
                
                // To be safe and ensure smooth rotation even if scale stops changing:
                // We SHOULD call drawGlobeRef.current().
                // Optimally, we would suppress the useEffect draw if we draw here.
                // But removing it is safer than double drawing if the performance is acceptable with batching.
                // For now, I will keep it but relying on the batching optimization to handle the load.
                // Actually, let's try to only draw here if we think useEffect won't pick it up?
                // No, that's complex.
                
                // Let's stick to the double draw for now but with optimized drawGlobe.
                // The previous bottleneck was individual features.
                drawGlobeRef.current();

                if (!fadeInStarted && elapsed >= fadeInTime) {
                    setMarkerAnimationState('fadingIn');
                    fadeInStarted = true;
                }

                if (elapsed >= totalDuration) {
                    timer.stop();
                    projection.rotate(targetRotation);
                    setGlobeScale(targetScale);
                    setGlobeAnimationState('idle');
                    if (!fadeInStarted) {
                        setMarkerAnimationState('fadingIn');
                    }
                }
            });

            return () => timer.stop();
        }
    }, [globeAnimationState, stableRegions, projection, isProjectionReady, currentRegionIndex, currentViewIndex]);

    useEffect(() => {
        if (markerAnimationState === 'fadingIn') {
            const enlargeDuration = 150;
            const shrinkDuration = 100;
            const totalDuration = enlargeDuration + shrinkDuration;

            const timer = d3.timer((elapsed) => {
                if (elapsed < enlargeDuration) {
                    const t = elapsed / enlargeDuration;
                    const easedT = d3.easeCubicOut(t);
                    setMarkerScale(easedT * 1);
                } else if (elapsed < totalDuration) {
                    const t = (elapsed - enlargeDuration) / shrinkDuration;
                    const easedT = d3.easeCubicIn(t);
                    setMarkerScale(1 - easedT * 0.2);
                } else {
                    timer.stop();
                    setMarkerScale(1);
                    setMarkerAnimationState('idle');
                }
            });
            return () => timer.stop();
        }
    }, [markerAnimationState]);

    return (
        <>
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 101 }}>
                <Link to="/timeline" style={{ color: 'white', textDecoration: 'none', fontFamily: '"BBH Sans Hegarty", sans-serif', fontSize: '1.5rem' }}>Timeline</Link>
            </div>
            <div style={{ position: 'absolute', bottom: '120px', left: '20px', zIndex: 101 }}>
                <Link to="/about" style={{ color: 'white', textDecoration: 'none', fontFamily: '"BBH Sans Hegarty", sans-serif', fontSize: '1.5rem' }}>About</Link>
            </div>
            <div style={{ width: '100%', height: '100vh' }}>
                <canvas ref={canvasRef} width={size.width} height={size.height} />
                <svg ref={svgRef} width={size.width} height={size.height} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                    {isProjectionReady && markers.map((marker) => {
                        // Optimization: if markerScale is 0, don't calculate projection or render
                        if (markerScale === 0) return null;

                        const point = projection(marker.coords);
                        if (!point) return null;

                        const [x, y] = point;
                        const [lambda, phi] = marker.coords;
                        const [rLambda, rPhi] = projection.rotate();
                        const isVisible = d3.geoDistance([lambda, phi], [-rLambda, -rPhi]) < Math.PI / 2;

                        if (isVisible) {
                            const imageSize = 32 * markerScale;
                            return (
                                <g
                                    key={marker.id}
                                    className="marker"
                                    transform={`translate(${x - imageSize / 2}, ${y - imageSize / 2})`}
                                    onClick={() => showDigSitePage(marker)}
                                    style={{ pointerEvents: 'all', cursor: 'pointer', opacity: markerScale }}
                                >
                                    <image
                                        href={marker.imageUrl}
                                        width={imageSize}
                                        height={imageSize}
                                    />
                                    <title>{marker.name}</title>
                                </g>
                            );
                        }
                        return null;
                    })}
                </svg>
            </div>
            <RegionControls regions={regions} onSelectRegion={onSelectRegion} currentRegionIndex={currentRegionIndex} onViewChange={handleViewChange} size={size} globeScale={globeScale} currentViewIndex={currentViewIndex} disabled={!initialAnimationDone} />
        </>
    );
};

export default Globe;