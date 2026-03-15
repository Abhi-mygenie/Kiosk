// Table Selector Modal
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TableSelector = ({ tables, selectedTable, onSelectTable, onClose }) => {
  // Group tables by section
  const sections = {};
  tables.forEach(table => {
    const section = table.title || '';
    if (!sections[section]) sections[section] = [];
    sections[section].push(table);
  });

  const sortedSections = Object.keys(sections).sort((a, b) => {
    if (a === '') return 1;
    if (b === '') return -1;
    return a.localeCompare(b);
  });

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>SELECT YOUR TABLE</Text>
              <Text style={styles.subtitle}>Tap on your table number to continue</Text>
            </View>
            {selectedTable && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Table Grid */}
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {sortedSections.map(section => (
              <View key={section || 'no-section'} style={styles.section}>
                {section && <Text style={styles.sectionTitle}>{section}</Text>}
                <View style={styles.tableGrid}>
                  {sections[section].map(table => (
                    <TouchableOpacity
                      key={table.id}
                      style={[
                        styles.tableButton,
                        selectedTable === table.table_no && styles.tableButtonSelected,
                      ]}
                      onPress={() => onSelectTable(table.table_no, table.id)}
                      testID={`table-${table.table_no}`}>
                      <Text
                        style={[
                          styles.tableText,
                          selectedTable === table.table_no && styles.tableTextSelected,
                        ]}>
                        {table.table_no}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                !selectedTable && styles.continueButtonDisabled,
              ]}
              onPress={onClose}
              disabled={!selectedTable}>
              <Text style={styles.continueText}>
                {selectedTable ? `Continue with Table ${selectedTable}` : 'Select a Table'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  container: {
    backgroundColor: `${colors.white}80`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.white}50`,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 800,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.white}30`,
    backgroundColor: `${colors.white}30`,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.blueDark,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.base,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.white}50`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
  },
  section: {
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.blueDark,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tableButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: `${colors.white}80`,
    borderWidth: 1,
    borderColor: `${colors.white}50`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableButtonSelected: {
    backgroundColor: colors.blueHero,
    borderColor: colors.blueHero,
    shadowColor: colors.blueHero,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tableText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.blueDark,
  },
  tableTextSelected: {
    color: colors.white,
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: `${colors.white}30`,
    backgroundColor: `${colors.white}30`,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: colors.blueHero,
    borderRadius: 8,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing['2xl'],
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: `${colors.white}50`,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default TableSelector;
