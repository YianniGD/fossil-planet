import React, { useState, useRef, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import { MicrophoneIcon, StopIcon } from '../Icons';
import bgAnimation from './data/bg.json';
import './css/SplashPage.css';

const SplashPage = ({ onEnter }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const splashTexts = [
    "Have you ever wondered what our planet<br />was like long before we were around?<br />You're about to find out!",
    "Get ready to travel back in time to uncover<br />the secrets of Earth's most amazing ancient animals.<br />This isn't just a list of dinosaurs. It's a window<br />into lost worlds. You'll discover the first dinosaurs<br />of the Triassic, the titans of the Jurassic,<br />and the last giants of the Cretaceous.<br />You'll meet the winged reptiles that soared through<br />the skies and the First fish to swim the oceans.",
    "As you explore, you can see exactly when each<br />creature lived on our Interactive Timeline<br />and get a real sense of their massive scale<br />with our Size Comparison tool.<br />Every animal has amazing Fun Facts<br />and our Pronunciation Guide will have you<br />saying Giganotosaurus like a real paleontologist.<br /><br />So, what are you curious about today?<br />Happy exploring!"
  ];

  useEffect(() => {
    audioRef.current = new Audio('/audio/female_narrator.wav');
    audioRef.current.onended = () => {
      setIsPlaying(false);
    };

    return () => {
      audioRef.current.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleAudio = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="splash-screen">
      <div className="splash-background">
        <Lottie 
          animationData={bgAnimation} 
          loop={false} 
          speed={0.5}
          autoplay={true}rendererSettings={{
          preserveAspectRatio: 'xMidYMid slice'
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
        />
      </div>
      <div className="splash-content">
        <h2>
          <span className="part-1" style={{ display: 'block' }}>Hey there, Explorer!</span>
          <span className="part-2" style={{ display: 'block' }}> Welcome to the Prehistoric Planet Encyclopedia!</span>
        </h2>
        <Swiper
          pagination={{
            dynamicBullets: true,
          }}
          modules={[Pagination]}
          className="mySwiper"
        >
          {splashTexts.map((text, index) => (
            <SwiperSlide key={index}>
              <p dangerouslySetInnerHTML={{ __html: text }} />
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="splash-buttons">
          <button onClick={onEnter} className="start-button">Enter</button>
          <button onClick={toggleAudio} className="audio-button">
            {isPlaying ? <StopIcon /> : <MicrophoneIcon />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplashPage;