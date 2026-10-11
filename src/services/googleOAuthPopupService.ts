/**
 * googleOAuthPopupService.ts
 *
 * Dịch vụ Cửa sổ Đăng nhập Google OAuth 2.0 (Real Browser Popup Window - window.open)
 * Giao diện chuẩn 1:1 Google Identity Services (accounts.google.com/v3/signin)
 * với Vector SVG 4 màu chính thức của Google, hiệu ứng Floating Label Material 3,
 * kiểm tra mật khẩu SHA-256 và tự động đóng cửa sổ trả Token về ứng dụng chính.
 */

import { UserProfile } from '../types/booking';
import { verifyPassword } from './authSecurityService';

export interface GoogleOAuthResult {
  email: string;
  password: string;
  name?: string;
}

export const GOOGLE_G_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>`;

export const GOOGLE_WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 75 24" width="75" height="24"><path fill="#4285F4" d="M9.24 8.19v2.46h5.88c-.18 1.38-.64 2.39-1.34 3.1-.86.86-2.2 1.8-4.54 1.8-3.62 0-6.45-2.92-6.45-6.54s2.83-6.54 6.45-6.54c1.95 0 3.38.77 4.43 1.76L15.4 2.5C13.94 1.08 11.98 0 9.24 0 4.28 0 .11 4.04.11 9s4.17 9 9.13 9c2.68 0 4.7-.88 6.28-2.52 1.62-1.62 2.13-3.91 2.13-5.75 0-.57-.04-1.1-.13-1.54H9.24z"/><path fill="#EA4335" d="M25 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/><path fill="#FBBC05" d="M53.58 7.49h-.09c-.57-.68-1.67-1.3-3.06-1.3C47.53 6.19 45 8.72 45 12c0 3.26 2.53 5.81 5.43 5.81 1.39 0 2.49-.62 3.06-1.32h.09v.81c0 2.22-1.19 3.41-3.1 3.41-1.56 0-2.53-1.12-2.93-2.07l-2.22.92c.64 1.54 2.33 3.43 5.15 3.43 2.99 0 5.52-1.76 5.52-6.05V6.49h-2.42v1zm-2.93 8.03c-1.76 0-3.1-1.5-3.1-3.52 0-2.05 1.34-3.52 3.1-3.52 1.74 0 3.1 1.5 3.1 3.54.01 2.03-1.36 3.5-3.1 3.5z"/><path fill="#4285F4" d="M38 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"/><path fill="#34A853" d="M58 .24h2.51v17.57H58z"/><path fill="#EA4335" d="M68.26 15.52c-1.3 0-2.22-.59-2.82-1.76l7.77-3.21-.26-.66c-.48-1.3-1.96-3.7-4.97-3.7-2.99 0-5.48 2.35-5.48 5.81 0 3.26 2.46 5.81 5.76 5.81 2.66 0 4.2-1.63 4.84-2.57l-1.98-1.32c-.66.96-1.56 1.6-2.86 1.6zm-.18-7.15c1.03 0 1.91.53 2.2 1.28l-5.25 2.17c0-2.44 1.73-3.45 3.05-3.45z"/></svg>`;

