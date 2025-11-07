// Type declarations for libsodium-wrappers
declare module 'libsodium-wrappers' {
  export const ready: Promise<void>;
  export function crypto_sign_verify_detached(
    signature: Uint8Array | Buffer,
    message: Uint8Array | Buffer,
    publicKey: Uint8Array | Buffer
  ): boolean;
}
