// Layout constants for consistent responsive behavior across the app

export const SIDEBAR_BREAKPOINT = 768; // Width threshold for showing sidebar vs bottom tabs
export const SIDEBAR_WIDTH = 220; // Width of the sidebar in pixels

// Utility function to determine if sidebar should be visible
export const useSidebarVisible = (width: number): boolean => {
  return width >= SIDEBAR_BREAKPOINT;
};

// Calculate left margin for main content when sidebar is visible
export const calculateSidebarMargin = (width: number): number => {
  return useSidebarVisible(width) ? SIDEBAR_WIDTH : 0;
};