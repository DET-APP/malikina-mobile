import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface PrayerTimes {
  Fajr: string; Sunrise: string; Dhuhr: string; Asr: string; Maghrib: string; Isha: string;
}

const PRAYERS: { key: keyof PrayerTimes; label: string; arabic: string; icon: string }[] = [
  { key: 'Fajr',    label: 'Fajr',    arabic: 'الفجر',   icon: 'moon-outline' },
  { key: 'Sunrise', label: 'Lever',   arabic: 'الشروق',  icon: 'sunny-outline' },
  { key: 'Dhuhr',   label: 'Dhuhr',   arabic: 'الظهر',   icon: 'sunny' },
  { key: 'Asr',     label: 'Asr',     arabic: 'العصر',   icon: 'partly-sunny-outline' },
  { key: 'Maghrib', label: 'Maghrib', arabic: 'المغرب',  icon: 'partly-sunny' },
  { key: 'Isha',    label: 'Isha',    arabic: 'العشاء',  icon: 'moon' },
];

function getNextPrayer(times: PrayerTimes): keyof PrayerTimes {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  for (const p of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as (keyof PrayerTimes)[]) {
    const [h, m] = times[p].split(':').map(Number);
    if (h * 60 + m > cur) return p;
  }
  return 'Fajr';
}

export default function PrayerScreen() {
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [city, setCity] = useState('Dakar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<keyof PrayerTimes | null>(null);

  const today = new Date();
  const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 14.6928, lng = -17.4467, cityName = 'Dakar';
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        lat = loc.coords.latitude; lng = loc.coords.longitude;
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        cityName = geo[0]?.city || geo[0]?.region || 'Position actuelle';
      }
      setCity(cityName);
      const res = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=2`);
      const data = await res.json();
      if (data.code === 200) {
        const t = data.data.timings;
        const pt: PrayerTimes = { Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
        setTimes(pt);
        setNextPrayer(getNextPrayer(pt));
      }
    } catch { setError('Impossible de charger les horaires'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const nextInfo = times && nextPrayer ? PRAYERS.find(p => p.key === nextPrayer) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerArabic}>أوقات الصلاة</Text>
            <Text style={styles.headerTitle}>Horaires de Prière</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={load}>
            <Ionicons name="refresh" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.7)" />
          <Text style={styles.locationText}>{city}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : times ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Hero card */}
          {nextInfo && (
            <View style={styles.hero}>
              <View style={styles.heroLeft}>
                <View style={styles.heroIcon}>
                  <Ionicons name={nextInfo.icon as any} size={26} color={Colors.white} />
                </View>
                <View>
                  <Text style={styles.heroLabel}>Prochaine prière</Text>
                  <Text style={styles.heroName}>{nextInfo.label}</Text>
                  <Text style={styles.heroArabic}>{nextInfo.arabic}</Text>
                </View>
              </View>
              <Text style={styles.heroTime}>{times[nextPrayer!]}</Text>
            </View>
          )}

          {/* Prayer rows */}
          <View style={styles.list}>
            {PRAYERS.map(p => {
              const active = p.key === nextPrayer;
              return (
                <View key={p.key} style={[styles.row, active && styles.rowActive]}>
                  <View style={[styles.rowIcon, active && styles.rowIconActive]}>
                    <Ionicons name={p.icon as any} size={18} color={active ? Colors.white : Colors.primary} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowName, active && styles.rowNameActive]}>{p.label}</Text>
                    <Text style={styles.rowArabic}>{p.arabic}</Text>
                  </View>
                  {active && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>En cours</Text>
                    </View>
                  )}
                  <Text style={[styles.rowTime, active && styles.rowTimeActive]}>{times[p.key]}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerArabic: { fontFamily: 'Amiri', fontSize: 26, color: Colors.goldLight },
  headerTitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  locationText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textMuted },
  errorText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: Colors.white, fontWeight: '600' },

  scroll: { paddingBottom: 24 },

  hero: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: Colors.surface, borderRadius: 18, padding: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.gold + '55',
    shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIcon: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  heroLabel: { fontSize: 11, color: Colors.textMuted },
  heroName: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 2 },
  heroArabic: { fontFamily: 'Amiri', fontSize: 17, color: Colors.primary, marginTop: 2 },
  heroTime: { fontSize: 34, fontWeight: '700', color: Colors.primary },

  list: { marginTop: 16, paddingHorizontal: 16, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  rowActive: { borderColor: Colors.gold, borderWidth: 2 },
  rowIcon: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rowIconActive: { backgroundColor: Colors.primary },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  rowNameActive: { color: Colors.primary, fontWeight: '700' },
  rowArabic: { fontFamily: 'Amiri', fontSize: 14, color: Colors.textMuted, marginTop: 1 },
  badge: {
    backgroundColor: Colors.gold + '22', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.gold + '55',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.gold },
  rowTime: { fontSize: 17, fontWeight: '700', color: Colors.textSecondary },
  rowTimeActive: { color: Colors.primary },
});
