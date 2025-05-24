"use client";

import React, { useState } from 'react';
import styles from './WorldMap.module.css';
import WorldMapSvg from './WorldMapSvg';

interface WorldMapProps {
  collectedCountries: {
    [key: string]: number; // country code -> number of coins
  };
}

interface CountryNameMapping {
  [key: string]: string;
}

const countryNameMapping: CountryNameMapping = {
  // Common variations
  'United States of America': 'United States',
  'USA': 'United States',
  'US': 'United States',
  'UNITED STATES': 'United States',
  'United Kingdom': 'UK',
  'Great Britain': 'UK',
  'Russian Federation': 'Russia',
  'People\'s Republic of China': 'China',
  'PRC': 'China',
};

const WorldMap = ({ collectedCountries = {} }: WorldMapProps) => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const handleCountryHover = (country: string | null, event: React.MouseEvent) => {
    setHoveredCountry(country);
    if (country && event) {
      // Get the container bounds for proper positioning
      const container = event.currentTarget.closest(`.${styles.mapContainer}`) as HTMLElement;
      if (container) {
        const containerBounds = container.getBoundingClientRect();
        const tooltipX = event.clientX - containerBounds.left + 10;
        const tooltipY = event.clientY - containerBounds.top - 10;
        
        setTooltipPosition({
          x: tooltipX,
          y: tooltipY,
        });
      }
    } else {
      setTooltipPosition(null);
    }
  };

  const handleCountryClick = (country: string) => {
    // Handle click event - could show details, navigate to collection, etc.
    console.log('Clicked country:', country);
    // You can add navigation logic here, for example:
    // router.push(`/collections/${country.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const getCountryName = (country: string): string => {
    return countryNameMapping[country] || country;
  };

  const getTooltipContent = (country: string): React.ReactNode => {
    const normalizedCountry = getCountryName(country);
    const coinCount = collectedCountries[normalizedCountry] || 0;
    
    return (
      <div className={styles.tooltipContent}>
        <strong>{country}</strong>
        <span>Coins in collection: {coinCount}</span>
      </div>
    );
  };

  // Calculate safe tooltip position to keep it within bounds
  const getSafeTooltipPosition = () => {
    if (!tooltipPosition) return {};
    
    // Base positioning
    let { x, y } = tooltipPosition;
    
    // We'll let CSS handle most of the positioning but ensure it's visible
    const style: React.CSSProperties = {
      left: x,
      top: y,
      transform: 'translate(-50%, -100%)',
    };
    
    // Adjust if too close to edges (simplified approach)
    if (x < 100) {
      style.transform = 'translate(0, -100%)';
      style.left = x + 10;
    } else if (x > window.innerWidth - 200) {
      style.transform = 'translate(-100%, -100%)';
      style.left = x - 10;
    }
    
    if (y < 60) {
      style.transform = style.transform?.replace('-100%', '10px') || 'translate(-50%, 10px)';
    }
    
    return style;
  };

  return (
    <div className={styles.mapContainer}>
      <WorldMapSvg
        collectedCountries={collectedCountries}
        onCountryHover={handleCountryHover}
        onCountryClick={handleCountryClick}
      />
      {hoveredCountry && tooltipPosition && (
        <div
          className={styles.tooltip}
          style={getSafeTooltipPosition()}
        >
          {getTooltipContent(hoveredCountry)}
        </div>
      )}
    </div>
  );
};

export default WorldMap; 