import React, { useMemo } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFirearmStore } from '@/store/firearmStore';
import { useAmmoStore } from '@/store/ammoStore';
import { useGearStore } from '@/store/gearStore';
import { useDocumentStore } from '@/store/documentStore';
import { useNFAStore } from '@/store/nfaStore';
import { CategorySummaryCard, Text, Button } from '@team556/ui';
import { useTheme } from '@team556/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AllItemsViewProps {
  onCategorySelect: (category: string) => void;
}

const AllItemsView: React.FC<AllItemsViewProps> = ({ onCategorySelect }) => {
  const { colors } = useTheme();

  // Fetching data from all relevant stores
  const firearms = useFirearmStore(state => state.firearms);
  const ammo = useAmmoStore(state => state.ammos);
  const gear = useGearStore(state => state.gear);
  const documents = useDocumentStore(state => state.documents);
  const nfaItems = useNFAStore(state => state.nfaItems);

  // Consolidating loading and error states
  const isLoading = useFirearmStore(state => state.isLoading) || useAmmoStore(state => state.isLoading) || useGearStore(state => state.isLoading) || useDocumentStore(state => state.isLoading) || useNFAStore(state => state.isLoading);
  const error = useFirearmStore(state => state.error) || useAmmoStore(state => state.error) || useGearStore(state => state.error) || useDocumentStore(state => state.error) || useNFAStore(state => state.error);
  
  // Clear error functions
  const clearFirearmError = useFirearmStore(state => state.setError);
  const clearAmmoError = useAmmoStore(state => state.setError);
  const clearGearError = useGearStore(state => state.setError);
  const clearDocumentError = useDocumentStore(state => state.setError);
  const clearNFAError = useNFAStore(state => state.setError);

  const handleClearError = () => {
    clearFirearmError(null);
    clearAmmoError(null);
    clearGearError(null);
    clearDocumentError(null);
    clearNFAError(null);
  }

  // Memoized calculations for summaries
  const firearmSummary = useMemo(() => ({
    count: firearms.length,
    totalValue: firearms.reduce((sum, item) => sum + Number(item.value || 0), 0),
  }), [firearms]);

  const ammoSummary = useMemo(() => ({
    count: ammo.length,
    totalValue: ammo.reduce((sum, item) => sum + Number(item.purchasePrice || 0), 0),
  }), [ammo]);

  const gearSummary = useMemo(() => ({
    count: gear.length,
    totalValue: gear.reduce((sum, item) => sum + Number(item.purchasePrice || 0), 0),
  }), [gear]);

  const documentSummary = useMemo(() => ({
    count: documents.length,
  }), [documents]);

  const nfaSummary = useMemo(() => ({
    count: nfaItems.length,
    totalValue: nfaItems.reduce((sum, item) => sum + Number(item.value || 0), 0),
  }), [nfaItems]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    centerMessage: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      color: colors.error,
      textAlign: 'center',
      marginBottom: 16,
    },
  });

  if (isLoading && !firearms.length && !ammo.length && !gear.length) {
    return <ActivityIndicator style={styles.centerMessage} size='large' color={colors.primary} />;
  }

  if (error) {
    return (
      <View style={styles.centerMessage}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title='Try Again' onPress={handleClearError} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <CategorySummaryCard
        icon={<MaterialCommunityIcons name="pistol" size={24} color={colors.primary} />}
        title="Firearms"
        count={Number(firearmSummary.count)}
        totalValue={Number(firearmSummary.totalValue)}
        onPress={() => onCategorySelect('Firearms')}
      />
      <CategorySummaryCard
        icon={<MaterialCommunityIcons name="ammunition" size={24} color={colors.primary} />}
        title="Ammunition"
        count={Number(ammoSummary.count)}
        totalValue={Number(ammoSummary.totalValue)}
        onPress={() => onCategorySelect('Ammo')}
      />
      <CategorySummaryCard
        icon={<MaterialCommunityIcons name="tent" size={24} color={colors.primary} />}
        title="Gear"
        count={Number(gearSummary.count)}
        totalValue={Number(gearSummary.totalValue)}
        onPress={() => onCategorySelect('Gear')}
      />
      <CategorySummaryCard
        icon={<MaterialCommunityIcons name="file-document-outline" size={24} color={colors.primary} />}
        title="NFA Items"
        count={Number(nfaSummary.count)}
        totalValue={Number(nfaSummary.totalValue)}
        onPress={() => onCategorySelect('NFA')}
      />
      <CategorySummaryCard
        icon={<MaterialCommunityIcons name="file-document-outline" size={24} color={colors.primary} />}
        title="Documents"
        count={Number(documentSummary.count)}
        onPress={() => onCategorySelect('Documents')}
      />
    </ScrollView>
  );
};

export default AllItemsView;