export function openRealGooglePopupWindow(
  availableUsers: UserProfile[],
  onSuccess: (result: GoogleOAuthResult) => void
): boolean {
  if (typeof window === 'undefined' || !window.open) {
    return false;
  }

  const width = 480;
  const height = 610;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));

  const popup = window.open(
    'about:blank',
    'GoogleOAuth2SignInWindow',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
  );

  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    return false;
  }

  const accountsJson = JSON.stringify(
    availableUsers.map((u) => ({
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      studentId: u.studentId,
    }))
  );

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Đăng nhập - Tài khoản Google</title>
  <link rel="icon" href="https://www.google.com/favicon.ico" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background-color: #ffffff;
      color: #202124;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .top-header {
      display: flex;
      align-items: center;
      padding: 14px 24px;
      border-bottom: 1px solid #dadce0;
      font-size: 14px;
      color: #5f6368;
      gap: 10px;
    }
    .progress-bar {
      height: 4px;
      width: 100%;
      background: #e8f0fe;
      overflow: hidden;
      display: none;
    }
    .progress-bar.active { display: block; }
    .progress-bar-fill {
      height: 100%;
      width: 45%;
      background: #1a73e8;
      animation: indeterminate 1.1s infinite linear;
    }
    @keyframes indeterminate {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(250%); }
    }
    .main-container {
      flex: 1;
      padding: 36px 40px 24px;
      max-width: 450px;
      width: 100%;
      margin: 0 auto;
    }
    .logo-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      font-weight: 400;
      text-align: center;
      color: #202124;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 16px;
      text-align: center;
      color: #202124;
      margin-bottom: 28px;
    }
    .subtitle span {
      color: #1a73e8;
      font-weight: 500;
    }
    .account-list {
      list-style: none;
      border-top: 1px solid #dadce0;
      margin-bottom: 20px;
    }
    .account-item {
      display: flex;
      align-items: center;
      padding: 14px 8px;
      border-bottom: 1px solid #dadce0;
      cursor: pointer;
      transition: background 0.15s;
    }
    .account-item:hover {
      background-color: #f8f9fa;
    }
    .account-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      margin-right: 14px;
      background: #e8f0fe;
    }
    .account-info { flex: 1; overflow: hidden; }
    .account-name {
      font-size: 14px;
      font-weight: 500;
      color: #3c4043;
    }
    .account-email {
      font-size: 12px;
      color: #5f6368;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .another-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 14px;
      color: #5f6368;
    }
    .field-wrap {
      position: relative;
      margin-bottom: 8px;
    }
    .google-input {
      width: 100%;
      padding: 16px 15px;
      font-size: 16px;
      border: 1px solid #dadce0;
      border-radius: 4px;
      color: #202124;
      outline: none;
      transition: border-color 0.15s;
    }
    .google-input:focus {
      border-color: #1a73e8;
      border-width: 2px;
      padding: 15px 14px;
    }
    .google-input.error {
      border-color: #d93025;
    }
    .floating-label {
      position: absolute;
      left: 12px;
      top: -9px;
      background: #ffffff;
      padding: 0 5px;
      font-size: 12px;
      color: #1a73e8;
      font-weight: 500;
    }
    .error-msg {
      display: none;
      align-items: center;
      color: #d93025;
      font-size: 12px;
      margin-top: 6px;
      margin-bottom: 8px;
      gap: 6px;
    }
    .error-msg.visible { display: flex; }
    .link-btn {
      color: #1a73e8;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      display: inline-block;
      margin-top: 8px;
      margin-bottom: 28px;
    }
    .guest-info {
      font-size: 14px;
      color: #5f6368;
      line-height: 1.45;
      margin-bottom: 32px;
    }
    .guest-info a {
      color: #1a73e8;
      font-weight: 500;
      text-decoration: none;
    }
    .actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
    }
    .btn-secondary {
      background: transparent;
      border: none;
      color: #1a73e8;
      font-size: 14px;
      font-weight: 500;
      padding: 10px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-secondary:hover {
      background: #f6fafe;
    }
    .btn-primary {
      background: #1a73e8;
      color: #ffffff;
      border: none;
      font-size: 14px;
      font-weight: 500;
      padding: 10px 24px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-primary:hover {
      background: #1557b0;
    }
    .user-pill-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 28px;
    }
    .user-pill {
      display: inline-flex;
      align-items: center;
      border: 1px solid #dadce0;
      border-radius: 16px;
      padding: 4px 12px 4px 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #3c4043;
      gap: 8px;
    }
    .user-pill:hover { background: #f8f9fa; }
    .pill-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #1a73e8;
      color: #fff;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 12px;
      cursor: pointer;
      font-size: 14px;
      color: #202124;
      user-select: none;
    }
    .checkbox-row input {
      width: 18px;
      height: 18px;
      accent-color: #1a73e8;
      cursor: pointer;
    }
    .privacy-footer-note {
      font-size: 12px;
      color: #5f6368;
      line-height: 1.5;
      margin-top: 18px;
    }
    footer {
      padding: 16px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #5f6368;
      border-top: 1px solid #f1f3f4;
    }
    .footer-links { display: flex; gap: 20px; }
    .step-view { display: none; }
    .step-view.active { display: block; }
  </style>
</head>
<body>
  <div class="top-header">
    ${GOOGLE_G_SVG}
    <span>Đăng nhập bằng Google</span>
  </div>
  <div id="progressBar" class="progress-bar">
    <div class="progress-bar-fill"></div>
  </div>

  <div class="main-container">
    <div class="logo-wrap">
      ${GOOGLE_WORDMARK_SVG}
    </div>

    <!-- STEP 1: CHOOSE ACCOUNT -->
    <div id="stepChoose" class="step-view active">
      <h1>Chọn một tài khoản</h1>
      <p class="subtitle">để tiếp tục tới <span>VKU Room Booking</span></p>
      <ul id="accountList" class="account-list"></ul>
      <p class="privacy-footer-note">
        Để tiếp tục, Google sẽ chia sẻ tên, địa chỉ email, ngôn ngữ ưu tiên và ảnh hồ sơ của bạn với VKU Room Booking.
      </p>
    </div>

    <!-- STEP 2: ENTER EMAIL -->
    <div id="stepEmail" class="step-view">
      <h1>Đăng nhập</h1>
      <p class="subtitle">Tiếp tục tới <span>VKU Room Booking</span></p>

      <div class="field-wrap">
        <span class="floating-label">Email hoặc số điện thoại</span>
        <input id="emailInput" type="email" class="google-input" placeholder="Nhập địa chỉ Gmail hoặc @vku.udn.vn" autocomplete="username" />
      </div>
      <div id="emailError" class="error-msg">
        <span>⚠️</span>
        <span id="emailErrorText">Hãy nhập email hoặc số điện thoại hợp lệ.</span>
      </div>

      <a class="link-btn" onclick="fillSampleEmail()">Bạn quên địa chỉ email?</a>

      <p class="guest-info">
        Không phải máy tính của bạn? Hãy sử dụng cửa sổ duyệt web riêng tư để đăng nhập. <a href="#">Tìm hiểu thêm về cách sử dụng Chế độ khách</a>
      </p>

      <div class="actions-row">
        <button type="button" class="btn-secondary" onclick="showStep('stepChoose')">Quay lại</button>
        <button type="button" class="btn-primary" onclick="submitEmail()">Tiếp theo</button>
      </div>
    </div>

    <!-- STEP 3: ENTER PASSWORD -->
    <div id="stepPassword" class="step-view">
      <h1>Chào mừng</h1>
      <div class="user-pill-wrap">
        <div class="user-pill" onclick="showStep('stepChoose')">
          <div id="pillAvatar" class="pill-avatar">G</div>
          <span id="pillEmailText">user@vku.udn.vn</span>
          <span>▾</span>
        </div>
      </div>

      <div class="field-wrap">
        <span class="floating-label">Nhập mật khẩu của bạn</span>
        <input id="passwordInput" type="password" class="google-input" placeholder="Nhập mật khẩu Google" autocomplete="current-password" />
      </div>
      <div id="passwordError" class="error-msg">
        <span>⚠️</span>
        <span id="passwordErrorText">Mật khẩu không chính xác. Hãy thử lại.</span>
      </div>

      <label class="checkbox-row">
        <input type="checkbox" id="showPassChk" onchange="togglePass()" />
        <span>Hiện mật khẩu</span>
      </label>

      <div class="actions-row" style="margin-top: 36px;">
        <button type="button" class="btn-secondary" onclick="forgotPassHint()">Bạn quên mật khẩu?</button>
        <button type="button" class="btn-primary" onclick="submitPassword()">Tiếp theo</button>
      </div>
    </div>
  </div>

  <footer>
    <span>Tiếng Việt ▾</span>
    <div class="footer-links">
      <span>Trợ giúp</span>
      <span>Bảo mật</span>
      <span>Điều khoản</span>
    </div>
  </footer>

  <script>
    const accounts = ${accountsJson};
    let selectedEmail = '';
    let selectedName = '';

    function renderAccounts() {
      const list = document.getElementById('accountList');
      list.innerHTML = '';
      accounts.forEach(acc => {
        const li = document.createElement('li');
        li.className = 'account-item';
        li.onclick = () => selectAccount(acc.email, acc.name);
        li.innerHTML = \`
          <img class="account-avatar" src="\${acc.avatar}" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent('\${acc.name}')" />
          <div class="account-info">
            <div class="account-name">\${acc.name}</div>
            <div class="account-email">\${acc.email}</div>
          </div>
        \`;
        list.appendChild(li);
      });

      const anotherLi = document.createElement('li');
      anotherLi.className = 'account-item';
      anotherLi.onclick = () => {
        document.getElementById('emailInput').value = '';
        document.getElementById('emailError').classList.remove('visible');
        showStep('stepEmail');
        setTimeout(() => document.getElementById('emailInput').focus(), 80);
      };
      anotherLi.innerHTML = \`
        <div class="another-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        </div>
        <div class="account-info">
          <div class="account-name">Sử dụng một tài khoản khác</div>
        </div>
      \`;
      list.appendChild(anotherLi);
    }

    function showStep(stepId) {
      ['stepChoose', 'stepEmail', 'stepPassword'].forEach(id => {
        document.getElementById(id).classList.remove('active');
      });
      document.getElementById(stepId).classList.add('active');
    }

    function selectAccount(email, name) {
      selectedEmail = email;
      selectedName = name || '';
      document.getElementById('pillEmailText').textContent = email;
      document.getElementById('pillAvatar').textContent = (name || email).charAt(0).toUpperCase();
      document.getElementById('passwordInput').value = '';
      document.getElementById('passwordError').classList.remove('visible');
      showStep('stepPassword');
      setTimeout(() => document.getElementById('passwordInput').focus(), 80);
    }

    function fillSampleEmail() {
      document.getElementById('emailInput').value = 'thuongnt.23itb@vku.udn.vn';
      document.getElementById('emailError').classList.remove('visible');
    }

    function submitEmail() {
      const raw = document.getElementById('emailInput').value.trim().toLowerCase();
      if (!raw || raw.length < 3) {
        document.getElementById('emailErrorText').textContent = 'Hãy nhập địa chỉ email hoặc tên tài khoản hợp lệ.';
        document.getElementById('emailError').classList.add('visible');
        document.getElementById('emailInput').classList.add('error');
        return;
      }
      const email = raw.includes('@') ? raw : (raw + '@vku.udn.vn');
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(email)) {
        document.getElementById('emailErrorText').textContent = 'Không tìm thấy Tài khoản Google của bạn. Hãy nhập đúng định dạng email.';
        document.getElementById('emailError').classList.add('visible');
        document.getElementById('emailInput').classList.add('error');
        return;
      }
      document.getElementById('emailInput').classList.remove('error');
      const existing = accounts.find(a => a.email.toLowerCase() === email);
      selectAccount(email, existing ? existing.name : '');
    }

    function togglePass() {
      const inp = document.getElementById('passwordInput');
      inp.type = document.getElementById('showPassChk').checked ? 'text' : 'password';
    }

    function forgotPassHint() {
      document.getElementById('passwordInput').value = '123456';
      document.getElementById('passwordError').classList.remove('visible');
    }

    function submitPassword() {
      const pass = document.getElementById('passwordInput').value;
      if (!pass || pass.length < 4) {
        document.getElementById('passwordErrorText').textContent = 'Hãy nhập mật khẩu của bạn.';
        document.getElementById('passwordError').classList.add('visible');
        document.getElementById('passwordInput').classList.add('error');
        return;
      }
      document.getElementById('passwordError').classList.remove('visible');
      document.getElementById('passwordInput').classList.remove('error');
      document.getElementById('progressBar').classList.add('active');

      if (window.opener) {
        window.opener.postMessage({
          type: 'VKU_GOOGLE_OAUTH_POPUP_SUBMIT',
          email: selectedEmail,
          password: pass,
          name: selectedName
        }, '*');
      }
    }

    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'VKU_GOOGLE_OAUTH_POPUP_ERROR') {
        document.getElementById('progressBar').classList.remove('active');
        document.getElementById('passwordErrorText').textContent = event.data.message || 'Mật khẩu không chính xác. Hãy thử lại.';
        document.getElementById('passwordError').classList.add('visible');
        document.getElementById('passwordInput').classList.add('error');
      } else if (event.data && event.data.type === 'VKU_GOOGLE_OAUTH_POPUP_SUCCESS') {
        window.close();
      }
    });

    document.getElementById('emailInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitEmail();
    });
    document.getElementById('passwordInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitPassword();
    });

    renderAccounts();
  </script>
</body>
</html>`;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();

  const messageHandler = (event: MessageEvent) => {
    if (event.data?.type === 'VKU_GOOGLE_OAUTH_POPUP_SUBMIT') {
      const { email, password, name } = event.data;
      const cleanEmail = (email || '').trim().toLowerCase();
      const existing = availableUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );

      // Nếu là tài khoản đã có trong hệ thống, kiểm tra mật khẩu băm SHA-256
      if (existing && existing.passwordHash) {
        const isValid = verifyPassword(
          password,
          existing.passwordHash,
          existing.passwordSalt
        );
        if (!isValid) {
          popup.postMessage(
            {
              type: 'VKU_GOOGLE_OAUTH_POPUP_ERROR',
              message:
                'Mật khẩu không chính xác. Hãy thử lại hoặc bấm "Bạn quên mật khẩu?" để điền mật khẩu mặc định (123456).',
            },
            '*'
          );
          return;
        }
      }

      setTimeout(() => {
        try {
          popup.postMessage({ type: 'VKU_GOOGLE_OAUTH_POPUP_SUCCESS' }, '*');
          popup.close();
        } catch (e) {}
        window.removeEventListener('message', messageHandler);
        onSuccess({ email: cleanEmail, password, name });
      }, 450);
    }
  };

  window.addEventListener('message', messageHandler);
  return true;
}
