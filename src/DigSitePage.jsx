import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const DigSitePage = ({ locationsData }) => {
    const [digSite, setDigSite] = useState(null);
    const { digSiteName } = useParams();

    useEffect(() => {
        if (locationsData && digSiteName) {
            const foundDigSite = locationsData.find(site => site.Location_Name === digSiteName);
            setDigSite(foundDigSite);
        }
    }, [locationsData, digSiteName]);

    if (!digSite) {
        return <div>Dig site not found.</div>;
    }

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <h1>{digSite.name}</h1>
            <img src={digSite.imageUrl} alt={digSite.name} />
            <p>{digSite.description}</p>

            <h2>Coordinates</h2>
            <ul>
                <li><strong>Latitude:</strong> {digSite.coords[1]}</li>
                <li><strong>Longitude:</strong> {digSite.coords[0]}</li>
            </ul>
        </div>
    );
};


export default DigSitePage;