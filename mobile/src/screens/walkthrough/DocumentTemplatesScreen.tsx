import React, { useMemo, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card } from '../../components';
import { ScreenShell } from './ScreenShell';

type TemplateAction = 'Fill' | 'Export';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface DocumentTemplateCard {
  id: string;
  title: string;
  category: string;
  summary: string;
  fields: string[];
  icon: IoniconName;
}

const DOCUMENT_TEMPLATES: DocumentTemplateCard[] = [
  {
    id: 'medication-log',
    title: 'Medication Log',
    category: 'Daily record',
    summary: 'Track time, dosage, support notes, and escalation details for provider review.',
    fields: ['Time', 'Medication', 'Dose', 'Notes'],
    icon: 'medical',
  },
  {
    id: 'session-note',
    title: 'Session Note',
    category: 'Shift note',
    summary: 'Capture goals worked on, participant response, worker observations, and next steps.',
    fields: ['Goal', 'Activity', 'Outcome', 'Follow-up'],
    icon: 'document-text',
  },
  {
    id: 'incident-report',
    title: 'Incident Report',
    category: 'Safety',
    summary: 'Record what happened, immediate response, people notified, and required follow-up.',
    fields: ['Incident', 'Response', 'Notifier', 'Action'],
    icon: 'warning',
  },
  {
    id: 'goal-tracker',
    title: 'Goal Tracker',
    category: 'Progress',
    summary: 'Log milestones, support evidence, barriers, and plan-review talking points.',
    fields: ['Milestone', 'Evidence', 'Barrier', 'Review note'],
    icon: 'flag',
  },
  {
    id: 'service-agreement',
    title: 'Service Agreement',
    category: 'Agreement',
    summary: 'Prepare service scope, schedule, rates, cancellation terms, and signatures.',
    fields: ['Scope', 'Schedule', 'Rate', 'Terms'],
    icon: 'reader',
  },
];

function TemplateButton({ action, onPress }: { action: TemplateAction; onPress: () => void }) {
  const isExport = action === 'Export';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${action} document template`}
      style={[styles.templateButton, isExport && styles.exportButton]}
      onPress={onPress}
    >
      <Ionicons name={isExport ? 'download' : 'create'} color={isExport ? '#0B4F6C' : '#FFFFFF'} size={15} />
      <Text style={[styles.templateButtonText, isExport && styles.exportButtonText]}>{action}</Text>
    </Pressable>
  );
}

export function DocumentTemplatesScreen() {
  const [lastAction, setLastAction] = useState<{ template: string; action: TemplateAction } | null>(null);

  const statusLabel = useMemo(() => {
    if (!lastAction) return 'Select Fill to draft details or Export to prepare a PDF handoff.';
    return `${lastAction.template} ${lastAction.action === 'Fill' ? 'draft opened' : 'export prepared'} for provider review.`;
  }, [lastAction]);

  return (
    <ScreenShell
      eyebrow="Document templates"
      title="S30 provider template library"
      subtitle="Common NDIS support documents with quick Fill and Export actions for provider workflows."
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />

      <View style={styles.statusStrip}>
        <Ionicons name="information-circle" color="#0B4F6C" size={18} />
        <Text style={styles.statusText}>{statusLabel}</Text>
      </View>

      <View style={styles.templateStack}>
        {DOCUMENT_TEMPLATES.map((template) => (
          <Card key={template.id} style={styles.templateCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <Ionicons name={template.icon} color="#0B4F6C" size={22} />
              </View>
              <View style={styles.titleWrap}>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templateSummary}>{template.summary}</Text>
              </View>
              <Badge label={template.category} tone={template.category === 'Safety' ? 'warning' : 'info'} />
            </View>

            <View style={styles.fieldRow}>
              {template.fields.map((field) => (
                <View key={field} style={styles.fieldPill}>
                  <Text style={styles.fieldText}>{field}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionRow}>
              <TemplateButton action="Fill" onPress={() => setLastAction({ template: template.title, action: 'Fill' })} />
              <TemplateButton action="Export" onPress={() => setLastAction({ template: template.title, action: 'Export' })} />
            </View>
          </Card>
        ))}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  statusStrip: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0EAF2',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusText: {
    flex: 1,
    color: '#4A5568',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  templateStack: {
    gap: 12,
  },
  templateCard: {
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#D0EAF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  templateTitle: {
    color: '#1A1A2E',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },
  templateSummary: {
    color: '#4A5568',
    fontSize: 12,
    lineHeight: 17,
  },
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldPill: {
    minHeight: 26,
    borderRadius: 8,
    backgroundColor: '#F7F3EE',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  fieldText: {
    color: '#4A5568',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  templateButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#0B4F6C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  exportButton: {
    borderWidth: 1,
    borderColor: '#0B4F6C',
    backgroundColor: '#FFFFFF',
  },
  templateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
  },
  exportButtonText: {
    color: '#0B4F6C',
  },
});
