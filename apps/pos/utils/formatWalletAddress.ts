/**
 * Formats a Solana wallet address for display by showing the first few and last few characters.
 * Example: `So1111...1111`
 * @param address The full wallet address string.
 * @param startChars The number of characters to show from the beginning.
 * @param endChars The number of characters to show from the end.
 * @returns The formatted address string, or an empty string if the input is invalid.
 */
export const formatWalletAddress = (
  address: string | undefined | null,
  startChars = 6,
  endChars = 4
): string => {
  if (!address) {
    return '';
  }
  if (address.length <= startChars + endChars) {
    return address; // Address is too short to truncate
  }
  const start = address.substring(0, startChars);
  const end = address.substring(address.length - endChars);
  return `${start}...${end}`;
};
