# Coin Odyssey Deployment Guide

## Prerequisites

### 1. Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure Project
```bash
cd mobile-app
eas build:configure
```

## Build Process

### 1. Development Build (Testing)
```bash
# iOS Development Build
eas build --profile development --platform ios

# Android Development Build  
eas build --profile development --platform android
```

### 2. Preview Build (Internal Testing)
```bash
# iOS Preview Build
eas build --profile preview --platform ios

# Android Preview Build
eas build --profile preview --platform android
```

### 3. Production Build (App Store)
```bash
# iOS Production Build
eas build --profile production --platform ios

# Android Production Build (APK for testing)
eas build --profile production --platform android

# Android Production Build (AAB for Play Store)
eas build --profile production-aab --platform android
```

## App Store Connect Setup (iOS)

### 1. Create App Record
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "Apps" → "+" → "New App"
3. Fill in app information:
   - **Name**: Coin Odyssey
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: com.coinodyssey.mobile
   - **SKU**: coin-odyssey-mobile-001
   - **User Access**: Full Access

### 2. App Information
- **Name**: Coin Odyssey
- **Subtitle**: Professional coin collection management
- **Category**: Lifestyle
- **Secondary Category**: Utilities
- **Content Rights**: No, it does not contain, show, or access third-party content

### 3. Pricing and Availability
- **Price**: Free
- **Availability**: All countries/regions
- **App Distribution**: App Store Connect

### 4. App Privacy
Upload the privacy policy you created and answer privacy questions:
- **Does this app collect data?**: Yes
- **Contact Info**: Email addresses
- **User Content**: Photos, Other User Content
- **Usage Data**: Product Interaction, Crash Data, Performance Data

### 5. Upload Build
```bash
# After production build completes
eas submit --platform ios
```

## Google Play Console Setup (Android)

### 1. Create App
1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in app details:
   - **App name**: Coin Odyssey
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free

### 2. App Content
- **Content rating**: Everyone
- **Target audience**: 13+
- **App category**: Lifestyle
- **Tags**: Education, Tools

### 3. Store Listing
Use the content from `app-store-description.md`:
- **Short description**: First paragraph of description
- **Full description**: Complete app store description
- **App icon**: 512x512 PNG
- **Screenshots**: Follow the screenshot guide

### 4. Upload Build
```bash
# Upload AAB file to Play Console
eas submit --platform android
```

## Environment Variables

### Production Environment
Create a `.env.production` file:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_production_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
EXPO_PUBLIC_PCGS_API_KEY=your_pcgs_api_key
EXPO_PUBLIC_ENVIRONMENT=production
```

### Build Secrets
Set up secrets in EAS:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your_url
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your_key
eas secret:create --scope project --name EXPO_PUBLIC_PCGS_API_KEY --value your_pcgs_key
```

## Pre-Submission Checklist

### Technical Requirements
- [ ] App builds successfully for both iOS and Android
- [ ] All features work offline when possible
- [ ] Camera permissions are properly requested
- [ ] Location permissions are optional and properly explained
- [ ] App handles network errors gracefully
- [ ] No debug code or console.log statements in production
- [ ] App icon and splash screen are properly configured

### Content Requirements
- [ ] App description is compelling and accurate
- [ ] Screenshots showcase key features
- [ ] Privacy policy is complete and accessible
- [ ] Terms of service are included (if needed)
- [ ] Age rating is appropriate
- [ ] Keywords are relevant and not misleading

### Testing Requirements
- [ ] Test on multiple device sizes
- [ ] Test core workflows (signup, add coin, view collection)
- [ ] Test camera functionality
- [ ] Test offline capabilities
- [ ] Test app store IAP flows (if applicable)
- [ ] Performance testing on older devices

## Common Issues and Solutions

### Build Failures
```bash
# Clear cache if build fails
eas build:clear-cache

# Check build logs
eas build:list
```

### Asset Issues
- Ensure all required assets are in correct sizes
- Check that icon meets platform requirements
- Verify splash screen dimensions

### Permission Issues
- Review iOS Info.plist usage descriptions
- Check Android permissions in app.json
- Test permission flows on device

## Post-Launch Monitoring

### Analytics Setup
```typescript
// Add to your app after launch
import { Analytics } from 'expo-analytics';

const analytics = new Analytics('your-analytics-id');
analytics.track('app_opened');
```

### Crash Reporting
```bash
# Install Sentry for crash reporting
npx expo install @sentry/react-native
```

### Performance Monitoring
```typescript
// Monitor app performance
import { PerformanceMonitor } from './src/services/performance';

PerformanceMonitor.startMonitoring();
```

## Update Process

### Over-the-Air Updates
```bash
# Publish OTA update
eas update --branch production

# Publish to specific channels
eas update --branch production --message "Bug fixes and improvements"
```

### App Store Updates
1. Increment version in app.json
2. Build new version: `eas build --profile production`
3. Submit to stores: `eas submit`
4. Update release notes

## Support and Maintenance

### User Feedback
- Monitor app store reviews
- Set up in-app feedback mechanism
- Track support tickets and common issues

### Regular Updates
- Monthly bug fixes and improvements
- Quarterly feature updates
- Annual major version releases

---

**Next Steps:**
1. Set up developer accounts
2. Take screenshots following the guide
3. Build production versions
4. Submit for review
5. Monitor for approval and feedback