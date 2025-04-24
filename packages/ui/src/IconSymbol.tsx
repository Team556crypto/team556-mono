// This file is a fallback for using MaterialIcons on Android and web.

import { MaterialIcons, Entypo, Ionicons, AntDesign, EvilIcons } from '@expo/vector-icons'
import { SymbolWeight } from 'expo-symbols'
import React from 'react'
import { OpaqueColorValue, StyleProp, TextStyle } from 'react-native'

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export default function IconSymbol({
  name,
  size = 24,
  color,
  style
}: {
  name: any
  size?: number
  color: string | OpaqueColorValue
  style?: StyleProp<TextStyle>
  weight?: SymbolWeight
}) {
  const iconPrefix = name.split(':')[0]
  const iconName = name.split(':')[1]

  switch (iconPrefix) {
    case 'entypo':
      return <Entypo color={color} size={size} name={iconName} style={style} />
    case 'ionicons':
      return <Ionicons color={color} size={size} name={iconName} style={style} />
    case 'antdesign':
      return <AntDesign color={color} size={size} name={iconName} style={style} />
    case 'evilicons':
      return <EvilIcons color={color} size={size} name={iconName} style={style} />
    default:
      return <MaterialIcons color={color} size={size} name={iconName} style={style} />
  }
}
