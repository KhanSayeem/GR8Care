import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, ProgressBar } from '../../components';
import { fundingCategories, fundingTransactions } from '../../data/walkthroughData';

function formatCurrency(value: number) {
  const amount = Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
  return value < 0 ? `-$${amount}` : `$${amount}`;
}

const totalAllocation = fundingCategories.reduce((sum, category) => sum + category.allocation, 0);
const totalUsed = fundingCategories.reduce((sum, category) => sum + category.used, 0);
const totalPercent = Math.round((totalUsed / totalAllocation) * 100);
const overBudgetCategory = fundingCategories.find((category) => category.used > category.allocation);

export function FundingScreen() {
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
              You have used {formatCurrency(totalUsed)} of {formatCurrency(totalAllocation)}. Capital Supports needs review before the next booking.
            </Text>
          </View>
          <View style={styles.listenButton}>
            <Ionicons name="volume-medium" color="#FFFFFF" size={12} />
            <Text style={styles.listenText}>Listen</Text>
          </View>
        </View>

        <View style={styles.usageWrap}>
          <View style={styles.usageRing}>
            <View style={styles.usageInner}>
              <Text style={styles.usagePercent}>{totalPercent}%</Text>
              <Text style={styles.usageLabel}>used</Text>
            </View>
          </View>
          <View style={styles.legendRow}>
            {fundingCategories.map((category) => (
              <View key={category.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: category.tone === 'teal-dark' ? '#0B4F6C' : category.tone === 'provider-green' ? '#2D9E6B' : '#E53E3E' }]} />
                <Text style={styles.legendText}>{category.label.replace(' Supports', '').replace(' Building', '')}</Text>
              </View>
            ))}
          </View>
        </View>

        {overBudgetCategory ? (
          <View style={styles.alertBox}>
            <Ionicons name="warning" color="#E53E3E" size={16} />
            <Text style={styles.alertText}>
              {overBudgetCategory.label} over budget by {formatCurrency(overBudgetCategory.used - overBudgetCategory.allocation)}
            </Text>
          </View>
        ) : null}

        <View style={styles.categoryStack}>
          {fundingCategories.map((category) => {
            const remaining = category.allocation - category.used;
            const progress = category.used / category.allocation;
            const isOverBudget = remaining < 0;
            const accent = category.tone === 'teal-dark' ? '#0B4F6C' : category.tone === 'provider-green' ? '#2D9E6B' : '#E53E3E';

            return (
              <Card key={category.label} variant={isOverBudget ? 'warning' : 'default'} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryTitleRow}>
                    <View style={[styles.categoryDot, { backgroundColor: accent }]} />
                    <Text style={styles.categoryTitle}>{category.label}</Text>
                  </View>
                  <View style={styles.categoryAmounts}>
                    <Text style={[styles.remainingAmount, { color: accent }]}>{formatCurrency(remaining)}</Text>
                    <Text style={styles.allocationAmount}>/{formatCurrency(category.allocation)}</Text>
                  </View>
                </View>
                <ProgressBar progress={progress} tone={category.tone} />
                <Text style={[styles.usedText, isOverBudget && styles.overBudgetText]}>
                  {isOverBudget ? 'Over budget' : `${formatCurrency(category.used)} used - ${Math.round(progress * 100)}%`}
                </Text>
              </Card>
            );
          })}
        </View>

        <Text style={styles.recentLabel}>Recent Transactions</Text>
        <View style={styles.transactionStack}>
          {fundingTransactions.map((transaction) => (
            <Card key={`${transaction.label}-${transaction.date}`} style={styles.transactionCard}>
              <View style={[styles.transactionIcon, transaction.tone === 'error' ? styles.transactionIconError : styles.transactionIconInfo]}>
                <Ionicons name={transaction.tone === 'error' ? 'receipt' : 'car'} color={transaction.tone === 'error' ? '#E53E3E' : '#0B4F6C'} size={20} />
              </View>
              <View style={styles.transactionCopy}>
                <Text style={styles.transactionTitle}>{transaction.label}</Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
              <Text style={styles.transactionAmount}>{formatCurrency(transaction.amount)}</Text>
            </Card>
          ))}
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
