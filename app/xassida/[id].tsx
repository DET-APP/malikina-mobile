import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { api, Verse, XassidaAudio } from '@/services/api';
import { Colors } from '@/constants/colors';

type Lang = 'arabic' | 'fr' | 'wo';

export default function XassidaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [activeLangs, setActiveLangs] = useState<Lang[]>(['arabic']);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const { data: xassida } = useQuery({ queryKey: ['xassida', id], queryFn: () => api.xassidas.get(id!) });
  const { data: verses = [], isLoading } = useQuery({ queryKey: ['verses', id], queryFn: () => api.xassidas.verses(id!) });
  const { data: audios = [] } = useQuery({ queryKey: ['audios', id], queryFn: () => api.xassidas.audios(id!) });

  useEffect(() => {
    if (xassida) navigation.setOptions({ headerTitle: xassida.title, headerTintColor: Colors.primary });
    return () => { sound?.unloadAsync(); };
  }, [xassida, sound]);

  const chapters = [...new Set(verses.map(v => v.chapter_number).filter(Boolean))].sort((a, b) => a! - b!);
  const filteredVerses = selectedChapter ? verses.filter(v => v.chapter_number === selectedChapter) : verses;

  const toggleLang = (lang: Lang) =>
    setActiveLangs(prev => prev.includes(lang)
      ? prev.length > 1 ? prev.filter(l => l !== lang) : prev
      : [...prev, lang]);

  const playAudio = async (audio: XassidaAudio) => {
    if (sound) { await sound.unloadAsync(); setSound(null); setPlayingAudioId(null); }
    if (playingAudioId === audio.id) return;
    if (!audio.audio_url) return;
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audio.audio_url }, { shouldPlay: true });
      setSound(newSound);
      setPlayingAudioId(audio.id);
      newSound.setOnPlaybackStatusUpdate(s => { if (s.isLoaded && s.didJustFinish) setPlayingAudioId(null); });
    } catch (e) { console.error('Audio error:', e); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Arabic title */}
      {xassida?.arabic_name && (
        <View style={styles.arabicTitleWrap}>
          <Text style={styles.arabicTitle}>{xassida.arabic_name}</Text>
        </View>
      )}

      {/* Language toggles */}
      <View style={styles.langRow}>
        {(['arabic', 'fr', 'wo'] as Lang[]).map(lang => (
          <TouchableOpacity
            key={lang}
            style={[styles.langBtn, activeLangs.includes(lang) && styles.langBtnActive]}
            onPress={() => toggleLang(lang)}
          >
            <Text style={[styles.langText, activeLangs.includes(lang) && styles.langTextActive]}>
              {lang === 'arabic' ? 'العربية' : lang === 'fr' ? 'FR' : 'WO'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chapter filter */}
      {chapters.length > 1 && (
        <FlatList
          horizontal
          data={[null, ...chapters]}
          keyExtractor={c => String(c ?? 'all')}
          contentContainerStyle={styles.chapterRow}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chapterChip, selectedChapter === item && styles.chapterChipActive]}
              onPress={() => setSelectedChapter(item)}
            >
              <Text style={[styles.chapterText, selectedChapter === item && styles.chapterTextActive]}>
                {item === null ? 'Tout' : `Ch. ${item}`}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Audio players */}
      {audios.filter(a => a.audio_url).length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.audioRow}>
          {audios.filter(a => a.audio_url).map(audio => (
            <TouchableOpacity key={audio.id} style={styles.audioBtn} onPress={() => playAudio(audio)}>
              <Ionicons
                name={playingAudioId === audio.id ? 'pause-circle' : 'play-circle'}
                size={24} color={Colors.primary}
              />
              <Text style={styles.audioLabel} numberOfLines={1}>
                {audio.reciter_name || audio.label || 'Audio'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Verses */}
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredVerses}
          keyExtractor={v => String(v.verse_number)}
          contentContainerStyle={styles.verseList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <VerseItem verse={item} langs={activeLangs} />}
        />
      )}
    </SafeAreaView>
  );
}

function VerseItem({ verse, langs }: { verse: Verse; langs: Lang[] }) {
  return (
    <View style={styles.verseCard}>
      <View style={styles.verseNumWrap}>
        <Text style={styles.verseNum}>{verse.verse_number}</Text>
      </View>
      {langs.includes('arabic') && verse.text_arabic && (
        <Text style={styles.verseArabic}>{verse.text_arabic}</Text>
      )}
      {langs.includes('arabic') && verse.transcription && (
        <Text style={styles.verseTranscription}>{verse.transcription}</Text>
      )}
      {langs.includes('fr') && verse.translation_fr && (
        <View style={styles.transWrap}>
          <Text style={styles.transLabel}>FR</Text>
          <Text style={styles.verseFr}>{verse.translation_fr}</Text>
        </View>
      )}
      {langs.includes('wo') && verse.translation_wo && (
        <View style={styles.transWrap}>
          <Text style={styles.transLabel}>WO</Text>
          <Text style={styles.verseWo}>{verse.translation_wo}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  arabicTitleWrap: {
    backgroundColor: Colors.surface, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  arabicTitle: { fontFamily: 'Amiri', fontSize: 24, color: Colors.primary, textAlign: 'center', paddingHorizontal: 16 },

  langRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: Colors.surface },
  langBtn: {
    paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  langBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  langText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  langTextActive: { color: Colors.white },

  chapterRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, backgroundColor: Colors.surfaceAlt },
  chapterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  chapterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chapterText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  chapterTextActive: { color: Colors.white, fontWeight: '700' },

  audioRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, backgroundColor: Colors.surfaceAlt },
  audioBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border, maxWidth: 170,
  },
  audioLabel: { fontSize: 12, color: Colors.textSecondary, flex: 1 },

  verseList: { padding: 14, gap: 10, paddingBottom: 24 },
  verseCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  verseNumWrap: {
    alignSelf: 'flex-end', backgroundColor: Colors.primaryLight,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
  },
  verseNum: { fontSize: 10, color: Colors.primary, fontWeight: '700' },
  verseArabic: { fontFamily: 'Amiri', fontSize: 22, color: Colors.text, textAlign: 'right', lineHeight: 36 },
  verseTranscription: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 20 },
  transWrap: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingTop: 4, borderTopWidth: 1, borderTopColor: Colors.border },
  transLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, backgroundColor: Colors.primaryLight, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginTop: 1 },
  verseFr: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  verseWo: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },
});
