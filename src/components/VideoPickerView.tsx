import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import CrossoverDetector from '../../modules/crossover-detector';
import { colors } from '../theme/colors';

/**
 * Local-video mode: pick a clip and process it end-to-end natively. Per-rep
 * `onRepComplete` events still fire during decode (the drill screen listens for
 * them), so the shared counter + completion overlay behave the same as live.
 */
export function VideoPickerView() {
  const [processing, setProcessing] = useState(false);

  const pickAndProcess = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
    });
    if (result.canceled || result.assets.length === 0) return;

    setProcessing(true);
    try {
      await CrossoverDetector.processVideo(result.assets[0].uri);
    } catch (e) {
      Alert.alert('Video processing failed', String(e));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.center}>
      <Text style={styles.hint}>
        Pick a clip from your library and we'll count the crossovers on-device.
      </Text>
      <Pressable
        style={[styles.button, processing && styles.buttonDisabled]}
        onPress={pickAndProcess}
        disabled={processing}>
        <Text style={styles.buttonText}>
          {processing ? 'Processing…' : 'Pick a video'}
        </Text>
      </Pressable>
      {processing && (
        <ActivityIndicator style={{ marginTop: 16 }} color="#fff" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.bg,
  },
  hint: {
    color: colors.textDim,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#000', fontSize: 18, fontWeight: '700' },
});
