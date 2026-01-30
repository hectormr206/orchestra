---
name: mobile
description: >
  Mobile development patterns for iOS, Android, React Native, Flutter.
  Offline-first, push notifications, app store guidelines, mobile security.
  Trigger: When building mobile apps or responsive mobile experiences.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Building mobile applications"
    - "Implementing offline functionality"
    - "Adding push notifications"
    - "Optimizing for mobile devices"
    - "Publishing to app stores"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Building native iOS/Android apps
- Developing with React Native or Flutter
- Implementing offline-first architecture
- Adding push notifications
- Optimizing mobile performance
- Preparing for app store submission
- Implementing mobile-specific security

---

## Critical Patterns

### > **ALWAYS**

1. **Design for offline-first**
   ```
   ┌─────────────────────────────────────────┐
   │ OFFLINE-FIRST ARCHITECTURE             │
   │                                         │
   │ 1. Local DB as source of truth          │
   │ 2. Queue operations when offline        │
   │ 3. Sync when connection restored        │
   │ 4. Handle conflicts gracefully          │
   │ 5. Show sync status to user             │
   └─────────────────────────────────────────┘
   ```

2. **Optimize for battery and data**
   - Batch network requests
   - Use compression (gzip, WebP images)
   - Implement smart caching
   - Reduce background operations

3. **Handle all network states**
   ```typescript
   type NetworkState =
     | 'online'           // Full connectivity
     | 'offline'          // No connection
     | 'slow'             // 2G/3G
     | 'metered';         // User on limited data

   // Adapt behavior based on state
   if (networkState === 'metered') {
     disableAutoSync();
     showDataUsageWarning();
   }
   ```

4. **Respect platform guidelines**
   - iOS: Human Interface Guidelines
   - Android: Material Design
   - Follow platform-specific UX patterns

5. **Implement proper deep linking**
   ```
   Universal Links (iOS) + App Links (Android)

   https://app.example.com/product/123
         ↓
   Opens in app → ProductScreen(id: 123)
         ↓
   Fallback to web if app not installed
   ```

6. **Secure local storage**
   - iOS: Keychain for secrets
   - Android: EncryptedSharedPreferences / Keystore
   - NEVER store secrets in plain text

### > **NEVER**

1. **Store sensitive data in plain text**
2. **Ignore memory management (leaks)**
3. **Block the main/UI thread**
4. **Skip testing on real devices**
5. **Ignore platform-specific behaviors**
6. **Hardcode API endpoints**
7. **Request unnecessary permissions**

---

## Mobile Architecture Patterns

### Clean Architecture for Mobile

```
┌─────────────────────────────────────────────┐
│              PRESENTATION                   │
│   (UI, ViewModels, State Management)        │
├─────────────────────────────────────────────┤
│                 DOMAIN                      │
│   (Use Cases, Entities, Repository Intf)   │
├─────────────────────────────────────────────┤
│                  DATA                       │
│   (Repository Impl, API, Local DB)          │
└─────────────────────────────────────────────┘
```

### State Management Comparison

| Framework | State Solution | When to Use |
|-----------|---------------|-------------|
| React Native | Redux/Zustand/Context | Complex state |
| React Native | React Query/SWR | Server state |
| Flutter | Riverpod/BLoC | Enterprise apps |
| Flutter | Provider | Simple apps |
| iOS (Swift) | SwiftUI + Combine | Modern iOS |
| Android (Kotlin) | ViewModel + Flow | Jetpack Compose |

---

## Offline-First Implementation

### Sync Queue Pattern

```typescript
// Queue operations when offline
interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

class SyncQueue {
  async enqueue(operation: SyncOperation) {
    await localDB.insert('sync_queue', operation);

    if (await isOnline()) {
      this.processQueue();
    }
  }

  async processQueue() {
    const operations = await localDB.query(
      'sync_queue',
      { orderBy: 'timestamp ASC' }
    );

    for (const op of operations) {
      try {
        await this.executeOperation(op);
        await localDB.delete('sync_queue', op.id);
      } catch (error) {
        if (op.retryCount < MAX_RETRIES) {
          await this.incrementRetry(op);
        } else {
          await this.moveToDeadLetter(op);
        }
      }
    }
  }
}
```

