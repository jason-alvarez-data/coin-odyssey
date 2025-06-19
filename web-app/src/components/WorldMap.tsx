"use client";

import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import styles from './WorldMap.module.css';
import { getStandardizedCountryName } from '@/utils/countryMappings';

interface WorldMapProps {
  collectedCountries: { [key: string]: number };
}

export default function WorldMap({ collectedCountries }: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const processedSvgRef = useRef<boolean>(false);
  const eventListenersRef = useRef<Map<Element, any>>(new Map());
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stable SVG content that never changes once set
  const stableSvgContent = useRef<string>('');
  
  // Tooltip refs to avoid state changes that cause re-renders
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipContentRef = useRef<string>('');
  const isTooltipVisibleRef = useRef<boolean>(false);

  const applyCountryHighlights = useCallback(() => {
    console.log('🎯 Applying country highlights with data:', collectedCountries);
    const svgContainer = containerRef.current?.querySelector(`.${styles.svgContainer}`);
    if (!svgContainer) {
      console.log('❌ No SVG container found');
      return;
    }

    const svg = svgContainer.querySelector('svg');
    if (!svg) {
      console.log('❌ No SVG found');
      return;
    }

    const paths = svg.querySelectorAll('path');
    console.log('📊 Found', paths.length, 'paths in SVG');
    
    let highlightedCount = 0;
    
    paths.forEach((path) => {
      const countryName = path.getAttribute('data-country-name');
      if (countryName) {
        // Try to match this SVG country with collected countries
        let isCollected = false;
        let matchedValue = 0;
        
        // First try exact match
        if (collectedCountries[countryName]) {
          matchedValue = collectedCountries[countryName];
          isCollected = Number(matchedValue) > 0;
        }
        
        // If no exact match, try case-insensitive match
        if (!isCollected) {
          const lowerSvgName = countryName.toLowerCase();
          const matchedEntry = Object.entries(collectedCountries).find(
            ([key]) => key.toLowerCase() === lowerSvgName
          );
          if (matchedEntry) {
            matchedValue = matchedEntry[1];
            isCollected = Number(matchedValue) > 0;
          }
        }
        
        // If still no match, try partial matching for regions like "CANARY ISLANDS (SPAIN)"
        if (!isCollected && countryName.includes('(') && countryName.includes(')')) {
          const parentCountry = countryName.match(/\(([^)]+)\)/)?.[1];
          if (parentCountry) {
            const matchedEntry = Object.entries(collectedCountries).find(
              ([key]) => key.toLowerCase() === parentCountry.toLowerCase()
            );
            if (matchedEntry) {
              matchedValue = matchedEntry[1];
              isCollected = Number(matchedValue) > 0;
            }
          }
        }
        
        if (isCollected) {
          console.log('Highlighting country:', countryName, 'with', matchedValue, 'coins');
          highlightedCount++;
        }
        
        const pathElement = path as SVGPathElement;
        
        // Apply permanent styles based on collection status
        if (isCollected) {
          // Collected countries - permanent blue highlighting
          pathElement.style.fill = '#3b82f6';
          pathElement.style.opacity = '1';
        } else {
          // Uncollected countries - light gray
          pathElement.style.fill = '#ffffff';
          pathElement.style.opacity = '0.1';
        }
        
        // Base styles for all countries
        pathElement.style.stroke = '#404040';
        pathElement.style.strokeWidth = '0.5';
        pathElement.style.cursor = 'pointer';
        
        // Set data attributes for tooltips
        path.setAttribute('data-collected', isCollected ? 'true' : 'false');
        path.setAttribute('data-coin-count', matchedValue.toString());
      }
    });
    
    console.log('📊 Highlighted', highlightedCount, 'countries out of', paths.length, 'total paths');
  }, [collectedCountries]);

  const showTooltip = useCallback((content: string, x: number, y: number) => {
    if (tooltipRef.current) {
      tooltipContentRef.current = content;
      tooltipRef.current.textContent = content;
      tooltipRef.current.style.left = `${x}px`;
      tooltipRef.current.style.top = `${y}px`;
      tooltipRef.current.style.transform = 'translate(-50%, -120%)';
      tooltipRef.current.style.display = 'block';
      isTooltipVisibleRef.current = true;
    }
  }, []);

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
      isTooltipVisibleRef.current = false;
    }
  }, []);

  const handleCountryEnter = useCallback((event: MouseEvent, country: string, path: Element) => {
    console.log('Country enter:', country);
    
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    const coinCount = path.getAttribute('data-coin-count') || '0';
    const content = `${country}: ${coinCount} coins`;
    
    const x = event.clientX;
    const y = event.clientY;
    
    showTooltip(content, x, y);
  }, [showTooltip]);

  const handleCountryLeave = useCallback((path: Element) => {
    console.log('Country leave');
    tooltipTimeoutRef.current = setTimeout(() => {
      hideTooltip();
    }, 100);
  }, [hideTooltip]);

  const setupEventListeners = useCallback(() => {
    console.log('Setting up event listeners');
    const svgContainer = containerRef.current?.querySelector(`.${styles.svgContainer}`);
    if (!svgContainer) {
      console.log('Cannot set up listeners - no container found');
      return;
    }

    const handleMouseEnter = (event: Event) => {
      if (!(event instanceof MouseEvent)) return;
      const path = event.target as Element;
      const countryName = path.getAttribute('data-country-name');
      if (countryName) {
        handleCountryEnter(event, countryName, path);
      }
    };

    const handleMouseLeave = (event: Event) => {
      if (!(event instanceof MouseEvent)) return;
      const path = event.target as Element;
      const countryName = path.getAttribute('data-country-name');
      if (countryName) {
        handleCountryLeave(path);
      }
    };

    const handleMouseMove = (event: Event) => {
      if (!(event instanceof MouseEvent)) return;
      const path = event.target as Element;
      const countryName = path.getAttribute('data-country-name');
      if (countryName && isTooltipVisibleRef.current) {
        const coinCount = path.getAttribute('data-coin-count') || '0';
        const content = `${countryName}: ${coinCount} coins`;
        
        const x = event.clientX;
        const y = event.clientY;
        showTooltip(content, x, y);
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

    console.log('Event listeners attached to SVG container');
  }, [handleCountryEnter, handleCountryLeave]);

  // Load SVG once on mount
  useEffect(() => {
    const loadSvg = async () => {
      try {
        console.log('🔄 Loading SVG...');
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
          }
        });
        
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.display = 'block';
        svg.style.maxWidth = '100%';
        svg.style.maxHeight = '100%';
        
        console.log('✅ SVG loaded and processed, setting content...');
        const svgHtml = svg.outerHTML;
        setSvgContent(svgHtml);
        stableSvgContent.current = svgHtml; // Store stable version
        setIsLoading(false);
        console.log('✅ SVG content set in state');
      } catch (err) {
        console.error('Error loading SVG:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    if (!processedSvgRef.current) {
      loadSvg();
    }
  }, []);

  // Setup event listeners ONCE after SVG is loaded
  useEffect(() => {
    if (svgContent && !isLoading && !processedSvgRef.current) {
      console.log('🚀 Setting up event listeners');
      // Use a timeout to ensure DOM is ready
      setTimeout(() => {
        setupEventListeners();
        processedSvgRef.current = true;
        console.log('✅ Event listeners setup complete');
      }, 100);
    }
  }, [svgContent, isLoading]);

  // Apply highlights when data is available OR when SVG content changes (HMR rebuilds)
  useEffect(() => {
    if (svgContent && !isLoading && Object.keys(collectedCountries).length > 0) {
      console.log('🎯 Applying highlights for', Object.keys(collectedCountries).length, 'countries');
      // Use a timeout to ensure DOM is ready
      setTimeout(() => {
        applyCountryHighlights();
        console.log('✅ Highlights applied');
      }, 150); // Slightly longer delay to ensure event listeners are set up first
    }
  }, [svgContent, isLoading, collectedCountries]);

  // Re-apply highlights when HMR updates (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && svgContent && Object.keys(collectedCountries).length > 0) {
      const intervalId = setInterval(() => {
        const svgContainer = containerRef.current?.querySelector(`.${styles.svgContainer}`);
        if (svgContainer) {
          const svg = svgContainer.querySelector('svg');
          if (svg) {
            const paths = svg.querySelectorAll('path');
            // Check if highlighting is lost (first path should have data-country-name but no custom styles)
            const firstPath = paths[0] as SVGPathElement;
            if (firstPath && firstPath.getAttribute('data-country-name') && !firstPath.style.fill) {
              console.log('🔄 HMR detected, re-applying highlights...');
              applyCountryHighlights();
            }
          }
        }
      }, 1000); // Check every second in development

      return () => clearInterval(intervalId);
    }
  }, [svgContent, collectedCountries, applyCountryHighlights]);

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
        dangerouslySetInnerHTML={{ __html: stableSvgContent.current || svgContent }}
      />
      <div
        ref={tooltipRef}
        className={styles.tooltip}
        style={{
          position: 'fixed',
          display: 'none',
          pointerEvents: 'none',
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap'
        }}
      />
    </div>
  );
} 