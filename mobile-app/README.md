# Coin Odyssey Mobile App

A premium React Native mobile application for coin collection management, built with Expo and TypeScript.

## Features

- **Premium Dark Theme**: Glassmorphism effects with gold accents
- **Authentication**: Secure login with Supabase
- **Collection Management**: Add, edit, and organize your coin collection
- **Camera Integration**: Photograph coins directly in the app
- **Analytics Dashboard**: Track collection value and performance
- **Offline Support**: Continue using the app without internet
- **Real-time Sync**: Automatic synchronization with cloud backend

## Tech Stack

- **React Native + Expo**: Cross-platform mobile development
- **TypeScript**: Type-safe development
- **Supabase**: Backend-as-a-Service for authentication and database
- **Expo Camera**: Professional coin photography
- **React Navigation**: Premium navigation experience
- **Expo Blur**: Glassmorphism effects
- **React Native Reanimated**: Smooth animations

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mobile-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. Start the development server:
   ```bash
   npm run start
   ```

### Running on Device/Simulator

- **iOS**: `npm run ios` (requires macOS)
- **Android**: `npm run android`
- **Web**: `npm run web`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Basic UI components (Button, Card, Input)
│   ├── collection/     # Collection-specific components
│   ├── dashboard/      # Dashboard widgets
│   └── camera/         # Camera components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── services/          # API and external services
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── styles/            # Design system and styling
```

## Design System

The app implements a premium design system with:

- **Colors**: Dark theme with gold accents (#FFD700)
- **Effects**: Glassmorphism cards with blur effects
- **Typography**: Consistent font scaling and weights
- **Spacing**: Standardized spacing system
- **Animations**: Smooth micro-interactions

## Development Commands

- `npm run start` - Start development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

## Environment Variables

Create a `.env` file with the following variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Follow the existing code style and conventions
2. Use TypeScript for all new code
3. Implement proper error handling
4. Add appropriate comments for complex logic
5. Test on both iOS and Android platforms

## License

This project is part of the Coin Odyssey application suite.