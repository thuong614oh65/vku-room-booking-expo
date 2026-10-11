/**
 * fieldSurveyLinkService.ts
 *
 * Kết nối liên thông giữa:
 * - Mini Project 2: VKU Room Booking (https://vku-room-booking-17t.pages.dev/)
 * - Mini Project 1: VKU Field Survey - Hệ thống Đánh giá & Khảo sát Thực địa CSVC (https://vku-field-survey-28x.pages.dev/)
 */

import { Linking, Platform } from 'react-native';
import { isEmbeddedWebView, openInExternalSystemBrowser } from './googleOAuthPopupService';

export const VKU_FIELD_SURVEY_BASE_URL = 'https://vku-field-survey-28x.pages.dev/';

export interface FieldSurveyParams {
  roomCode?: string;
  roomName?: string;
  building?: string;
  floor?: string | number;
  studentName?: string;
  studentId?: string;
}

export function buildFieldSurveyUrl(params?: FieldSurveyParams): string {
  if (!params) return VKU_FIELD_SURVEY_BASE_URL;
  const search = new URLSearchParams();
  if (params.roomCode) search.set('room', params.roomCode);
  if (params.roomName) search.set('rname', params.roomName);
  if (params.building) search.set('building', params.building);
  if (params.floor !== undefined && params.floor !== null) {
    search.set('floor', String(params.floor));
  }
  if (params.studentName) search.set('student', params.studentName);
  if (params.studentId) search.set('mssv', params.studentId);
  const qs = search.toString();
  return qs ? `${VKU_FIELD_SURVEY_BASE_URL}?${qs}` : VKU_FIELD_SURVEY_BASE_URL;
}

export function openFieldSurveyEvaluation(params?: FieldSurveyParams): void {
  const url = buildFieldSurveyUrl(params);
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (isEmbeddedWebView()) {
      openInExternalSystemBrowser(url);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  Linking.openURL(url).catch(() => {});
}
