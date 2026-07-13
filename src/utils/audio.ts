/**
 * Converts a base64 encoded string representing raw 16-bit PCM audio (24000Hz, mono)
 * into a typed Int16Array of audio samples.
 */
export function base64ToInt16Array(base64: string): Int16Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Ensure we avoid memory alignment issues with a fresh copy
  const arrayBuffer = new ArrayBuffer(bytes.length);
  const uint8View = new Uint8Array(arrayBuffer);
  uint8View.set(bytes);
  
  return new Int16Array(arrayBuffer);
}

/**
 * Concatenates an array of Int16Arrays into a single unified Int16Array.
 */
export function concatenateInt16Arrays(arrays: Int16Array[]): Int16Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Int16Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Encodes a 16-bit linear PCM Int16Array of samples into a standard, fully compatible WAV Blob.
 */
export function encodeWAV(samples: Int16Array, sampleRate: number = 24000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // 1. RIFF Identifier
  writeString(view, 0, "RIFF");
  // 2. File length: 36 + data size in bytes
  view.setUint32(4, 36 + samples.length * 2, true);
  // 3. WAVE Type
  writeString(view, 8, "WAVE");
  
  // 4. Format subchunk identifier ("fmt ")
  writeString(view, 12, "fmt ");
  // 5. Subchunk size (16 for standard PCM)
  view.setUint32(16, 16, true);
  // 6. Audio format (1 for uncompressed linear PCM)
  view.setUint16(20, 1, true);
  // 7. Number of channels (1 for mono)
  view.setUint16(22, 1, true);
  // 8. Sample rate (e.g. 24000)
  view.setUint32(24, sampleRate, true);
  // 9. Byte rate: sampleRate * numChannels * bytesPerSample
  view.setUint32(28, sampleRate * 1 * 2, true);
  // 10. Block align: numChannels * bytesPerSample
  view.setUint16(32, 2, true);
  // 11. Bits per sample (16)
  view.setUint16(34, 16, true);
  
  // 12. Data subchunk identifier ("data")
  writeString(view, 36, "data");
  // 13. Subchunk size (number of samples * 2 bytes)
  view.setUint32(40, samples.length * 2, true);

  // 14. Write Int16 PCM audio samples
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, samples[i], true);
  }

  return new Blob([view], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Helper to download a Blob object with a given filename in the user's browser.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
