"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './WorldMap.module.css';

interface WorldMapProps {
  collectedCountries: { [key: string]: number };
}

// Country name mapping for standardization
const countryNameMapping: { [key: string]: string } = {
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

export default function WorldMap({ collectedCountries }: WorldMapProps) {
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>();
  const eventListenersRef = useRef<Map<Element, any>>(new Map());
  const processedSvgRef = useRef<boolean>(false);
  const collectedCountriesRef = useRef(collectedCountries);
  const activePathRef = useRef<Element | null>(null);

  const getStandardizedCountryName = useCallback((countryName: string): string => {
    return countryNameMapping[countryName] || countryName;
  }, []);

  // Update the ref when collectedCountries changes
  useEffect(() => {
    collectedCountriesRef.current = collectedCountries;
    if (containerRef.current) {
      updateCountryStates();
    }
  }, [collectedCountries]);

  const updateCountryStates = useCallback(() => {
    const svgContainer = containerRef.current?.querySelector(`.${styles.svgContainer}`);
    if (!svgContainer) return;

    const svg = svgContainer.querySelector('svg');
    if (!svg) return;

    const paths = svg.querySelectorAll('path');
    paths.forEach((path) => {
      const countryName = path.getAttribute('data-country-name');
      if (countryName) {
        const isCollected = collectedCountriesRef.current[countryName];
        // Set data attributes for state management
        path.setAttribute('data-collected', isCollected ? 'true' : 'false');
        // Set fill and opacity directly
        const pathElement = path as SVGPathElement;
        if (isCollected) {
          pathElement.style.fill = 'var(--collected-country)';
          pathElement.style.opacity = '1';
        } else {
          pathElement.style.fill = 'var(--country-fill)';
          pathElement.style.opacity = '0.1';
        }
        pathElement.style.cursor = 'pointer';
        pathElement.style.strokeWidth = '0.5';
        pathElement.style.stroke = 'var(--country-stroke)';
        pathElement.style.transition = 'opacity 0.3s ease-in-out, fill 0.3s ease-in-out, stroke-width 0.3s ease-in-out';
      }
    });
  }, []);

  const handleCountryHover = useCallback((event: MouseEvent, country: string | null, path: Element | null) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    if (country && containerRef.current && path) {
      const count = collectedCountriesRef.current[country] || 0;
      const content = `${country}: ${count} coins`;
      setTooltipContent(content);
      
      const x = event.clientX;
      const y = event.clientY;
      
      setTooltipPosition({ x, y });
      setIsTooltipVisible(true);

      // Update hover state
      const isCollected = path.getAttribute('data-collected') === 'true';
      const pathElement = path as SVGPathElement;
      if (isCollected) {
        pathElement.style.fill = 'var(--collected-country-hover)';
      } else {
        pathElement.style.fill = 'var(--country-hover)';
        pathElement.style.opacity = '0.2';
      }
      pathElement.style.strokeWidth = '1';
      activePathRef.current = path;
    }

    // Handle mouse leave
    if (!country || !path) {
      tooltipTimeoutRef.current = setTimeout(() => {
        setIsTooltipVisible(false);
        if (activePathRef.current) {
          const isCollected = activePathRef.current.getAttribute('data-collected') === 'true';
          const pathElement = activePathRef.current as SVGPathElement;
          if (isCollected) {
            pathElement.style.fill = 'var(--collected-country)';
            pathElement.style.opacity = '1';
          } else {
            pathElement.style.fill = 'var(--country-fill)';
            pathElement.style.opacity = '0.1';
          }
          pathElement.style.strokeWidth = '0.5';
        }
      }, 100);
    }
  }, []);

  const setupEventListeners = useCallback(() => {
    const svgContainer = containerRef.current?.querySelector(`.${styles.svgContainer}`);
    if (!svgContainer || processedSvgRef.current) return;

    const handleMouseEnter = (event: Event) => {
      if (!(event instanceof MouseEvent)) return;
      const path = event.target as Element;
      const countryName = path.getAttribute('data-country-name');
      handleCountryHover(event, countryName, path);
    };

    const handleMouseLeave = (event: Event) => {
      if (!(event instanceof MouseEvent)) return;
      const path = event.target as Element;
      const countryName = path.getAttribute('data-country-name');
      handleCountryHover(event, null, path);
    };

    const handleMouseMove = (event: Event) => {
      if (!(event instanceof MouseEvent)) return;
      const path = event.target as Element;
      const countryName = path.getAttribute('data-country-name');
      if (countryName) {
        handleCountryHover(event, countryName, path);
      }
    };

    svgContainer.addEventListener('mouseover', handleMouseEnter);
    svgContainer.addEventListener('mouseout', handleMouseLeave);
    svgContainer.addEventListener('mousemove', handleMouseMove);

    eventListenersRef.current.set(svgContainer, {
      mouseenter: handleMouseEnter,
      mouseleave: handleMouseLeave,
      mousemove: handleMouseMove,
    });

    updateCountryStates();
    processedSvgRef.current = true;
  }, [handleCountryHover, updateCountryStates]);

  // Load SVG once on mount
  useEffect(() => {
    const loadSvg = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/world-map.svg');
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
        }
        
        let content = await response.text();
        
        content = content
          .replace(/<\?xml[^>]*>/g, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .trim();
        
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(content, 'image/svg+xml');
        
        if (svgDoc.querySelector('parsererror')) {
          throw new Error('Failed to parse SVG content');
        }
        
        const svg = svgDoc.querySelector('svg');
        if (!svg) {
          throw new Error('No SVG element found');
        }
        
        // Process all paths in the SVG
        const paths = svg.querySelectorAll('path');
        paths.forEach((path) => {
          let countryName = path.getAttribute('name') || 
                          path.getAttribute('id') || 
                          path.getAttribute('data-name') ||
                          path.getAttribute('title');

          if (!countryName) {
            const className = path.getAttribute('class');
            if (className) {
              countryName = className.split(' ')
                .filter(c => c !== 'land' && c !== 'country')
                .map(c => c.toUpperCase())
                .join(' ');
            }
          }

          if (countryName) {
            const standardizedName = getStandardizedCountryName(countryName);
            path.setAttribute('data-country-name', standardizedName);
            path.setAttribute('data-collected', 'false');
            // Set initial styles
            path.style.fill = 'var(--country-fill)';
            path.style.stroke = 'var(--country-stroke)';
            path.style.strokeWidth = '0.5';
            path.style.cursor = 'pointer';
            path.style.opacity = '0.1';
            path.style.transition = 'opacity 0.3s ease-in-out, fill 0.3s ease-in-out, stroke-width 0.3s ease-in-out';
          }
        });
        
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.display = 'block';
        svg.style.maxWidth = '100%';
        svg.style.maxHeight = '100%';
        
        setSvgContent(svg.outerHTML);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading SVG:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    loadSvg();
  }, [getStandardizedCountryName]);

  // Setup event listeners after SVG is loaded
  useEffect(() => {
    if (svgContent && !isLoading) {
      processedSvgRef.current = false;
      setupEventListeners();
    }
  }, [svgContent, isLoading, setupEventListeners]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      if (eventListenersRef.current) {
        eventListenersRef.current.forEach((listeners, element) => {
          if (listeners.mouseenter) element.removeEventListener('mouseenter', listeners.mouseenter, true);
          if (listeners.mouseleave) element.removeEventListener('mouseleave', listeners.mouseleave, true);
          if (listeners.mousemove) element.removeEventListener('mousemove', listeners.mousemove, true);
        });
        eventListenersRef.current.clear();
      }
    };
  }, []);

  if (error) {
    return (
      <div className={styles.mapContainer}>
        <div className={styles.mapError}>{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.mapContainer}>
        <div className={styles.mapLoading}>Loading world map...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.mapContainer}>
      <div
        className={styles.svgContainer}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      {isTooltipVisible && (
        <div
          className={styles.tooltip}
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -120%)',
            pointerEvents: 'none'
          }}
        >
          <div className={styles.tooltipContent}>
            {tooltipContent}
          </div>
        </div>
      )}
    </div>
  );
} 