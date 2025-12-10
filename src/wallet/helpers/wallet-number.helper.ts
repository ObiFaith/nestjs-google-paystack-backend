export class WalletNumberHelper {
  /**
   * Generate a unique 13-digit wallet number
   * Format: 45XXXXXXXXXXX (starts with 45)
   */
  static generate(): string {
    const prefix = '45'; // Your bank/service identifier
    const randomDigits = Math.floor(Math.random() * 10000000000) // 11 random digits
      .toString()
      .padStart(11, '0');

    return prefix + randomDigits;
  }

  /**
   * Validate wallet number format
   */
  static isValid(walletNumber: string): boolean {
    return /^45\d{11}$/.test(walletNumber);
  }
}
