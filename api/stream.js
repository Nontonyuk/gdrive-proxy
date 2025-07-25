const CryptoJS = require("crypto-js");

module.exports = async (req, res) => {
  const { id } = req.query;
  const SECRET_KEY = process.env.GDRIVE_SECRET_KEY || "UltraSecretKey@2024";

  try {
    const bytes = CryptoJS.AES.decrypt(decodeURIComponent(id), SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted || !/^[\\w-]{10,}$/.test(decrypted)) {
      return res.status(400).send("Invalid ID");
    }

    return res.redirect(302, `https://drive.google.com/file/d/${decrypted}/preview`);
  } catch {
    return res.status(500).send("Failed to decrypt");
  }
};
