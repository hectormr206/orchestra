---
name: pwa
description: >
  Progressive Web App patterns: Service Workers, Web App Manifest,
  caching strategies, offline-first, push notifications, installability.
  Trigger: When building PWAs or adding PWA features to web apps.
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Building a Progressive Web App"
    - "Adding service workers"
    - "Implementing offline functionality"
    - "Adding push notifications to web"
    - "Making app installable"
    - "Optimizing for Lighthouse PWA"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Building a new Progressive Web App
- Converting existing web app to PWA
- Implementing service workers
- Adding offline capabilities
- Implementing push notifications (web)
- Making web app installable
- Optimizing Lighthouse PWA score
- Creating background sync functionality

---

## Critical Patterns

### > **ALWAYS**

1. **Register service worker correctly**
   ```javascript
   // Register service worker
   if ('serviceWorker' in navigator) {
     window.addEventListener('load', () => {
       navigator.serviceWorker.register('/sw.js')
         .then(registration => {
           console.log('SW registered:', registration.scope);

           // Check for updates
           registration.addEventListener('updatefound', () => {
             const newWorker = registration.installing;
             newWorker.addEventListener('statechange', () => {
               if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                 // New version available
                 notifyUpdateAvailable();
               }
             });
           });
         })
         .catch(error => {
           console.error('SW registration failed:', error);
         });
     });
   }
   ```

2. **Implement proper caching strategy**
   ```
   ┌─────────────────────────────────────────┐
   │ CACHING STRATEGIES                       │
   │                                         │
   │ 1. Cache First: Static assets           │
   │    → CSS, JS, images, fonts             │
   │                                         │
   │ 2. Network First: API calls             │
   │    → Fresh data, fallback to cache      │
   │                                         │
   │ 3. Stale-While-Revalidate: HTML         │
   │    → Fast response, background update   │
   │                                         │
   │ 4. Cache Only: offline fallback         │
   │    → Offline page                       │
   └─────────────────────────────────────────┘
   ```

3. **Provide complete Web App Manifest**
   ```json
   {
     "name": "My App",
     "short_name": "App",
     "description": "My progressive web app",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#000000",
     "orientation": "portrait-primary",
     "icons": [
       {
         "src": "/icons/icon-192x192.png",
         "sizes": "192x192",
         "type": "image/png",
         "purpose": "any maskable"
       },
       {
         "src": "/icons/icon-512x512.png",
         "sizes": "512x512",
         "type": "image/png",
         "purpose": "any maskable"
       }
     ],
     "categories": ["productivity", "utilities"],
     "screenshots": [
       {
         "src": "/screenshots/mobile1.png",
         "sizes": "540x720",
         "type": "image/png",
         "form_factor": "narrow"
       }
     ]
   }
   ```

4. **Handle service worker updates gracefully**
   ```javascript
   // Skip waiting on new service worker
   self.addEventListener('install', (event) => {
     self.skipWaiting();
   });

   // Claim clients immediately
   self.addEventListener('activate', (event) => {
     event.waitUntil(
       clients.claim()
     );
   });

   // Clean up old caches
   self.addEventListener('activate', (event) => {
     event.waitUntil(
       caches.keys().then(cacheNames => {
         return Promise.all(
           cacheNames.map(cacheName => {
             if (cacheName !== CACHE_VERSION) {
               return caches.delete(cacheName);
             }
           })
         );
       })
     );
   });
   ```

5. **Implement background sync for offline actions**
   ```javascript
   // Service worker
   self.addEventListener('sync', (event) => {
     if (event.tag === 'sync-data') {
       event.waitUntil(syncData());
     }
   });

   async function syncData() {
     const data = await getIdbData('syncQueue');
     for (const item of data) {
       try {
         await fetch(item.url, {
           method: item.method,
           body: JSON.stringify(item.payload)
         });
         await deleteIdbData(item.id);
       } catch (error) {
         console.error('Sync failed:', error);
       }
     }
   }
   ```

