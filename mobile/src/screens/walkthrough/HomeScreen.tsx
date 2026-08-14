import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProviderScheduleBlock, ProviderStats, getProviderScheduleToday, getProviderStats } from '../../api/providerDashboard';
import { Badge, Card, ProgressBar } from '../../components';
import { careSummary, fundingCategories, shiftTasks, templateExamples, workforceResources } from '../../data/walkthroughData';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface HomeScreenProps {
  roleLabel: string;
  providerSection?: ProviderSection;
  onOpenEducation?: () => void;
  onOpenAvailability?: () => void;
  onOpenNotifications?: () => void;
  onOpenBooking?: () => void;
  onOpenBookings?: () => void;
  onOpenSchedule?: () => void;
}

type ProviderSection = 'dashboard' | 'resources' | 'templates' | 'workforce';

interface QuickAction {
  title: string;
  subtitle: string;
  icon: IoniconName;
  color: string;
  bg: string;
  educationShortcut?: boolean;
  availabilityShortcut?: boolean;
  bookingShortcut?: boolean;
  scheduleShortcut?: boolean;
}

const participantQuickActions: QuickAction[] = [
  { title: 'Education Library', subtitle: 'Browse categories', icon: 'book', color: '#0B4F6C', bg: '#D0EAF2', educationShortcut: true },
  { title: 'Find Provider', subtitle: '40+ nearby', icon: 'search', color: '#1A1A2E', bg: '#FFFFFF' },
  { title: 'Book Service', subtitle: 'Schedule now', icon: 'calendar', color: '#E8734A', bg: '#FFF1EA', bookingShortcut: true },
  { title: 'Track Provider', subtitle: 'Live location', icon: 'navigate-circle', color: '#E53E3E', bg: '#FFF5F5' },
];

const providerQuickActions: QuickAction[] = [
  { title: 'Set Availability', subtitle: 'Time blocks', icon: 'calendar', color: '#0B4F6C', bg: '#D0EAF2', availabilityShortcut: true },
  { title: 'My Schedule', subtitle: 'Upcoming sessions', icon: 'time', color: '#E8734A', bg: '#FFF1EA', scheduleShortcut: true },
  { title: 'Resources', subtitle: 'NDIS categories', icon: 'book', color: '#0B4F6C', bg: '#D0EAF2', educationShortcut: true },
  { title: 'Ask S-TRAH AI', subtitle: 'Plain language', icon: 'school', color: '#E8734A', bg: '#FFF1EA', educationShortcut: true },
  { title: 'Templates', subtitle: 'Examples only', icon: 'document-text', color: '#2D9E6B', bg: '#D4F0E4' },
  { title: 'Workforce', subtitle: 'Practice prompts', icon: 'briefcase', color: '#2D1B69', bg: '#EDE9FF' },
];

const supportWorkerQuickActions: QuickAction[] = [
  { title: 'Shift Note AI', subtitle: 'Capture and review', icon: 'mic', color: '#0B4F6C', bg: '#D0EAF2' },
  { title: 'Wellness', subtitle: 'Simple reset', icon: 'heart', color: '#E8734A', bg: '#FFF1EA' },
  { title: 'NDIS Education Library', subtitle: 'Plain-language guides', icon: 'book', color: '#0B4F6C', bg: '#D0EAF2', educationShortcut: true },
  { title: 'Knowledge Agent', subtitle: 'Cited answers', icon: 'school', color: '#2D9E6B', bg: '#D4F0E4', educationShortcut: true },
  { title: 'Templates', subtitle: 'Examples only', icon: 'document-text', color: '#2D1B69', bg: '#EDE9FF' },
];

const providerSectionCopy: Record<ProviderSection, { title: string; description: string }> = {
  dashboard: {
    title: 'Education hub',
    description: 'NDIS education resources, example templates, and workforce tools for everyday practice.',
  },
  resources: {
    title: 'Education resources',
    description: 'Plain-language guides and prompts for support conversations and workforce learning.',
  },
  templates: {
    title: 'Template library',
    description: 'Example structures for notes, communication, and education guides.',
  },
  workforce: {
    title: 'Workforce tools',
    description: 'Practice prompts for communication, boundaries, escalation, and worker-owned drafting.',
  },
};

function formatCurrency(value: number) {
  const amount = Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
  return value < 0 ? `-$${amount}` : `$${amount}`;
}

