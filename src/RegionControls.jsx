import React from 'react';

const RegionControls = ({ regions, onSelectRegion, currentRegionIndex, onViewChange, size, globeScale, currentViewIndex, disabled }) => {
  const currentRegion = regions[currentRegionIndex];

  if (!size || !size.width || !size.height) {
    return null;
  }

  const isZoomed = currentRegionIndex !== null;

  // --- Layout Calculations for main controls ---
  const centerX = size.width / 2;
  const centerY = size.height / 2;
  const radius = Math.min(size.width, size.height) / 2.5;
  const angleStep = (2 * Math.PI) / regions.length;
  const yOffset = 80; // Vertical spacing for sidebar
  const totalHeight = regions.length * yOffset;
  const startY = (size.height - totalHeight) / 2;
  const sidebarPositions = regions.map((_, index) => ({
      left: 80,
      top: startY + (index * yOffset) + (yOffset / 2)
  }));

  const getButtonPosition = (index) => {
    if (isZoomed) {
      return {
        left: sidebarPositions[index].left,
        top: sidebarPositions[index].top,
      };
    } else {
      const angle = angleStep * index - Math.PI / 2;
      return {
        left: centerX + radius * Math.cos(angle),
        top: centerY + radius * Math.sin(angle),
      };
    }
  };
  
  // --- Styles for the secondary controls ---
  const outerContainerStyle = {
    position: 'absolute',
    top: '5rem',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 1rem',
    pointerEvents: 'none',
    zIndex: 100,
  };

  const innerContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(16px)',
    padding: '0.5rem',
    borderRadius: '9999px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    pointerEvents: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  };

  const getSecondaryButtonStyle = (isActive) => ({
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontFamily: '"BBH Sans Hegarty", sans-serif',
    fontWeight: 500,
    transition: 'all 0.3s',
    background: isActive ? '#d97706' : 'transparent',
    color: isActive ? 'white' : '#a3a3a3',
    border: 'none',
    cursor: 'pointer',
    transform: isActive ? 'scale(1.05)' : 'scale(1)',
  });

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {regions.map((region, index) => {
        const positionStyle = getButtonPosition(index);
        return (
          <button
            key={region.Region_Name}
            onClick={() => !disabled && onSelectRegion(currentRegionIndex === index ? null : index)}
            style={{
              position: 'absolute',
              transform: 'translate(-50%, -50%)',
              ...positionStyle,
              background: index === currentRegionIndex ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '10px 15px',
              cursor: disabled ? 'wait' : 'pointer',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px',
              pointerEvents: disabled ? 'none' : 'all',
              opacity: disabled ? 0.5 : (isZoomed && index !== currentRegionIndex) ? 0.7 : 1,
            }}
          >
            <img src={`${import.meta.env.BASE_URL}/images/Globes/${region.Region_Name}.svg`} alt={region.Region_Name} style={{ width: isZoomed ? '40px' : '50px', height: isZoomed ? '40px' : '50px', transition: 'all 0.5s' }} />
            <div style={{ fontFamily: '"BBH Sans Hegarty", sans-serif', fontSize: isZoomed ? '0.8rem' : '1rem', transition: 'all 0.5s' }}>{region.Region_Name}</div>
          </button>
        );
      })}
      {currentRegion && currentRegion.views && (
        <div style={outerContainerStyle}>
            <div style={innerContainerStyle}>
                {currentRegion.views.map((view, index) => (
                    <button
                        key={view.name}
                        onClick={() => onViewChange(index)}
                        style={getSecondaryButtonStyle(currentViewIndex === index)}
                        onMouseOver={(e) => {
                            if (currentViewIndex !== index) {
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (currentViewIndex !== index) {
                            e.currentTarget.style.color = '#a3a3a3';
                            e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                    {view.name}
                    </button>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default RegionControls;