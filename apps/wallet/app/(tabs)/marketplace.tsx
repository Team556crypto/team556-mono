import { Text, Input, useTheme, HorizontalBadgeScroll } from '@repo/ui';
import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Pressable, FlatList } from 'react-native'; 
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '@/components/layout/ScreenLayout';
import { LinearGradient } from 'expo-linear-gradient'; 
import { Image } from 'expo-image'; 

// Define the interface for a marketplace item
interface MarketplaceItem {
  id: string;
  name: string;
  price: string; 
  imageUrl?: string; 
  seller: string;
  category: string;
}

// Mock data for listings
const mockListings: MarketplaceItem[] = [
  {
    id: '1',
    name: 'Trijicon RMR Type 2',
    price: '450 USDC',
    imageUrl: 'https://via.placeholder.com/150/D0D0D0/808080?text=RMR', 
    seller: 'OpticsPro',
    category: 'Optics',
  },
  {
    id: '2',
    name: 'Magpul PMAG 30rd Mags (5 pack)',
    price: '60 USDC',
    imageUrl: 'https://via.placeholder.com/150/D0D0D0/808080?text=PMAG',
    seller: 'AmmoLand',
    category: 'Accessories',
  },
  {
    id: '3',
    name: 'Surefire X300 Weapon Light',
    price: '250 USDC',
    imageUrl: 'https://via.placeholder.com/150/D0D0D0/808080?text=X300',
    seller: 'GearUp',
    category: 'Accessories',
  },
  {
    id: '4',
    name: '5.56 NATO 1000 rounds',
    price: '400 USDC',
    seller: 'FreedomSeeds',
    category: 'Ammo',
  },
];

// Mock data for categories (can be fetched or managed globally later)
const availableCategories = ['All', 'Optics', 'Parts', 'Accessories', 'Gear', 'Services'];

const COLUMN_GAP = 16; // For FlatList spacing, similar to FirearmsView

// Marketplace Item Card Component (Overhauled)
interface MarketplaceItemCardProps {
  item: MarketplaceItem;
  onPress?: (item: MarketplaceItem) => void;
}

