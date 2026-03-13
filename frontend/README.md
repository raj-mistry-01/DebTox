# Economia

A modern, comprehensive expense tracking and group-splitting application built with **React Native** and **Expo**. It allows users to smartly manage their shared expenses, track personal balances, settle debts with friends, and navigate a responsive UI with ease.

## Project Structure

Below is a high-level overview of the project's folder structure and file architecture, excluding standard build/IDE files (like `node_modules`, `.expo`, and `.git`).

```text
Economia/
├── app/                  # Main application routing & screens (Expo Router)
│   ├── (tabs)/           # Tab navigation screens
│   │   ├── _layout.tsx   # Tab bar layout
│   │   ├── account.tsx   # User account and settings
│   │   ├── activity.tsx  # Global activity feed
│   │   ├── friends.tsx   # Friends list & management
│   │   └── groups.tsx    # Groups list & management
│   ├── expenses/         # Flow for creating and viewing expenses
│   │   ├── new.tsx       # Add new expense screen (Amount, Split Options, Currencies)
│   │   └── [expenseId].tsx # Expense detail screen
│   ├── friends/          
│   │   └── [friendId].tsx# Friend details & active shared tabs
│   ├── groups/           
│   │   ├── new.tsx       # Create new group screen
│   │   └── [groupId].tsx # Group transaction history and details
│   ├── settle/           
│   │   └── [userId].tsx  # Settle up debt flow
│   ├── index.tsx         # App entry point (startup logic & redirect)
│   ├── login.tsx         # User authentication login
│   ├── register.tsx      # User authentication registration
│   ├── modal.tsx         # Reusable global modal view
│   └── _layout.tsx       # Root layout file (Providers & navigation wrappers)
│
├── components/           # Reusable UI components & Layout wrappers
│   ├── ui/               # Foundational design components (Icons, Collapsibles)
│   ├── external-link.tsx # Component for opening links externally
│   ├── haptic-tab.tsx    # Tab button with tactile feedback
│   ├── parallax-scroll-view.tsx # ScrollView with parallax header
│   ├── themed-text.tsx   # Theme-aware text element
│   └── themed-view.tsx   # Theme-aware view container
│
├── constants/            # Project-wide constants
│   └── theme.ts          # Styling tokens, colors, and layout metrics
│
├── context/              # React Context Providers for global state
│   └── AuthContext.tsx   # Tracks active user session & authentication state
│
├── data/                 # Local data layer
│   └── mockData.ts       # Stubbed data (Groups, Users, Activities) for testing UI
│
├── hooks/                # Custom React Hooks
│   ├── use-color-scheme.ts  # Native device theme checking
│   └── use-theme-color.ts   # Dynamic context-based styling hook
│
├── scripts/              # Helper utilities script
│   └── reset-project.js  # Clean startup script for Expo
│
├── types/                # TypeScript type declarations & schemas
│   └── index.ts          # Shared TS interfaces (User, Group, Friend, Expense, Activity)
│
├── app.json              # Expo manifest (app configurations, name, permissions)
├── package.json          # Node dependencies & automation scripts
└── tsconfig.json         # TypeScript configuration rules
```

## Running the Project Locally

This is an [Expo](https://expo.dev) project.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npx expo start
   ```

You can view the app on your physical device using the **Expo Go** app, or run it on an iOS/Android emulator locally.
