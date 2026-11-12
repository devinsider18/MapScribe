require('dotenv').config();

export default ({ config }) => ({
    ...config,
    name: 'MapScribe',
    slug: 'mapscribe',
    version: '1.0.0',
    orientation: 'portrait',
    ios: {
        ...config.ios,
        bundleIdentifier: 'com.voronkov.mapscribe',
        infoPlist: {
            NSLocationWhenInUseUsageDescription: 'This app uses your location to show your position on the map.',
            NSLocationAlwaysAndWhenInUseUsageDescription: 'This app needs background location access to track your routes.',
        },
    },
    android: {
        ...config.android,
        package: 'com.voronkov.mapscribe',
        permissions: [
            'ACCESS_FINE_LOCATION',
            'ACCESS_COARSE_LOCATION',
            'FOREGROUND_SERVICE',
        ],
    },
    plugins: [
        [
            'react-native-maps',
            {
                androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
            },
        ],
    ],
});