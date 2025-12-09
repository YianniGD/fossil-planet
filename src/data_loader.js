import { useState, useEffect } from 'react';

const useSpeciesData = () => {
    const [speciesByDigsite, setSpeciesByDigsite] = useState({});
    const [speciesIndexFull, setSpeciesIndexFull] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [digsiteRes, indexRes] = await Promise.all([
                    fetch('data/species_by_digsite.json?url'),
                    fetch('data/species_index_full.json?url')
                ]);

                if (!digsiteRes.ok) throw new Error(`HTTP error! status: ${digsiteRes.status} from species_by_digsite.json`);
                if (!indexRes.ok) throw new Error(`HTTP error! status: ${indexRes.status} from species_index_full.json`);

                const digsiteData = await digsiteRes.json();
                const indexData = await indexRes.json();

                const digsiteMap = {};
                digsiteData.forEach(entry => {
                    digsiteMap[entry.dig_site] = entry.species;
                });

                const indexMap = {};
                indexData.forEach(species => {
                    indexMap[species.id] = species;
                });

                setSpeciesByDigsite(digsiteMap);
                setSpeciesIndexFull(indexMap);
            } catch (e) {
                setError(e);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return { speciesByDigsite, speciesIndexFull, loading, error };
};

export default useSpeciesData;