# Team556 UI Components

A shared UI components library for Team556 applications.

## Installation

```bash
npm install @team556/ui
```

## Usage

### Theme Configuration

The UI components now support automatic theme inheritance from the app without explicit prop passing. To set up theming in your app:

1. Import the `setAppTheme` function from the UI package:

```tsx
import { setAppTheme } from '@team556/ui'
import { Colors } from '@/constants/Colors'

// Call this once at the app's entry point
setAppTheme(Colors)
```

2. Use the components without passing colors props:

```tsx
// Before
<Text colors={Colors} preset="h1">Hello World</Text>

// Now (no explicit colors prop needed)
<Text preset="h1">Hello World</Text>
```

### Available Components

- **Text**: Typography component with preset styles
- **Button**: Customizable button with various styles
- **Input**: Text input component with label and error handling
- **Toggle**: Switch component for boolean values
- **Drawer**: Bottom drawer with gesture support
- **StepForm**: Multi-step form for guided processes

### Component Props

Each component still accepts an optional `colors` prop to override the theme for specific instances if needed.

## Color Theme Structure

The theme system uses the following color structure:

```ts
export type ThemeColors = {
  error: string
  success: string
  text: string
  background: string
  backgroundDark: string
  tint: string
  icon: string
  tabIconDefault: string
  tabIconSelected: string
}
```

## Customizing Colors

To customize colors for a specific component, you can still pass a `colors` prop:

```tsx
<Button title='Custom Button' colors={{ tint: '#FF0000' }} />
```

This will override just the tint color for this specific button instance, while using the global theme for other colors.