function QuickActionCard({
  title,
  subtitle,
  icon,
  color,
  bg,
  onPress,
}: QuickAction & { onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={styles.quickPressable}>
      <Card style={styles.quickCard}>
        <View style={[styles.quickIconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon} color={color} size={25} />
        </View>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickSub}>{subtitle}</Text>
      </Card>
    </Pressable>
  );
}

function formatDashboardCurrency(value: number) {
  return value.toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  });
}

export function HomeScreen({
  roleLabel,
  providerSection = 'dashboard',
  onOpenEducation,
  onOpenAvailability,
  onOpenNotifications,
  onOpenBooking,
  onOpenBookings,
  onOpenSchedule,
}: HomeScreenProps) {
  const [providerStats, setProviderStats] = useState<ProviderStats | null>(null);
  const [providerSchedule, setProviderSchedule] = useState<ProviderScheduleBlock[]>([]);
  const [providerDashboardBoundary, setProviderDashboardBoundary] = useState('');
  const [providerScheduleDay, setProviderScheduleDay] = useState('');
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerRefreshing, setProviderRefreshing] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);

  const isProviderShell = roleLabel === 'Provider' || roleLabel === 'Support Worker';
  const isSupportWorkerDashboard = roleLabel === 'Support Worker' && providerSection === 'dashboard';
  const isProviderDashboard = isProviderShell && providerSection === 'dashboard';
  const heroTitle = isProviderShell
    ? isSupportWorkerDashboard
      ? 'Support Worker home'
      : `${roleLabel} ${providerSectionCopy[providerSection].title.toLowerCase()}`
    : careSummary.participantName;
  const quickActions = isSupportWorkerDashboard ? supportWorkerQuickActions : isProviderShell ? providerQuickActions : participantQuickActions;
  const visibleResources = providerSection === 'workforce'
    ? workforceResources.filter((resource) => resource.tag === 'Drafting' || resource.tag === 'Practice')
    : workforceResources;
  const educationStripText = isProviderShell
    ? isSupportWorkerDashboard
      ? 'Ask S-TRAH AI, shift notes, wellness, education, and templates for daily practice.'
      : providerSectionCopy[providerSection].description
    : 'Browse NDIS education in plain-language categories';

  const loadProviderDashboard = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!isProviderDashboard) return;

    if (silent) {
      setProviderRefreshing(true);
    } else {
      setProviderLoading(true);
    }
    setProviderError(null);

    try {
      const [statsResult, scheduleResult] = await Promise.all([getProviderStats(), getProviderScheduleToday()]);
      setProviderStats(statsResult.stats);
      setProviderSchedule(scheduleResult.schedule);
      setProviderDashboardBoundary(statsResult.boundary || scheduleResult.boundary);
      setProviderScheduleDay(scheduleResult.day);
    } catch (err) {
      setProviderError(err instanceof Error ? err.message : 'Provider dashboard could not be loaded.');
    } finally {
      setProviderLoading(false);
      setProviderRefreshing(false);
    }
  }, [isProviderDashboard]);

  useEffect(() => {
    loadProviderDashboard();
  }, [loadProviderDashboard]);

  const providerMetricCards = providerStats
    ? [
        { label: 'Today', value: `${providerStats.sessionsToday}`, detail: 'sessions' },
        { label: 'Week', value: `${providerStats.sessionsThisWeek}`, detail: 'sessions' },
        { label: 'Earnings', value: formatDashboardCurrency(providerStats.earningsThisWeek), detail: 'this week' },
        { label: 'Rating', value: providerStats.rating === null ? 'New' : providerStats.rating.toFixed(1), detail: 'average' },
      ]
    : [];

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.phoneFrame}>
        <View style={styles.hero}>
          <View style={styles.heroMain}>
            <View style={styles.heroCopy}>
              <Text style={styles.greeting}>Good morning</Text>
              <Text style={styles.participantName}>{heroTitle}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              disabled={!onOpenNotifications}
              onPress={onOpenNotifications}
              style={styles.bellButton}
            >
              <Ionicons name="notifications" color="#FFFFFF" size={20} />
              <View style={styles.notificationDot} />
            </Pressable>
          </View>
          <View style={styles.heroPills}>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{roleLabel}</Text>
            </View>
            <View style={styles.zonePill}>
              <Ionicons name={isProviderDashboard && providerStats?.verified ? 'checkmark-circle' : isProviderShell ? 'school' : 'location'} color="#0B4F6C" size={12} />
              <Text style={styles.zonePillText}>
                {isProviderDashboard && providerStats
                  ? providerStats.verified
                    ? 'Verified provider'
                    : 'Verification pending'
                  : isSupportWorkerDashboard
                    ? 'MVP tools'
                    : isProviderShell
                      ? 'Education hub'
                      : 'Parramatta LGA Zone'}
              </Text>
            </View>
            {isProviderDashboard && providerStats ? (
              <View style={styles.tierPill}>
                <Text style={styles.tierPillText}>{providerStats.subscriptionTier}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.educationStrip}>
            <Ionicons name="book" color="#0B4F6C" size={14} />
            <Text style={styles.educationStripText}>{isProviderDashboard && providerDashboardBoundary ? providerDashboardBoundary : educationStripText}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {isProviderDashboard ? (
            <Card style={styles.providerDashboardCard}>
              {providerLoading ? (
                <View style={styles.providerStateWrap}>
                  <ActivityIndicator color="#0B4F6C" />
                  <Text style={styles.providerStateTitle}>Loading provider dashboard</Text>
                  <Text style={styles.providerStateText}>Fetching stats and today's schedule from the GR8Care API.</Text>
                </View>
              ) : providerError ? (
                <View style={styles.providerStateWrap}>
                  <Ionicons name="alert-circle" color="#E53E3E" size={22} />
                  <Text style={styles.providerStateTitle}>Dashboard unavailable</Text>
                  <Text style={styles.providerStateText}>{providerError}</Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={providerRefreshing}
                    onPress={() => loadProviderDashboard({ silent: true })}
                    style={styles.providerRetryButton}
                  >
                    {providerRefreshing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.providerRetryText}>Retry</Text>}
                  </Pressable>
                </View>
              ) : providerStats ? (
                <>
                  <View style={styles.dashboardHeader}>
                    <View>
                      <Text style={styles.sectionLabel}>Provider dashboard</Text>
                      <Text style={styles.dashboardName}>{providerStats.displayName}</Text>
                    </View>
                    <Badge label={providerStats.verified ? 'Verified' : 'Pending'} tone={providerStats.verified ? 'success' : 'warning'} />
                  </View>

                  <View style={styles.metricGrid}>
                    {providerMetricCards.map((metric) => (
                      <View key={metric.label} style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                        <Text style={styles.metricValue}>{metric.value}</Text>
                        <Text style={styles.metricDetail}>{metric.detail}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.scheduleHeader}>
                    <Text style={styles.sectionLabel}>Today's schedule{providerScheduleDay ? ` - ${providerScheduleDay}` : ''}</Text>
                    <Text style={styles.metricDetail}>{providerStats.activeAvailabilityBlocks} active blocks</Text>
                  </View>
                  <View style={styles.scheduleStack}>
                    {providerSchedule.length === 0 ? (
                      <View style={styles.scheduleEmpty}>
                        <Ionicons name="calendar" color="#0B4F6C" size={18} />
                        <Text style={styles.providerStateText}>No enabled availability blocks for today.</Text>
                      </View>
                    ) : (
                      providerSchedule.map((block) => (
                        <View key={block.id} style={styles.scheduleRow}>
                          <View style={styles.scheduleTimePill}>
                            <Text style={styles.scheduleTimeText}>{block.start}</Text>
                            <Text style={styles.scheduleTimeText}>{block.end}</Text>
                          </View>
                          <View style={styles.bookingCopy}>
                            <Text style={styles.taskText}>{block.service}</Text>
                            <Text style={styles.bookingService}>Available for matching</Text>
                          </View>
                          <Badge label="Open" tone="success" />
                        </View>
                      ))
                    )}
                  </View>
                </>
              ) : null}
            </Card>
          ) : null}

          {isSupportWorkerDashboard ? (
            <Pressable accessibilityRole="button" onPress={onOpenEducation} style={styles.primaryActionPressable}>
              <Card style={styles.primaryActionCard}>
                <View style={[styles.quickIconWrap, { backgroundColor: '#FFF1EA' }]}>
                  <Ionicons name="school" color="#E8734A" size={25} />
                </View>
                <View style={styles.primaryActionCopy}>
                  <Text style={styles.primaryActionTitle}>Ask S-TRAH AI</Text>
                  <Text style={styles.primaryActionSub}>
                    Large plain-language entry point for education questions, with Knowledge Agent and library links nearby.
                  </Text>
                </View>
                <Ionicons name="arrow-forward" color="#0B4F6C" size={18} />
              </Card>
            </Pressable>
          ) : null}

          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.title}
                {...action}
                onPress={
                  action.educationShortcut
                    ? onOpenEducation
                    : action.availabilityShortcut
                      ? onOpenAvailability
                      : action.bookingShortcut
                        ? onOpenBooking
                        : action.scheduleShortcut
                          ? onOpenSchedule
                          : undefined
                }
              />
            ))}
          </View>

          {isProviderShell ? (
            <>
              {providerSection !== 'templates' ? (
                <Card style={styles.fundingCard}>
                  <Text style={styles.sectionLabel}>{providerSection === 'workforce' ? 'Workforce practice' : 'Resource collection'}</Text>
                  <View style={styles.taskStack}>
                    {visibleResources.map((resource) => (
                      <View key={resource.title} style={styles.taskRow}>
                        <View style={styles.bookingCopy}>
                          <Text style={styles.taskText}>{resource.title}</Text>
                          <Text style={styles.bookingService}>{resource.body}</Text>
                        </View>
                        <Badge label={resource.tag} tone="info" />
                      </View>
                    ))}
                  </View>
                </Card>
              ) : null}

              {providerSection !== 'resources' && providerSection !== 'workforce' ? (
                <Card style={styles.fundingCard}>
                  <Text style={styles.sectionLabel}>Educational examples</Text>
                  <Text style={styles.bookingService}>Use these structures for learning and practice, not as official records.</Text>
                  <View style={styles.taskStack}>
                    {templateExamples.map((template) => (
                      <View key={template.title} style={styles.templateExample}>
                        <View style={styles.taskRow}>
                          <View style={styles.bookingCopy}>
                            <Text style={styles.taskText}>{template.title}</Text>
                            <Text style={styles.bookingService}>{template.summary}</Text>
                          </View>
                          <Badge label={template.category} tone="info" />
                        </View>
                      </View>
                    ))}
                  </View>
                  <View style={styles.templateDisclaimer}>
                    <Text style={styles.taskText}>Educational examples only</Text>
                    <Text style={styles.bookingService}>
                      Templates are not audit documents, compliance documents, official records, or certification tools.
                    </Text>
                  </View>
                </Card>
              ) : null}
            </>
          ) : (
            <>
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

              <Pressable accessibilityRole="button" onPress={onOpenBookings} style={styles.upcomingRow}>
                <Text style={styles.upcomingLabel}>Upcoming Bookings</Text>
                <Ionicons name="chevron-forward" color="#A0AEC0" size={16} />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={onOpenBookings}>
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
              </Pressable>

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
            </>
          )}
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
  tierPill: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFF1EA',
  },
  tierPillText: {
    color: '#B5532C',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
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
  quickPressable: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  quickCard: {
    flex: 1,
    minHeight: 102,
  },
  providerDashboardCard: {
    gap: 14,
  },
  providerStateWrap: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  providerStateTitle: {
    color: '#1A1A2E',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  providerStateText: {
    color: '#4A5568',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  providerRetryButton: {
    marginTop: 4,
    height: 34,
    minWidth: 104,
    borderRadius: 10,
    backgroundColor: '#0B4F6C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerRetryText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  dashboardName: {
    marginTop: 4,
    color: '#1A1A2E',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 74,
    borderRadius: 10,
    backgroundColor: '#F7F3EE',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  metricLabel: {
    color: '#4A5568',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  metricValue: {
    marginTop: 2,
    color: '#1A1A2E',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
  },
  metricDetail: {
    marginTop: 1,
    color: '#A0AEC0',
    fontSize: 11,
    lineHeight: 14,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  scheduleStack: {
    gap: 10,
  },
  scheduleEmpty: {
    minHeight: 58,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0EAF2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  scheduleRow: {
    minHeight: 64,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },
  scheduleTimePill: {
    width: 54,
    borderRadius: 9,
    backgroundColor: '#D0EAF2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  scheduleTimeText: {
    color: '#0B4F6C',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  primaryActionPressable: {
    width: '100%',
  },
  primaryActionCard: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryActionCopy: {
    flex: 1,
  },
  primaryActionTitle: {
    color: '#1A1A2E',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
  },
  primaryActionSub: {
    marginTop: 3,
    color: '#4A5568',
    fontSize: 12,
    lineHeight: 16,
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
  upcomingRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  templateExample: {
    paddingTop: 2,
  },
  templateDisclaimer: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F2D6A2',
    backgroundColor: '#FFF7E6',
    padding: 12,
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
