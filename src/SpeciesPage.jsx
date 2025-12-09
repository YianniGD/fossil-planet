import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Lottie from 'lottie-react';
import './css/SpeciesPage.css';
import speciesIndex from './data/species_index_full.json';
import fgAnimation from './data/fg.json';

const SpeciesPage = ({ species, allSpecies, showDigSitePage, locationsData }) => {
    const { speciesId } = useParams();
    const [localSpecies, setLocalSpecies] = useState(species);
    const [phrases, setPhrases] = useState({});

    useEffect(() => {
        if (!localSpecies && allSpecies && allSpecies.length > 0) {
            const foundSpecies = allSpecies.find(s => s.id === speciesId);
            setLocalSpecies(foundSpecies);
        }
    }, [localSpecies, allSpecies, speciesId]);

    const speciesData = speciesIndex.find(s => s.id === speciesId);
    const subcategory = speciesData ? speciesData.category[0] : null;

    const getSubcategoryClassName = (subcategory) => {
        if (!subcategory) return '';
        return `species-page--${subcategory.replace(/ /g, '-').replace(/:/g, '').toLowerCase()}`;
    };

    const subcategoryClassName = getSubcategoryClassName(subcategory);

    useEffect(() => {
        if (localSpecies) {
            const phrasePools = {
                livedDuring: [
                    "lived during",
                    "existed in",
                    "roamed the earth in",
                    "was present during",
                    "is known from"
                ],
                aMemberOf: [
                    "A member of",
                    "Belonging to",
                    "Classified as part of"
                ],
                itWas: [
                    "it was",
                    "this creature was",
                    "the species was",
                    "it is described as"
                ],
                knownFor: [
                    "known for being about",
                    "measuring approximately",
                    "reaching lengths of around",
                    "growing to about"
                ],
                firstFossils: [
                    "The first fossils of this dinosaur were discovered in",
                    "Remains of this species were first unearthed at",
                    "This dinosaur was first identified from fossils found in",
                    "Initial fossil evidence was located in"
                ]
            };

            const getRandomPhrase = (pool) => pool[Math.floor(Math.random() * pool.length)];

            setPhrases({
                livedDuring: getRandomPhrase(phrasePools.livedDuring),
                aMemberOf: getRandomPhrase(phrasePools.aMemberOf),
                itWas: getRandomPhrase(phrasePools.itWas),
                knownFor: getRandomPhrase(phrasePools.knownFor),
                firstFossils: getRandomPhrase(phrasePools.firstFossils)
            });
        }
    }, [localSpecies]);

    const [isDragging, setIsDragging] = useState(false);

    const containerRef = useRef(null);
    const skeletonRef = useRef(null);
    const lensRef = useRef(null);
    const blurRef = useRef(null);
    const lensTimeoutRef = useRef(null);
    const audioRef = useRef(null);
    const userHasInteracted = useRef(false);
    const rafId = useRef(null);
    const lastX = useRef(0);
    const lastY = useRef(0);

    // Initialize audio
    useEffect(() => {
        audioRef.current = new Audio(import.meta.env.BASE_URL + 'audio/AFX_SCANNINGRAY_DFMG.wav');
        audioRef.current.loop = true;
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Unlock audio on first user interaction
    useEffect(() => {
        const unlockAudio = () => {
            if (audioRef.current && !userHasInteracted.current) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.then(_ => {
                        audioRef.current.pause();
                    }).catch(error => {
                        console.error("Audio unlock failed:", error);
                    });
                }
                userHasInteracted.current = true;
            }
            window.removeEventListener('pointerdown', unlockAudio);
        };

        window.addEventListener('pointerdown', unlockAudio);

        return () => {
            window.removeEventListener('pointerdown', unlockAudio);
        };
    }, []);

    const handleXRayPointerDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        if (audioRef.current && userHasInteracted.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(error => {
                console.error("Audio play failed:", error);
            });
        }
    };

    const handleXRayPointerUp = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        const EXIT_DURATION = 220;
        const lensElLocal = lensRef.current;
        if (lensElLocal) {
            lensElLocal.classList.add('edge-exit');
            if (lensTimeoutRef.current) clearTimeout(lensTimeoutRef.current);
            lensTimeoutRef.current = setTimeout(() => {
                setIsDragging(false);
                if (lensRef.current) {
                    lensRef.current.style.opacity = '0';
                    lensRef.current.classList.remove('edge-exit');
                }
                lensTimeoutRef.current = null;
            }, EXIT_DURATION + 40);
        } else {
            setIsDragging(false);
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handlePointerMove = (e) => {
            if (!isDragging) return; // Only apply X-ray effect if it's open

            if (rafId.current) return;

            rafId.current = requestAnimationFrame(() => {
                const rect = container.getBoundingClientRect();
                const x = (e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX)) - rect.left;
                const y = (e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY)) - rect.top;

                // read radius from CSS variable if present (falls back to 100px)
                const cs = getComputedStyle(container);
                let radius = cs.getPropertyValue('--xray-radius') || '100px';
                radius = radius.trim();
                // If CSS var is given as --xray-radius: 100px; it's safe to use directly

                // Update only the skeleton's clip-path for X-Ray effect
                if (skeletonRef.current) {
                    skeletonRef.current.style.clipPath = `circle(${radius} at ${x}px ${y}px)`;
                    skeletonRef.current.style.opacity = '1';
                }

                // Reveal the blurred rim layer and give it a slightly larger radius so the rim shows
                if (blurRef.current) {
                    // compute numeric px from radius string
                    const rPx = parseInt(radius, 10) || 100;
                    const blurRadius = Math.round(rPx * 1.25);
                    blurRef.current.style.clipPath = `circle(${blurRadius}px at ${x}px ${y}px)`;
                    blurRef.current.style.opacity = '1';
                }

                // Position and size the glass 'lens' overlay (if present)
                if (lensRef.current) {
                    // parse radius like '100px' -> 100
                    const rPx = parseInt(radius, 10) || 100;
                    const size = Math.round(rPx * 2 * 1.15); // slight padding around the reveal
                    lensRef.current.style.width = `${size}px`;
                    lensRef.current.style.height = `${size}px`;
                    // position lens relative to the xray container
                    // clear any pending hide timeout (user re-entered)
                    if (lensTimeoutRef.current) {
                        clearTimeout(lensTimeoutRef.current);
                        lensTimeoutRef.current = null;
                    }

                    lensRef.current.style.left = `${x}px`;
                    lensRef.current.style.top = `${y}px`;
                    lensRef.current.style.opacity = '1';

                    // detect proximity to container edges and animate away if near
                    try {
                        const cW = rect.width;
                        const cH = rect.height;
                        const lensR = size / 2;
                        const threshold = 12; // px before edge to trigger animation (tweakable)
                        const nearLeft = (x - lensR) < (0 + threshold);
                        const nearTop = (y - lensR) < (0 + threshold);
                        const nearRight = (x + lensR) > (cW - threshold);
                        const nearBottom = (y + lensR) > (cH - threshold);
                        if (nearLeft || nearTop || nearRight || nearBottom) {
                            lensRef.current.classList.add('edge-exit');
                        }
                        else {
                            lensRef.current.classList.remove('edge-exit');
                        }
                    } catch (err) {
                        // silent fail — do not block pointer handling
                    }
                }

                lastX.current = x;
                lastY.current = y;
                rafId.current = null;
            });
        };

        container.addEventListener('pointermove', handlePointerMove);
        container.addEventListener('mousemove', handlePointerMove);
        container.addEventListener('touchmove', handlePointerMove);

        return () => {
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }
            container.removeEventListener('pointermove', handlePointerMove);
            container.removeEventListener('mousemove', handlePointerMove);
            container.removeEventListener('touchmove', handlePointerMove);
        };
    }, [isDragging]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handlePointerLeave = () => {
            if (!isDragging) return; // Only perform actions if X-ray is open

            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (skeletonRef.current) {
                skeletonRef.current.style.opacity = '0';
                // collapse clip-path back to 0% so enabling X-Ray later doesn't show a centered reveal
                skeletonRef.current.style.clipPath = 'circle(0% at 50% 50%)';
            }
            if (lensRef.current) {
                // animate lens away smoothly when pointer leaves
                lensRef.current.classList.add('edge-exit');
                // after the CSS transition finishes, hide and reset
                const EXIT_DURATION = 220; // ms, keep in sync with CSS transition
                if (lensTimeoutRef.current) clearTimeout(lensTimeoutRef.current);
                lensTimeoutRef.current = setTimeout(() => {
                    try {
                        lensRef.current.style.opacity = '0';
                        lensRef.current.classList.remove('edge-exit');
                    } catch (e) {}
                    lensTimeoutRef.current = null;
                }, EXIT_DURATION + 40);
            }
            if (blurRef.current) {
                blurRef.current.style.opacity = '0';
            }
        };

        container.addEventListener('mouseleave', handlePointerLeave);
        container.addEventListener('pointerleave', handlePointerLeave);

        return () => {
            container.removeEventListener('mouseleave', handlePointerLeave);
            container.removeEventListener('pointerleave', handlePointerLeave);
        };
    }, [isDragging]);

    useEffect(() => {
        if (!isDragging) return;
        const container = containerRef.current;
        const skeletonEl = skeletonRef.current;
        if (!container || !skeletonEl) return;
        const lensEl = lensRef.current;

        // Ensure skeleton and blur are hidden at the start of X-ray interaction
        skeletonEl.style.opacity = '0';
        skeletonEl.style.clipPath = 'circle(0% at 50% 50%)';
        if (blurRef.current) {
            blurRef.current.style.opacity = '0';
            blurRef.current.style.clipPath = 'circle(0% at 50% 50%)';
        }

        window.addEventListener('pointerup', handleXRayPointerUp);

        return () => {
            window.removeEventListener('pointerup', handleXRayPointerUp);
            if (skeletonEl) {
                skeletonEl.style.clipPath = 'circle(0% at 50% 50%)';
                skeletonEl.style.opacity = '0';
            }
            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (lensEl) {
                lensEl.classList.remove('edge-exit');
            }
            if (lensTimeoutRef.current) {
                clearTimeout(lensTimeoutRef.current);
                lensTimeoutRef.current = null;
            }
        };
    }, [isDragging]);

    if (!localSpecies) {
        return <div>Species not found.</div>;
    }

    const primaryWaterCategories = ['Early Marine Life', 'Prehistoric Sea Reptiles', 'Prehistoric Amphibians'];
    const subWaterCategories = ['Pliosaurs', 'Ocean-Dwelling Crocodiles', 'Water & Land Birds', 'Early Marine Diapsids', 'Early Aquatic Reptiles', 'Turtles'];

    const isWaterDwelling = localSpecies.categories && localSpecies.categories.some(cat =>
        primaryWaterCategories.includes(cat.primary) || subWaterCategories.includes(cat.subcategory)
    );

    const baseImage = isWaterDwelling ? 'water.webp' : 'landandair.webp';

    const HUMAN_FEET = 1.4;
    const speciesFeet = localSpecies.size.feet;
    let speciesWidth, humanWidth;
    const MAX_WIDTH = 800; // px

    if (speciesFeet > HUMAN_FEET) {
        speciesWidth = MAX_WIDTH;
        humanWidth = (HUMAN_FEET / speciesFeet) * MAX_WIDTH;
    } else {
        humanWidth = MAX_WIDTH;
        speciesWidth = (speciesFeet / HUMAN_FEET) * MAX_WIDTH;
    }

    return (
        <div className={`species-page ${subcategoryClassName}`} style={{
            padding: '28px',
            height: '100vh',
            boxSizing: 'border-box',
            overflow: 'hidden',
            fontSize: '18px',
            lineHeight: 1.4,
            backgroundImage: `url(${import.meta.env.BASE_URL}images/Bg.webp)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}>
            <div style={{ textAlign: 'right' }}>
                <h1>{localSpecies.id}</h1>
                {localSpecies.phonetic_spelling && <h2 style={{ fontStyle: 'italic', marginTop: '-10px' }}>{localSpecies.phonetic_spelling}</h2>}
            </div>

            <div style={{ marginTop: 12, marginBottom: 18, position: 'relative', zIndex: 1 }}>
                <div>
                    <div>
                        {localSpecies.literal_translation && (
                            <div style={{ marginBottom: '1rem' }}>
                                <p>
                                    <strong>"{localSpecies.literal_translation}"</strong>
                                    <br />
                                    <em style={{ fontSize: '0.9em' }}>{localSpecies.etymology}</em>
                                </p>
                            </div>
                        )}

                        <p>
                            {localSpecies.id} {phrases.livedDuring} the {localSpecies.epoch} epoch of the {localSpecies.eras && localSpecies.eras.join(', ')} era. <br />
                            {phrases.aMemberOf} the {localSpecies.categories && localSpecies.categories.length > 0 && localSpecies.categories[0].primary} as one of the {localSpecies.categories && localSpecies.categories.length > 0 && localSpecies.categories[0].subcategory}, <br />
                            {phrases.itWas} {localSpecies.description}, {phrases.knownFor} {localSpecies.size.feet} feet ({localSpecies.size.meters} meters) long! <br />
                            {phrases.firstFossils} the {localSpecies.discovery_locations && localSpecies.discovery_locations.length > 0 && localSpecies.discovery_locations[0].dig_site} in {localSpecies.discovery_locations && localSpecies.discovery_locations.length > 0 && localSpecies.discovery_locations[0].region}.
                        </p>
                        
                        {localSpecies.discovery_locations && (
                            <div>
                                <h2>Discovery Locations</h2>
                                <ul>
                                    {localSpecies.discovery_locations.map((loc, index) => {
                                        const digSite = locationsData.find(ds => ds.Location_Name === loc.dig_site);
                                        if (!digSite) {
                                            return (
                                                <li key={`${loc.region}-${loc.dig_site}`}>
                                                    <strong>{loc.region}:</strong> {loc.dig_site}
                                                </li>
                                            );
                                        }
                                        const randomImageId = Math.floor(Math.random() * 6) + 1;
                                        const pageData = {
                                            name: digSite.Location_Name,
                                            description: digSite.description,
                                            imageUrl: import.meta.env.BASE_URL + `images/site_${randomImageId}.webp`,
                                            coords: digSite.coords
                                        };
                                        return (
                                            <li key={`${loc.region}-${loc.dig_site}`} onClick={() => showDigSitePage(pageData)} style={{ cursor: 'pointer' }}>
                                                <strong>{loc.region}:</strong> {loc.dig_site}
                                                <img src={digSite.imageUrl} alt={digSite.Location_Name} style={{ width: '50px', height: '50px' }} />
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '1rem', fontFamily: '"BBH Sans Hegarty", sans-serif', textTransform: 'uppercase', color: 'white', margin: 0 }}>
                        Want a deeper look?<br/>
                        Click and hold the X-Ray icon!
                    </p>
                </div>

                <div className="image-container">
                    <img src={`${import.meta.env.BASE_URL}images/${baseImage}`} alt="ground base" style={{ position: 'absolute', bottom: '-70%', left: 0, width: '100%', height: '120%', objectFit: 'cover', objectPosition: 'center bottom', zIndex: -1 }} />
                    <img src={import.meta.env.BASE_URL + "animals/human.webp"} alt="human" className="xray-human-image" style={{ width: humanWidth }} />
                    {/* X-Ray button intentionally removed — press-and-hold is enabled on the image area */}

                    <div
                        className={isDragging ? 'xray-images xray-active' : 'xray-images'}
                        ref={containerRef}
                    >
                        {/* SVG filter for subtle distortion applied to the blurred rim layer */}
                        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
                            <defs>
                                <filter id="xray-distort-filter" x="-20%" y="-20%" width="140%" height="140%">
                                    <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="2" seed="23" result="noise" />
                                    <feGaussianBlur in="noise" stdDeviation="2" result="blurredNoise" />
                                    <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="18" xChannelSelector="R" yChannelSelector="G" />
                                </filter>
                            </defs>
                        </svg>

                        {/* <img
                            src="/images/background.png"
                            alt="Background"
                            className="species-background"
                        /> */}

                        {localSpecies.image_url && localSpecies.image_url.image && (
                            <img
                                src={import.meta.env.BASE_URL + localSpecies.image_url.image}
                                alt={localSpecies.name || localSpecies.id}
                                className="xray-specimen-image"
                                style={{ width: `${speciesWidth}px` }}
                            />
                        )}

                        {localSpecies.image_url && localSpecies.image_url.xray_image && (
                            <>
                                <img
                                    ref={blurRef}
                                    src={import.meta.env.BASE_URL + localSpecies.image_url.xray_image}
                                    alt={`${localSpecies.name || localSpecies.id} Skeleton (blur)`}
                                    className="xray-specimen-blur"
                                    style={{ width: `${speciesWidth}px` }}
                                />
                                <img
                                    ref={skeletonRef}
                                    src={import.meta.env.BASE_URL + localSpecies.image_url.xray_image}
                                    alt={`${localSpecies.name || localSpecies.id} Skeleton`}
                                    className="xray-specimen-skeleton"
                                    style={{ width: `${speciesWidth}px` }}
                                />
                            </>                            
                        )}

                        <div
                            ref={lensRef}
                            className="xray-lens"
                            aria-hidden="true"
                        />


                    </div>
                    <img 
                        src={import.meta.env.BASE_URL + "ui/xray icon.svg"} 
                        alt="X-Ray trigger"
                        onPointerDown={handleXRayPointerDown}
                        onPointerCancel={handleXRayPointerUp}
                        style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '20px',
                            width: '80px',
                            height: '80px',
                            cursor: 'pointer',
                            zIndex: 10
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SpeciesPage;
