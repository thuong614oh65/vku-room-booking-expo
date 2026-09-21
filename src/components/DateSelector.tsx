import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelectDate }) => {
  // Sinh 7 ngày liên ti?p t? ngày hi?n t?i
  const dates = React.useMemo(() => {
    const list: { fullDate: string; dayOfWeek: string; dayNumber: string; isToday: boolean }[] = [];
    const today = new Date();

    const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const fullDate = `${yyyy}-${mm}-${dd}`;

      list.push({
        fullDate,
        dayOfWeek: i === 0 ? 'Hôm nay' : DAYS[d.getDay()],
        dayNumber: `${dd}/${mm}`,
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.headerLabel}>?? Ch?n ngày d?t phòng (L?ch 7 ngày t?i):</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {dates.map((item) => {
          const isSelected = selectedDate === item.fullDate;
          return (
            <Pressable
              key={item.fullDate}
              style={[
                styles.dateCard,
                isSelected && styles.dateCardSelected,
                item.isToday && !isSelected && styles.dateCardToday,
              ]}
              onPress={() => onSelectDate(item.fullDate)}
            >
              <Text style={[styles.dayOfWeekText, isSelected && styles.textSelected]}>{item.dayOfWeek}</Text>
              <Text style={[styles.dayNumberText, isSelected && styles.textSelected]}>{item.dayNumber}</Text>
              {isSelected && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dateCard: {
    width: 72,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCardToday: {
    borderColor: '#0284c7',
  },
  dateCardSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  dayOfWeekText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 3,
  },
  dayNumberText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  textSelected: {
    color: '#ffffff',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    marginTop: 4,
  },
});
