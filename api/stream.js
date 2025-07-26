import CryptoJS from "crypto-js";
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) return res.status(400).send("Missing encrypted ID");

  try {
    // Dekripsi ID dari parameter
    const encrypted = Buffer.from(id, "base64").toString("utf8");
    const decrypted = CryptoJS.AES.decrypt(encrypted, "UltraSecretKey@2024");
    const realId = decrypted.toString(CryptoJS.enc.Utf8);

    if (!realId || !/^[\w-]{10,}$/.test(realId)) {
      return res.status(400).send("Invalid video ID");
    }

    // Bangun URL asli dari Google Drive
    const videoUrl = `https://drive.google.com/uc?export=download&id=${realId}`;

    // Ambil stream dari Google
    const response = await fetch(videoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    // Teruskan headers (type, length, dll)
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status);

    // Stream langsung ke player
    response.body.pipe(res);
  } catch (err) {
    console.error("Stream error:", err);
    res.status(500).send("Stream failed");
  }
}
