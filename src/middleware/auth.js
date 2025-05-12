const config = require('../../config.json');

function validateSystemKey(req, res, next) {
  const systemKey = req.headers['x-system-key'];
  
  if (!systemKey || systemKey !== config.system_key) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing system key'
    });
  }
  
  next();
}

module.exports = {
  validateSystemKey
};