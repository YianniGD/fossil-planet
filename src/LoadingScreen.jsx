import React from 'react';

const LoadingScreen = () => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#000',
            color: '#fff',
            fontFamily: '"BBH Sans Hegarty", sans-serif',
            fontSize: '2rem',
            textTransform: 'uppercase'
        }}>
            Loading...
        </div>
    );
};

export default LoadingScreen;