### Conflict Resolution Strategies

```
┌─────────────────────────────────────────────┐
│ CONFLICT RESOLUTION STRATEGIES              │
├─────────────────────────────────────────────┤
│ 1. Last-Write-Wins (LWW)                   │
│    → Simple, may lose data                  │
│                                             │
│ 2. First-Write-Wins                         │
│    → Preserves original                     │
│                                             │
│ 3. Merge                                    │
│    → Combine changes (complex)              │
│                                             │
│ 4. User Resolution                          │
│    → Ask user to choose                     │
│                                             │
│ 5. Server Authority                         │
│    → Server always wins                     │
└─────────────────────────────────────────────┘
```

---

## Push Notifications

### Best Practices

```
┌─────────────────────────────────────────────┐
│ PUSH NOTIFICATION RULES                     │
├─────────────────────────────────────────────┤
│ ✓ Ask permission at the right moment        │
│ ✓ Explain value before asking               │
│ ✓ Allow granular notification settings      │
│ ✓ Use silent pushes for data sync           │
│ ✓ Deep link to relevant content             │
│ ✓ Respect quiet hours                       │
│                                             │
│ ✗ Don't spam users                          │
│ ✗ Don't ask immediately on first launch     │
│ ✗ Don't send irrelevant notifications       │
└─────────────────────────────────────────────┘
```

### Implementation (React Native)

```typescript
// Request permission properly
async function requestNotificationPermission() {
  // Show explanation first
  const shouldAsk = await showPermissionExplanation();
  if (!shouldAsk) return false;

  const { status } = await Notifications.requestPermissionsAsync();

  if (status === 'granted') {
    const token = await Notifications.getExpoPushTokenAsync();
    await registerTokenWithServer(token);
    return true;
  }

  return false;
}

// Handle notification received
Notifications.addNotificationReceivedListener(notification => {
  // Update badge, show in-app banner, etc.
});

// Handle notification tapped
Notifications.addNotificationResponseReceivedListener(response => {
  const { data } = response.notification.request.content;
  navigateToContent(data.deepLink);
});
```

---

## Mobile Security

### Security Checklist

```
NETWORK SECURITY
□ Certificate pinning
□ TLS 1.2+ only
□ No sensitive data in URLs
□ Proper timeout handling

STORAGE SECURITY
□ Keychain/Keystore for secrets
□ Encrypted local database
□ No sensitive data in logs
□ Clear data on logout

CODE SECURITY
□ Obfuscation enabled
□ No hardcoded secrets
□ Root/jailbreak detection
□ Tampering detection

AUTHENTICATION
□ Biometric authentication
□ Secure session management
□ Token refresh mechanism
□ Proper logout (clear all tokens)
```

### Certificate Pinning (React Native)

```typescript
// Using SSL Pinning
import { fetch } from 'react-native-ssl-pinning';

const response = await fetch('https://api.example.com/data', {
  method: 'GET',
  sslPinning: {
    certs: ['cert1', 'cert2']  // SHA256 hashes
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Secure Storage

```typescript
// React Native - Secure storage
import * as SecureStore from 'expo-secure-store';

// Store sensitive data
await SecureStore.setItemAsync('authToken', token, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED
});

// Retrieve sensitive data
const token = await SecureStore.getItemAsync('authToken');

// Delete on logout
await SecureStore.deleteItemAsync('authToken');
```

---

## Performance Optimization

### Image Optimization

```typescript
// Use appropriate image sizes
<Image
  source={{ uri: imageUrl }}
  // Request size appropriate for device
  style={{ width: 100, height: 100 }}
  // Use WebP format
  resizeMode="cover"
  // Lazy load off-screen images
  loading="lazy"
/>

// Image caching
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: imageUrl,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable
  }}
/>
```

### List Performance

```typescript
// Use FlatList for long lists
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
  // Memoize render item
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index
  })}
/>

