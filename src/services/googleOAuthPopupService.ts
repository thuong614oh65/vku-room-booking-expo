/**
 * googleOAuthPopupService.ts
 *
 * Dịch vụ Đăng nhập Google OAuth 2.0 Chính Chủ 100% (Google Identity Services - accounts.google.com)
 * Tuyệt đối không sử dụng màn hình giả lập nội bộ.
 * Client ID thuộc tổ chức VKU (vku.udn.vn):
 * 1003178768971-qn13952kqgsbbkqcdkebet5jblf748je.apps.googleusercontent.com
 */

import { UserProfile } from '../types/booking';

export const GOOGLE_OAUTH_CLIENT_ID =
  '1003178768971-qn13952kqgsbbkqcdkebet5jblf748je.apps.googleusercontent.com';

export interface GoogleOAuthResult {
  email: string;
  password: string;
  name?: string;
  avatar?: string;
  resetPassword?: boolean;
}

export const GOOGLE_G_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>`;

function ensureGoogleGsiScriptLoaded(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).google?.accounts?.oauth2) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      let checks = 0;
      const timer = setInterval(() => {
        checks++;
        if ((window as any).google?.accounts?.oauth2) {
          clearInterval(timer);
          resolve(true);
        } else if (checks > 25) {
          clearInterval(timer);
          resolve(false);
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(Boolean((window as any).google?.accounts?.oauth2));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function isEmbeddedWebView(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  if (
    /Zalo|FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line|MicroMessenger|BytedanceWebview|TikTok|\bwv\b|WebView/i.test(
      ua
    )
  ) {
    return true;
  }
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isRealIOSBrowser = /Safari\/|CriOS\/|FxiOS\/|EdgiOS\/|OPiOS\//i.test(ua);
  if (isIOS && !isRealIOSBrowser) {
    return true;
  }
  return false;
}

/**
 * Chuyển hướng thoát khỏi trình duyệt nhúng (Zalo / Messenger) sang thẳng Safari (iOS) hoặc Chrome (Android)
 * để đăng nhập Google OAuth 2.0 chính chủ an toàn tuyệt đối.
 */
export function openInExternalSystemBrowser(targetUrl?: string): void {
  if (typeof window === 'undefined') return;
  const fullUrl = targetUrl || window.location.href;
  const ua = navigator.userAgent || '';
  const withoutProtocol = fullUrl.replace(/^https?:\/\//i, '');

  if (/iPhone|iPad|iPod/i.test(ua)) {
    window.location.href = `x-safari-https://${withoutProtocol}`;
    return;
  }

  if (/Android/i.test(ua)) {
    window.location.href = `intent://${withoutProtocol}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(
      fullUrl
    )};end`;
    return;
  }

  window.open(fullUrl, '_blank', 'noopener,noreferrer');
}

export function openRealGooglePopupWindow(
  _availableUsers: UserProfile[],
  onSuccess: (result: GoogleOAuthResult) => void,
  onError?: (errorMessage: string) => void
): boolean {
  if (typeof window === 'undefined') return false;

  if (isEmbeddedWebView()) {
    // Tự động kích hoạt mở sang Safari (trên iPhone) hoặc Chrome (trên Android)
    openInExternalSystemBrowser();
    return false;
  }

  const launchGsiTokenFlow = () => {
    const gsi = (window as any).google?.accounts?.oauth2;
    if (!gsi) {
      onError?.('Không thể kết nối tới máy chủ Google Identity Services. Vui lòng kiểm tra kết nối mạng.');
      return;
    }

    const tokenClient = gsi.initTokenClient({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      scope: 'openid email profile',
      hosted_domain: 'vku.udn.vn',
      prompt: 'select_account',
      callback: async (tokenResponse: any) => {
        if (tokenResponse?.error) {
          if (tokenResponse.error !== 'popup_closed_by_user') {
            onError?.(`Xác thực Google không thành công: ${tokenResponse.error_description || tokenResponse.error}`);
          }
          return;
        }

        const accessToken = tokenResponse?.access_token;
        if (!accessToken) {
          onError?.('Không nhận được mã xác thực từ Google.');
          return;
        }

        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (!res.ok) {
            onError?.('Không thể tải thông tin hồ sơ từ máy chủ Google.');
            return;
          }
          const profile = await res.json();
          const email = (profile?.email || '').trim().toLowerCase();

          if (!email.endsWith('@vku.udn.vn')) {
            onError?.(
              `Tài khoản ${email} không thuộc tổ chức VKU. Vui lòng chọn tài khoản email sinh viên/giảng viên có đuôi @vku.udn.vn.`
            );
            return;
          }

          onSuccess({
            email,
            password: `google_verified_${profile?.sub || Date.now()}`,
            name: profile?.name || undefined,
            avatar: profile?.picture || undefined,
            resetPassword: true,
          });
        } catch (_err) {
          onError?.('Lỗi kết nối khi lấy thông tin tài khoản Google VKU.');
        }
      },
      error_callback: (err: any) => {
        if (err?.type !== 'popup_closed') {
          onError?.('Cửa sổ đăng nhập Google đã đóng hoặc bị trình duyệt chặn.');
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  };

  if ((window as any).google?.accounts?.oauth2) {
    launchGsiTokenFlow();
    return true;
  }

  ensureGoogleGsiScriptLoaded().then((ready) => {
    if (ready) {
      launchGsiTokenFlow();
    } else {
      onError?.('Không thể tải thư viện xác thực Google (accounts.google.com).');
    }
  });

  return true;
}