6. **Add proper meta tags for PWA**
   ```html
   <!-- Theme color -->
   <meta name="theme-color" content="#000000">

   <!-- Apple touch icon -->
   <link rel="apple-touch-icon" href="/icons/icon-192x192.png">

   <!-- Manifest -->
   <link rel="manifest" href="/manifest.json">

   <!-- Mobile fullscreen -->
   <meta name="apple-mobile-web-app-capable" content="yes">
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
   ```

7. **Implement install prompt**
   ```javascript
   let deferredPrompt;

   window.addEventListener('beforeinstallprompt', (e) => {
     // Prevent Chrome 67 and earlier from automatically showing the prompt
     e.preventDefault();
     // Stash the event so it can be triggered later
     deferredPrompt = e;

     // Show install button
     showInstallButton();
   });

   async function installApp() {
     if (!deferredPrompt) return;

     // Show the prompt
     deferredPrompt.prompt();

     // Wait for the user to respond to the prompt
     const { outcome } = await deferredPrompt.userChoice;

     if (outcome === 'accepted') {
       console.log('User accepted the install prompt');
     }

     deferredPrompt = null;
   }
   ```

### > **NEVER**

1. **Cache HTML with aggressive strategies** (can serve stale content)
2. **Forget to handle service worker updates** (users stuck on old version)
3. **Ignore network status** (show offline UI appropriately)
4. **Cache sensitive data** (API responses with PII, auth tokens)
5. **Forget to provide offline fallback** (show meaningful offline page)
6. **Assume service worker is always active** (test without it)
7. **Cache API responses without versioning** (breaks when API changes)

---

## Service Worker Patterns

### Cache-First Strategy (Static Assets)

```javascript
const CACHE_NAME = 'static-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/styles.css',
  '/app.js',
  '/offline.html'
];

// Cache assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then(response => {
          // Cache the new response
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
  );
});
```

### Network-First Strategy (API Calls)

```javascript
self.addEventListener('fetch', (event) => {
  // Only handle API calls
  if (!event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache the response
        return caches.open('api-v1').then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});
```

### Stale-While-Revalidate (HTML)

```javascript
self.addEventListener('fetch', (event) => {
  // Only handle HTML documents
  if (event.request.mode !== 'navigate') {
    return;
  }

  event.respondWith(
    caches.open('pages-v1').then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });

        // Return cached response immediately, update in background
        return cachedResponse || fetchPromise;
      });
    })
  );
});
```

---

## Workbox Integration

### Using Workbox (Recommended)

```bash
# Install Workbox
npm install workbox-cli --save-dev

# Generate service worker
npx workbox generateSW
```

**workbox.config.js:**

```javascript
module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{js,css,html,png,jpg,svg,json}'
  ],
  swDest: 'dist/sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.example\.com\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 86400  // 24 hours
        },
        networkTimeoutSeconds: 10
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 604800  // 7 days
        }
      }
    },
    {
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources'
      }
    }
  ]
};
```

### Custom Strategies with Workbox

```javascript
import { registerRoute, NavigationRoute, CacheFirst } from 'workbox-routing';
import { precacheAndRoute } from 'workbox-precaching';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      ),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60  // 7 days
      })
    ]
  })
);

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60  // 24 hours
      })
    ]
  })
);
```

---

## Offline Patterns

### Offline Fallback Page

```javascript
// Service worker
const OFFLINE_FALLBACK = '/offline.html';

// Cache offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('offline-v1').then(cache => {
      return cache.addAll([OFFLINE_FALLBACK]);
    })
  );
});

// Serve offline page when network fails
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_FALLBACK);
      })
    );
  }
});
```

### Offline Indicator

```javascript
// Client-side code
const offlineIndicator = document.getElementById('offline-indicator');

function updateOnlineStatus() {
  if (navigator.onLine) {
    offlineIndicator.classList.remove('visible');
    // Sync any pending data
    syncPendingData();
  } else {
    offlineIndicator.classList.add('visible');
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Initial check
updateOnlineStatus();
```

### IndexedDB for Offline Data

