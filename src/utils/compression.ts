import pako from 'pako';

/**
 * Compress a string using pako (zlib)
 * @param data The string to compress
 * @returns Base64 encoded compressed data
 */
export function compress(data: string): string {
  try {
    // Convert string to Uint8Array
    const uint8Array = new TextEncoder().encode(data);
    
    // Compress the data
    const compressed = pako.deflate(uint8Array);
    
    // Convert to base64 for storage
    return uint8ArrayToBase64(compressed);
  } catch (error) {
    console.error('Compression error:', error);
    return data; // Return original data on error
  }
}

/**
 * Decompress a previously compressed string
 * @param compressedData Base64 encoded compressed data
 * @returns The original string
 */
export function decompress(compressedData: string): string {
  try {
    // Convert base64 back to Uint8Array
    const compressedArray = base64ToUint8Array(compressedData);
    
    // Decompress the data
    const decompressed = pako.inflate(compressedArray);
    
    // Convert back to string
    return new TextDecoder().decode(decompressed);
  } catch (error) {
    console.error('Decompression error:', error);
    return compressedData; // Return compressed data on error
  }
}

/**
 * Convert a Uint8Array to a base64 string
 */
function uint8ArrayToBase64(array: Uint8Array): string {
  let binary = '';
  const len = array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}

/**
 * Convert a base64 string to a Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Compress a game state object
 * @param state The game state to compress
 * @returns Compressed representation of the state
 */
export function compressGameState(state: any): { 
  compressedData: string; 
  originalSize: number;
  compressedSize: number;
} {
  const stateString = JSON.stringify(state);
  const originalSize = stateString.length;
  const compressedData = compress(stateString);
  const compressedSize = compressedData.length;
  
  return {
    compressedData,
    originalSize,
    compressedSize
  };
}

/**
 * Decompress a game state
 * @param compressedData The compressed state data
 * @returns The original game state object
 */
export function decompressGameState(compressedData: string): any {
  const decompressed = decompress(compressedData);
  return JSON.parse(decompressed);
}

/**
 * Calculate compression ratio
 * @param originalSize Original size in bytes
 * @param compressedSize Compressed size in bytes
 * @returns Compression ratio as a percentage
 */
export function getCompressionRatio(originalSize: number, compressedSize: number): number {
  return Math.round((1 - (compressedSize / originalSize)) * 100);
}
