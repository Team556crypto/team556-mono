import React from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFirearmStore } from '@/store/firearmStore';
import { useAmmoStore } from '@/store/ammoStore';
import { useGearStore } from '@/store/gearStore';
import { useDocumentStore } from '@/store/documentStore';
import { useNFAStore } from '@/store/nfaStore';
import { CategorySummaryCard, Text, Button } from '@team556/ui';
import { useTheme } from '@team556/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useArmoryStore } from '@/store/armoryStore';
import { useEffect } from 'react';

interface AllItemsViewProps {
  onCategorySelect: (category: string) => void;
}

const AllItemsView: React.FC<AllItemsViewProps> = ({ onCategorySelect }) => {
  const { colors } = useTheme();

  // Use armory store for counts
  const armoryStore = useArmoryStore();
  
  // Use destructuring to call each hook only once
  const firearmStore = useFirearmStore();
  const ammoStore = useAmmoStore();
  const gearStore = useGearStore();
  const documentStore = useDocumentStore();
  const nfaStore = useNFAStore();

  // Fetch armory counts when component mounts
  useEffect(() => {
    armoryStore.fetchCounts();
  }, []);

  // Extract values safely
  const firearms = firearmStore.firearms || [];
  const ammo = ammoStore.ammos || [];
  const gear = gearStore.gear || [];
  const documents = documentStore.documents || [];
  const nfaItems = nfaStore.nfaItems || [];

  // Consolidating loading and error states
  const isLoading = firearmStore.isLoading || ammoStore.isLoading || gearStore.isLoading || documentStore.isLoading || nfaStore.isLoading;
  const error = firearmStore.error || ammoStore.error || gearStore.error || documentStore.error || nfaStore.error || armoryStore.error;

  const handleClearError = () => {
    firearmStore.setError(null);
    ammoStore.setError(null);
    gearStore.setError(null);
    documentStore.setError(null);
    nfaStore.setError(null);
    armoryStore.setError(null);
    armoryStore.fetchCounts();
  };

  // Calculate summaries
  const firearmCount = armoryStore.counts?.firearms ?? firearms.length;
  const firearmValue = firearms.reduce((sum, item) => sum + Number(item.value || 0), 0);

  const ammoCount = armoryStore.counts?.ammo ?? ammo.length;
  const ammoValue = ammo.reduce((sum, item) => sum + Number(item.purchasePrice || 0), 0);

  const gearCount = armoryStore.counts?.gear ?? gear.length;
  const gearValue = gear.reduce((sum, item) => sum + Number(item.purchasePrice || 0), 0);

  const documentCount = armoryStore.counts?.documents ?? documents.length;

  const nfaCount = armoryStore.counts?.nfa ?? nfaItems.length;
  const nfaValue = nfaItems.reduce((sum, item) => sum + Number(item.value || 0), 0);

  // Define styles before any early returns
  const styles = StyleSheet.create({
    container: {
      flex: 1,
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
        count={firearmCount}
        totalValue={firearmValue}
        onPress={() => onCategorySelect('Firearms')}
      />
      <CategorySummaryCard
        icon={<MaterialCommunityIcons name="ammunition" size={24} color={colors.primary} />}
        title="Ammunition"
        count={ammoCount}
        totalValue={ammoValue}
        onPress={() => onCategorySelect('Ammo')}
      />
      <CategorySummaryCard
        icon={<MaterialCommunityIcons name="tent" size={24} color={colors.primary} />}
        title="Gear"
        count={gearCount}
        totalValue={gearValue}
        onPress={() => onCategorySelect('Gear')}
      />
      <CategorySummaryCard
        icon={<MaterialCommunityIcons name="file-document-outline" size={24} color={colors.primary} />}
        title="NFA Items"
        count={nfaCount}
        totalValue={nfaValue}
        onPress={() => onCategorySelect('NFA')}
      />
      <CategorySummaryCard
        icon={<MaterialCommunityIcons name="file-document-outline" size={24} color={colors.primary} />}
        title="Documents"
        count={documentCount}
        onPress={() => onCategorySelect('Documents')}
      />
    </ScrollView>
  );
};

export default AllItemsView;
