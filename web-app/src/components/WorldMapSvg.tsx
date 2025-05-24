import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './WorldMap.module.css';

interface WorldMapSvgProps {
  collectedCountries: {
    [key: string]: number;
  };
  onCountryHover: (country: string | null, event: React.MouseEvent) => void;
  onCountryClick: (country: string) => void;
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

// Global flag to prevent multiple loads across all component instances
let globalSvgContent = '';
let globalIsLoaded = false;

export const WorldMapSvg: React.FC<WorldMapSvgProps> = ({ 
  collectedCountries,
  onCountryHover,
  onCountryClick
}) => {
  const [isLoaded, setIsLoaded] = useState(globalIsLoaded);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>(globalSvgContent);
  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const eventListenersRef = useRef<Map<Element, any>>(new Map());

  const getStandardizedCountryName = useCallback((countryName: string): string => {
    return countryNameMapping[countryName] || countryName;
  }, []);

  const getCountryName = useCallback((path: SVGPathElement): string | null => {
    // Try different attributes to get country name
    let countryName = path.getAttribute('name') || 
                     path.getAttribute('id') || 
                     path.getAttribute('data-name') ||
                     path.getAttribute('title');
    
    // If name attribute is not available, try to get it from class
    if (!countryName) {
      const className = path.getAttribute('class');
      if (className) {
        countryName = className.split(' ')
          .filter(c => c !== 'land' && c !== 'country')
          .map(c => c.toUpperCase())
          .join(' ');
      }
    }
    
    return countryName;
  }, []);

  const setupEventListeners = useCallback(() => {
    if (!svgContainerRef.current) return;

    const svg = svgContainerRef.current.querySelector('svg');
    if (!svg) return;

    // Clear existing listeners
    eventListenersRef.current.forEach((listeners, element) => {
      if (listeners.mouseenter) element.removeEventListener('mouseenter', listeners.mouseenter);
      if (listeners.mouseleave) element.removeEventListener('mouseleave', listeners.mouseleave);
      if (listeners.click) element.removeEventListener('click', listeners.click);
    });
    eventListenersRef.current.clear();

    const paths = svg.querySelectorAll('path');

    paths.forEach(path => {
      const countryName = getCountryName(path);
      
      if (countryName) {
        const standardizedName = getStandardizedCountryName(countryName);
        const coinCount = collectedCountries[standardizedName] || 0;
        
        // Apply initial styling - IMPORTANT: Override SVG's default fill
        path.classList.add(styles.country);
        path.setAttribute('data-country', standardizedName);
        path.setAttribute('data-collected', String(coinCount > 0));
        path.style.cursor = 'pointer';
        
        // Force remove any existing fill attribute to let CSS take control
        path.removeAttribute('fill');
        
        // Create event listeners
        const handleMouseEnter = (e: MouseEvent) => {
          onCountryHover(standardizedName, e as any);
        };
        
        const handleMouseLeave = (e: MouseEvent) => {
          onCountryHover(null, e as any);
        };
        
        const handleClick = () => {
          onCountryClick(standardizedName);
        };
        
        // Add event listeners
        path.addEventListener('mouseenter', handleMouseEnter);
        path.addEventListener('mouseleave', handleMouseLeave);
        path.addEventListener('click', handleClick);
        
        // Store listeners for cleanup
        eventListenersRef.current.set(path, {
          mouseenter: handleMouseEnter,
          mouseleave: handleMouseLeave,
          click: handleClick
        });
      }
    });
  }, [collectedCountries, onCountryHover, onCountryClick, getCountryName, getStandardizedCountryName]);

  const loadSvg = useCallback(async () => {
    // If already loaded globally, use cached content
    if (globalIsLoaded && globalSvgContent) {
      setSvgContent(globalSvgContent);
      setIsLoaded(true);
      return;
    }

    try {
      console.log('Loading SVG...');
      
      const response = await fetch('/world-map.svg');
      console.log('Fetch response:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
      }
      
      let svgContent = await response.text();
      console.log('SVG content length:', svgContent.length);
      
      // Clean the SVG content by removing XML declaration and comments
      svgContent = svgContent
        .replace(/<\?xml[^>]*>/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim();
      
      // Parse the SVG to modify it
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      
      // Check for parsing errors
      const parserError = svgDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Failed to parse SVG content');
      }
      
      const svg = svgDoc.querySelector('svg');
      if (!svg) {
        throw new Error('No SVG element found in the content');
      }
      
      // Set proper SVG attributes for responsive sizing
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.style.display = 'block';
      svg.style.maxWidth = '100%';
      svg.style.maxHeight = '100%';
      svg.classList.add(styles.worldMap);
      
      // Remove the default fill attribute from the SVG to let CSS control it
      svg.removeAttribute('fill');
      
      // Get the processed SVG content
      const processedSvgContent = svg.outerHTML;
      console.log('Processed SVG content length:', processedSvgContent.length);
      
      // Cache globally
      globalSvgContent = processedSvgContent;
      globalIsLoaded = true;
      
      setSvgContent(processedSvgContent);
      setIsLoaded(true);
    } catch (err) {
      console.error('Error loading SVG:', err);
      setError(`Failed to load world map: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  // Load SVG on mount
  useEffect(() => {
    if (!isLoaded && !error) {
      loadSvg();
    }
  }, [loadSvg, isLoaded, error]);

  // Setup event listeners when SVG content is loaded
  useEffect(() => {
    if (isLoaded && svgContent) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        setupEventListeners();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, svgContent, setupEventListeners]);

  // Update country styling when collection data changes
  useEffect(() => {
    if (isLoaded && svgContainerRef.current) {
      const svg = svgContainerRef.current.querySelector('svg');
      if (svg) {
        const paths = svg.querySelectorAll('path');
        paths.forEach(path => {
          const countryName = path.getAttribute('data-country');
          if (countryName) {
            const coinCount = collectedCountries[countryName] || 0;
            path.setAttribute('data-collected', String(coinCount > 0));
          }
        });
      }
    }
  }, [collectedCountries, isLoaded]);

  // Cleanup function
  useEffect(() => {
    return () => {
      eventListenersRef.current.forEach((listeners, element) => {
        if (listeners.mouseenter) element.removeEventListener('mouseenter', listeners.mouseenter);
        if (listeners.mouseleave) element.removeEventListener('mouseleave', listeners.mouseleave);
        if (listeners.click) element.removeEventListener('click', listeners.click);
      });
      eventListenersRef.current.clear();
    };
  }, []);

  if (error) {
    return (
      <div className={styles.svgContainer}>
        <div className={styles.mapError}>
          {error}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={styles.svgContainer}>
        <div className={styles.mapLoading}>
          Loading world map...
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={svgContainerRef}
      className={styles.svgContainer}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default WorldMapSvg; 