import CryptoJS from "crypto-js";

const STATIC_AES_KEY = CryptoJS.enc.Hex.parse(
  "fada9144dd7692f8caa5f4482ac78fea"
);
const STATIC_IV = CryptoJS.enc.Hex.parse("00000000000000000000000000000000");

export const encryptPassword = (password: string): string | null => {
  try {
    const encrypted = CryptoJS.AES.encrypt(password, STATIC_AES_KEY, {
      iv: STATIC_IV,
      mode: CryptoJS.mode.CFB,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Ensure consistent output by using the same IV and encoding
    const ciphertext = encrypted.ciphertext;
    const ivAndCiphertext = STATIC_IV.clone().concat(ciphertext);
    return ivAndCiphertext.toString(CryptoJS.enc.Base64);
  } catch (error) {
    console.error("Error encrypting password:", error);
    return null;
  }
};
