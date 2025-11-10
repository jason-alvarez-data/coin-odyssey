# Accessibility Guide

This guide documents accessibility features and best practices implemented in the Coin Odyssey mobile app.

## Overview

The app follows WCAG 2.1 Level AA guidelines and React Native accessibility best practices to ensure the app is usable by people with disabilities.

## Implemented Features

### 1. Screen Reader Support

All interactive elements include:
- **accessibilityLabel**: Descriptive text for screen readers
- **accessibilityRole**: Semantic role (button, text, image, etc.)
- **accessibilityHint**: Additional context about what will happen
- **accessibilityState**: Current state (disabled, selected, etc.)

### 2. Touch Target Sizes

All interactive elements meet minimum touch target sizes:
- Buttons: Minimum 44x44 points
- Touch areas: Properly sized for easy interaction
- Spacing: Adequate spacing between interactive elements

### 3. Color Contrast

- Text on dark backgrounds meets WCAG AA standards
- Gold accent color (#FFD700) provides sufficient contrast
- Important information not conveyed by color alone

### 4. Focus Management

- Logical tab order for navigation
- Focus indicators visible
- Modal dialogs trap focus appropriately

## Component Accessibility

### Photo Section
```typescript
<TouchableOpacity
  accessibilityLabel="Take photo of coin obverse"
  accessibilityRole="button"
  accessibilityHint="Opens camera to photograph the front of the coin"
>
```

### Stats Grid
```typescript
<BlurView
  accessible={true}
  accessibilityLabel={`${stat.label}: ${stat.value}`}
  accessibilityRole="summary"
>
```

### Quick Actions
```typescript
<TouchableOpacity
  accessibilityLabel={action.label}
  accessibilityRole="button"
  accessibilityHint={`Navigate to ${action.label}`}
>
```

### Input Fields
```typescript
<Input
  accessibilityLabel="Coin name input"
  accessibilityHint="Enter the specific name of the coin"
/>
```

## Testing Accessibility

### iOS VoiceOver
1. Enable: Settings > Accessibility > VoiceOver
2. Navigate with single-finger swipe
3. Double-tap to activate
4. Test all major user flows

### Android TalkBack
1. Enable: Settings > Accessibility > TalkBack
2. Navigate with swipe gestures
3. Double-tap to activate
4. Test all major user flows

### Manual Checks
- [ ] All images have meaningful labels
- [ ] All buttons describe their action
- [ ] Form inputs have labels and hints
- [ ] Error messages are announced
- [ ] Loading states are announced
- [ ] Success confirmations are announced

## Best Practices

### DO:
✅ Provide descriptive labels for all interactive elements
✅ Use semantic roles (button, text, header, etc.)
✅ Provide hints for complex actions
✅ Announce dynamic content changes
✅ Support device text scaling
✅ Ensure minimum touch targets (44x44)
✅ Test with real screen readers

### DON'T:
❌ Use vague labels like "Click here" or "Button"
❌ Rely solely on color to convey information
❌ Create touch targets smaller than 44x44
❌ Ignore focus management in modals
❌ Use images without alt text
❌ Disable accessibility features
❌ Create keyboard traps

## Common Patterns

### Buttons
```typescript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Add new coin"
  accessibilityRole="button"
  accessibilityHint="Opens the form to add a coin to your collection"
  onPress={handleAddCoin}
>
  <Text>Add Coin</Text>
</TouchableOpacity>
```

### Images
```typescript
<Image
  source={coinImage}
  accessible={true}
  accessibilityLabel="2022 American Women Quarter featuring Sally Ride"
  accessibilityRole="image"
/>
```

### Lists
```typescript
<FlatList
  data={coins}
  accessible={false} // Let items handle their own accessibility
  renderItem={({ item }) => (
    <CoinCard
      coin={item}
      accessible={true}
      accessibilityLabel={`${item.year} ${item.denomination}, ${item.grade}`}
      accessibilityRole="button"
    />
  )}
/>
```

### Form Fields
```typescript
<Input
  label="Coin Name"
  value={name}
  onChangeText={setName}
  accessibilityLabel="Coin name"
  accessibilityHint="Enter the name of the coin, like Morgan Dollar"
  accessibilityRequired={true}
/>
```

### Loading States
```typescript
{loading && (
  <ActivityIndicator
    accessible={true}
    accessibilityLabel="Loading your collection"
    accessibilityRole="progressbar"
  />
)}
```

### Error Messages
```typescript
{error && (
  <Text
    accessible={true}
    accessibilityRole="alert"
    accessibilityLiveRegion="polite"
  >
    {error.message}
  </Text>
)}
```

## Keyboard Navigation

### Focus Order
1. Primary actions first
2. Secondary actions second
3. Tertiary/cancel actions last
4. Logical reading order (top to bottom, left to right)

### Shortcuts
- Tab: Move to next focusable element
- Shift+Tab: Move to previous focusable element
- Enter/Space: Activate focused element
- Escape: Close modals/dismiss

## Dynamic Content

### Announcements
```typescript
import { AccessibilityInfo } from 'react-native';

// Announce important changes
AccessibilityInfo.announceForAccessibility(
  'Coin successfully added to your collection'
);
```

### Live Regions
```typescript
<Text
  accessibilityLiveRegion="polite" // or "assertive" for urgent updates
  accessibilityRole="status"
>
  {statusMessage}
</Text>
```

## Resources

- [React Native Accessibility API](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Accessibility](https://developer.apple.com/accessibility/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)

## Testing Checklist

- [ ] All screens tested with VoiceOver (iOS)
- [ ] All screens tested with TalkBack (Android)
- [ ] All forms can be completed with screen reader
- [ ] All images have descriptive labels
- [ ] All buttons describe their action
- [ ] Navigation is logical and consistent
- [ ] Focus indicators are visible
- [ ] Dynamic content changes are announced
- [ ] Error states are accessible
- [ ] Loading states are accessible
- [ ] Success messages are announced
- [ ] Color contrast meets WCAG AA
- [ ] Text is readable at 200% zoom
- [ ] Touch targets meet minimum size

---

**Last Updated:** 2025-01-09
**Maintainer:** Development Team
