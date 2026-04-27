import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface PrayerTimes {
  Fajr: string; Sunrise: string; Dhuhr: string; Asr: string;
  Maghrib: string; Isha: string;
}

const PRAYER_NAMES: Record<string, string> = {
  Fajr: 'Fajr (Subh)',
  Sunrise: 'Lever du soleil',
  Dhuhr: 'Dhuhr (Zuhr)',
  Asr: 'Asr',
  Maghrib: 'Maghrib',
  Isha: 'Isha',
};

const PRAYER_ICONS: Record<string, string> = {
  Fajr: 'moon', Sunrise: 'sunny', Dhuhr: 'sunny',
  Asr: 'partly-sunny', Maghrib: 'sunset', Isha: 'moon',
};

function getNextPrayer(times: PrayerTimes): string | null {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const keys = Object.keys(times).filter(k => k !== 'Sunrise') as (keyof PrayerTimes)[];
  for (const key of keys) {
    const [h, m] = times[key].split(':').map(Number);
    if (h * 60 + m > current) return key;
  }
  return keys[0];
}

export default function PrayerScreen() {
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [city, setCity] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<string | null>(null);

  const today = new Date();
  const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

  const fetchTimes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 14.6928, lng = -17.4467; // Dakar par défaut
      let cityName = 'Dakar';

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        cityName = geo[0]?.city || geo[0]?.region || 'Position actuelle';
      }

      setCity(cityName);
      const res = await fetch(
        `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=2`
      );
      const data = await res.json();
      if (data.code === 200) {
        const t = data.data.timings;
        const pt: PrayerTimes = {
          Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr,
          Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha,
        };
        setTimes(pt);
        setNextPrayer(getNextPrayer(pt));
      } else {
        throw new Error('API error');
      }
    } catch (e) {
      setError('Impossible de charger les horaires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTimes(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerArabic}>أوقات الصلاة</Text>
        <Text style={styles.headerTitle}>Horaires de Prière</Text>
        {city ? <Text style={styles.city}><Ionicons name="location" size={13} /> {city}</Text> : null}
      </View>

      {loading && <ActivityIndicator color={Colors.gold} style={{ flex: 1 }} />}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchTimes}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {times && (
        <View style={styles.content}>
          {(Object.keys(times) as (keyof PrayerTimes)[]).map(key => {
            const isNext = key === nextPrayer;
            return (
              <View key={key} style={[styles.prayerRow, isNext && styles.prayerRowNext]}>
                <View style={styles.prayerLeft}>
                  <Ionicons
                    name={(PRAYER_ICONS[key] as any) || 'time'}
                    size={20}
                    color={isNext ? Colors.gold : Colors.textMuted}
                    style={styles.prayerIcon}
                  />
                  <View>
                    <Text style={[styles.prayerName, isNext && styles.prayerNameNext]}>
                      {PRAYER_NAMES[key] || key}
                    </Text>
                    {isNext && <Text style={styles.nextLabel}>Prochaine prière</Text>}
                  </View>
                </View>
                <Text style={[styles.prayerTime, isNext && styles.prayerTimeNext]}>
                  {times[key]}
                </Text>
              </View>
            );
          })}

          <TouchableOpacity style={styles.refreshBtn} onPress={fetchTimes}>
            <Ionicons name="refresh" size={16} color={Colors.textMuted} />
            <Text style={styles.refreshText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 16, backgroundColor: Colors.surface },
  headerArabic: { fontFamily: 'Amiri', fontSize: 22, color: Colors.gold },
  headerTitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 2 },
  city: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  content: { padding: 16, gap: 10 },
  prayerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  prayerRowNext: { borderColor: Colors.gold, backgroundColor: Colors.primaryDark },
  prayerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prayerIcon: { width: 24 },
  prayerName: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  prayerNameNext: { color: Colors.gold, fontWeight: '700' },
  nextLabel: { fontSize: 11, color: Colors.gold, marginTop: 2 },
  prayerTime: { fontSize: 18, color: Colors.textSecondary, fontWeight: '600', fontVariant: ['tabular-nums'] },
  prayerTimeNext: { color: Colors.gold, fontSize: 20 },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: Colors.textSecondary, fontSize: 15 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: Colors.white, fontWeight: '600' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  refreshText: { fontSize: 13, color: Colors.textMuted },
});
