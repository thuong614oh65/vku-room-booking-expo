import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Pressable } from 'react-native';
import { useBookingStore } from '../store/useBookingStore';
import { Building, Equipment } from '../types/booking';
import { TIME_SLOTS } from '../data/roomsData';

const BUILDINGS: (Building | 'ALL')[] = ['ALL', 'Khu V', 'Khu K', 'Khu B', 'Khu A', 'Khu C', 'Thư viện'];

const CAPACITIES: { label: string; value: number | null }[] = [
  { label: 'Tất cả sức chứa', value: null },
  { label: '≥ 6 người', value: 6 },
  { label: '≥ 15 người', value: 15 },
  { label: '≥ 20 người', value: 20 },
];

const EQUIPMENTS: { label: string; value: Equipment }[] = [
  { label: '🖥️ High-spec PC', value: 'High-spec PC' },
  { label: '📽️ Máy chiếu', value: 'Projector' },
  { label: '❄️ Điều hòa', value: 'AC' },
  { label: '📋 Bảng từ', value: 'Whiteboard' },
];

const getNext7Days = () => {
  const list: { date: string | null; label: string }[] = [{ date: null, label: 'Tất cả ngày' }];
  const today = new Date();
  const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const fullDate = `${yyyy}-${mm}-${dd}`;
    const dayLabel = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : DAYS[d.getDay()];
    list.push({
      date: fullDate,
      label: `${dayLabel} (${dd}/${mm})`,
    });
  }
  return list;
};

