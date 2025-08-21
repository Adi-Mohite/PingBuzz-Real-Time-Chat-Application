import nacl from "tweetnacl";
import {
  encodeBase64,
  decodeBase64,
  encodeUTF8,
  decodeUTF8,
} from "tweetnacl-util";
import { axiosInstance } from "../lib/axios";

// 🔐 Derive a 256-bit AES key using PBKDF2
export async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// 🔄 Convert AES Key to raw Uint8Array (for NaCl secretbox)
export async function exportRawKey(key) {
  return new Uint8Array(await window.crypto.subtle.exportKey("raw", key));
}

// 🔐 Generate and encrypt NaCl key pair with password
export async function generateEncryptedKeyPair(password) {
  const keyPair = nacl.box.keyPair(); // Raw Uint8Array keys
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const nonce = window.crypto.getRandomValues(new Uint8Array(12)); // AES-GCM nonce

  const aesKey = await deriveKey(password, salt);
  const enc = new TextEncoder();

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    aesKey,
    keyPair.secretKey
  );

  return {
    publicKey: encodeBase64(keyPair.publicKey),
    encryptedPrivateKey: JSON.stringify({
      ciphertext: encodeBase64(new Uint8Array(encrypted)),
      nonce: encodeBase64(nonce),
      salt: encodeBase64(salt),
    }),
  };
}

// 🔓 Decrypt private key using password
export async function decryptPrivateKey(encryptedJson, password) {
  const { ciphertext, nonce, salt } = JSON.parse(encryptedJson);
  const aesKey = await deriveKey(password, decodeBase64(salt));

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(nonce) },
    aesKey,
    decodeBase64(ciphertext)
  );

  const secretKey = new Uint8Array(decrypted);
  const publicKey = nacl.box.keyPair.fromSecretKey(secretKey).publicKey;

  return {
    privateKey: secretKey,
    publicKey: encodeBase64(publicKey),
  };
}

// 🔏 Encrypt message with NaCl box

export function encryptMessage(
  message,
  senderPrivateKeyUint8,
  receiverPublicKeyUint8
) {
  try {
    // Validate key formats
    if (
      !(senderPrivateKeyUint8 instanceof Uint8Array) ||
      senderPrivateKeyUint8.length !== nacl.box.secretKeyLength
    ) {
      throw new Error("Invalid sender private key type/length.");
    }
    if (
      !(receiverPublicKeyUint8 instanceof Uint8Array) ||
      receiverPublicKeyUint8.length !== nacl.box.publicKeyLength
    ) {
      throw new Error("Invalid receiver public key type/length.");
    }

    // Generate a random nonce
    const nonce = nacl.randomBytes(nacl.box.nonceLength);

    // Encrypt the message
    const encrypted = nacl.box(
      decodeUTF8(message), // Message as Uint8Array
      nonce, // Nonce
      receiverPublicKeyUint8, // Receiver's public key
      senderPrivateKeyUint8 // Sender's private key
    );

    // Return Base64 encoded ciphertext + nonce for transport/storage
    return {
      ciphertext: encodeBase64(encrypted),
      nonce: encodeBase64(nonce),
    };
  } catch (error) {
    console.error("🔐 encryptMessage error", error);
    throw error;
  }
}

function normalizeKey(key) {
  // Already Uint8Array → just return
  if (key instanceof Uint8Array) return key;

  // Stored as a raw number array → convert
  if (Array.isArray(key)) return new Uint8Array(key);

  // Stored as Base64 string → decode
  if (typeof key === "string") return decodeBase64(key.trim());

  throw new Error("Unsupported key format for NaCl");
}

export function decryptMessage(
  ciphertext,
  nonce,
  senderPublicKey,
  recipientPrivateKey
) {
  try {
    if (!ciphertext || !nonce || !senderPublicKey || !recipientPrivateKey) {
      throw new Error("❌ Missing required decryption parameters");
    }

    // Debug input types
    console.log("🔍 decryptMessage inputs:", {
      ciphertextType: typeof ciphertext,
      nonceType: typeof nonce,
      senderPublicKeyType: typeof senderPublicKey,
      recipientPrivateKeyType: typeof recipientPrivateKey,
    });

    // Always decode from Base64 if not already Uint8Array
    const senderPublicKeyUint8 = normalizeKey(senderPublicKey);
    const recipientPrivateKeyUint8 = normalizeKey(recipientPrivateKey);

    console.log("🔍 Decoded key lengths:", {
      senderPublicKeyLength: senderPublicKeyUint8.length,
      recipientPrivateKeyLength: recipientPrivateKeyUint8.length,
    });

    if (senderPublicKeyUint8.length !== nacl.box.publicKeyLength) {
      throw new Error(
        `Invalid sender public key length: ${senderPublicKeyUint8.length}`
      );
    }
    if (recipientPrivateKeyUint8.length !== nacl.box.secretKeyLength) {
      throw new Error(
        `Invalid recipient private key length: ${recipientPrivateKeyUint8.length}`
      );
    }

    const decrypted = nacl.box.open(
      decodeBase64(ciphertext),
      decodeBase64(nonce),
      senderPublicKeyUint8,
      recipientPrivateKeyUint8
    );

    if (!decrypted)
      throw new Error("❌ Decryption failed (bad keys or corrupted data)");

    return encodeUTF8(decrypted);
  } catch (err) {
    console.error("Failed to decrypt:", err);
    return "🔐 Unable to decrypt";
  }
}

// 📡 Fetch another user's public key from backend
export async function fetchRecipientPublicKey(userId) {
  try {
    const res = await axiosInstance.get(`/auth/public-key/${userId}`);
    return res.data.publicKey;
  } catch (err) {
    console.error("❌ Failed to fetch recipient's public key", err);
    return null;
  }
}
