const crypto = require('crypto');
const RequestLog = require('../models/RequestLog');
const { sanitizeOutput } = require('../services/maskSensitive');

function requestLogger(req, res, next) {
  const startDate = new Date();
  const start = process.hrtime.bigint();
  const correlationId = req.header('x-correlation-id') || crypto.randomUUID();

  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  const requestPayload = sanitizeOutput(req.body);

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = (body) => {
    res.locals.responsePayload = sanitizeOutput(body);
    return originalJson(body);
  };

  res.send = (body) => {
    if (Buffer.isBuffer(body)) {
      res.locals.responsePayload = {
        type: 'buffer',
        length: body.length,
      };
    } else {
      res.locals.responsePayload = sanitizeOutput(body);
    }
    return originalSend(body);
  };

  res.on('finish', () => {
    const elapsedNs = process.hrtime.bigint() - start;
    const elapsedMs = Number(elapsedNs / BigInt(1000000));

    const responsePayload =
      res.locals.responsePayload || {
        type: 'stream-or-empty',
        info: 'response body not captured (possibly stream or empty payload)',
      };

    RequestLog.create({
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      userId: req.user ? req.user.id : undefined,
      username: req.user ? req.user.username : undefined,
      apiKeyPrefix: req.apiKey ? req.apiKey.prefix : undefined,
      tenantScope: req.user ? req.user.assignedMuseumIds : [],
      requestCreatedAt: startDate,
      requestCompletedAt: new Date(),
      totalTimeMs: elapsedMs,
      requestPayload,
      responsePayload,
      ip: req.ip,
      userAgent: req.header('user-agent'),
      correlationId,
    }).catch((error) => {
      console.error('Failed to persist request log:', error.message);
    });
  });

  next();
}

module.exports = { requestLogger };
