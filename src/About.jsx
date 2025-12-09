import React from 'react';

const AboutPageContent = () => (
    <div>
        <h2>About This Project</h2>
        <p>This interactive encyclopedia is a personal project designed to bring the prehistoric world to life. It's built with a passion for web development, history, and the incredible creatures that once roamed our planet.</p>
        
        <h2>Technologies Used</h2>
        <ul>
            <li><strong>React:</strong> For building a dynamic and responsive user interface.</li>
            <li><strong>D3.js:</strong> To power the interactive globe visualization.</li>
            <li><strong>Vite:</strong> As a fast and modern build tool for web development.</li>
        </ul>

        <h2>Resources</h2>
        <p>The information about the prehistoric creatures is aggregated from various reputable sources, including:</p>
        <ul>
            <li><a href="https://www.nhm.ac.uk/discover/dino-directory.html" target="_blank" rel="noopener noreferrer" style={{color: '#85CEC0'}}>Natural History Museum, London</a></li>
            <li>Prehistoric Wildlife</li>
        </ul>
        <p>This project is for educational and demonstrative purposes only. All content and assets are used under fair use principles.</p>
    </div>
);


const About = ({ setView }) => {
    return (
        <div style={{ padding: '2rem', color: '#f4f4f4' }}>
            <AboutPageContent />
            <button className="start-button" onClick={() => setView('start')} style={{marginTop: '2rem'}}>Back to Start</button>
        </div>
    );
};

export default About;
