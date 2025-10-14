import React from 'react'
import { View, StyleSheet, FlatList } from 'react-native'
import { useTheme, Text, Button, Badge } from '@team556/ui'
import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '@/constants/Colors'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { Transaction } from '@/services/api'

// Lightweight, file-local stat card for simple KPIs
function StatCard({
  label,
  value,
  delta,
  icon,
  positive
}: {
  label: string
  value: string | number
  delta?: string
  icon?: React.ReactNode
  positive?: boolean
}) {
  const { colors } = useTheme()
  return (
    <View style={[styles.statCard, { backgroundColor: colors.backgroundCard, borderColor: colors.backgroundLight }]}>
      <View style={styles.statHeader}>
        <Text preset='label' style={{ color: colors.textSecondary }}>{label}</Text>
        {icon ? <View>{icon}</View> : null}
      </View>
      <Text preset='h3' style={{ marginTop: 6 }}>{value}</Text>
      {delta ? (
        <Text preset='caption' style={{ marginTop: 4, color: positive ? colors.success : colors.error }}>
          {positive ? '▲ ' : '▼ '}{delta}
        </Text>
      ) : null}
    </View>
  )
}

// Simple row for recent transactions
function TransactionRow({ item }: { item: Transaction }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.txRow, { borderColor: colors.backgroundLight }]}> 
      <View style={styles.txLeft}>
        <View style={[styles.txIcon, { backgroundColor: Colors.cardBackgroundSubtle }]}> 
          <MaterialCommunityIcons
            name={item.type === 'Receive' ? 'tray-arrow-down' : item.type === 'Send' ? 'tray-arrow-up' : 'swap-horizontal'}
            size={18}
            color={colors.text}
          />
        </View>
        <View>
          <Text style={{ fontWeight: '600' }}>{item.type}</Text>
          <Text preset='caption' style={{ color: colors.textSecondary }}>
            {new Date(item.date).toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={styles.txRight}>
        <Badge label={`${item.amount} ${item.token}`} />
      </View>
    </View>
  )
}

export default function Dashboard() {
  const { colors } = useTheme()
  const { isTabletOrLarger } = useBreakpoint()

  // TODO: Replace with live data once API is available
  const metrics = {
    salesToday: '$4,230.54',
    ordersToday: 128,
    avgOrderValue: '$33.05',
    conversionRate: '2.8%'
  }

  const recentTransactions: Transaction[] = [
    {
      signature: 'abc123',
      date: new Date().toISOString(),
      type: 'Receive',
      amount: '152.00',
      token: 'USDC',
      from: 'Customer A',
      to: 'Merchant',
      memo: 'POS Payment'
    },
    {
      signature: 'def456',
      date: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      type: 'Send',
      amount: '45.00',
      token: 'USDC',
      from: 'Merchant',
      to: 'Supplier',
      memo: 'Order #1043'
    },
    {
      signature: 'ghi789',
      date: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
      type: 'Team556 Pay',
      amount: '18.75',
      token: 'USDC',
      from: 'Customer B',
      to: 'Merchant'
    }
  ]

  return (
    <ScreenLayout
      title='Dashboard'
      headerIcon={<Ionicons name='speedometer' size={24} color={colors.primary} />}
      headerRightElement={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title='New Order' leftIcon={<Ionicons name='add' size={16} color='#fff' />} />
          <Button title='Export' variant='outline' leftIcon={<Ionicons name='download' size={16} color={colors.text} />} />
        </View>
      }
      scrollEnabled
    >
      {/* KPI row */}
      <View style={[styles.kpiRow, { gap: 12 }]}> 
        <StatCard
          label='Sales Today'
          value={metrics.salesToday}
          delta='12.3% vs. yesterday'
          positive
          icon={<Ionicons name='cash' size={18} color={colors.icon} />}
        />
        <StatCard
          label='Orders Today'
          value={metrics.ordersToday}
          delta='-3.1% vs. yesterday'
          positive={false}
          icon={<Ionicons name='cart' size={18} color={colors.icon} />}
        />
        <StatCard
          label='Avg. Order Value'
          value={metrics.avgOrderValue}
          icon={<Ionicons name='pricetag' size={18} color={colors.icon} />}
        />
        <StatCard
          label='Conversion Rate'
          value={metrics.conversionRate}
          icon={<Ionicons name='trending-up' size={18} color={colors.icon} />}
        />
      </View>

      {/* Main content area: chart + recent activity */}
      <View style={[styles.mainRow, { flexDirection: isTabletOrLarger ? 'row' : 'column', gap: 12 }]}> 
        {/* Chart placeholder */}
        <View style={[styles.panel, { flex: 2, backgroundColor: colors.backgroundCard, borderColor: colors.backgroundLight }]}> 
          <View style={styles.panelHeader}>
            <Text preset='h4'>Sales (Last 7 days)</Text>
            <Badge label='7d' />
          </View>
          <View style={[styles.chartPlaceholder, { backgroundColor: Colors.cardBackgroundSubtle }]}>
            <Text preset='caption' style={{ color: colors.textSecondary }}>
              Chart coming soon
            </Text>
          </View>
        </View>

        {/* Recent transactions */}
        <View style={[styles.panel, { flex: 3, backgroundColor: colors.backgroundCard, borderColor: colors.backgroundLight }]}> 
          <View style={styles.panelHeader}>
            <Text preset='h4'>Recent Activity</Text>
            <Button title='View All' variant='ghost' />
          </View>
          <FlatList
            data={recentTransactions}
            keyExtractor={(item) => item.signature}
            renderItem={({ item }) => <TransactionRow item={item} />}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        </View>
      </View>

      {/* Quick actions */}
      <View style={[styles.quickActions, { backgroundColor: colors.backgroundCard, borderColor: colors.backgroundLight }]}> 
        <Text preset='h4'>Quick Actions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <Button title='Create Invoice' leftIcon={<Ionicons name='document-text' size={16} color='#fff' />} />
          <Button title='Add Product' variant='secondary' leftIcon={<Ionicons name='cube' size={16} color={colors.text} />} />
          <Button title='Scan Payment' variant='outline' leftIcon={<Ionicons name='scan' size={16} color={colors.text} />} />
        </View>
      </View>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16
  },
  statCard: {
    flexGrow: 1,
    minWidth: 180,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  mainRow: {
    width: '100%',
    alignItems: 'stretch',
    marginBottom: 16
  },
  panel: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  chartPlaceholder: {
    height: 200,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  txIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  quickActions: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1
  }
})
