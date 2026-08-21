import React, { useEffect } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  SafeAreaView,
} from 'react-native';
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDecay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const MAX_SCALE = 6.0;
const MIN_SCALE = 1.0;

interface ZoomableImageModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}

const ZoomableImageModal: React.FC<ZoomableImageModalProps> = ({
  visible,
  imageUri,
  onClose,
}) => {
  // Reanimated shared values (run entirely on the UI thread for smooth 60fps)
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetAll = () => {
    'worklet';
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  useEffect(() => {
    if (!visible) {
      // Reset without animation if the modal is hidden
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [visible]);

  // --- Pure UI Thread Gestures ---
  // No JS thread callbacks (like setState or runOnJS) to absolutely prevent crashing.

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.max(MIN_SCALE * 0.8, Math.min(newScale, MAX_SCALE * 1.2));
    })
    .onEnd(() => {
      let finalScale = scale.value;
      if (scale.value < MIN_SCALE) {
        finalScale = MIN_SCALE;
        scale.value = withSpring(MIN_SCALE);
      } else if (scale.value > MAX_SCALE) {
        finalScale = MAX_SCALE;
        scale.value = withSpring(MAX_SCALE);
      }
      savedScale.value = finalScale;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > MIN_SCALE) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd((event) => {
      if (scale.value > MIN_SCALE) {
        const maxTx = (width * scale.value - width) / 2;
        const maxTy = (height * scale.value - height) / 2;
        
        translateX.value = withDecay({ velocity: event.velocityX, clamp: [-maxTx, maxTx] });
        translateY.value = withDecay({ velocity: event.velocityY, clamp: [-maxTy, maxTy] });
        
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
        resetAll();
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        resetAll();
      } else {
        const target = 2.5;
        scale.value = withSpring(target);
        savedScale.value = target;
      }
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close-circle" size={36} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Image Surface */}
            <View style={styles.imageSurface}>
              <GestureDetector gesture={composedGesture}>
                <Animated.View style={[styles.imageContainer, animatedStyle]}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.fullImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </GestureDetector>
            </View>
          </SafeAreaView>
        </GestureHandlerRootView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  closeBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  imageSurface: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageContainer: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});

export default ZoomableImageModal;