```javascript
import { openDB } from 'idb';

const db = await openDB('my-app-db', 1, {
  upgrade(db) {
    // Create object stores
    db.createObjectStore('syncQueue', { keyPath: 'id' });
    db.createObjectStore('cache', { keyPath: 'url' });
  }
});

// Save data for sync
async function saveForSync(id, data) {
  await db.put('syncQueue', {
    id,
    data,
    timestamp: Date.now()
  });
}

// Get all pending sync items
async function getPendingSync() {
  return await db.getAll('syncQueue');
}

// Delete synced item
async function deleteSyncItem(id) {
  await db.delete('syncQueue', id);
}
```

---

## Push Notifications

### Request Permission

```javascript
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Use with user interaction
document.getElementById('notify-btn').addEventListener('click', async () => {
  const hasPermission = await requestNotificationPermission();

  if (hasPermission) {
    subscribeToPushNotifications();
  }
});
```

### Subscribe to Push

```javascript
async function subscribeToPushNotifications() {
  try {
    // Register service worker
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });

    console.log('Push subscription successful');
  } catch (error) {
    console.error('Push subscription failed:', error);
  }
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
```

### Handle Push Events

```javascript
// Service worker
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'  // Deep link
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('My App', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else if (event.action === 'close') {
    // Just close
  } else {
    // Default: open app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});
```

---

## Performance & Lighthouse

### PWA Checklist (100/100 Lighthouse Score)

```
INSTALLABILITY
□ Manifest with all required fields
□ At least 1 icon (192x192 and 512x512)
□ serves from HTTPS
□ Service worker registered
□ Responds with 200 when offline
□ Start URL matches manifest

PERFORMANCE
□ First Contentful Paint < 1.8s
□ Time to Interactive < 3.8s
□ Speed Index < 3.4s
□ No JavaScript execution time > 50ms

BEST PRACTICES
□ HTTPS served
□ HTTP redirects to HTTPS
□ No insecure forms
□ No mixed content
□ Uses HTTPS for all scripts

ACCESSIBILITY
□ Color contrast ratio > 4.5:1
□ Proper ARIA labels
□ Keyboard navigation
□ Focus indicators
```

### Performance Optimization

```javascript
// Lazy load service worker registration
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    // Defer SW registration
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js');
    }, 1000);  // Don't block initial render
  }
});

// Use Cache API efficiently
const CACHE_VERSION = 'v2';

// Update cache name on deploy
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`
};

// Preload critical resources
const link = document.createElement('link');
link.rel = 'preload';
link.as = 'script';
link.href = '/critical.js';
document.head.appendChild(link);
```

---

## Testing PWA

### Lighthouse CI

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run Lighthouse
lhci autorun --collect.url=http://localhost:3000
```

**lighthouserc.json:**

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "npm start",
      "url": ["http://localhost:3000"]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:pwa": ["error", { "minScore": 1 }],
        "categories:performance": ["error", { "minScore": 0.9 }],
        "installable-manifest": "error",
        "offline-start-url": "error",
        "service-worker": "error"
      }
    }
  }
}
```

### Testing Service Worker

```javascript
// Test service worker registration
describe('Service Worker', () => {
  it('should register service worker', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    expect(registration).toBeDefined();
    expect(registration.active).toBeDefined();
  });

  it('should cache static assets', async () => {
    const cache = await caches.open('static-v1');
    const cachedResponse = await cache.match('/styles.css');
    expect(cachedResponse).toBeDefined();
  });
});
```

### Testing Offline Functionality

```javascript
// Chrome DevTools
// 1. Open Application tab
// 2. Check "Service Workers"
// 3. Check "Offline" checkbox
// 4. Verify app works offline

// Or test with code
async function testOffline() {
  // Go offline
  const offlineToggle = document.getElementById('offline-toggle');
  offlineToggle.click();

  // Try to fetch data
  const response = await fetch('/api/data');

  // Should serve from cache
  expect(response.ok).toBe(true);
  expect(response.fromCache).toBe(true);
}
```

---

## Background Sync

### Register Sync Event

```javascript
// Client-side
async function syncData() {
  // Register background sync
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('sync-data');
}

