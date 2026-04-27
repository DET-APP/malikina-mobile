import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah',
];

const GREGORIAN_MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function toHijri(date: Date): { day: number; month: number; year: number } {
  // Approximate Hijri conversion
  const jd = Math.floor((14 + 153 * (date.getMonth() + 1 > 2 ? date.getMonth() - 1 : date.getMonth() + 10) + 5) / 5)
    + date.getDate() + Math.floor((153 * (date.getMonth() + 1 > 2 ? date.getMonth() - 1 : date.getMonth() + 10) + 2) / 5)
    + Math.floor(365.25 * (date.getFullYear() + (date.getMonth() + 1 > 2 ? 0 : -1) + 4716))
    - Math.floor((date.getFullYear() + (date.getMonth() + 1 > 2 ? 0 : -1) + 4716 + (date.getMonth() + 1 > 2 ? 0 : -1)) / 100)
    + Math.floor(Math.floor((date.getFullYear() + (date.getMonth() + 1 > 2 ? 0 : -1) + 4716) / 100) / 4) - 1524;

  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
    + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { day, month, year };
}

const ISLAMIC_EVENTS: Record<string, string> = {
  '1-1': 'Nouvel An Hijri',
  '10-1': 'Achoura',
  '12-3': 'Mawlid an-Nabi',
  '27-7': 'Isra et Mi\'raj',
  '1-9': 'Début Ramadan',
  '27-9': 'Nuit du Destin (Laylat al-Qadr)',
  '1-10': 'Aïd al-Fitr',
  '9-12': 'Jour d\'Arafat',
  '10-12': 'Aïd al-Adha',
};

export default function CalendarScreen() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const hijriToday = toHijri(today);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerArabic}>التقويم الإسلامي</Text>
        <Text style={styles.headerTitle}>Calendrier Islamique</Text>
        <Text style={styles.hijriToday}>
          {hijriToday.day} {HIJRI_MONTHS[hijriToday.month - 1]} {hijriToday.year} H
        </Text>
      </View>

      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{GREGORIAN_MONTHS[currentMonth]} {currentYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.daysRow}>
        {DAYS.map(d => (
          <Text key={d} style={[styles.dayHeader, d === 'Ven' && styles.friday]}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e-${i}`} style={styles.emptyCell} />;
          const date = new Date(currentYear, currentMonth, day);
          const hijri = toHijri(date);
          const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
          const isFriday = date.getDay() === 5;
          const eventKey = `${hijri.day}-${hijri.month}`;
          const hasEvent = ISLAMIC_EVENTS[eventKey];

          return (
            <View key={day} style={[styles.cell, isToday && styles.cellToday, isFriday && styles.cellFriday]}>
              <Text style={[styles.cellDay, isToday && styles.cellDayToday, isFriday && styles.cellDayFriday]}>{day}</Text>
              <Text style={[styles.cellHijri, isToday && styles.cellHijriToday]}>{hijri.day}</Text>
              {hasEvent && <View style={styles.eventDot} />}
            </View>
          );
        })}
      </View>

      {/* Events this month */}
      <View style={styles.eventsSection}>
        <Text style={styles.eventsTitle}>Événements du mois</Text>
        {Object.entries(ISLAMIC_EVENTS).map(([key, name]) => {
          const [d, m] = key.split('-').map(Number);
          const hijriFirstOfMonth = toHijri(new Date(currentYear, currentMonth, 1));
          if (m === hijriFirstOfMonth.month) {
            return (
              <View key={key} style={styles.eventRow}>
                <View style={styles.eventBullet} />
                <Text style={styles.eventName}>{name}</Text>
                <Text style={styles.eventDate}>{d} {HIJRI_MONTHS[m - 1]}</Text>
              </View>
            );
          }
          return null;
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 12, backgroundColor: Colors.surface },
  headerArabic: { fontFamily: 'Amiri', fontSize: 22, color: Colors.gold },
  headerTitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 2 },
  hijriToday: { fontSize: 13, color: Colors.gold, marginTop: 4 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  navBtn: { padding: 8 },
  monthLabel: { fontSize: 17, color: Colors.text, fontWeight: '700' },
  daysRow: { flexDirection: 'row', paddingHorizontal: 8 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 12, color: Colors.textMuted, fontWeight: '600', paddingVertical: 4 },
  friday: { color: Colors.gold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  cell: { width: '14.28%', aspectRatio: 0.85, alignItems: 'center', justifyContent: 'center', padding: 2 },
  emptyCell: { width: '14.28%', aspectRatio: 0.85 },
  cellToday: { backgroundColor: Colors.primary, borderRadius: 8 },
  cellFriday: { backgroundColor: Colors.primaryDark + '66', borderRadius: 8 },
  cellDay: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  cellDayToday: { color: Colors.white, fontWeight: '700' },
  cellDayFriday: { color: Colors.gold },
  cellHijri: { fontSize: 9, color: Colors.textMuted, marginTop: 1 },
  cellHijriToday: { color: Colors.white },
  eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.gold, marginTop: 1 },
  eventsSection: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 8 },
  eventsTitle: { fontSize: 14, color: Colors.textSecondary, fontWeight: '700', marginBottom: 10 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  eventBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gold },
  eventName: { flex: 1, fontSize: 13, color: Colors.text },
  eventDate: { fontSize: 12, color: Colors.textMuted },
});
