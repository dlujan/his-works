import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import {
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";

const screenWidth = Dimensions.get("window").width;

const ImageCarouselModal = ({
  visible,
  images,
  previewImageUri,
  onSetImage,
}: {
  visible: boolean;
  images: {
    uuid?: string;
    localUri?: string;
    compressedUri?: string;
    remoteUrl?: string;
    uploading: boolean;
    isNew?: boolean;
    sort_order?: number;
  }[];
  previewImageUri?: string | null | undefined;
  onSetImage: (uri: string | null | undefined) => void;
}) => {
  const scrollRef = useRef<ScrollView>(null);

  // Determine starting index
  const startIndex = images
    ? images.findIndex((img) => img.localUri === previewImageUri)
    : 0;

  // Scroll to selected image whenever the modal opens
  useEffect(() => {
    if (visible && scrollRef.current && startIndex >= 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: startIndex * screenWidth,
          animated: false,
        });
      }, 10);
    }
  }, [visible, startIndex]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    const image = images[index];
    if (image?.localUri) {
      onSetImage(image.localUri);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => onSetImage(null)}
    >
      <View style={styles.fullscreenContainer}>
        {/* Close */}
        <TouchableOpacity
          style={styles.fullscreenCloseButton}
          onPress={() => onSetImage(null)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={styles.fullscreenCloseText}>×</Text>
        </TouchableOpacity>

        {/* Horizontal Swipe ScrollView */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          style={{
            width: screenWidth,
          }}
        >
          {images.map((img) => (
            <View key={img.uuid || img.localUri} style={styles.imageWrapper}>
              <Image
                source={img.localUri}
                style={styles.fullscreenImage}
                contentFit="contain"
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ImageCarouselModal;

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenCloseButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenCloseText: {
    color: "white",
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 28,
  },
  imageWrapper: {
    width: Dimensions.get("window").width,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
  },
});