// Use when offline operation occurs
async function saveOffline(data) {
  // Save to IndexedDB
  await saveToSyncQueue(data);

  // Try to sync immediately
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-data');
  } catch (error) {
    console.log('Sync registered, will run when online');
  }
}
```

### Handle Sync in Service Worker

```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // Get data from IndexedDB
    const data = await getSyncQueueData();

    for (const item of data) {
      const response = await fetch(item.url, {
        method: item.method,
        body: JSON.stringify(item.payload)
      });

      if (response.ok) {
        await removeFromSyncQueue(item.id);
      }
    }

    // Notify user of successful sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        count: data.length
      });
    });
  } catch (error) {
    // Sync failed, will retry automatically
    console.error('Sync failed:', error);
  }
}
```

---

## Periodic Background Sync

### Request Permission

```javascript
async function requestPeriodicSyncPermission() {
  const registration = await navigator.serviceWorker.ready;

  // Check if supported
  if ('periodicSync' in registration) {
    // Request permission
    const status = await navigator.permissions.query({
      name: 'periodic-background-sync'
    });

    if (status.state === 'granted') {
      // Register periodic sync
      await registration.periodicSync.register('update-content', {
        minInterval: 24 * 60 * 60 * 1000  // 24 hours
      });
    }
  }
}
```

### Handle Periodic Sync

```javascript
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  // Fetch new content
  const response = await fetch('/api/content/updates');

  if (response.ok) {
    const data = await response.json();

    // Update cache
    const cache = await caches.open('content-v1');
    await cache.put('/api/content', new Response(JSON.stringify(data)));

    // Show notification
    await self.registration.showNotification('New content available!', {
      body: `${data.items.length} new items`,
      icon: '/icons/icon-192x192.png'
    });
  }
}
```

---

## App Shortcuts

### Add to Manifest

```json
{
  "shortcuts": [
    {
      "name": "New Item",
      "short_name": "New",
      "description": "Create a new item",
      "url": "/create",
      "icons": [
        {
          "src": "/icons/shortcut-new.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Search",
      "short_name": "Search",
      "description": "Search items",
      "url": "/search",
      "icons": [
        {
          "src": "/icons/shortcut-search.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

### Add Shortcut Programmatically

```javascript
// Add app shortcut (Chrome)
navigator.mediaSession.addAction('newitem', {
  icon: '/icons/shortcut-new.png',
  title: 'New Item'
});
```

---

## Share Target

### Add to Manifest

```json
{
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "file",
          "accept": ["image/*", "video/*", ".pdf"]
        }
      ]
    }
  }
}
```

### Handle Share in App

```javascript
// Parse shared data on share page
window.addEventListener('load', async () => {
  const shareData = await getShareData();

  if (shareData) {
    // Display shared content
    displaySharedContent(shareData);

    // Allow user to process
    document.getElementById('share-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      await processShare(shareData);

      // Redirect to home
      window.location.href = '/';
    });
  }
});

async function getShareData() {
  const params = new URLSearchParams(window.location.search);

  return {
    title: params.get('title'),
    text: params.get('text'),
    url: params.get('url'),
    files: await getSharedFiles()
  };
}
```

---

## Window Controls Overlay

### Enable in Manifest

```json
{
  "display_override": ["window-controls-overlay"],
  "display": "standalone"
}
```

### Handle Overlay

```javascript
if (navigator.windowControlsOverlay) {
  // Get overlay rectangle
  const rect = navigator.windowControlsOverlay.getTitlebarAreaRect();

  // Adjust layout when overlay changes
  navigator.windowControlsOverlay.addEventListener('geometrychange', (e) => {
    const { titlebarArea } = e;

    // Adjust content padding
    document.body.style.paddingTop = `${titlebarArea.height}px`;
  });

  // Check if overlay is visible
  if (navigator.windowControlsOverlay.visible) {
    document.body.classList.add('window-controls-overlay');
  }
}
```

---

## Commands

```bash
# Workbox CLI
npx workbox generateSW
npx workbox copyLibraries dist/workbox

# Lighthouse
npx lighthouse https://example.com --view
npx lighthouse https://example.com --output=html --output-path=./report.html

# PWA Builder (Asset generation)
npx pwa-asset-generator source-logo.png icons

# Test service worker
# Chrome DevTools > Application > Service Workers

# Test offline
# Chrome DevTools > Network > Offline checkbox

# Test push notifications
# Chrome DevTools > Application > Service Workers > Push
```

---

## Resources

- **PWA Spec**: [w3c.github.io/manifest](https://w3c.github.io/manifest/)
- **Service Worker API**: [developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- **Workbox**: [developers.google.com/web/tools/workbox](https://developers.google.com/web/tools/workbox)
- **PWA Builder**: [www.pwabuilder.com](https://www.pwabuilder.com)
- **Lighthouse**: [developers.google.com/web/tools/lighthouse](https://developers.google.com/web/tools/lighthouse)
- **Web.dev PWA**: [web.dev/progressive-web-apps](https://web.dev/progressive-web-apps)

---

## Examples

### Example 1: Complete Service Worker

```javascript
const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`
};

// Assets to pre-cache
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/styles.css',
  '/app.js'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => !Object.values(CACHE_NAMES).includes(name))
          .map(name => caches.delete(name))
      );
    })
    .then(() => clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different request types
  if (request.mode === 'navigate') {
    // HTML documents - stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API calls - network-first
    event.respondWith(networkFirst(request));
  } else if (request.destination === 'image') {
    // Images - cache-first
    event.respondWith(cacheFirst(request));
  } else {
    // Static assets - cache-first
    event.respondWith(cacheFirst(request));
  }
});

// Strategies
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAMES.static);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    // Return offline fallback for HTML
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAMES.api);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAMES.static);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    cache.put(request, response.clone());
    return response;
  });

  return cached || fetchPromise;
}

// Push notification
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'New update';

  event.waitUntil(
    self.registration.showNotification('My App', {
      body: data,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png'
    })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implementation depends on your IndexedDB structure
  // This is where you'd sync offline changes to server
  console.log('Background sync triggered');
}
```

### Example 2: IndexedDB Wrapper

```javascript
// idb wrapper for easier usage
import { openDB } from 'idb';

export const db = await openDB('my-pwa-db', 1, {
  upgrade(db) {
    // Create stores
    db.createObjectStore('syncQueue', { keyPath: 'id' });
    db.createObjectStore('cache', { keyPath: 'url' });
    db.createObjectStore('settings', { keyPath: 'key' });
  }
});

// Sync queue operations
export async function addToSyncQueue(item) {
  await db.put('syncQueue', {
    id: `${Date.now()}-${Math.random()}`,
    ...item,
    timestamp: Date.now()
  });
}

export async function getSyncQueue() {
  return await db.getAll('syncQueue');
}

export async function removeFromSyncQueue(id) {
  await db.delete('syncQueue', id);
}

// Cache operations
export async function cacheData(url, data) {
  await db.put('cache', {
    url,
    data,
    timestamp: Date.now()
  });
}

export async function getCachedData(url, maxAge = 3600000) {
  const cached = await db.get('cache', url);

  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < maxAge) {
      return cached.data;
    }
  }

  return null;
}

