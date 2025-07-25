const CryptoJS = require("crypto-js");

/**
 * Vercel Serverless Function untuk decrypt dan redirect Google Drive links
 * Endpoint: /api/stream?id=<encrypted_base64_id>
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
  }
  
  const { id } = req.query;
  const SECRET_KEY = process.env.GDRIVE_SECRET_KEY || "UltraSecretKey@2024";
  
  // Validate required parameters
  if (!id) {
    return res.status(400).json({ 
      error: 'Missing parameter',
      message: 'Parameter "id" is required'
    });
  }
  
  if (!SECRET_KEY) {
    console.error('GDRIVE_SECRET_KEY environment variable not set');
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Encryption key not configured'
    });
  }
  
  try {
    // Decode dari base64 URL-safe (replace browser atob with Node.js Buffer)
    let base64Encrypted;
    try {
      base64Encrypted = Buffer.from(decodeURIComponent(id), 'base64').toString('utf8');
    } catch (decodeError) {
      console.error('Base64 decode error:', decodeError);
      return res.status(400).json({ 
        error: 'Invalid encoding',
        message: 'Failed to decode base64 parameter'
      });
    }
    
    // Decrypt menggunakan CryptoJS
    let decryptedBytes;
    try {
      decryptedBytes = CryptoJS.AES.decrypt(base64Encrypted, SECRET_KEY);
    } catch (decryptError) {
      console.error('AES decrypt error:', decryptError);
      return res.status(400).json({ 
        error: 'Decryption failed',
        message: 'Invalid encrypted data'
      });
    }
    
    // Convert ke string UTF-8
    let decryptedId;
    try {
      decryptedId = decryptedBytes.toString(CryptoJS.enc.Utf8);
    } catch (convertError) {
      console.error('UTF-8 conversion error:', convertError);
      return res.status(400).json({ 
        error: 'Conversion failed',
        message: 'Failed to convert decrypted data'
      });
    }
    
    // Validate decrypted ID
    if (!decryptedId) {
      return res.status(400).json({ 
        error: 'Invalid decryption',
        message: 'Decrypted data is empty'
      });
    }
    
    // Validate Google Drive ID format (minimal 10 chars, alphanumeric + hyphens/underscores)
    if (!/^[\w-]{10,}$/.test(decryptedId)) {
      console.error('Invalid Google Drive ID format:', decryptedId);
      return res.status(400).json({ 
        error: 'Invalid ID format',
        message: 'Decrypted ID does not match Google Drive format'
      });
    }
    
    // Log successful decryption (for debugging, remove in production)
    console.log(`Successfully decrypted ID: ${decryptedId.substring(0, 5)}...`);
    
    // Generate Google Drive preview URL
    const googleDriveUrl = `https://drive.google.com/file/d/${decryptedId}/preview`;
    
    // Redirect to Google Drive with 302 status
    return res.redirect(302, googleDriveUrl);
    
  } catch (error) {
    // Log error for debugging
    console.error('Stream API error:', {
      message: error.message,
      stack: error.stack,
      id: id ? id.substring(0, 20) + '...' : 'undefined'
    });
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process request'
    });
  }
};
