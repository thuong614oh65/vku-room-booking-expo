import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, Pressable } from 'react-native';
import { useBookingStore } from '../store/useBookingStore';
import { Building, Equipment } from '../types/booking';

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

export const FilterBar: React.FC = () => {
  const { filters, setSearchQuery, setBuildingFilter, setMinCapacityFilter, toggleEquipmentFilter, resetFilters } =
    useBookingStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.building !== 'ALL' || filters.minCapacity !== null || filters.equipment.length > 0 || filters.searchQuery !== '';

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
            ⚡ Bộ lọc {filters.equipment.length + (filters.building !== 'ALL' ? 1 : 0) + (filters.minCapacity ? 1 : 0) > 0 ? `(${filters.equipment.length + (filters.building !== 'ALL' ? 1 : 0) + (filters.minCapacity ? 1 : 0)})` : ''}
          </Text>
        </Pressable>
      </View>

      {/* Building Horizontal Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buildingScroll} contentContainerStyle={styles.buildingScrollContent}>
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

      {/* Expanded Filters Panel */}
      {isExpanded && (
        <View style={styles.expandedPanel}>
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
    marginBottom: 10,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
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
    marginTop: 4,
    paddingVertical: 6,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '700',
  },
});
