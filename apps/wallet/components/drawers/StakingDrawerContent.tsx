import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Button, Input } from '@repo/ui';
import { Ionicons } from '@expo/vector-icons'; 
import { styles } from './StakingDrawerContent.styles';
import { Colors } from '../../constants/Colors';
import { useStakingStore, StakingOption, UserStakedPosition } from '../../store/stakingStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { useWalletStore } from '../../store/walletStore'; 

export function StakingDrawerContent() {
  const {
    availableStakingOptions,
    userStakedPositions,
    isLoading: stakingIsLoading, 
    error: stakingError, 
    fetchAvailableStakingOptions,
    fetchUserStakedPositions,
    stakeTeamToOption,
  } = useStakingStore();

  const { user } = useAuthStore();
  const walletAddress = user?.wallets?.[0]?.address;
  const showToast = useToastStore((state) => state.showToast);
  const { 
    teamPrice, 
    isTeamLoading: walletIsLoading, 
    teamError: walletError,
    teamBalance 
  } = useWalletStore(); 

  const [selectedOptionToStake, setSelectedOptionToStake] = useState<StakingOption | null>(null);
  const [amountToStakeInput, setAmountToStakeInput] = useState<string>('');

  const isLoading = stakingIsLoading || walletIsLoading;
  const error = stakingError || walletError;

  useEffect(() => {
    if (walletAddress) {
      fetchAvailableStakingOptions();
      fetchUserStakedPositions(walletAddress);
    }
  }, [walletAddress, fetchAvailableStakingOptions, fetchUserStakedPositions]);

  const handleSelectOptionForStaking = (option: StakingOption) => {
    setSelectedOptionToStake(option);
    setAmountToStakeInput('');
  };

  const handleConfirmStake = async () => {
    if (!selectedOptionToStake || !walletAddress) {
      showToast('Please select an option and ensure your wallet is connected.', 'error');
      return;
    }
    const amount = parseFloat(amountToStakeInput);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount to stake.', 'error');
      return;
    }
    if (selectedOptionToStake.minStakeAmount && amount < selectedOptionToStake.minStakeAmount) {
        showToast(`Minimum stake is ${selectedOptionToStake.minStakeAmount} TEAM.`, 'error');
        return;
    }

    try {
      // Pass walletIsLoading to disable button during staking to prevent double submission
      // if stakingIsLoading is not sufficient (e.g. if walletStore is also doing critical ops)
      await stakeTeamToOption(selectedOptionToStake.id, Number(amount), walletAddress); 
      showToast(`Successfully staked ${amount} TEAM into ${selectedOptionToStake.name}.`, 'success');
      setSelectedOptionToStake(null);
      setAmountToStakeInput('');
    } catch (e: any) {
      showToast(e.message || 'Failed to stake. Please try again.', 'error');
    }
  };

  const totalStakedTEAM = useMemo(() => {
    return userStakedPositions.reduce((sum, pos) => sum + pos.amountStaked, 0);
  }, [userStakedPositions]);

  const totalEstimatedRewards = useMemo(() => {
    return userStakedPositions.reduce((sum, pos) => sum + (pos.rewardsEarned || 0), 0);
  }, [userStakedPositions]);
  
  const totalStakedValueUSD = useMemo(() => {
    return totalStakedTEAM * (teamPrice || 0);
  }, [totalStakedTEAM, teamPrice]);

  const onRefresh = React.useCallback(() => {
    if (walletAddress) {
        fetchAvailableStakingOptions();
        fetchUserStakedPositions(walletAddress);
    }
  }, [walletAddress, fetchAvailableStakingOptions, fetchUserStakedPositions]);

  if (isLoading && availableStakingOptions.length === 0 && userStakedPositions.length === 0) {
    return <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (error && availableStakingOptions.length === 0) {
    return <View style={styles.centeredMessage}><Text>Error fetching staking data: {String(error)}</Text><Button title="Retry" onPress={onRefresh} /></View>;
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary}/>}
    >
      <View style={styles.overviewCard}>
        <Text style={styles.overviewTitle}>Staking Overview</Text>
        
        <View style={styles.overviewItemContainer}>
          <Ionicons name="layers-outline" size={24} style={styles.overviewIcon} />
          <View style={styles.overviewTextContainer}>
            <Text style={styles.overviewLabel}>Total Staked TEAM:</Text>
            <Text style={styles.overviewValue}>{totalStakedTEAM.toLocaleString()} TEAM</Text>
          </View>
        </View>

        {teamPrice !== null && (
          <View style={styles.overviewItemContainer}>
            <Ionicons name="cash-outline" size={24} style={styles.overviewIcon} />
            <View style={styles.overviewTextContainer}>
              <Text style={styles.overviewLabel}>Total Value (USD):</Text>
              <Text style={styles.overviewValue}>${totalStakedValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          </View>
        )}

        <View style={styles.overviewItemContainer}>
          <Ionicons name="gift-outline" size={24} style={styles.overviewIcon} />
          <View style={styles.overviewTextContainer}>
            <Text style={styles.overviewLabel}>Total Est. Rewards:</Text>
            <Text style={styles.overviewValue}>{totalEstimatedRewards.toLocaleString()} TEAM</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Available Staking Pools</Text>
      {availableStakingOptions.length === 0 && !isLoading ? (
        <Text style={styles.centeredMessage}>No staking options currently available.</Text>
      ) : null}
      {availableStakingOptions.map((option) => (
        <View key={option.id} style={[styles.optionCard, selectedOptionToStake?.id === option.id && styles.selectedOptionCard]}>
          <View style={styles.optionCardHeader}>
            <Text style={styles.optionName}>{option.name}</Text>
            <View style={styles.optionIconWrapper}>
              <Ionicons 
                name={option.type === 'fixed' ? 'lock-closed-outline' : 'refresh-outline'} 
                size={22} 
                color={Colors.primary} 
              />
            </View>
          </View>

          <View style={styles.optionCardBody}>
            <View style={styles.optionDetailRow}>
              <Text style={styles.optionDetailLabel}>APY:</Text>
              <Text style={[styles.optionDetailValue, styles.apyText]}>{(option.apy * 100).toFixed(2)}%</Text>
            </View>

            {option.durationDays ? (
              <View style={styles.optionDetailRow}>
                <Text style={styles.optionDetailLabel}>Duration:</Text>
                <Text style={styles.optionDetailValue}>{String(option.durationDays)} days</Text>
              </View>
            ) : (
              <View style={styles.optionDetailRow}>
                <Text style={styles.optionDetailLabel}>Type:</Text>
                <Text style={styles.optionDetailValue}>Flexible</Text>
              </View>
            )}

            {option.minStakeAmount && (
              <View style={styles.optionDetailRow}>
                <Text style={styles.optionDetailLabel}>Min. Stake:</Text>
                <Text style={styles.optionDetailValue}>{String(option.minStakeAmount)} TEAM</Text>
              </View>
            )}
          </View>

          <Text style={styles.optionDescription}>{option.description}</Text>
          
          <Button 
            title={selectedOptionToStake?.id === option.id ? "Selected" : "Select for Staking"} 
            onPress={() => handleSelectOptionForStaking(option)} 
            variant={selectedOptionToStake?.id === option.id ? 'primary' : 'outline'}
            style={{marginTop: 10}}
            disabled={isLoading}
          />
        </View>
      ))}

      {selectedOptionToStake && (
        <View style={styles.stakeActionSection}>
          <Text style={styles.sectionTitle}>Stake in "{selectedOptionToStake.name}"</Text>
          {teamBalance !== null && (
            <Text style={styles.balanceText}>
              Available: {teamBalance.toLocaleString()} TEAM
            </Text>
          )}
          <Input
            value={amountToStakeInput}
            onChangeText={setAmountToStakeInput}
            placeholder={`Min ${String(selectedOptionToStake.minStakeAmount || 0)} TEAM`}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor={Colors.textSecondary}
          />
          <Button 
            title={`Stake ${String(amountToStakeInput ? amountToStakeInput : '0')} TEAM`}
            onPress={handleConfirmStake} 
            loading={isLoading} 
            style={styles.button} 
            disabled={!amountToStakeInput || parseFloat(amountToStakeInput) <= 0 || isLoading}
          />
          <Button title="Cancel" onPress={() => setSelectedOptionToStake(null)} variant='outline' style={styles.button} disabled={isLoading} />
        </View>
      )}

      <Text style={styles.sectionTitle}>My Staked Positions</Text>
      {userStakedPositions.length === 0 && !isLoading ? (
        <Text style={styles.centeredMessage}>You have no active stakes.</Text>
      ) : null}
      {userStakedPositions.map((position) => {
        const optionDetails = availableStakingOptions.find(opt => opt.id === position.optionId);
        const displayName = position.optionName || optionDetails?.name || 'Staked Position';
        const displayApy = optionDetails ? `${(optionDetails.apy * 100).toFixed(2)}% APY` : '';
        const iconName = optionDetails?.type === 'fixed' ? 'lock-closed-outline' : 'refresh-outline';
        const iconColor = Colors.success; // For active stakes

        return (
          <View key={position.positionId} style={styles.positionCard}>
            <View style={styles.positionCardHeader}>
              <Text style={styles.positionName}>{displayName}</Text>
              <View style={styles.positionIconWrapper}>
                <Ionicons 
                  name="checkmark-done-circle-outline" // Icon indicating active/successful stake
                  size={22} 
                  color={iconColor} 
                />
              </View>
            </View>

            {displayApy && (
                <View style={styles.optionDetailRow}>
                    <Text style={styles.optionDetailLabel}>APY:</Text>
                    <Text style={[styles.optionDetailValue, styles.apyText]}>{displayApy.replace(' APY', '')}</Text>
                </View>
            )}
            
            <View style={styles.optionDetailRow}>
                <Text style={styles.optionDetailLabel}>Staked:</Text>
                <Text style={styles.optionDetailValue}>{String(position.amountStaked)} TEAM</Text>
            </View>
            <View style={styles.optionDetailRow}>
                <Text style={styles.optionDetailLabel}>Rewards:</Text>
                <Text style={styles.optionDetailValue}>{String(position.rewardsEarned)} TEAM</Text>
            </View>
            <View style={styles.optionDetailRow}>
                <Text style={styles.optionDetailLabel}>Date Staked:</Text>
                <Text style={styles.optionDetailValue}>{new Date(position.stakedDate).toLocaleDateString()}</Text>
            </View>
            {position.unlockDate && (
                <View style={styles.optionDetailRow}>
                    <Text style={styles.optionDetailLabel}>Unlocks:</Text>
                    <Text style={styles.optionDetailValue}>{new Date(position.unlockDate).toLocaleDateString()}</Text>
                </View>
            )}
          </View>
        );
      })}

    {isLoading && (availableStakingOptions.length > 0 || userStakedPositions.length > 0) && 
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20}} />
    }
    </ScrollView>
  );
}
