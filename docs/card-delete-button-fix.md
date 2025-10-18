# Card Delete Button Fix

## Issue
The delete button (trash can icon) on Firearm and Ammo cards was visible but non-functional on web. Clicking the icon did nothing.

## Root Cause
The delete button (`TouchableOpacity`) was placed **inside** the card's main `Pressable` component. The parent Pressable was intercepting all touch/click events before they could reach the delete button's `onPress` handler.

### Event Capture Hierarchy (Before Fix)
```
View (card container)
└── Pressable (onPress for card details)
    └── LinearGradient
        ├── Image/Content
        └── TouchableOpacity (onDelete) ← TRAPPED INSIDE!
```

On web, React Native's Pressable captures mouse events at the parent level, preventing nested touch handlers from firing properly.

## Solution
Move the delete button **outside** the Pressable so it's a sibling element rather than a child.

### New Hierarchy (After Fix)
```
View (card container)
├── Pressable (onPress for card details)
│   └── LinearGradient
│       └── Image/Content
└── TouchableOpacity (onDelete) ← NOW AT SIBLING LEVEL!
```

## Code Changes

**File**: `packages/ui/src/Card.tsx`

**Before**:
```tsx
<View style={[styles.card, containerStyle]}>
  <Pressable onPress={onPress}>
    <LinearGradient>
      {/* content */}
      {onDelete && (
        <TouchableOpacity onPress={onDelete}>
          <MaterialCommunityIcons name="trash-can-outline" />
        </TouchableOpacity>
      )}
    </LinearGradient>
  </Pressable>
</View>
```

**After**:
```tsx
<View style={[styles.card, containerStyle]}>
  <Pressable onPress={onPress}>
    <LinearGradient>
      {/* content */}
    </LinearGradient>
  </Pressable>
  {onDelete && (
    <TouchableOpacity 
      onPress={(e) => {
        e?.stopPropagation?.();
        onDelete();
      }}
    >
      <MaterialCommunityIcons name="trash-can-outline" />
    </TouchableOpacity>
  )}
</View>
```

## Key Points

1. **Absolute Positioning Maintained**: The delete button still uses `position: 'absolute'` with `top: 8, right: 8`, so it visually appears in the same location (top-right corner)

2. **Z-Index Preserved**: `zIndex: 999` and `elevation: 5` ensure the button stays on top of other content

3. **StopPropagation Added**: Extra safety measure to prevent event bubbling (though unnecessary with sibling placement)

4. **Works on Web and Native**: This fix resolves the web-specific issue while maintaining native functionality

## Testing
- ✅ Delete button visible on cards
- ✅ Clicking delete button triggers confirmation alert
- ✅ Card onPress still works (clicking card content opens details)
- ✅ Works on web browsers
- ✅ Works on native iOS/Android

## Affected Components
- `FirearmCard` → Uses shared `Card` component
- `AmmoCard` → Uses shared `Card` component  
- `GearCard` → Uses shared `Card` component
- Any other card components using `packages/ui/src/Card.tsx`

## Related Files
- `packages/ui/src/Card.tsx` - Shared card component (FIXED)
- `apps/wallet/components/armory/cards/FirearmCard.tsx` - Passes onDelete prop
- `apps/wallet/components/armory/cards/AmmoCard.tsx` - Passes onDelete prop
- `apps/wallet/components/armory/views/FirearmsView.tsx` - Handles delete logic
- `apps/wallet/components/armory/views/AmmoView.tsx` - Handles delete logic

---

**Status**: ✅ RESOLVED  
**Date**: 2024-10-18  
**Impact**: All card delete buttons now functional across web and native platforms
