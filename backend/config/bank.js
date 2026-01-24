export function getBankDetails() {
  return {
    bankName: process.env.BANK_NAME || 'Example Bank',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
    accountName: process.env.BANK_ACCOUNT_NAME || 'Pulse Productions',
    swiftCode: process.env.BANK_SWIFT_CODE || 'SWIFT123',
    instructions: `Please include the reference code in your bank transfer memo/notes.`
  };
}