// Memoize list items
const MemoizedItem = React.memo(({ item }) => (
  <ItemComponent item={item} />
));
```

### Memory Management

```
┌─────────────────────────────────────────────┐
│ MEMORY MANAGEMENT RULES                     │
├─────────────────────────────────────────────┤
│ ✓ Cancel subscriptions on unmount           │
│ ✓ Clear timers/intervals                    │
│ ✓ Release image resources                   │
│ ✓ Use weak references where appropriate     │
│ ✓ Monitor memory usage in dev               │
│ ✓ Test on low-end devices                   │
└─────────────────────────────────────────────┘
```

---

## App Store Guidelines

### iOS App Store

| Requirement | Details |
|-------------|---------|
| **Privacy** | Privacy policy required, App Tracking Transparency |
| **Payments** | In-App Purchase for digital goods (30% fee) |
| **Content** | Age ratings, content moderation |
| **Quality** | No crashes, complete functionality |
| **Design** | Follow HIG, no misleading UI |

### Google Play Store

| Requirement | Details |
|-------------|---------|
| **Privacy** | Data safety section, privacy policy |
| **Payments** | Google Play Billing for digital goods |
| **Target SDK** | Must target recent Android version |
| **Permissions** | Justify all requested permissions |
| **Content** | IARC age ratings |

### Common Rejection Reasons

```
iOS:
□ Incomplete app (missing features)
□ Placeholder content
□ Crashes or bugs
□ Guideline 4.2: Minimum functionality
□ Guideline 5.1.1: Data collection without consent

Android:
□ Deceptive behavior
□ Missing privacy policy
□ Excessive permissions
□ Malware/spyware behavior
□ Impersonation
```

---

## Testing Mobile Apps

### Testing Pyramid for Mobile

```
           ┌───────────┐
           │  Manual   │  ← Exploratory, UX
          ┌┴───────────┴┐
          │    E2E      │  ← Detox, Appium
         ┌┴─────────────┴┐
         │  Integration   │  ← API + UI
        ┌┴───────────────┴┐
        │     Unit         │  ← Jest, XCTest
       └───────────────────┘
```

### Device Testing Matrix

```
MINIMUM TESTING DEVICES:
□ iOS: Latest version, Latest-1, Latest-2
□ Android: Various screen sizes, API levels 24+
□ Tablets (if supported)
□ Low-end devices (memory/CPU constraints)
□ Different network conditions (3G, 4G, WiFi)
```

---

## Cross-Platform Considerations

| Aspect | React Native | Flutter |
|--------|--------------|---------|
| Language | JavaScript/TypeScript | Dart |
| Performance | Near-native | Near-native |
| UI | Native components | Custom rendering |
| Hot Reload | Yes | Yes |
| Native Modules | Bridge required | Platform channels |
| Bundle Size | Larger | Larger |
| Community | Very large | Growing fast |

---

## Commands

```bash
# React Native
npx react-native run-ios
npx react-native run-android
npx react-native start --reset-cache

# Flutter
flutter run
flutter build apk --release
flutter build ios --release

# iOS (Xcode)
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release

# Android (Gradle)
./gradlew assembleRelease
./gradlew bundleRelease  # For Play Store

# Testing
npx detox test -c ios.sim.release
flutter test
```

---

## Resources

- **iOS HIG**: [developer.apple.com/design/human-interface-guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- **Material Design**: [material.io/design](https://material.io/design)
- **React Native**: [reactnative.dev](https://reactnative.dev/)
- **Flutter**: [flutter.dev](https://flutter.dev/)
- **App Store Review**: [developer.apple.com/app-store/review/guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **Google Play Policy**: [play.google.com/console/about/guides](https://play.google.com/console/about/guides/)

---

## Examples

### Example 1: Offline-First React Native App

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Offline-aware data fetching
function useOfflineData(key, fetchFn) {
  const queryClient = useQueryClient();
  
  const { data, error, isLoading } = useQuery({
    queryKey: [key],
    queryFn: async () => {
      const netInfo = await NetInfo.fetch();
      
      if (!netInfo.isConnected) {
        // Load from cache
        const cached = await AsyncStorage.getItem(key);
        return cached ? JSON.parse(cached) : null;
      }
      
      // Fetch from network
      const data = await fetchFn();
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return data;
    }
  });
  
  return { data, error, isLoading };
}

// Usage
function UserList() {
  const { data: users } = useOfflineData('users', api.getUsers);
  
  if (!users) return <Loading />;
  
  return (
    <FlatList
      data={users}
      renderItem={({ item }) => <UserItem user={item} />}
    />
  );
}
