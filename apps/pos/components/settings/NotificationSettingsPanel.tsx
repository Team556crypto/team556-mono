import React, { useEffect, useMemo, useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Switch } from 'react-native'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { notificationsApi, type NotificationSettingsResponse, type NotificationType, type UpdateNotificationSettingsRequest } from '@/services/api/notifications'

const ALL_TYPES: NotificationType[] = ['transaction', 'alerts', 'security', 'marketing']

export const NotificationSettingsPanel: React.FC = () => {
  const token = useAuthStore(s => s.token)

  const [loading, setLoading] = useState(false)
  const [initial, setInitial] = useState<NotificationSettingsResponse | null>(null)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [types, setTypes] = useState<Set<NotificationType>>(new Set())
  const [contactEmail, setContactEmail] = useState<string>('')
  const [dailySummary, setDailySummary] = useState(false)
  const [txnAlerts, setTxnAlerts] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await notificationsApi.getSettings(token)
      setInitial(data)
      setEmailEnabled(data.email_enabled)
      setPushEnabled(data.push_enabled)
      setTypes(new Set(data.types))
      setContactEmail(data.contact_email || '')
      setDailySummary(data.daily_summary_enabled)
      setTxnAlerts(data.transaction_alerts_enabled)
      setMarketingOptIn(!!data.marketing_opt_in)
      setEmailVerified(!!data.email_verified)
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load notification settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const dirty = useMemo(() => {
    if (!initial) return false
    const sameTypes = initial.types.length === types.size && initial.types.every(t => types.has(t))
    return (
      initial.email_enabled !== emailEnabled ||
      initial.push_enabled !== pushEnabled ||
      !sameTypes ||
      (initial.contact_email || '') !== (contactEmail || '') ||
      initial.daily_summary_enabled !== dailySummary ||
      initial.transaction_alerts_enabled !== txnAlerts ||
      (initial.marketing_opt_in || false) !== marketingOptIn
    )
  }, [initial, emailEnabled, pushEnabled, types, contactEmail, dailySummary, txnAlerts, marketingOptIn])

  const statusPill = useMemo(() => {
    if (emailEnabled && types.size === ALL_TYPES.length && dailySummary && txnAlerts) {
      return { text: 'All Enabled', color: Colors.success }
    }
    if (!emailEnabled && types.size === 0 && !dailySummary && !txnAlerts) {
      return { text: 'All Disabled', color: Colors.error }
    }
    return { text: 'Some Disabled', color: Colors.warning }
  }, [emailEnabled, pushEnabled, types, dailySummary, txnAlerts])

  const toggleType = (t: NotificationType) => {
    setTypes(prev => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  const onCancel = () => {
    if (!initial) return
    setEmailEnabled(initial.email_enabled)
    setPushEnabled(initial.push_enabled)
    setTypes(new Set(initial.types))
    setContactEmail(initial.contact_email || '')
    setDailySummary(initial.daily_summary_enabled)
    setTxnAlerts(initial.transaction_alerts_enabled)
    setMarketingOptIn(!!initial.marketing_opt_in)
    setEmailVerified(!!initial.email_verified)
  }

  const onSave = async () => {
    const body: UpdateNotificationSettingsRequest = {
      email_enabled: emailEnabled,
      push_enabled: pushEnabled,
      types: Array.from(types),
      contact_email: contactEmail || null,
      daily_summary_enabled: dailySummary,
      transaction_alerts_enabled: txnAlerts,
      marketing_opt_in: marketingOptIn,
    }
    try {
      await notificationsApi.updateSettings(token, body)
      Alert.alert('Saved', 'Notification preferences updated')
      await load()
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save preferences')
    }
  }

  const onVerify = async () => {
    try {
      await notificationsApi.resendVerification(token)
      Alert.alert('Verification', 'Verification email sent')
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to send verification email')
    }
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
      {/* Header Card */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Notification Preferences</Text>
          <View style={[styles.pill, { backgroundColor: `${statusPill.color}15`, borderColor: statusPill.color }]}>
            <Text style={styles.pillText}>{statusPill.text}</Text>
          </View>
        </View>

        {/* Global Toggles */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Email Notifications</Text>
          <Switch value={emailEnabled} onValueChange={setEmailEnabled} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Push Notifications</Text>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} />
        </View>

        {/* Active Types */}
        <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Active Notification Types <Text style={styles.counter}>{types.size}/{ALL_TYPES.length}</Text></Text>
        <View style={styles.chipsWrap}>
          {ALL_TYPES.map(t => (
            <TouchableOpacity key={t} onPress={() => toggleType(t)} style={[styles.chip, types.has(t) ? styles.chipActive : null]}>
              <Text style={[styles.chipText, types.has(t) ? styles.chipTextActive : null]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Email Block */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Email Notifications</Text>
        <TextInput
          style={styles.input}
          placeholder='contact@team556.com'
          placeholderTextColor={Colors.textSecondary}
          value={contactEmail}
          onChangeText={setContactEmail}
          autoCapitalize='none'
          keyboardType='email-address'
        />
        <Text style={styles.helper}>Notifications will be sent to this email address. Ensure it’s verified.</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <TouchableOpacity style={[styles.secondaryBtn, emailVerified && { opacity: 0.6 }]} onPress={onVerify} disabled={emailVerified}>
            <Text style={styles.btnText}>{emailVerified ? 'Verified' : 'Verify'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Individual Toggles */}
      <View style={styles.card}>
        <View style={[styles.tag, { backgroundColor: `${Colors.success}15`, borderColor: Colors.success }]}><Text style={styles.tagText}>Business</Text></View>
        <View style={styles.toggleRow}> 
          <Text style={styles.toggleLabel}>Daily Summary</Text>
          <Switch value={dailySummary} onValueChange={setDailySummary} />
        </View>
        <View style={[styles.tag, { backgroundColor: `${Colors.error}15`, borderColor: Colors.error }]}><Text style={styles.tagText}>Urgent</Text></View>
        <View style={styles.toggleRow}> 
          <Text style={styles.toggleLabel}>Transaction Alerts</Text>
          <Switch value={txnAlerts} onValueChange={setTxnAlerts} />
        </View>
      </View>

      {/* Footer Actions */}
      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, !dirty && { opacity: 0.6 }]} onPress={onSave}>
          <Text style={styles.btnText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.backgroundDark, borderRadius: 12, borderWidth: 1, borderColor: Colors.backgroundLight, padding: 16, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  pill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1 },
  pillText: { color: Colors.text, fontSize: 12, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  toggleLabel: { color: Colors.text, fontSize: 14 },
  sectionLabel: { color: Colors.text, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  counter: { color: Colors.textSecondary, fontWeight: '600' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: Colors.backgroundLight, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 },
  chipActive: { backgroundColor: `${Colors.primary}15`, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: 12 },
  chipTextActive: { color: Colors.primary },
  sectionHeader: { color: Colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: Colors.backgroundLight, borderWidth: 1, borderColor: Colors.backgroundLight, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14, color: Colors.text },
  helper: { color: Colors.textSecondary, fontSize: 12, marginTop: 8, marginBottom: 12 },
  tag: { alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10, marginBottom: 6, borderWidth: 1 },
  tagText: { color: Colors.text, fontSize: 10, fontWeight: '700' },
  footerRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  primaryBtn: { backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  secondaryBtn: { borderWidth: 1, borderColor: Colors.backgroundLight, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnText: { color: Colors.text, fontWeight: '600' },
})