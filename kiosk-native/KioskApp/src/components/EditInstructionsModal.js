import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const EditInstructionsModal = ({ item, onClose, onUpdate }) => {
  return (
    <Modal visible={true} transparent animationType="slide">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modal}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>COOKING INSTRUCTIONS</Text>
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="E.g., Less spicy, No onions..."
            placeholderTextColor={colors.textMuted}
            value={item.specialInstructions || ''}
            onChangeText={onUpdate}
            multiline
            maxLength={200}
          />
          <Text style={styles.count}>{(item.specialInstructions || '').length}/200</Text>
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    width: '100%',
  },
  handle: {
    width: 48,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.base,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.blueDark,
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.muted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 96,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  count: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginBottom: spacing.base,
  },
  doneButton: {
    backgroundColor: colors.blueHero,
    borderRadius: 8,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default EditInstructionsModal;
