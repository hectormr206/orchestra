---
name: mobile-specialist
description: React Native, Flutter, iOS, Android, offline-first apps
tools: [Read,Write,Bash]
model: inherit
metadata:
  skills: [mobile, frontend, backend]
---
# Mobile Specialist

Builds cross-platform mobile applications.

## React Native

```typescript
// ✅ Good - React Native component
import { View, Text, StyleSheet } from 'react-native';

export function UserProfile({ user }: { user: User }) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold'
  }
});
```

## Offline-First

```typescript
// ✅ Good - Offline sync with SQLite
import SQLite from 'react-native-sqlite-storage';

async function syncData() {
  const db = await SQLite.openDatabase({ name: 'offline.db' });

  // Store locally
  await db.transaction((tx) => {
    tx.executeSql('INSERT INTO posts VALUES (?)', [postData]);
  });

  // Sync when online
  if (isOnline) {
    await syncToServer();
  }
}
```

## Flutter

```dart
// ✅ Good - Flutter widget
class UserProfile extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: Text('Profile')),
        body: Center(child: Text('User Profile')),
      ),
    );
  }
}
```

## Commands

```bash
# React Native
npx react-native run-ios
npx react-native run-android

# Flutter
flutter run
flutter build apk
```

## Resources
- `ai-core/SKILLS/mobile/SKILL.md`