export const FilterBar: React.FC = () => {
  const {
    filters,
    setSearchQuery,
    setBuildingFilter,
    setMinCapacityFilter,
    toggleEquipmentFilter,
    setDateFilter,
    setSlotFilter,
    resetFilters,
  } = useBookingStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const dates = useMemo(() => getNext7Days(), []);

  const activeFilterCount =
    (filters.building !== 'ALL' ? 1 : 0) +
    (filters.minCapacity !== null ? 1 : 0) +
    filters.equipment.length +
    (filters.date !== null ? 1 : 0) +
    (filters.slotId !== null ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0 || filters.searchQuery !== '';

  const activeSlotLabel = filters.slotId
    ? TIME_SLOTS.find((s) => s.id === filters.slotId)?.label || filters.slotId
    : null;

  return (
    <View style={styles.container}>
      {/* Search Box */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm mã phòng VKU (VD: V.A201, K.A203, B.201, LIB...)"
            placeholderTextColor="#94a3b8"
            value={filters.searchQuery}
            onChangeText={setSearchQuery}
          />
          {filters.searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          style={[styles.filterToggleBtn, (isExpanded || hasActiveFilters) && styles.filterToggleBtnActive]}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={[styles.filterToggleIcon, (isExpanded || hasActiveFilters) && styles.filterToggleIconActive]}>
            ⚡ Bộ lọc {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
          </Text>
        </Pressable>
      </View>

      {/* Building Horizontal Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.buildingScroll}
        contentContainerStyle={styles.buildingScrollContent}
      >
        {BUILDINGS.map((b) => {
          const isSelected = filters.building === b;
          return (
            <Pressable
              key={b}
              style={[styles.buildingChip, isSelected && styles.buildingChipActive]}
              onPress={() => setBuildingFilter(b)}
            >
              <Text style={[styles.buildingChipText, isSelected && styles.buildingChipTextActive]}>
                {b === 'ALL' ? '🏢 Tất Cả Tòa Nhà' : b}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Active Date & Time Filter Indicator Bar */}
      {(filters.date || filters.slotId) && (
        <View style={styles.activeDateTimeBar}>
          <Text style={styles.activeDateTimeText}>
            🎯 Đang lọc phòng trống: {filters.date ? `Ngày ${filters.date}` : 'Hôm nay'}
            {activeSlotLabel ? ` • ${activeSlotLabel}` : ' • Tất cả ca'}
          </Text>
          <Pressable
            style={styles.clearDateTimeBtn}
            onPress={() => {
              setDateFilter(null);
              setSlotFilter(null);
            }}
          >
            <Text style={styles.clearDateTimeText}>✕ Bỏ lọc giờ</Text>
          </Pressable>
        </View>
      )}

      {/* Expanded Filters Panel */}
      {isExpanded && (
        <View style={styles.expandedPanel}>
          {/* Section 1: Lọc theo Ngày */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>📅 Chọn Ngày Cần Đặt Phòng (7 Ngày Tới):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
              {dates.map((item) => {
                const isSelected = filters.date === item.date;
                return (
                  <Pressable
                    key={item.label}
                    style={[styles.smallChip, isSelected && styles.smallChipActive]}
                    onPress={() => setDateFilter(item.date)}
                  >
                    <Text style={[styles.smallChipText, isSelected && styles.smallChipTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Section 2: Lọc theo Giờ / Ca Học */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>⏰ Chọn Ca Học / Khung Giờ (2 Giờ/Ca):</Text>
            <View style={styles.chipRow}>
              <Pressable
                style={[styles.smallChip, filters.slotId === null && styles.smallChipActive]}
                onPress={() => setSlotFilter(null)}
              >
                <Text style={[styles.smallChipText, filters.slotId === null && styles.smallChipTextActive]}>
                  Tất cả ca
                </Text>
              </Pressable>
              {TIME_SLOTS.map((slot) => {
                const isSelected = filters.slotId === slot.id;
                return (
                  <Pressable
                    key={slot.id}
                    style={[styles.smallChip, isSelected && styles.smallChipActive]}
                    onPress={() => setSlotFilter(slot.id)}
                  >
                    <Text style={[styles.smallChipText, isSelected && styles.smallChipTextActive]}>
                      {slot.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Section 3: Sức Chứa Tối Thiểu */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>👥 Sức Chứa Tối Thiểu:</Text>
            <View style={styles.chipRow}>
              {CAPACITIES.map((cap) => {
                const isSelected = filters.minCapacity === cap.value;
                return (
                  <Pressable
                    key={cap.label}
                    style={[styles.smallChip, isSelected && styles.smallChipActive]}
                    onPress={() => setMinCapacityFilter(cap.value)}
                  >
                    <Text style={[styles.smallChipText, isSelected && styles.smallChipTextActive]}>
                      {cap.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Section 4: Trang Thiết Bị Yêu Cầu */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>🛠️ Trang Thiết Bị Yêu Cầu:</Text>
            <View style={styles.chipRow}>
              {EQUIPMENTS.map((eq) => {
                const isSelected = filters.equipment.includes(eq.value);
                return (
                  <Pressable
                    key={eq.value}
                    style={[styles.smallChip, isSelected && styles.smallChipActive]}
                    onPress={() => toggleEquipmentFilter(eq.value)}
                  >
                    <Text style={[styles.smallChipText, isSelected && styles.smallChipTextActive]}>
                      {eq.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Reset All Filters Button */}
          {hasActiveFilters && (
            <Pressable style={styles.resetBtn} onPress={resetFilters}>
              <Text style={styles.resetBtnText}>🔄 Đặt lại tất cả bộ lọc</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0f172a',
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '700',
  },
  filterToggleBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterToggleBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  filterToggleIcon: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  filterToggleIconActive: {
    color: '#0284c7',
  },
  buildingScroll: {
    marginTop: 10,
  },
  buildingScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  buildingChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  buildingChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  buildingChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  buildingChipTextActive: {
    color: '#ffffff',
  },
  activeDateTimeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeDateTimeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1d4ed8',
    flex: 1,
  },
  clearDateTimeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  clearDateTimeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ef4444',
  },
  expandedPanel: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  horizontalChips: {
    gap: 6,
    paddingVertical: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  smallChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  smallChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  smallChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  smallChipTextActive: {
    color: '#ffffff',
  },
  resetBtn: {
    marginTop: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '700',
  },
});
