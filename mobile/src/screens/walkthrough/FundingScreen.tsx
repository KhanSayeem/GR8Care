import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FundingCategoryKey, FundingCategorySummary, FundingSummary, FundingTransaction, getFundingSummary, getFundingTransactions } from '../../api/funding';
import { Card, ProgressBar } from '../../components';

type ProgressTone = 'teal-dark' | 'provider-green' | 'error';

const CATEGORY_TONES: Record<FundingCategoryKey, ProgressTone> = {
  core: 'teal-dark',
  capacity: 'provider-green',
  capital: 'error',
};

function formatCurrency(value: number, currency = 'AUD') {
  const amount = Math.abs(value).toLocaleString('en-AU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
  return value < 0 ? `-${amount}` : amount;
}

function formatTransactionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getAccent(tone: ProgressTone) {
  if (tone === 'teal-dark') return '#0B4F6C';
  if (tone === 'provider-green') return '#2D9E6B';
  return '#E53E3E';
}

function getShortCategoryLabel(label: string) {
  return label.replace(' Supports', '').replace(' Building', '');
}

export function FundingScreen() {
  const [summary, setSummary] = useState<FundingSummary | null>(null);
  const [transactions, setTransactions] = useState<FundingTransaction[]>([]);
  const [boundary, setBoundary] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = summary?.currency ?? 'AUD';
  const categories = summary?.categories ?? [];
  const totalAllocation = summary?.totals.allocation ?? 0;
  const totalUsed = summary?.totals.spentToDate ?? 0;
  const totalPercent = totalAllocation > 0 ? Math.round((totalUsed / totalAllocation) * 100) : 0;
  const overBudgetCategory = summary?.budgetAlerts[0] ?? categories.find((category) => category.overBudget);

  const loadFunding = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [summaryResult, transactionsResult] = await Promise.all([getFundingSummary(), getFundingTransactions({ limit: 10 })]);
      setSummary(summaryResult.summary);
      setTransactions(transactionsResult.transactions);
      setBoundary(summaryResult.boundary || transactionsResult.boundary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Funding data could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFunding();
  }, [loadFunding]);

  const statusContent = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.statusCard}>
          <ActivityIndicator color="#0B4F6C" />
          <Text style={styles.statusTitle}>Loading funding tracker</Text>
          <Text style={styles.statusBody}>Fetching your active NDIS plan summary and recent transactions.</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.statusCard, styles.statusCardWarning]}>
          <Ionicons name="alert-circle" color="#E53E3E" size={22} />
          <Text style={styles.statusTitle}>Funding unavailable</Text>
          <Text style={styles.statusBody}>{error}</Text>
          <Pressable accessibilityRole="button" style={styles.retryButton} disabled={refreshing} onPress={() => loadFunding({ silent: true })}>
            {refreshing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.retryText}>Retry</Text>}
          </Pressable>
        </View>
      );
    }

    if (!summary || categories.length === 0) {
      return (
        <View style={styles.statusCard}>
          <Ionicons name="wallet" color="#0B4F6C" size={22} />
          <Text style={styles.statusTitle}>No active funding plan</Text>
          <Text style={styles.statusBody}>Funding categories will appear here when the API has an active NDIS plan for this account.</Text>
        </View>
      );
    }

    return null;
  }, [categories.length, error, loadFunding, loading, refreshing, summary]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.phoneFrame}>
        <View style={styles.headerRow}>
          <View style={styles.backButton}>
            <Ionicons name="chevron-back" color="#1A1A2E" size={20} />
          </View>
          <Text style={styles.headerTitle}>NDIS Funding Tracker</Text>
        </View>

        <View style={styles.educatorCard}>
          <View style={styles.coralRail} />
          <View style={styles.educatorIcon}>
            <Ionicons name="school" color="#0B4F6C" size={20} />
          </View>
          <View style={styles.educatorCopy}>
            <Text style={styles.educatorTitle}>Hi Amina, here is your funding snapshot</Text>
            <Text style={styles.educatorBody}>
              {summary
                ? `You have used ${formatCurrency(totalUsed, currency)} of ${formatCurrency(totalAllocation, currency)}. ${
                    overBudgetCategory ? `${overBudgetCategory.label} needs review before the next booking.` : 'All categories are within allocation.'
                  }`
                : boundary || 'Your funding categories and recent plan transactions load from the GR8Care API.'}
            </Text>
          </View>
          <View style={styles.listenButton}>
            <Ionicons name="volume-medium" color="#FFFFFF" size={12} />
            <Text style={styles.listenText}>Listen</Text>
          </View>
        </View>

        {statusContent}

        {!statusContent ? (
          <>
            <View style={styles.usageWrap}>
              <View style={styles.usageRing}>
                <View style={styles.usageInner}>
                  <Text style={styles.usagePercent}>{totalPercent}%</Text>
                  <Text style={styles.usageLabel}>used</Text>
                </View>
              </View>
              <View style={styles.legendRow}>
                {categories.map((category) => {
                  const tone = CATEGORY_TONES[category.category];
                  return (
                    <View key={category.category} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: getAccent(tone) }]} />
                      <Text style={styles.legendText}>{getShortCategoryLabel(category.label)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {overBudgetCategory ? (
              <View style={styles.alertBox}>
                <Ionicons name="warning" color="#E53E3E" size={16} />
                <Text style={styles.alertText}>
                  {overBudgetCategory.label} over budget by {formatCurrency(Math.abs(overBudgetCategory.remaining), currency)}
                </Text>
              </View>
            ) : null}

            <View style={styles.categoryStack}>
              {categories.map((category: FundingCategorySummary) => {
                const tone = CATEGORY_TONES[category.category];
                const progress = category.allocation === 0 ? 0 : category.spentToDate / category.allocation;
                const accent = getAccent(tone);

                return (
                  <Card key={category.category} variant={category.overBudget ? 'warning' : 'default'} style={styles.categoryCard}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryTitleRow}>
                        <View style={[styles.categoryDot, { backgroundColor: accent }]} />
                        <Text style={styles.categoryTitle}>{category.label}</Text>
                      </View>
                      <View style={styles.categoryAmounts}>
                        <Text style={[styles.remainingAmount, { color: accent }]}>{formatCurrency(category.remaining, currency)}</Text>
                        <Text style={styles.allocationAmount}>/{formatCurrency(category.allocation, currency)}</Text>
                      </View>
                    </View>
                    <ProgressBar progress={progress} tone={tone} />
                    <Text style={[styles.usedText, category.overBudget && styles.overBudgetText]}>
                      {category.overBudget
                        ? 'Over budget'
                        : `${formatCurrency(category.spentToDate, currency)} used - ${category.percentageUsed}%`}
                    </Text>
                  </Card>
                );
              })}
            </View>

            <Text style={styles.recentLabel}>Recent Transactions</Text>
            <View style={styles.transactionStack}>
              {transactions.length === 0 ? (
                <Card style={styles.transactionCard}>
                  <View style={[styles.transactionIcon, styles.transactionIconInfo]}>
                    <Ionicons name="receipt" color="#0B4F6C" size={20} />
                  </View>
                  <View style={styles.transactionCopy}>
                    <Text style={styles.transactionTitle}>No transactions yet</Text>
                    <Text style={styles.transactionDate}>Recent plan transactions will appear here.</Text>
                  </View>
                </Card>
              ) : (
                transactions.map((transaction) => {
                  const isCapital = transaction.category === 'capital';
                  const displayAmount = transaction.amount > 0 ? -transaction.amount : transaction.amount;
                  return (
                    <Card key={transaction.id} style={styles.transactionCard}>
                      <View style={[styles.transactionIcon, isCapital ? styles.transactionIconError : styles.transactionIconInfo]}>
                        <Ionicons name={isCapital ? 'receipt' : 'car'} color={isCapital ? '#E53E3E' : '#0B4F6C'} size={20} />
                      </View>
                      <View style={styles.transactionCopy}>
                        <Text style={styles.transactionTitle}>{transaction.label}</Text>
                        <Text style={styles.transactionDate}>{formatTransactionDate(transaction.serviceDate)}</Text>
                      </View>
                      <Text style={styles.transactionAmount}>{formatCurrency(displayAmount, currency)}</Text>
                    </Card>
                  );
                })
              )}
            </View>
          </>
        ) : null}
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
    alignItems: 'center',
    paddingBottom: 36,
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 390,
    paddingHorizontal: 16,
    paddingTop: 52,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E0D6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A4F6B',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    color: '#1A1A2E',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  educatorCard: {
    marginTop: 18,
    minHeight: 96,
    borderRadius: 14,
    backgroundColor: '#0B4F6C',
    overflow: 'hidden',
    paddingLeft: 52,
    paddingRight: 12,
    paddingVertical: 14,
  },
  coralRail: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 4,
    backgroundColor: '#E8734A',
  },
  educatorIcon: {
    position: 'absolute',
    left: 14,
    top: 30,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D0EAF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  educatorCopy: {
    paddingRight: 82,
  },
  educatorTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  educatorBody: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10.5,
    lineHeight: 15,
  },
  listenButton: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    height: 24,
    minWidth: 78,
    borderRadius: 12,
    backgroundColor: '#E8734A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  listenText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  statusCard: {
    marginTop: 18,
    minHeight: 124,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E0D6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  statusCardWarning: {
    borderColor: '#E53E3E',
    backgroundColor: '#FED7D7',
  },
  statusTitle: {
    color: '#1A1A2E',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusBody: {
    color: '#4A5568',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    height: 34,
    minWidth: 104,
    borderRadius: 10,
    backgroundColor: '#0B4F6C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  usageWrap: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 10,
  },
  usageRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 18,
    borderColor: '#0B4F6C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usageInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#F7F3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usagePercent: {
    color: '#1A1A2E',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  usageLabel: {
    color: '#A0AEC0',
    fontSize: 12,
    lineHeight: 16,
  },
  legendRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    color: '#4A5568',
    fontSize: 12,
    lineHeight: 16,
  },
  alertBox: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E53E3E',
    backgroundColor: '#FED7D7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
  },
  alertText: {
    flex: 1,
    color: '#E53E3E',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
  categoryStack: {
    marginTop: 14,
    gap: 12,
  },
  categoryCard: {
    gap: 14,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryTitle: {
    color: '#1A1A2E',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  categoryAmounts: {
    alignItems: 'flex-end',
  },
  remainingAmount: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  allocationAmount: {
    color: '#A0AEC0',
    fontSize: 11,
    lineHeight: 14,
  },
  usedText: {
    marginTop: -8,
    color: '#A0AEC0',
    fontSize: 11,
    lineHeight: 14,
  },
  overBudgetText: {
    color: '#E53E3E',
  },
  recentLabel: {
    marginTop: 18,
    color: '#A0AEC0',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  transactionStack: {
    marginTop: 8,
    gap: 10,
  },
  transactionCard: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIconError: {
    backgroundColor: '#FED7D7',
  },
  transactionIconInfo: {
    backgroundColor: '#D0EAF2',
  },
  transactionCopy: {
    flex: 1,
  },
  transactionTitle: {
    color: '#1A1A2E',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  transactionDate: {
    marginTop: 2,
    color: '#A0AEC0',
    fontSize: 11,
    lineHeight: 14,
  },
  transactionAmount: {
    color: '#E53E3E',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
});
