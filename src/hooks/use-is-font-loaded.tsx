"use client";

import { useState, useEffect } from 'react';

export const useIsFontLoaded = (fontFamily: string): boolean => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const loadFont = async () => {
      try {
        // Ensure document is available before accessing it
        if (typeof document !== 'undefined') {
          // Use font face observer to check if font is loaded.
          const font = new FontFace(fontFamily, `url('/fonts/${fontFamily}-Regular.ttf')`); // Replace with your font URL if needed
          await font.load();
          (document as any).fonts.add(font);

          // Check if font is loaded immediately after adding.
          setIsLoaded((document as any).fonts.check(`16px ${fontFamily}`));
        }
      } catch (error) {
        console.error('Error loading font:', error);
        setIsLoaded(false);
      }
    };

    loadFont();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fontFamily]);

  return isLoaded;
};

