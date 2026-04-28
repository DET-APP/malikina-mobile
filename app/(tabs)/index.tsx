import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { api, Xassida } from '@/services/api';
import { Colors } from '@/constants/colors';

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const PRAYER_LABELS: Record<string, string> = {
  Fajr: 'Fajr', Sunrise: 'Lever', Dhuhr: 'Dhuhr', Asr: 'Asr', Maghrib: 'Maghrib', Isha: 'Isha',
};

function getNextPrayer(times: Record<string, string>): string {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  for (const k of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
    const [h, m] = times[k].split(':').map(Number);
    if (h * 60 + m > cur) return k;
  }
  return 'Fajr';
}

export default function HomeScreen() {
  const today = new Date();
  const dateLabel = `${DAYS_FR[today.getDay()]} ${today.getDate()} ${MONTHS_FR[today.getMonth()]} ${today.getFullYear()}`;
  const [prayerTimes, setPrayerTimes] = useState<Record<string, string> | null>(null);
  const [nextPrayer, setNextPrayer] = useState<string>('');

  const { data: xassidas = [], isLoading } = useQuery({
    queryKey: ['xassidas'],
    queryFn: api.xassidas.list,
  });

  const recentXassidas = xassidas.filter(x => !x.is_fiqh).slice(0, 8);
  const featuredXassida = recentXassidas[0];

  const { data: verses = [] } = useQuery({
    queryKey: ['verses-home', featuredXassida?.id],
    queryFn: () => featuredXassida ? api.xassidas.verses(featuredXassida.id) : Promise.resolve([]),
    enabled: !!featuredXassida,
  });

  const featuredVerse = verses[0];

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        let lat = 14.6928, lng = -17.4467;
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          lat = loc.coords.latitude; lng = loc.coords.longitude;
        }
        const d = today;
        const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
        const res = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=2`);
        const data = await res.json();
        if (data.code === 200) {
          const t = data.data.timings;
          const pt = { Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
          setPrayerTimes(pt);
          setNextPrayer(getNextPrayer(pt));
        }
      } catch {}
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>Bienvenue</Text>
              <Text style={styles.headerDate}>Assalamou Alaikoum</Text>
            </View>
            <View style={styles.headerIconBtn}>
              <Ionicons name="notifications-outline" size={22} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.headerArabic}>الْمُتَحَابِّينَ فِي اللَّهِ</Text>
        </View>

        {/* ── Logo card ───────────────────────────────────── */}
        <View style={styles.logoCard}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>م</Text>
          </View>
          <View style={styles.logoInfo}>
            <Text style={styles.logoTitle}>Al Moutahabbina Fillahi</Text>
            <Text style={styles.logoArabic}>الْمُتَحَابِّينَ فِي اللَّهِ</Text>
            <Text style={styles.logoSub}>Dahira des Étudiants Tidianes - UAD</Text>
          </View>
        </View>

        {/* ── Prochaine prière ─────────────────────────────── */}
        <TouchableOpacity style={styles.prayerCard} onPress={() => router.push('/(tabs)/prayer')}>
          <View style={styles.prayerLeft}>
            <View style={styles.prayerIconCircle}>
              <Ionicons name="time" size={20} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.prayerLabel}>Prochaine prière</Text>
              {prayerTimes && nextPrayer
                ? <Text style={styles.prayerName}>{PRAYER_LABELS[nextPrayer]}</Text>
                : <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 4 }} />
              }
            </View>
          </View>
          <View style={styles.prayerRight}>
            {prayerTimes && nextPrayer && (
              <Text style={styles.prayerTime}>{prayerTimes[nextPrayer]}</Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* ── Xassidas récentes ───────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>À découvrir</Text>
              <Text style={styles.sectionSubtitle}>Xassidas populaires</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/xassidas')}>
              <Text style={styles.sectionLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <FlatList
              horizontal
              data={recentXassidas}
              keyExtractor={x => x.id}
              contentContainerStyle={styles.xassidasRow}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => <XassidaCard xassida={item} />}
            />
          )}
        </View>

        {/* ── Vers du jour ─────────────────────────────────── */}
        {featuredVerse && featuredXassida && (
          <TouchableOpacity
            style={styles.verseCard}
            onPress={() => router.push(`/xassida/${featuredXassida.id}`)}
          >
            <View style={styles.verseTopRow}>
              <View style={styles.verseBadge}>
                <Text style={styles.verseBadgeText}>✦ Vers du Jour</Text>
              </View>
              <Text style={styles.verseXassidaName} numberOfLines={1}>{featuredXassida.title}</Text>
            </View>
            {featuredVerse.text_arabic && (
              <Text style={styles.verseArabic}>{featuredVerse.text_arabic}</Text>
            )}
            {featuredVerse.transcription && (
              <Text style={styles.verseTranscription} numberOfLines={3}>{featuredVerse.transcription}</Text>
            )}
            {featuredVerse.translation_fr && (
              <Text style={styles.verseFr} numberOfLines={2}>{featuredVerse.translation_fr}</Text>
            )}
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function XassidaCard({ xassida }: { xassida: Xassida }) {
  const initials = xassida.title.slice(0, 2).toUpperCase();
  return (
    <TouchableOpacity style={styles.xassidaCard} onPress={() => router.push(`/xassida/${xassida.id}`)}>
      <View style={styles.xassidaInitials}>
        <Text style={styles.xassidaInitialsText}>{initials}</Text>
      </View>
      {xassida.arabic_name && (
        <Text style={styles.xassidaArabic} numberOfLines={1}>{xassida.arabic_name}</Text>
      )}
      <Text style={styles.xassidaTitle} numberOfLines={2}>{xassida.title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 24 },

  header: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 52 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  headerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  headerDate: { fontSize: 17, color: Colors.white, fontWeight: '700', marginTop: 2 },
  headerIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  headerArabic: { fontFamily: 'Amiri', fontSize: 22, color: Colors.goldLight, textAlign: 'center', marginTop: 4 },

  logoCard: {
    marginHorizontal: 16, marginTop: -30, backgroundColor: Colors.surface,
    borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14, shadowRadius: 14, elevation: 6,
  },
  logoCircle: {
    width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  logoLetter: { fontFamily: 'Amiri', fontSize: 30, color: Colors.white },
  logoInfo: { flex: 1 },
  logoTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  logoArabic: { fontFamily: 'Amiri', fontSize: 17, color: Colors.gold, marginTop: 2 },
  logoSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  prayerCard: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: Colors.gold + '55',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  prayerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prayerIconCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  prayerLabel: { fontSize: 11, color: Colors.textMuted },
  prayerName: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: 2 },
  prayerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prayerTime: { fontSize: 22, fontWeight: '700', color: Colors.primary },

  section: { marginTop: 22 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  sectionSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  sectionLink: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  xassidasRow: { paddingHorizontal: 16, gap: 10 },

  xassidaCard: {
    width: 130, backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  xassidaInitials: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  xassidaInitialsText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  xassidaArabic: { fontFamily: 'Amiri', fontSize: 14, color: Colors.primary, marginBottom: 4 },
  xassidaTitle: { fontSize: 12, fontWeight: '600', color: Colors.text, lineHeight: 17 },

  verseCard: {
    marginHorizontal: 16, marginTop: 14, backgroundColor: Colors.primary, borderRadius: 18, padding: 20,
    shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 12, elevation: 6,
  },
  verseTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  verseBadge: {
    backgroundColor: Colors.gold, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  verseBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  verseXassidaName: { fontSize: 12, color: 'rgba(255,255,255,0.65)', flex: 1 },
  verseArabic: {
    fontFamily: 'Amiri', fontSize: 22, color: Colors.white,
    textAlign: 'right', lineHeight: 36, marginBottom: 10,
  },
  verseTranscription: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginBottom: 6, lineHeight: 20 },
  verseFr: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 19 },
});
