require('dotenv').config();

export default ({ config }) => ({
    ...config,
    name: 'MapScribe',
    slug: 'mapscribe',
    scheme: 'mapscribe',
    version: '1.0.0',
    orientation: 'portrait',
    android: {
        ...config.android,
        package: 'ua.com.devinsider.mapscribe',
        permissions: [
            'ACCESS_FINE_LOCATION',
            'ACCESS_COARSE_LOCATION',
            'FOREGROUND_SERVICE',
        ],
    },
    plugins: [
        'expo-router',
        'expo-sqlite',
        'expo-web-browser',
        [
            'expo-status-bar',
            {
                style: 'dark',
            },
        ],
        [
            'expo-navigation-bar',
            {
                style: 'dark',
                enforceContrast: false,
            },
        ],
        [
            'expo-image-picker',
            {
                photosPermission: 'MapScribe uses access to let you add photos to saved places.',
                cameraPermission: 'MapScribe uses the camera to add photos to saved places.',
            },
        ],
        [
            'react-native-maps',
            {
                androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
            },
        ],
    ],
});