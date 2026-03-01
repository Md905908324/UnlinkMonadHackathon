// Derive a deterministic address from a mnemonic using SHA-256
export async function mnemonicToAddress(mnemonic: string): Promise<string> {
  const normalized = mnemonic.trim().toLowerCase();
  
  // Use SubtleCrypto to hash the mnemonic
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert hash to hex and format as Ethereum-like address (0x + 40 chars)
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Take first 40 chars of hash and format as address
  return '0x' + hashHex.slice(0, 40);
}
