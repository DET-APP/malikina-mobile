import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];
const GREGORIAN_MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function toHijri(date: Date) {
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
  return { day: l3 - Math.floor((709 * Math.floor((24 * l3) / 709)) / 24), month: Math.floor((24 * l3) / 709), year: 30 * n + j - 30 };
}

const EVENTS: Record<string, string> = {
  '1-1': 'Nouvel An Hijri', '10-1': 'Achoura', '12-3': 'Mawlid an-Nabi',
  '27-7': "Isra et Mi'raj", '1-9': 'Début Ramadan', '27-9': 'Laylat al-Qadr',
  '1-10': 'Aïd al-Fitr', '9-12': "Jour d'Arafat", '10-12': 'Aïd al-Adha',
};

export default function CalendarScreen() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const hijriToday = toHijri(today);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const monthEvents = Object.entries(EVENTS).filter(([key]) => {
    const [, m] = key.split('-').map(Number);
    return m === toHijri(new Date(year, month, 1)).month;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerArabic}>التقويم الإسلامي</Text>
          <Text style={styles.headerTitle}>Calendrier Islamique</Text>
          <View style={styles.hijriBadge}>
            <Text style={styles.hijriText}>
              {hijriToday.day} {HIJRI_MONTHS[hijriToday.month - 1]} {hijriToday.year} H
            </Text>
          </View>
        </View>

        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prev} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{GREGORIAN_MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={next} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={styles.daysRow}>
          {DAYS.map(d => (
            <Text key={d} style={[styles.dayHeader, d === 'Ven' && styles.friday]}>{d}</Text>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (!day) return <View key={`e-${i}`} style={styles.emptyCell} />;
            const date = new Date(year, month, day);
            const hijri = toHijri(date);
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isFri = date.getDay() === 5;
            const hasEvent = EVENTS[`${hijri.day}-${hijri.month}`];
            return (
              <View key={day} style={[styles.cell, isToday && styles.cellToday, isFri && !isToday && styles.cellFri]}>
                <Text style={[styles.cellDay, isToday && styles.cellDayToday, isFri && !isToday && styles.cellDayFri]}>{day}</Text>
                <Text style={[styles.cellHijri, isToday && styles.cellHijriToday]}>{hijri.day}</Text>
                {hasEvent && <View style={styles.dot} />}
              </View>
            );
          })}
        </View>

        {/* Events */}
        <View style={styles.eventsCard}>
          <Text style={styles.eventsTitle}>Événements du mois</Text>
          {monthEvents.length === 0
            ? <Text style={styles.noEvents}>Aucun événement islamique ce mois-ci</Text>
            : monthEvents.map(([key, name]) => {
                const [d, m] = key.split('-').map(Number);
                return (
                  <View key={key} style={styles.eventRow}>
                    <View style={styles.eventBullet} />
                    <Text style={styles.eventName}>{name}</Text>
                    <Text style={styles.eventDate}>{d} {HIJRI_MONTHS[m - 1]}</Text>
                  </View>
                );
              })
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, alignItems: 'center' },
  headerArabic: { fontFamily: 'Amiri', fontSize: 26, color: Colors.goldLight },
  headerTitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  hijriBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  hijriText: { fontSize: 12, color: Colors.white, fontWeight: '600' },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 17, fontWeight: '700', color: Colors.text },

  daysRow: { flexDirection: 'row', paddingHorizontal: 8, backgroundColor: Colors.surface },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, color: Colors.textMuted, fontWeight: '700', paddingVertical: 6 },
  friday: { color: Colors.gold },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, backgroundColor: Colors.surface, paddingBottom: 8 },
  cell: { width: '14.28%', aspectRatio: 0.85, alignItems: 'center', justifyContent: 'center', padding: 2 },
  emptyCell: { width: '14.28%', aspectRatio: 0.85 },
  cellToday: { backgroundColor: Colors.primary, borderRadius: 10 },
  cellFri: { backgroundColor: Colors.primaryLight, borderRadius: 10 },
  cellDay: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  cellDayToday: { color: Colors.white, fontWeight: '700' },
  cellDayFri: { color: Colors.primary, fontWeight: '600' },
  cellHijri: { fontSize: 9, color: Colors.textMuted, marginTop: 1 },
  cellHijriToday: { color: 'rgba(255,255,255,0.8)' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.gold, marginTop: 1 },

  eventsCard: {
    margin: 16, backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  eventsTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  noEvents: { fontSize: 13, color: Colors.textMuted },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  eventBullet: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.gold },
  eventName: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '500' },
  eventDate: { fontSize: 11, color: Colors.textMuted },
});
