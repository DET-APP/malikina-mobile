import { useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
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
    if (xassida) navigation.setOptions({ headerTitle: xassida.title });
    return () => { sound?.unloadAsync(); };
  }, [xassida, sound]);

  const chapters = [...new Set(verses.map(v => v.chapter_number).filter(Boolean))].sort((a, b) => a! - b!);

  const filteredVerses = selectedChapter
    ? verses.filter(v => v.chapter_number === selectedChapter)
    : verses;

  const toggleLang = (lang: Lang) => {
    setActiveLangs(prev =>
      prev.includes(lang) ? (prev.length > 1 ? prev.filter(l => l !== lang) : prev) : [...prev, lang]
    );
  };

  const playAudio = async (audio: XassidaAudio) => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setPlayingAudioId(null);
    }
    if (playingAudioId === audio.id) return;

    const url = audio.audio_url;
    if (!url) return;

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      setSound(newSound);
      setPlayingAudioId(audio.id);
      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudioId(null);
        }
      });
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Arabic title */}
      {xassida?.arabic_name && (
        <Text style={styles.arabicTitle}>{xassida.arabic_name}</Text>
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
          keyExtractor={(c) => String(c ?? 'all')}
          contentContainerStyle={styles.chapterFilter}
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
      {audios.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.audioRow}>
          {audios.filter(a => a.audio_url).map(audio => (
            <TouchableOpacity key={audio.id} style={styles.audioBtn} onPress={() => playAudio(audio)}>
              <Ionicons
                name={playingAudioId === audio.id ? 'pause-circle' : 'play-circle'}
                size={22} color={Colors.gold}
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
        <ActivityIndicator color={Colors.gold} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredVerses}
          keyExtractor={(v) => String(v.verse_number)}
          contentContainerStyle={styles.verseList}
          renderItem={({ item }) => <VerseItem verse={item} langs={activeLangs} />}
        />
      )}
    </SafeAreaView>
  );
}

function VerseItem({ verse, langs }: { verse: Verse; langs: Lang[] }) {
  return (
    <View style={styles.verseCard}>
      <Text style={styles.verseNum}>{verse.verse_number}</Text>
      {langs.includes('arabic') && verse.text_arabic && (
        <Text style={styles.verseArabic}>{verse.text_arabic}</Text>
      )}
      {langs.includes('arabic') && verse.transcription && (
        <Text style={styles.verseTranscription}>{verse.transcription}</Text>
      )}
      {langs.includes('fr') && verse.translation_fr && (
        <Text style={styles.verseFr}>{verse.translation_fr}</Text>
      )}
      {langs.includes('wo') && verse.translation_wo && (
        <Text style={styles.verseWo}>{verse.translation_wo}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  arabicTitle: { fontFamily: 'Amiri', fontSize: 26, color: Colors.gold, textAlign: 'center', padding: 12 },
  langRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12 },
  langBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  langBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  langText: { fontSize: 13, color: Colors.textSecondary },
  langTextActive: { color: Colors.white, fontWeight: '600' },
  chapterFilter: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  chapterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chapterChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight },
  chapterText: { fontSize: 12, color: Colors.textSecondary },
  chapterTextActive: { color: Colors.white, fontWeight: '600' },
  audioRow: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  audioBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border, maxWidth: 160 },
  audioLabel: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  verseList: { padding: 12, gap: 8 },
  verseCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  verseNum: { fontSize: 11, color: Colors.textMuted, fontWeight: '700' },
  verseArabic: { fontFamily: 'Amiri', fontSize: 22, color: Colors.text, textAlign: 'right', lineHeight: 36 },
  verseTranscription: { fontSize: 14, color: Colors.textSecondary, fontStyle: 'italic' },
  verseFr: { fontSize: 14, color: Colors.textSecondary },
  verseWo: { fontSize: 14, color: Colors.text },
});
