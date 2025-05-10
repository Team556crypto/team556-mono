import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';

const chartStyleId = 'dexscreener-chart-styles';
const chartStyles = `
  #dexscreener-embed {
    position: relative;
    width: 100%;
    padding-bottom: 125%; /* Default aspect ratio */
  }
  @media(min-width: 1400px) {
    #dexscreener-embed {
      padding-bottom: 65%; /* Aspect ratio for wider screens */
    }
  }
  #dexscreener-embed iframe {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border: 0;
  }
`;

const DexScreenerChart: React.FC = () => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const existingStyleElement = document.getElementById(chartStyleId);
      if (!existingStyleElement) {
        const styleElement = document.createElement('style');
        styleElement.id = chartStyleId;
        styleElement.innerHTML = chartStyles;
        document.head.appendChild(styleElement);
      }

      // It's good practice to clean up styles if the component can unmount
      // and this style is specific only to this instance or could conflict.
      // For this use case, leaving it might be fine if the chart is always the same.
      return () => {
        const styleElementToRemove = document.getElementById(chartStyleId);
        // Only remove if you are sure no other instances of this chart need these styles.
        // If multiple charts could be on a page, manage styles more carefully or make them less global.
        // For a single, specific chart like this, removal on unmount is robust.
        if (styleElementToRemove && styleElementToRemove.innerHTML === chartStyles) {
         // document.head.removeChild(styleElementToRemove); // Uncomment if cleanup is strictly needed
        }
      };
    }
  }, []);

  if (Platform.OS !== 'web') {
    return null; // Don't render anything on non-web platforms
  }

  return (
    <View
      // The nativeID prop translates to an 'id' attribute on the web.
      // This allows the CSS in the <style> tag to target this View.
      // @ts-ignore: nativeID is not in standard ViewProps but works in react-native-web
      nativeID="dexscreener-embed"
      style={{ marginTop: 16, marginBottom: 16 }} // Add some margin for spacing
    >
      <iframe
        src="https://dexscreener.com/solana/CjatczypBXKbwV2XnPznMfh4qCSToUQpZmjqCnUkTZSL?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTimeframesToolbar=0&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          borderWidth: 0, // In React Native style, border: 0 becomes borderWidth: 0
        }}
      />
    </View>
  );
};

export default DexScreenerChart;
