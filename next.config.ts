import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // Essential Placeholders & Google
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'via.placeholder.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.googleusercontent.com', port: '', pathname: '/**' },

      // User's Specific Requests (Left-leaning outlets)
      { protocol: 'https', hostname: 'taz.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.taz.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'jacobin.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.jacobin.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'freitag.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.freitag.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'jungewelt.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.jungewelt.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'jungle.world', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.jungle.world', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'nd-aktuell.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.nd-aktuell.de', port: '', pathname: '/**' },

      // Major National & Popular German News Providers
      { protocol: 'https', hostname: 'www.n-tv.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'spiegel.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.spiegel.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'zeit.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.zeit.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'sueddeutsche.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.sueddeutsche.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'faz.net', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.faz.net', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'welt.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.welt.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'handelsblatt.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.handelsblatt.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'focus.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.focus.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'stern.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.stern.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'tagesschau.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.tagesschau.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'zdf.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.zdf.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'bild.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.bild.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'dw.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.dw.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'tagesspiegel.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.tagesspiegel.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'fr.de', port: '', pathname: '/**' }, // Frankfurter Rundschau
      { protocol: 'https', hostname: '*.fr.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 't-online.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.t-online.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'heise.de', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.heise.de', port: '', pathname: '/**' },
    ],
  },
  webpack: (config) => {
    // Fix for pdf-lib dependencies in browser environment
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "fs": false,
      "path": false,
      "stream": false,
    };

    return config;
  },
};

export default nextConfig;
