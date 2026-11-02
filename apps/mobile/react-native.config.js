/**
 * Native map engines per platform: Apple Maps (react-native-maps) on iOS and
 * MapLibre on Android. react-native-maps is not linked on Android so the app never
 * pulls in Google Play Services Maps or needs a Google Maps API key.
 * MapLibre stays linked on iOS because its config plugin edits the Podfile.
 */
module.exports = {
  dependencies: {
    'react-native-maps': { platforms: { android: null } },
  },
};
