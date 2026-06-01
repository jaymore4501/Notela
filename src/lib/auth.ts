import crypto from "crypto";

/**
 * Hash a password using PBKDF2.
 * Returns pbkdf2:iterations:salt:hash format.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 600000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
  return `pbkdf2:${iterations}:${salt}:${hash}`;
}

/**
 * Verify a password against a stored PBKDF2 hash.
 * Handles both the legacy salt:hash and the new pbkdf2:iterations:salt:hash format.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    
    if (parts.length === 2) {
      // Legacy salt:hash format (1000 iterations)
      const [salt, originalHash] = parts;
      if (!salt || !originalHash) return false;
      
      const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
      const hashBuffer = Buffer.from(hash, "hex");
      const originalHashBuffer = Buffer.from(originalHash, "hex");
      
      if (hashBuffer.length !== originalHashBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(hashBuffer, originalHashBuffer);
    } 
    
    if (parts.length === 4 && parts[0] === "pbkdf2") {
      // Modern pbkdf2:iterations:salt:hash format
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const originalHash = parts[3];
      if (isNaN(iterations) || !salt || !originalHash) return false;
      
      const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
      const hashBuffer = Buffer.from(hash, "hex");
      const originalHashBuffer = Buffer.from(originalHash, "hex");
      
      if (hashBuffer.length !== originalHashBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(hashBuffer, originalHashBuffer);
    }
    
    return false;
  } catch (err) {
    return false;
  }
}
