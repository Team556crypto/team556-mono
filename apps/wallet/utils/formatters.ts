// Helper to format balance, showing '--' if null/undefined or not a number
export const formatBalance = (balance: number | null | undefined): string => {
  if (typeof balance !== 'number') {
    return '--'
  }
  // Adjust formatting as needed (e.g., locale, max digits)
  // Consider significant digits for smaller amounts if needed
  return balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6 // Show more precision for crypto
  })
}

// Helper to format currency value (USD), showing '--' if null/undefined or not a number
export const formatPrice = (value: number | null | undefined): string => {
  if (typeof value !== 'number') {
    return '--'
  }
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6 // Ensure exactly 2 decimal places
  })}`
}

// Helper to format wallet address, showing '--' if null/undefined or not a string
export const formatWalletAddress = (address: string) => {
  if (address === 'No wallet linked') return address
  if (address.length > 16) {
    return `${address.substring(0, 5)}...${address.substring(address.length - 5)}`
  }
  return address
}
