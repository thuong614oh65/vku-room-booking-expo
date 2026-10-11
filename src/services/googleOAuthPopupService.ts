/**
 * googleOAuthPopupService.ts
 *
 * Dịch vụ Đăng nhập Google OAuth 2.0 Chính Chủ (Google Identity Services - accounts.google.com)
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

export const GOOGLE_WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 75 24" width="75" height="24"><path fill="#4285F4" d="M9.24 8.19v2.46h5.88c-.18 1.38-.64 2.39-1.34 3.1-.86.86-2.2 1.8-4.54 1.8-3.62 0-6.45-2.92-6.45-6.54s2.83-6.54 6.45-6.54c1.95 0 3.38.77 4.43 1.76L15.4 2.5C13.94 1.08 11.98 0 9.24 0 4.28 0 .11 4.04.11 9s4.17 9 9.13 9c2.68 0 4.7-.88 6.28-2.52 1.62-1.62 2.13-3.91 2.13-5.75 0-.57-.04-1.1-.13-1.54H9.24z"/><path fill="#EA4335" d="M25 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/><path fill="#4285F4" d="M53.58 7.49h-.09c-.57-.68-1.67-1.3-3.06-1.3C47.53 6.19 45 8.72 45 12c0 3.26 2.53 5.81 5.43 5.81 1.39 0 2.49-.62 3.06-1.32h.09v.81c0 2.22-1.19 3.41-3.1 3.41-1.56 0-2.53-1.12-2.93-2.07l-2.22.92c.64 1.54 2.33 3.43 5.15 3.43 2.99 0 5.52-1.76 5.52-6.05V6.49h-2.42v1zm-2.93 8.03c-1.76 0-3.1-1.5-3.1-3.52 0-2.05 1.34-3.52 3.1-3.52 1.74 0 3.1 1.5 3.1 3.54.01 2.03-1.36 3.5-3.1 3.5z"/><path fill="#FBBC05" d="M38 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/><path fill="#34A853" d="M58 .24h2.51v17.57H58z"/><path fill="#EA4335" d="M68.26 15.52c-1.3 0-2.22-.59-2.82-1.76l7.77-3.21-.26-.66c-.48-1.3-1.96-3.7-4.97-3.7-2.99 0-5.48 2.35-5.48 5.81 0 3.26 2.46 5.81 5.76 5.81 2.66 0 4.2-1.63 4.84-2.57l-1.98-1.32c-.66.96-1.56 1.6-2.86 1.6zm-.18-7.15c1.03 0 1.91.53 2.2 1.28l-5.25 2.17c0-2.44 1.73-3.45 3.05-3.45z"/></svg>`;

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

export function openRealGooglePopupWindow(
  _availableUsers: UserProfile[],
  onSuccess: (result: GoogleOAuthResult) => void,
  onError?: (errorMessage: string) => void
): boolean {
  if (typeof window === 'undefined') return false;

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
