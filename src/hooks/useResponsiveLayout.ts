import { useWindowDimensions } from 'react-native';

/**
 * Custom Hook: useResponsiveLayout
 * Slide 26 - Week 5: Responsive Design & Custom Hooks
 * Handles dynamic grid column layout and card width calculations on device rotation
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  return {
    isLandscape: width > height,
    isTablet: width >= 768,
    columns: width >= 768 ? 3 : width >= 480 ? 2 : 1,
    cardWidth: width >= 768 ? (width - 48 - 24) / 3 : width - 32,
  };
}
