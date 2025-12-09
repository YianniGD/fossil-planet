import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { geoCentroid } from 'd3-geo';
import Globe from './Globe';
import StartScreen from './StartScreen';
import SpeciesPage from './SpeciesPage';
import Timeline from './Timeline';
import LoadingScreen from './LoadingScreen'; // Import the LoadingScreen component

import FilterControls from './FilterControls';
import About from './About'; // Import the About component
import DigSitePage from './DigSitePage';

import speciesData from './data/species_index_full.json';
import allRegions from './data/regions.json';
import mergedGeoData from './data/custom.min.simplified.merged.geo.json';
import speciesByDigsiteData from './data/species_by_digsite.json';

const App = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSpecies, setSelectedSpecies] = useState(null);
    const [allSpecies, setAllSpecies] = useState([]);
    const [filteredSpecies, setFilteredSpecies] = useState([]);
    const [regions, setRegions] = useState([]);
    const [locationsData, setLocationsData] = useState([]);
    const [geoData, setGeoData] = useState(null);
    const [currentRegionIndex, setCurrentRegionIndex] = useState(null);
    const [speciesByDigsite, setSpeciesByDigsite] = useState([]);
    const [eras, setEras] = useState([]);
    const [epochs, setEpochs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        name: '',
        era: '',
        epoch: '',
        category: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        try {
            const eras = [...new Set(speciesData.flatMap(s => s.eras))];
            const epochs = [...new Set(speciesData.map(s => s.epoch))];
            const categories = [...new Set(speciesData.flatMap(s => (s.categories || []).map(c => c.primary)))];

            setAllSpecies(speciesData);
            setFilteredSpecies(speciesData);
            setEras(eras);
            setEpochs(epochs);
            setCategories(categories);

                        const locations = mergedGeoData.features.flatMap(feature =>
                            (feature.properties.dig_sites || []).map((site, index) => {
                                const randomImageId = Math.floor(Math.random() * 6) + 1;
                                return {
                                    ...site,
                                    name: site.Location_Name,
                                    imageUrl: import.meta.env.BASE_URL + `images/site_${randomImageId}.webp`,
                                    coords: geoCentroid(feature)
                                };
                            }))
            setLocationsData(locations);
            setRegions(allRegions.filter(region => region.Region_Name !== 'Antarctica'));
            setGeoData(mergedGeoData);
            setIsLoading(false); // Set loading to false after all data is loaded
        } catch (error) {
            console.error("Failed to load initial data:", error);
        }
    }, []);

    const handleFilterChange = (filterType, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [filterType]: value
        }));
    };

    useEffect(() => {
        let species = allSpecies;

        if (filters.name) {
            species = species.filter(s => s.id.toLowerCase().includes(filters.name.toLowerCase()));
        }

        if (filters.era) {
            species = species.filter(s => s.eras.includes(filters.era));
        }

        if (filters.epoch) {
            species = species.filter(s => s.epoch === filters.epoch);
        }

        if (filters.category) {
            species = species.filter(s => s.categories.some(c => c.primary === filters.category));
        }

        setFilteredSpecies(species);
    }, [filters, allSpecies]);

    const showSpeciesPage = (speciesId) => {
        const species = allSpecies.find(s => s.id === speciesId);
        setSelectedSpecies(species);
        navigate(`/species/${speciesId}`);
    };

    const showDigSitePage = (digSite) => {
        navigate(`/dig-site/${digSite.name}`);
    };

    const handleBackClick = () => {
        navigate(-1);
    }

    const backButtonStyle = {
        fontFamily: '"BBH Sans Hegarty", sans-serif',
        textTransform: 'uppercase',
        fontSize: '2rem',
        background: 'none',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        padding: '1rem',
        position: 'fixed',
        top: '10px',
        left: '10px',
        zIndex: 100
    };

    useEffect(() => {
        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        };

        const handleKeyDown = (e) => {
            if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0')) {
                e.preventDefault();
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div>
            <button style={backButtonStyle} onClick={handleBackClick}>Back</button>
            <Routes>
                <Route path="/" element={<StartScreen setView={(view) => navigate(view)} />} />
                <Route path="/globe" element={<Globe showSpeciesPage={showSpeciesPage} showDigSitePage={showDigSitePage} locationsData={locationsData} regions={regions} geoData={geoData} currentRegionIndex={currentRegionIndex} onSelectRegion={setCurrentRegionIndex} />} />
                <Route path="/timeline" element={<><FilterControls eras={eras} epochs={epochs} categories={categories} onFilterChange={handleFilterChange} /><Timeline speciesData={filteredSpecies} showSpeciesPage={showSpeciesPage} /></>} />
                <Route path="/species/:speciesId" element={<SpeciesPage species={selectedSpecies} allSpecies={allSpecies} showDigSitePage={showDigSitePage} locationsData={locationsData} />} />
                <Route path="/dig-site/:digSiteName" element={<DigSitePage locationsData={locationsData} />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </div>
    );
};

export default App;
