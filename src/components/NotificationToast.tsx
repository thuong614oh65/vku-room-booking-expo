import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { AppNotification, notificationService } from '../services/notificationService';

export const NotificationToast: React.FC = () => {
  const [current, setCurrent] = useState<AppNotification | null>(null);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    return notificationService.subscribe((list) => {
      if (list.length > 0) {
        const latest = list[0];
        setCurrent(latest);
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.delay(4000),
          Animated.timing(slideAnim, {
            toValue: -120,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setCurrent(null);
        });
      }
    });
  }, []);

  if (!current) return null;

  const getBorderColor = () => {
    switch (current.type) {
      case 'CONFLICT':
        return '#ef4444';
      case 'WAITLIST_AVAILABLE':
        return '#8b5cf6';
      case 'REMINDER':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  const getIcon = () => {
    switch (current.type) {
      case 'CONFLICT':
        return '??';
      case 'WAITLIST_AVAILABLE':
        return '??';
      case 'REMINDER':
        return '?';
      default:
        return '?';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], borderLeftColor: getBorderColor() },
      ]}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.iconText}>{getIcon()}</Text>
      </View>
      <View style={styles.contentWrap}>
        <Text style={styles.titleText}>{current.title}</Text>
        <Text style={styles.bodyText} numberOfLines={2}>
          {current.body}
        </Text>
      </View>
      <Pressable
        onPress={() => {
          Animated.timing(slideAnim, {
            toValue: -120,
            duration: 180,
            useNativeDriver: true,
          }).start(() => setCurrent(null));
        }}
        style={styles.closeBtn}
      >
        <Text style={styles.closeText}>?</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderLeftWidth: 5,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  iconWrap: {
    marginRight: 10,
  },
  iconText: {
    fontSize: 22,
  },
  contentWrap: {
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  bodyText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 6,
  },
  closeText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
});
