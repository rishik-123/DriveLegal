import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DriveVerse — One Identity. Every Vehicle Service.",
  description:
    "India's most advanced vehicle management ecosystem. Manage vehicles, challans, documents, navigation, and more with Astra AI.",
  keywords: [
    "vehicle management",
    "RTO",
    "challan",
    "DigiLocker",
    "driving license",
    "insurance",
    "PUC",
    "India",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="neo-black" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for (var registration of registrations) {
                  registration.unregister().then(function(success) {
                    if (success) console.log('Service Worker unregistered on localhost to prevent caching issues.');
                  });
                }
              });
              if ('caches' in window) {
                caches.keys().then(function(names) {
                  for (var name of names) {
                    caches.delete(name);
                  }
                  console.log('Caches cleared on localhost.');
                });
              }
            } else {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  console.log('ServiceWorker registered:', reg.scope);
                }).catch(function(err) {
                  console.warn('ServiceWorker registration failed:', err);
                });
              });
            }
          }
        `}} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
