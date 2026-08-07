import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, ProgressBar } from '../../components';
import { careSummary, shiftTasks } from '../../data/walkthroughData';

interface HomeScreenProps {
  roleLabel: string;
}

export function HomeScreen({ roleLabel }: HomeScreenProps) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.phoneFrame}>
        <View style={styles.hero}>
          <View style={styles.heroMain}>
            <View>
              <Text style={styles.greeting}>Good morning 👋</Text>
              <Text style={styles.participantName}>{careSummary.participantName}</Text>
            </View>
            <View style={styles.bellButton}>
              <Text style={styles.bellText}>🔔</Text>
            </View>
          </View>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{roleLabel}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.stack}>
            <Card>
              <Text style={styles.sectionLabel}>Current goal</Text>
              <Text style={styles.cardHeading}>{careSummary.activeGoal}</Text>
              <Text style={styles.cardBody}>Next visit: {careSummary.nextVisit}</Text>
            </Card>

            <View style={styles.quickGrid}>
              <Card style={styles.quickCard}>
                <Text style={styles.quickIcon}>🤖</Text>
                <Text style={styles.quickTitle}>AI Educator</Text>
                <Text style={styles.quickSub}>Ask anything</Text>
              </Card>
              <Card style={styles.quickCard}>
                <Text style={styles.quickIcon}>🔍</Text>
                <Text style={styles.quickTitle}>Find Provider</Text>
                <Text style={styles.quickSub}>40+ nearby</Text>
              </Card>
            </View>

            <Card>
              <Text style={styles.sectionLabel}>NDIS Funding Overview</Text>
              <View style={styles.fundingStack}>
                <View>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Core Supports</Text>
                    <Text style={styles.progressValue}>$9,760 left</Text>
                  </View>
                  <ProgressBar progress={careSummary.fundingUsed} />
                </View>
                <View>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Capacity Building</Text>
                    <Text style={styles.progressValue}>$5,400 left</Text>
                  </View>
                  <ProgressBar progress={0.36} tone="provider-green" />
                </View>
              </View>
            </Card>

            <View style={styles.stack}>
              {shiftTasks.map((task) => (
                <Card key={task.label}>
                  <View style={styles.taskRow}>
                    <Text style={styles.taskText}>{task.label}</Text>
                    <Badge label={task.status} tone={task.tone} />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F3EE',
  },
  scrollContent: {
    paddingBottom: 36,
    alignItems: 'center',
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 390,
  },
  hero: {
    backgroundColor: '#0B4F6C',
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 56,
  },
  heroMain: {
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
  },
  participantName: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '800',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellText: {
    fontSize: 20,
  },
  rolePill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  rolePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    marginTop: -32,
    paddingHorizontal: 20,
  },
  stack: {
    gap: 12,
  },
  sectionLabel: {
    color: '#A0AEC0',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardHeading: {
    marginTop: 8,
    color: '#1A1A2E',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  cardBody: {
    marginTop: 4,
    color: '#4A5568',
    fontSize: 14,
    lineHeight: 20,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    minHeight: 102,
  },
  quickIcon: {
    fontSize: 28,
    lineHeight: 32,
  },
  quickTitle: {
    marginTop: 8,
    color: '#1A1A2E',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  quickSub: {
    marginTop: 2,
    color: '#A0AEC0',
    fontSize: 11,
    lineHeight: 14,
  },
  fundingStack: {
    marginTop: 16,
    gap: 16,
  },
  progressHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: '#4A5568',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  progressValue: {
    color: '#A0AEC0',
    fontSize: 11,
    lineHeight: 16,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  taskText: {
    flex: 1,
    color: '#1A1A2E',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
