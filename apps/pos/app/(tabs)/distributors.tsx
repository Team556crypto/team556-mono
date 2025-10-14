import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TextInput, View, Switch } from 'react-native';
import { Button, Text, useTheme } from '@team556/ui';
import { ScreenLayout } from '@/components/layout/ScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { distributorsApi, DistributorInfo, DistributorConnectionOut, DistributorSettings, PricingSettings } from '@/services/api/distributors';

export default function Distributors() {
  const { colors } = useTheme();
  const token = useAuthStore(s => s.token);

  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState<DistributorInfo[]>([]);
  const [connections, setConnections] = useState<Record<string, DistributorConnectionOut | undefined>>({});
  const [creds, setCreds] = useState<Record<string, Record<string, string>>>({});
  const [settings, setSettings] = useState<Record<string, DistributorSettings>>({});

  const load = async () => {
    try {
      setLoading(true);
      const [list, conns] = await Promise.all([
        distributorsApi.listSupported(token),
        distributorsApi.listConnections(token),
      ]);
      setSupported(list.distributors);
      const map: Record<string, DistributorConnectionOut> = {};
      conns.connections.forEach(c => { map[c.distributor_code] = c });
      setConnections(map);
      // Initialize creds object fields if not present
      const initial: Record<string, Record<string, string>> = {};
      list.distributors.forEach(d => {
        if (!initial[d.code]) {
          initial[d.code] = {};
          d.fields.forEach(f => { initial[d.code][f] = '' });
        }
      });
      setCreds(prev => ({ ...initial, ...prev }));

      // Load settings for each distributor
      const settingsEntries = await Promise.all(
        list.distributors.map(async (d) => {
          try {
            const s = await distributorsApi.getSettings(token, d.code);
            return [d.code, s] as const;
          } catch (err) {
            return [d.code, { pricing: {} as PricingSettings }] as const;
          }
        })
      );
      const settingsMap: Record<string, DistributorSettings> = {};
      settingsEntries.forEach(([code, s]) => { settingsMap[code] = s });
      setSettings(settingsMap);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load distributors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (code: string, field: string, value: string) => {
    setCreds(prev => ({ ...prev, [code]: { ...(prev[code] || {}), [field]: value } }));
  };

  const saveConnection = async (code: string) => {
    try {
      const d = supported.find(s => s.code === code);
      if (!d) return;
      const values = creds[code] || {};
      // Minimal validation
      const missing = d.fields.filter(f => !values[f]);
      if (missing.length > 0) {
        Alert.alert('Missing fields', `Please fill: ${missing.join(', ')}`);
        return;
      }
      const res = await distributorsApi.upsertConnection(token, code, values);
      if (res.valid) {
        Alert.alert('Saved', 'Connection saved and validated');
        load();
      } else {
        Alert.alert('Saved with issues', res.error || 'Validation failed');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save connection');
    }
  };

  const validateConnection = async (code: string) => {
    try {
      const res = await distributorsApi.validateConnection(token, code);
      if (res.valid) {
        Alert.alert('Validated', 'Credentials are valid');
        load();
      } else {
        Alert.alert('Invalid', res.error || 'Credentials failed validation');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to validate');
    }
  };

  const updatePricingField = (code: string, key: keyof PricingSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [code]: {
        pricing: {
          ...(prev[code]?.pricing || {}),
          [key]: value,
        }
      }
    }));
  };

  const saveSettings = async (code: string) => {
    try {
      await distributorsApi.updateSettings(token, code, settings[code] || { pricing: {} });
      Alert.alert('Saved', 'Settings updated');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save settings');
    }
  };

  return (
    <ScreenLayout
      title='Distributors'
      headerIcon={<Ionicons name='shield-checkmark' size={24} color={colors.primary} />}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.pageTitle}>Connect your distributors</Text>
        <Text style={styles.pageSubtitle}>Add connections so your POS can sync product feeds and availability.</Text>

        {supported.map((d) => {
          const conn = connections[d.code];
          return (
            <View key={d.code} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{d.name}</Text>
                <View style={[styles.badge, conn?.status === 'connected' ? styles.badgeConnected : styles.badgeDisconnected]}>
                  <Text style={styles.badgeText}>{conn?.status || 'disconnected'}</Text>
                </View>
              </View>
              <Text style={styles.cardSubtext}>Auth type: {d.auth_type} • <Text style={styles.link} onPress={() => Linking.openURL(d.docs_url)}>Docs</Text></Text>

              <View style={styles.formFields}>
                <Text style={styles.sectionLabel}>Credentials</Text>
                {d.fields.map((field) => (
                  <View key={`${d.code}-${field}`} style={styles.formGroup}>
                    <Text style={styles.formLabel}>{field.toUpperCase()}</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder={`Enter ${field}`}
                      placeholderTextColor={Colors.textSecondary}
                      value={creds[d.code]?.[field] || ''}
                      onChangeText={(v) => handleChange(d.code, field, v)}
                      secureTextEntry={field.toLowerCase().includes('token')}
                      autoCapitalize='none'
                    />
                  </View>
                ))}
              </View>

              <View style={[styles.formFields, { marginTop: 12 }] }>
                <Text style={styles.sectionLabel}>Pricing Settings</Text>
                <View style={styles.formGroupRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.formLabel}>Margin %</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. 20"
                      keyboardType='decimal-pad'
                      value={settings[d.code]?.pricing?.margin_percent?.toString() || ''}
                      onChangeText={(v) => updatePricingField(d.code, 'margin_percent', v ? parseFloat(v) : undefined)}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.formLabel}>Min Margin %</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="optional"
                      keyboardType='decimal-pad'
                      value={settings[d.code]?.pricing?.min_margin_percent?.toString() || ''}
                      onChangeText={(v) => updatePricingField(d.code, 'min_margin_percent', v ? parseFloat(v) : undefined)}
                    />
                  </View>
                </View>

                <View style={styles.formGroupRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.formLabel}>Rounding</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="none | nearest | up"
                      autoCapitalize='none'
                      value={settings[d.code]?.pricing?.rounding || ''}
                      onChangeText={(v) => updatePricingField(d.code, 'rounding', v as any)}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.formLabel}>Price Floor (cents)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="optional"
                      keyboardType='number-pad'
                      value={settings[d.code]?.pricing?.price_floor_cents?.toString() || ''}
                      onChangeText={(v) => updatePricingField(d.code, 'price_floor_cents', v ? parseInt(v, 10) : undefined)}
                    />
                  </View>
                </View>

                <View style={styles.formGroupRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.formLabel}>Shipping/Handling (cents)</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="optional"
                      keyboardType='number-pad'
                      value={settings[d.code]?.pricing?.shipping_handling_cents?.toString() || ''}
                      onChangeText={(v) => updatePricingField(d.code, 'shipping_handling_cents', v ? parseInt(v, 10) : undefined)}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.formLabel, { marginRight: 12 }]}>MAP Enforced</Text>
                    <Switch
                      value={!!settings[d.code]?.pricing?.map_enforced}
                      onValueChange={(val) => updatePricingField(d.code, 'map_enforced', val)}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <Button onPress={() => saveConnection(d.code)}>
                  <Text style={styles.buttonText}>Save Connection</Text>
                </Button>
                <View style={{ width: 12 }} />
                <Button variant='secondary' onPress={() => validateConnection(d.code)}>
                  <Text style={styles.buttonText}>Validate</Text>
                </Button>
                <View style={{ width: 12 }} />
                <Button variant='secondary' onPress={() => saveSettings(d.code)}>
                  <Text style={styles.buttonText}>Save Settings</Text>
                </Button>
              </View>
            </View>
          )
        })}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  cardSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  formFields: {
    gap: 12,
  },
  formGroup: {
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  formGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: Colors.text,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeConnected: {
    backgroundColor: '#1f7a1f55',
  },
  badgeDisconnected: {
    backgroundColor: '#7a1f1f55',
  },
  badgeText: {
    fontSize: 12,
    color: Colors.text,
    textTransform: 'capitalize',
  },
});
