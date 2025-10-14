import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Colors } from '@/constants/Colors'
import { useAuthStore } from '@/store/authStore'
import { distributorsApi, DistributorConnectionOut, DistributorInfo, DistributorSettings, PricingSettings } from '@/services/api/distributors'
import { Ionicons } from '@expo/vector-icons'

export const DistributorSettingsPanel: React.FC = () => {
  const token = useAuthStore(s => s.token)
  const [supported, setSupported] = useState<DistributorInfo[]>([])
  const [connections, setConnections] = useState<DistributorConnectionOut[]>([])
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [creds, setCreds] = useState<Record<string, Record<string, string>>>({})
  const [settings, setSettings] = useState<Record<string, DistributorSettings>>({})
  const [loading, setLoading] = useState(false)

  const codeToName = useMemo(() => {
    const m: Record<string, string> = {}
    supported.forEach(d => { m[d.code] = d.name })
    return m
  }, [supported])

  const load = async () => {
    try {
      setLoading(true)
      const [list, conns] = await Promise.all([
        distributorsApi.listSupported(token),
        distributorsApi.listConnections(token),
      ])
      setSupported(list.distributors)
      setConnections(conns.connections)
      const initial: Record<string, Record<string, string>> = {}
      list.distributors.forEach(d => {
        initial[d.code] = {}
        d.fields.forEach(f => { initial[d.code][f] = '' })
      })
      setCreds(prev => ({ ...initial, ...prev }))

      const settingsEntries = await Promise.all(list.distributors.map(async d => {
        try { return [d.code, await distributorsApi.getSettings(token, d.code)] as const }
        catch { return [d.code, { pricing: {} as PricingSettings }] as const }
      }))
      const sMap: Record<string, DistributorSettings> = {}
      settingsEntries.forEach(([c, s]) => { sMap[c] = s })
      setSettings(sMap)
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load distributors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleChangeCred = (code: string, field: string, value: string) => {
    setCreds(prev => ({ ...prev, [code]: { ...(prev[code] || {}), [field]: value } }))
  }

  const updatePricingField = (code: string, key: keyof PricingSettings, value: any) => {
    setSettings(prev => ({ ...prev, [code]: { pricing: { ...(prev[code]?.pricing || {}), [key]: value } } }))
  }

  const saveConnection = async (code: string) => {
    const d = supported.find(s => s.code === code)
    if (!d) return
    const values = creds[code] || {}
    const missing = d.fields.filter(f => !values[f])
    if (missing.length > 0) { Alert.alert('Missing fields', `Please fill: ${missing.join(', ')}`); return }
    try {
      const res = await distributorsApi.upsertConnection(token, code, values)
      if (!res.valid) Alert.alert('Saved with issues', res.error || 'Validation failed')
      else Alert.alert('Saved', 'Connection saved and validated')
      await load()
    } catch (e: any) { Alert.alert('Error', e?.message || 'Failed to save connection') }
  }

  const validate = async (code: string) => {
    try {
      const res = await distributorsApi.validateConnection(token, code)
      Alert.alert(res.valid ? 'Validated' : 'Invalid', res.valid ? 'Credentials are valid' : res.error || 'Failed')
    } catch (e: any) { Alert.alert('Error', e?.message || 'Failed to validate') }
  }

  const saveSettings = async (code: string) => {
    try { await distributorsApi.updateSettings(token, code, settings[code] || { pricing: {} }); Alert.alert('Saved', 'Settings updated') }
    catch (e: any) { Alert.alert('Error', e?.message || 'Failed to save settings') }
  }

  const disconnect = async (code: string) => {
    Alert.alert(
      'Disconnect Distributor',
      'Are you sure you want to disconnect this distributor? You can reconnect later by re-entering credentials.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await distributorsApi.deleteConnection(token, code)
              Alert.alert('Disconnected', 'Distributor has been disconnected.')
              await load()
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to disconnect')
            }
          }
        }
      ]
    )
  }

  const sync = async (code: string) => {
    try { await distributorsApi.syncConnection(token, code); Alert.alert('Sync', 'Sync queued'); await load() }
    catch (e: any) { Alert.alert('Error', e?.message || 'Failed to queue sync') }
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Connected Distributors */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Connected Distributors</Text>
        </View>
        {connections.length === 0 ? (
          <Text style={styles.emptyText}>No distributors connected yet.</Text>
        ) : connections.map(c => (
          <View key={c.id} style={styles.rowBetween}>
            <View>
              <Text style={styles.itemTitle}>{codeToName[c.distributor_code] || c.distributor_code}</Text>
              <Text style={styles.itemSub}>Status: {c.status}{c.last_sync_at ? ` • Last synced ${new Date(c.last_sync_at).toLocaleDateString()}` : ''}</Text>
            </View>
            <View style={styles.row}>
              <TouchableOpacity style={styles.smallBtn} onPress={() => sync(c.distributor_code)}><Ionicons name='sync' size={16} color={Colors.text} /><Text style={styles.smallBtnText}> Sync</Text></TouchableOpacity>
              <View style={{ width: 8 }} />
              <TouchableOpacity style={[styles.smallBtn, { borderColor: Colors.error }]} onPress={() => disconnect(c.distributor_code)}><Ionicons name='close' size={16} color={Colors.error} /><Text style={[styles.smallBtnText, { color: Colors.error }]}> Disconnect</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Distributor Connections selector */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Distributor Connections</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setSelectedCode(supported[0]?.code || null)}>
            <Ionicons name='add' size={16} color={Colors.text} /><Text style={styles.smallBtnText}> Add Distributor</Text>
          </TouchableOpacity>
        </View>
        {/* simple selector */}
        <View style={styles.rowWrap}>
          {supported.map(d => (
            <TouchableOpacity key={d.code} style={[styles.selectorChip, selectedCode === d.code && styles.selectorChipActive]} onPress={() => setSelectedCode(d.code)}>
              <Text style={styles.selectorText}>{d.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedCode && (
          <View>
            <Text style={styles.sectionLabel}>Credentials for {codeToName[selectedCode] || selectedCode} <Text style={styles.link} onPress={() => Linking.openURL(supported.find(s => s.code === selectedCode)?.docs_url || '#')}>Docs</Text></Text>
            {(supported.find(s => s.code === selectedCode)?.fields || []).map(field => (
              <View key={`${selectedCode}-${field}`} style={styles.formGroup}>
                <Text style={styles.formLabel}>{field.toUpperCase()}</Text>
                <TextInput style={styles.input} placeholder={`Enter ${field}`} placeholderTextColor={Colors.textSecondary} value={creds[selectedCode]?.[field] || ''} onChangeText={(v) => handleChangeCred(selectedCode, field, v)} secureTextEntry={field.toLowerCase().includes('token')} autoCapitalize='none' />
              </View>
            ))}
            <View style={styles.row}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => saveConnection(selectedCode)}><Text style={styles.btnText}>Save Connection</Text></TouchableOpacity>
              <View style={{ width: 8 }} />
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => validate(selectedCode)}><Text style={styles.btnText}>Validate</Text></TouchableOpacity>
            </View>

            <View style={{ height: 16 }} />
            <Text style={styles.sectionLabel}>Distributor Settings</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.formLabel}>Percentage Markup</Text>
                <TextInput style={styles.input} placeholder='e.g. 20' keyboardType='decimal-pad' value={settings[selectedCode]?.pricing?.margin_percent?.toString() || ''} onChangeText={v => updatePricingField(selectedCode, 'margin_percent', v ? parseFloat(v) : undefined)} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.formLabel}>Fixed Markup ($)</Text>
                <TextInput style={styles.input} placeholder='e.g. 5' keyboardType='decimal-pad' value={settings[selectedCode]?.pricing?.fixed_markup_cents != null ? (settings[selectedCode]!.pricing!.fixed_markup_cents!/100).toString() : ''} onChangeText={v => updatePricingField(selectedCode, 'fixed_markup_cents', v ? Math.round(parseFloat(v) * 100) : undefined)} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.formLabel}>Rounding</Text>
                <TextInput style={styles.input} placeholder='none | nearest | up' autoCapitalize='none' value={settings[selectedCode]?.pricing?.rounding || ''} onChangeText={v => updatePricingField(selectedCode, 'rounding', v as any)} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.formLabel}>Price Floor (cents)</Text>
                <TextInput style={styles.input} placeholder='optional' keyboardType='number-pad' value={settings[selectedCode]?.pricing?.price_floor_cents?.toString() || ''} onChangeText={v => updatePricingField(selectedCode, 'price_floor_cents', v ? parseInt(v, 10) : undefined)} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.formLabel}>Shipping/Handling (cents)</Text>
                <TextInput style={styles.input} placeholder='optional' keyboardType='number-pad' value={settings[selectedCode]?.pricing?.shipping_handling_cents?.toString() || ''} onChangeText={v => updatePricingField(selectedCode, 'shipping_handling_cents', v ? parseInt(v, 10) : undefined)} />
              </View>
            </View>
            <View style={styles.rowWrap}>
              <TouchableOpacity style={[styles.toggle, settings[selectedCode]?.pricing?.auto_import_new ? styles.toggleOn : styles.toggleOff]} onPress={() => updatePricingField(selectedCode, 'auto_import_new', !settings[selectedCode]?.pricing?.auto_import_new)}>
                <Text style={styles.toggleText}>Automatically import new products</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggle, settings[selectedCode]?.pricing?.auto_update_existing ? styles.toggleOn : styles.toggleOff]} onPress={() => updatePricingField(selectedCode, 'auto_update_existing', !settings[selectedCode]?.pricing?.auto_update_existing)}>
                <Text style={styles.toggleText}>Automatically update existing prices</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 8 }} />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => saveSettings(selectedCode)}><Text style={styles.btnText}>Save Settings</Text></TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.backgroundDark, borderRadius: 12, borderWidth: 1, borderColor: Colors.backgroundLight, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  itemSub: { fontSize: 12, color: Colors.textSecondary },
  selectorChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.backgroundLight },
  selectorChipActive: { backgroundColor: `${Colors.primary}15`, borderColor: Colors.primary },
  selectorText: { color: Colors.text, fontSize: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  formGroup: { marginBottom: 10 },
  formLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: Colors.backgroundLight, borderWidth: 1, borderColor: Colors.backgroundLight, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14, color: Colors.text },
  primaryBtn: { backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  secondaryBtn: { borderWidth: 1, borderColor: Colors.backgroundLight, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  smallBtn: { borderWidth: 1, borderColor: Colors.backgroundLight, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  smallBtnText: { color: Colors.text, fontSize: 12, fontWeight: '600' },
  btnText: { color: Colors.text, fontWeight: '600' },
  addBtn: { borderWidth: 1, borderColor: Colors.backgroundLight, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  link: { color: Colors.primary, textDecorationLine: 'underline' },
  emptyText: { color: Colors.textSecondary, fontSize: 12 },
  toggle: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.backgroundLight },
  toggleOn: { backgroundColor: `${Colors.primary}15`, borderColor: Colors.primary },
  toggleOff: {},
  btnRow: { flexDirection: 'row', alignItems: 'center' },
})