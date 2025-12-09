import React, { useState } from 'react';
import SplashPage from './SplashPage'; // Import the SplashPage component

const StartScreen = ({ setView }) => {
    const [showSplash, setShowSplash] = useState(true);

    const handleEnter = () => {
        setView('/globe');
    };

    const buttonStyle = {
        fontFamily: '"BBH Sans Hegarty", sans-serif',
        textTransform: 'uppercase',
        fontSize: '2rem',
        background: 'none',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        padding: '1rem'
    };

    if (showSplash) {
        return <SplashPage onEnter={handleEnter} />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <h1 style={{ fontFamily: '"BBH Sans Hegarty", sans-serif', fontSize: '4rem', textTransform: 'uppercase' }}>Fossil Planet</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button style={buttonStyle} onClick={() => setView('/globe')}>Globe</button>
                <button style={buttonStyle} onClick={() => setView('/timeline')}>Timeline</button>
                <button style={buttonStyle} onClick={() => setView('/about')}>About</button>
            </div>
        </div>
    );
};

export default StartScreen;