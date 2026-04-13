import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { radius, useAppTheme } from '../theme';

export default function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return undefined;
    }

    overlayOpacity.setValue(0);
    translateY.setValue(32);
    return undefined;
  }, [overlayOpacity, translateY, visible]);

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          {(title || subtitle) && (
            <View style={styles.header}>
              {!!title && <Text style={styles.title}>{title}</Text>}
              {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          )}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(3, 5, 9, 0.62)',
    },
    sheet: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 22,
      backgroundColor: theme.playerBg,
      borderTopLeftRadius: radius.lg + 4,
      borderTopRightRadius: radius.lg + 4,
      borderWidth: 1,
      borderColor: theme.glassBorderStrong,
      borderBottomWidth: 0,
      gap: 12,
    },
    handle: {
      alignSelf: 'center',
      width: 52,
      height: 5,
      borderRadius: radius.full,
      backgroundColor: theme.text12,
      marginBottom: 2,
    },
    header: {
      paddingHorizontal: 6,
      gap: 4,
    },
    title: {
      fontSize: 17 * theme.scale,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 12 * theme.scale,
      color: theme.text30,
      lineHeight: 18 * theme.scale,
    },
  });
}
