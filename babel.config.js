module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Required by react-native-vision-camera frame processors (worklets).
    // Must be listed last.
    plugins: ['react-native-worklets-core/plugin'],
  };
};
