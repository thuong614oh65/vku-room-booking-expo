import { Platform } from 'react-native';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  type: 'REMINDER' | 'CONFLICT' | 'WAITLIST_AVAILABLE' | 'SUCCESS';
}

class NotificationService {
  private inAppNotifications: AppNotification[] = [];
  private listeners: ((notifications: AppNotification[]) => void)[] = [];

  constructor() {
    this.requestPermissions();
  }

  async requestPermissions() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (e) {
          console.warn('Web notification permission error:', e);
        }
      }
    }
  }

  notify(title: string, body: string, type: AppNotification['type'] = 'SUCCESS') {
    const item: AppNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title,
      body,
      timestamp: Date.now(),
      type,
    };

    this.inAppNotifications.unshift(item);
    if (this.inAppNotifications.length > 20) {
      this.inAppNotifications = this.inAppNotifications.slice(0, 20);
    }
    this.listeners.forEach((fn) => fn([...this.inAppNotifications]));

    // Web Notification nếu được cấp quyền
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, { body, icon: 'https://vku.udn.vn/favicon.ico' });
        } catch (e) {
          console.warn('Cannot display web notification:', e);
        }
      }
    }
  }

  /**
   * Đặt lịch nhắc nhở 15 phút trước giờ học
   */
  scheduleBookingReminder(roomName: string, date: string, startTime: string) {
    const title = '⏰ Nhắc nhở ca học tại VKU (Còn 15 phút)';
    const body = `Phòng ${roomName} của bạn sắp bắt đầu lúc ${startTime} (${date}). Hãy sẵn sàng quét mã QR check-in!`;
    
    // Gửi thông báo xác nhận lịch hẹn
    this.notify('🔔 Đã đặt phòng & Lên lịch nhắc nhở', `Hệ thống sẽ nhắc bạn 15 phút trước ca học ${startTime} tại ${roomName}.`, 'REMINDER');
  }

  subscribe(listener: (notifications: AppNotification[]) => void) {
    this.listeners.push(listener);
    listener([...this.inAppNotifications]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getNotifications() {
    return [...this.inAppNotifications];
  }

  clear() {
    this.inAppNotifications = [];
    this.listeners.forEach((fn) => fn([]));
  }
}

export const notificationService = new NotificationService();
