import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card, ProgressBar } from '../../components';
import { careSummary, fundingCategories, shiftTasks } from '../../data/walkthroughData';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface HomeScreenProps {
  roleLabel: string;
}

const quickActions: Array<{
  title: string;
  subtitle: string;
  icon: IoniconName;
  color: string;
  bg: string;
}> = [
  { title: 'AI Educator', subtitle: 'Ask anything', icon: 'school', color: '#0B4F6C', bg: '#D0EAF2' },
  { title: 'Find Provider', subtitle: '40+ nearby', icon: 'search', color: '#1A1A2E', bg: '#FFFFFF' },
  { title: 'Book Service', subtitle: 'Schedule now', icon: 'calendar', color: '#E8734A', bg: '#FFF1EA' },
  { title: 'Track Provider', subtitle: 'Live location', icon: 'navigate-circle', color: '#E53E3E', bg: '#FFF5F5' },
];

function formatCurrency(value: number) {
  const amount = Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
  return value < 0 ? `-$${amount}` : `$${amount}`;
}

function QuickActionCard({ title, subtitle, icon, color, bg }: (typeof quickActions)[number]) {
  return (
    <Card style={styles.quickCard}>
      <View style={[styles.quickIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} color={color} size={25} />
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSub}>{subtitle}</Text>
    </Card>
  );
}

export function HomeScreen({ roleLabel }: HomeScreenProps) {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.phoneFrame}>
        <View style={styles.hero}>
          <View style={styles.heroMain}>
            <View style={styles.heroCopy}>
              <Text style={styles.greeting}>Good morning</Text>
              <Text style={styles.participantName}>{careSummary.participantName}</Text>
            </View>
            <View style={styles.bellButton}>
              <Ionicons name="notifications" color="#FFFFFF" size={20} />
              <View style={styles.notificationDot} />
            </View>
          </View>
          <View style={styles.heroPills}>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{roleLabel}</Text>
            </View>
            <View style={styles.zonePill}>
              <Ionicons name="location" color="#0B4F6C" size={12} />
              <Text style={styles.zonePillText}>Parramatta LGA Zone</Text>
            </View>
          </View>
          <View style={styles.educationStrip}>
            <Ionicons name="book" color="#0B4F6C" size={14} />
            <Text style={styles.educationStripText}>S-TRAH explains NDIS questions in plain language</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <QuickActionCard key={action.title} {...action} />
            ))}
          </View>

          <Card style={styles.fundingCard}>
            <Text style={styles.sectionLabel}>NDIS Funding Overview</Text>
            <View style={styles.fundingStack}>
              {fundingCategories.map((category) => {
                const remaining = category.allocation - category.used;
                const progress = category.used / category.allocation;
                const valueColor = remaining < 0 ? '#E53E3E' : '#A0AEC0';

                return (
                  <View key={category.label}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>{category.label}</Text>
                      <Text style={[styles.progressValue, { color: valueColor }]}>
                        {remaining < 0 ? `Over ${formatCurrency(Math.abs(remaining))}` : `${formatCurrency(remaining)} left`}
                      </Text>
                    </View>
                    <ProgressBar progress={progress} tone={category.tone} />
                  </View>
                );
              })}
            </View>
          </Card>

          <View style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>View Full Funding Tracker</Text>
            <Ionicons name="arrow-forward" color="#0B4F6C" size={16} />
          </View>

          <Text style={styles.upcomingLabel}>Upcoming Bookings</Text>
          <Card style={styles.bookingCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>MR</Text>
            </View>
            <View style={styles.bookingCopy}>
              <Text style={styles.bookingName}>Maria Rodriguez</Text>
              <Text style={styles.bookingService}>Occupational Therapy</Text>
              <Text style={styles.bookingTime}>{careSummary.nextVisit}</Text>
            </View>
            <Badge label="Confirmed" tone="success" />
          </Card>

          <View style={styles.taskStack}>
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
      </ScrollView>
    </>
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
    marginTop: 40,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 88,
    overflow: 'hidden',
  },
  heroMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroCopy: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    color: 'rgba(255,255,255,0.75)',
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    right: 8,
    top: 7,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E8734A',
  },
  heroPills: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  rolePill: {
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
  zonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#D0EAF2',
  },
  zonePillText: {
    color: '#0B4F6C',
    fontSize: 11,
    fontWeight: '700',
  },
  educationStrip: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  educationStripText: {
    flex: 1,
    color: '#D0EAF2',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  content: {
    marginTop: -54,
    paddingHorizontal: 20,
    gap: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 102,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  fundingCard: {
    paddingBottom: 18,
  },
  sectionLabel: {
    color: '#A0AEC0',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  fundingStack: {
    marginTop: 14,
    gap: 14,
  },
  progressHeader: {
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
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
  outlineButton: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0B4F6C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  outlineButtonText: {
    color: '#0B4F6C',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  upcomingLabel: {
    color: '#A0AEC0',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  bookingCard: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0B4F6C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  bookingCopy: {
    flex: 1,
  },
  bookingName: {
    color: '#1A1A2E',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  bookingService: {
    marginTop: 2,
    color: '#4A5568',
    fontSize: 12,
    lineHeight: 16,
  },
  bookingTime: {
    marginTop: 1,
    color: '#A0AEC0',
    fontSize: 11,
    lineHeight: 14,
  },
  taskStack: {
    gap: 12,
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