// Settings operations
export async function getSetting(key) {
  const item = await db.get('settings', key);
  return item ? item.value : null;
}

export async function setSetting(key, value) {
  await db.put('settings', { key, value });
}
```

### Example 3: Offline-Aware API Client

```javascript
import { addToSyncQueue, getSyncQueue, removeFromSyncQueue, cacheData, getCachedData } from './db';

class OfflineAwareAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async get(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, options);

      if (response.ok) {
        const data = await response.json();
        // Cache successful GET requests
        await cacheData(url, data);
        return data;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      // Try cache on network failure
      const cached = await getCachedData(url);
      if (cached) {
        console.log('Serving from cache');
        return cached;
      }
      throw error;
    }
  }

  async post(endpoint, data, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });

      if (response.ok) {
        return await response.json();
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      // Add to sync queue for later
      await addToSyncQueue({
        method: 'POST',
        url,
        payload: data
      });
      throw error;
    }
  }

  async put(endpoint, data, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });

      if (response.ok) {
        return await response.json();
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      // Add to sync queue for later
      await addToSyncQueue({
        method: 'PUT',
        url,
        payload: data
      });
      throw error;
    }
  }

  async sync() {
    const queue = await getSyncQueue();

    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item.payload)
        });

        if (response.ok) {
          await removeFromSyncQueue(item.id);
        }
      } catch (error) {
        console.error('Sync failed for item:', item.id);
      }
    }
  }
}

