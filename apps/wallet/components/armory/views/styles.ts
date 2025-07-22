import { StyleSheet } from 'react-native'

export const viewStyles = (colors: any, COLUMN_GAP: any) => {
    return StyleSheet.create({
        container: {
            height: '100%',
            backgroundColor: colors.backgroundDarker
          },
          header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
            zIndex: 1,
          },
          headerTitleContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8
          },
          flatListContainer: {
            flex: 1,
            overflow: 'visible'
          },
          gridContent: {
            paddingBottom: 40
          },
          columnWrapper: {
            gap: COLUMN_GAP,
            justifyContent: 'flex-start',
            marginBottom: COLUMN_GAP * 1.5
          },
          gridItem: {
            margin: COLUMN_GAP / 2,
            alignItems: 'center',
          },
          cardWrapper: {
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center'
          },
          centerMessage: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          },
          errorText: {
            color: colors.error,
            textAlign: 'center',
            marginTop: 8
          },
          limitReachedText: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            marginVertical: 8,
            paddingHorizontal: 16
          },
          emptyMessage: {
            flex: 1,
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.backgroundLight,
            backgroundColor: 'rgba(0,0,0,0.2)',
            gap: 12,
            paddingVertical: 48
          },
          addButton: {
            borderRadius: 8
          },
          addButtonHeaderSmall: {
            padding: 8,
            borderRadius: 8
          },
          addButtonLarge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(128, 90, 213, 0.1)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            gap: 8
          },
          addButtonText: {
            color: '#805AD5',
            fontWeight: '600'
          }
  })
}