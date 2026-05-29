// TimingSettingsScreen - Operating Hours & Prep Time Configuration
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTimingSettings } from '../contexts/TimingSettingsContext';
import { colors } from '../theme/colors';

const TimingSettingsScreen = ({ navigation, route }) => {
  const fromSidebar = route?.params?.fromSidebar;
  const { shifts: savedShifts, saveShifts, clearShifts } = useTimingSettings();

  const [slots, setSlots] = useState(() => {
    if (savedShifts.length) return savedShifts.map((s, i) => ({ ...s, id: i }));
    return [];
  });

  const addSlot = () => {
    if (slots.length >= 4) {
      Toast.show({ type: 'error', text1: 'Maximum 4 time slots allowed' });
      return;
    }
    setSlots(prev => [...prev, { id: Date.now(), start: '07:00', end: '09:00', prepTime: '10' }]);
  };

  const removeSlot = (id) => {
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  const updateSlot = (id, field, value) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    const cleaned = slots.map(({ start, end, prepTime }) => ({
      start,
      end,
      prepTime: parseInt(prepTime) || 10,
    }));
    await saveShifts(cleaned);
    Toast.show({ type: 'success', text1: 'Timing settings saved' });
    if (fromSidebar && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleCancel = () => {
    if (fromSidebar && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleReset = async () => {
    setSlots([]);
    await clearShifts();
    Toast.show({ type: 'success', text1: 'Timing settings cleared' });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {fromSidebar && (
            <TouchableOpacity onPress={handleCancel} style={styles.backBtn}>
              <Text style={styles.backIcon}>{'<'}</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>OPERATING HOURS</Text>
            <Text style={styles.headerSub}>Define time slots and estimated preparation time</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {fromSidebar && (
            <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Body */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.clockIcon}>&#128339;</Text>
            <View>
              <Text style={styles.cardTitle}>RESTAURANT OPERATING HOURS</Text>
              <Text style={styles.cardSub}>Estimated prep time is shown to guests after placing an order</Text>
            </View>
          </View>

          {/* Column headers */}
          {slots.length > 0 && (
            <View style={styles.colHeaders}>
              <Text style={[styles.colHeader, { width: 60 }]}></Text>
              <Text style={[styles.colHeader, { flex: 1 }]}>Start</Text>
              <Text style={[styles.colHeader, { flex: 1 }]}>End</Text>
              <Text style={[styles.colHeader, { width: 80 }]}>Prep</Text>
              <Text style={[styles.colHeader, { width: 40 }]}></Text>
            </View>
          )}

          {/* Slots */}
          {slots.map((slot, index) => (
            <View key={slot.id} style={styles.slotRow}>
              <Text style={styles.slotLabel}>Slot {index + 1}</Text>
              <TextInput
                style={styles.timeInput}
                value={slot.start}
                onChangeText={(v) => updateSlot(slot.id, 'start', v)}
                placeholder="07:00"
              />
              <TextInput
                style={styles.timeInput}
                value={slot.end}
                onChangeText={(v) => updateSlot(slot.id, 'end', v)}
                placeholder="09:00"
              />
              <View style={styles.prepContainer}>
                <TextInput
                  style={styles.prepInput}
                  value={String(slot.prepTime)}
                  onChangeText={(v) => updateSlot(slot.id, 'prepTime', v)}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.prepUnit}>min</Text>
              </View>
              <TouchableOpacity onPress={() => removeSlot(slot.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteIcon}>X</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Empty state */}
          {slots.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>&#128339;</Text>
              <Text style={styles.emptyTitle}>No time slots configured</Text>
              <Text style={styles.emptySub}>Add slots to show estimated prep time on orders</Text>
            </View>
          )}

          {/* Add Slot */}
          {slots.length < 4 && (
            <TouchableOpacity onPress={addSlot} style={styles.addSlotBtn}>
              <Text style={styles.addSlotText}>+ Add Slot</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleReset} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
        <Text style={styles.countText}>
          {slots.length} slot{slots.length !== 1 ? 's' : ''} configured
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e5e5',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 20, color: '#666' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, letterSpacing: 1 },
  headerSub: { fontSize: 11, color: '#999' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 4 },
  cancelText: { fontSize: 13, fontWeight: '600', color: '#666' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.accent, borderRadius: 4 },
  saveText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  body: { flex: 1 },
  bodyContent: { padding: 16, maxWidth: 600, alignSelf: 'center', width: '100%' },
  card: {
    backgroundColor: '#fff', borderRadius: 4, borderWidth: 2, borderColor: '#e5e5e5', padding: 20,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  clockIcon: { fontSize: 28 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, letterSpacing: 1 },
  cardSub: { fontSize: 12, color: '#999', marginTop: 2 },
  colHeaders: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  colHeader: { fontSize: 10, fontWeight: '600', color: '#999', textTransform: 'uppercase' },
  slotRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F8F6',
    borderRadius: 4, borderWidth: 1, borderColor: '#e5e5e5', padding: 10, marginBottom: 8, gap: 8,
  },
  slotLabel: { width: 55, fontSize: 13, fontWeight: 'bold', color: colors.primary },
  timeInput: {
    flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5e5',
    borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13,
  },
  prepContainer: { flexDirection: 'row', alignItems: 'center', width: 80, gap: 4 },
  prepInput: {
    flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5e5',
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 8, fontSize: 13, textAlign: 'center',
  },
  prepUnit: { fontSize: 11, color: '#999' },
  deleteBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  deleteIcon: { fontSize: 14, color: '#ef4444' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyIcon: { fontSize: 36, opacity: 0.3, marginBottom: 8 },
  emptyTitle: { fontSize: 13, color: '#999' },
  emptySub: { fontSize: 11, color: '#bbb', marginTop: 4 },
  addSlotBtn: {
    marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderWidth: 2,
    borderStyle: 'dashed', borderColor: '#e5e5e5', borderRadius: 4,
  },
  addSlotText: { fontSize: 13, fontWeight: '500', color: '#999' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e5e5',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  clearBtn: { padding: 8 },
  clearText: { fontSize: 12, color: '#999' },
  countText: { fontSize: 12, color: '#999' },
});

export default TimingSettingsScreen;