// Usage
const api = new OfflineAwareAPI('/api');

// Get data (uses cache when offline)
const users = await api.get('/users');

// Create data (queues when offline)
await api.post('/users', { name: 'John' });

// Sync queued operations
if (navigator.serviceWorker) {
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('sync-data');
}
```

### Example 4: Install Prompt Component

```jsx
import React, { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div className="install-prompt">
      <p>Install our app for the best experience!</p>
      <button onClick={handleInstall}>
        Install App
      </button>
      <button onClick={() => setShowInstall(false)}>
        Not now
      </button>
    </div>
  );
}
```

### Example 5: Offline Indicator Component

```jsx
import React, { useState, useEffect } from 'react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sync pending changes
      syncPendingChanges();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function syncPendingChanges() {
    // Trigger background sync
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-data');
    }
  }

  if (isOnline) return null;

  return (
    <div className="offline-indicator">
      <span>⚠️ You're offline. Some features may be limited.</span>
    </div>
  );
}
```

---

## Advanced Topics

### Service Worker Update Strategy

```javascript
// Update detection
let isNewVersionAvailable = false;

// Listen for update
navigator.serviceWorker.addEventListener('controllerchange', () => {
  // New service worker is active
  window.location.reload();
});

// Prompt user to update
function showUpdateBanner() {
  const banner = document.createElement('div');
  banner.className = 'update-banner';
  banner.innerHTML = `
    <p>A new version is available!</p>
    <button id="update-btn">Update</button>
  `;
  document.body.appendChild(banner);

  document.getElementById('update-btn').addEventListener('click', () => {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  });
}

// In service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

### Cache Expiration Strategy

```javascript
// Set up cache expiration
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const now = Date.now();
  const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      const cacheTime = new Date(response.headers.get('date')).getTime();

      if (now - cacheTime > MAX_AGE) {
        await cache.delete(request);
      }
    }
  }
}

// Run cleanup periodically
self.addEventListener('activate', (event) => {
  event.waitUntil(
    cleanupOldCaches()
  );
});
```

### Adaptive Loading Based on Network

```javascript
// Detect network type
async function getNetworkType() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) return 'unknown';

  return {
    effectiveType: connection.effectiveType,  // '2g', '3g', '4g'
    downlink: connection.downlink,            // Mbps
    rtt: connection.rtt,                      // Round-trip time
    saveData: connection.saveData             // Data saver mode
  };
}

// Adjust content based on network
async function loadContent() {
  const network = await getNetworkType();

  if (network.saveData || network.effectiveType === '2g') {
    // Load lighter version
    return loadLightVersion();
  } else {
    // Load full version
    return loadFullVersion();
  }
}

// Listen for network changes
if (navigator.connection) {
  navigator.connection.addEventListener('change', () => {
    // Reload content when network changes
    loadContent();
  });
}
```

---

## Security Considerations

```
SECURITY CHECKLIST
□ Service worker served from HTTPS
□ No sensitive data in Cache API
□ Validate push notification payloads
□ Use SubtleCrypto for sensitive data
□ Implement Content Security Policy
□ Sanitize user-generated content
□ Use HTTPS for all external requests
□ Don't cache authentication tokens
```

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
">
```

---

## Migration Checklist

```
MIGRATING TO PWA
□ Audit current site with Lighthouse
□ Create manifest.json
□ Add icons (192x192, 512x512)
□ Register service worker
□ Implement caching strategy
□ Add offline fallback page
□ Test offline functionality
□ Set up HTTPS
□ Test on mobile devices
□ Configure push notifications (optional)
□ Add install prompt
□ Verify Lighthouse PWA score
□ Deploy to production
□ Monitor service worker errors
□ Set up periodic updates
```
