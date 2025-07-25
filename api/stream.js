const CryptoJS = require("crypto-js");

module.exports = async (req, res) => {
  const { id } = req.query;
  const SECRET_KEY = process.env.GDRIVE_SECRET_KEY;

  if (!id || !SECRET_KEY) {
    return res.status(400).send("Missing parameters");
  }

  try {
    // Decode dari base64 URL aman
    const base64Encrypted = atob(decodeURIComponent(id));
    const bytes = CryptoJS.AES.decrypt(base64Encrypted, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted || !/^[\w-]{10,}$/.test(decrypted)) {
      return res.status(400).send("Invalid decrypted ID");
    }

    // Redirect ke Google Drive
    return res.redirect(302, `https://drive.google.com/file/d/${decrypted}/preview`);
  } catch (err) {
    console.error("Decrypt error:", err);
    return res.status(500).send("Failed to decrypt");
  }
};