const MarketplaceItemCard: React.FC<MarketplaceItemCardProps> = ({ item, onPress }) => {
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  // Placeholder for image if item.imageUrl is missing
  const renderImagePlaceholder = () => (
    <View style={[cardStyles.placeholder, { backgroundColor: colors.backgroundDark }]}>
      <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
      <Text style={[cardStyles.placeholderText, { color: colors.textTertiary }]}>No Image</Text>
    </View>
  );

  const renderCardImage = () => {
    return (
      <View style={cardStyles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={cardStyles.image} contentFit="cover" />
        ) : (
          renderImagePlaceholder()
        )}
        <View style={[cardStyles.categoryTag, { backgroundColor: colors.backgroundDarker, borderColor: colors.backgroundLight }]}>
          <Text style={[cardStyles.categoryText, { color: colors.text }]}>{item.category}</Text>
        </View>
      </View>
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        cardStyles.card,
        { 
          borderColor: colors.backgroundLight, 
          transform: [{ scale: pressed ? 0.98 : 1 }],
          // Width will be determined by FlatList numColumns & columnWrapperStyle gap
        }
      ]}
      onPress={handlePress}
    >
      <LinearGradient colors={[colors.backgroundCard, colors.backgroundDark]} style={cardStyles.cardGradient}>
        {renderCardImage()}
        <View style={cardStyles.infoContainer}>
          <Text style={[cardStyles.itemName, { color: colors.text }]} numberOfLines={2} ellipsizeMode='tail'>
            {item.name}
          </Text>
          <Text style={[cardStyles.itemPrice, { color: colors.primary }]} numberOfLines={1} ellipsizeMode='tail'>
            {item.price}
          </Text>
          <Text style={[cardStyles.itemSeller, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode='tail'>
            Sold by: {item.seller}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const cardStyles = StyleSheet.create({
  card: { // Replicates FirearmCard style
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    // marginBottom is removed, handled by FlatList's columnWrapperStyle
    // width and height will be implicitly set by FlatList column logic
  },
  cardGradient: { // Replicates FirearmCard style
    width: '100%',
    height: '100%', // Card itself will have height managed by content or FlatList item style if needed
    justifyContent: 'flex-start',
  },
  imageContainer: { // Replicates FirearmCard style
    width: '100%',
    height: '65%', // Proportion similar to FirearmCard
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { // Replicates FirearmCard style
    width: '100%',
    height: '100%',
  },
  placeholder: { // Replicates FirearmCard style
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { // Replicates FirearmCard style
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  categoryTag: { // Replicates FirearmCard style
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: { // Replicates FirearmCard style
    fontSize: 12,
    fontWeight: '500',
  },
  infoContainer: { // Replicates FirearmCard style
    flex: 1, // Takes remaining space after imageContainer (approx 35%)
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8, // Added some vertical padding for balance
  },
  itemName: { // For item.name, replicates FirearmCard 'name' style
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  itemPrice: { // For item.price, can use a 'details' like style or make it prominent
    fontWeight: '600', // Make price slightly more prominent
    fontSize: 14,
    marginBottom: 4,
  },
  itemSeller: { // For item.seller, replicates FirearmCard 'details' style
    fontSize: 13,
    fontWeight: '500',
  },
});

export default function MarketplaceScreen() {
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All'); 

  const handleItemPress = (item: MarketplaceItem) => {
    console.log('Item pressed:', item.name);
  };

  const renderItem = ({ item }: { item: MarketplaceItem }) => (
    <MarketplaceItemCard item={item} onPress={handleItemPress} />
  );

  const filteredListings = useMemo(() => {
    return mockListings.filter(item => {
      const matchesSearchText = item.name.toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearchText && matchesCategory;
    });
  }, [searchText, selectedCategory]);

  const renderMarketListHeader = () => (
    <View style={styles.listHeaderContainer}> 
      {/* Search Bar Container */}
      <View style={styles.searchBarContainer}>
        <Input
          placeholder="Search Marketplace..."
          value={searchText}
          onChangeText={setSearchText}
          leftIcon={<Ionicons name="search" size={20} color={colors.textSecondary} />}
          clearable
          onClear={() => setSearchText('')}
          style={[
            styles.searchInput, 
            { backgroundColor: colors.backgroundLight } 
          ]}
        />
      </View>

      {/* Category Filter Bar */}
      <HorizontalBadgeScroll 
        items={availableCategories}
        initialSelectedItem={selectedCategory}
        onSelect={setSelectedCategory}
        style={styles.categoryFilterContainer} 
      />

      {/* Section Title: Browse Listings */}
      <Text preset="h2" bold style={[styles.browseTitle, { color: colors.text }]}>Browse Listings</Text>
    </View>
  );

  return (
    <ScreenLayout 
      title="Marketplace"
      headerIcon={<Ionicons name="storefront-outline" size={24} color={colors.primary} />}
    >
      <FlatList 
        ListHeaderComponent={renderMarketListHeader} 
        data={filteredListings} 
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={[styles.listingsContainer, { backgroundColor: colors.background }]} 
        contentContainerStyle={styles.listingsContentContainer}
        numColumns={2} 
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: COLUMN_GAP, marginBottom: COLUMN_GAP * 1.5 }}
        ListEmptyComponent={() => (
          <View style={[
            styles.emptyListContainer, 
            { 
              backgroundColor: colors.backgroundCard, 
              borderRadius: 8 
            }
          ]}>
            <Text style={[styles.emptyListText, { color: colors.textSecondary }]}>No listings found matching your criteria.</Text>
          </View>
        )}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  listHeaderContainer: { 
    // ScreenLayout's styles.container provides paddingHorizontal: 16
    // So, no explicit paddingHorizontal here unless needed for specific alignment within the header elements
    // This container groups the search, filter, and title.
    // If ScreenLayout's padding isn't perfectly aligning these, we might add padding here.
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16, 
  },
  searchInput: {
    flex: 1,
    // backgroundColor is set inline based on theme
  },
  categoryFilterContainer: {
    marginBottom: 20, // Space after filters, before "Browse Listings" title
  },
  browseTitle: {
    marginBottom: 16, // Space after "Browse Listings" title, before the actual list items
  },
  listingsContainer: {
    flex: 1, // Make FlatList take available space
    // backgroundColor is set inline based on theme
  },
  listingsContentContainer: {
    // paddingHorizontal might be needed if ScreenLayout's padding doesn't cover items correctly
    // For now, relying on ScreenLayout's padding for the overall screen
    // And columnWrapperStyle for gaps between items.
    paddingBottom: 40, // Ensure space at the bottom of the list
  },
  emptyListContainer: {
    // This style is for the 'No listings found' message
    // It should appear within the list area, so FlatList's padding applies if any
    // ScreenLayout's paddingHorizontal will apply to this if it's the only thing shown.
    flex: 1, // If it's the only item, let it take space
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20, 
  },
  emptyListText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
