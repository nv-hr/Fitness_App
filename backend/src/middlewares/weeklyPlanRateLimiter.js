import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

const weeklyPlanLimiter = rateLimit({
  windowMs: isTest ? 1000 : 15 * 60 * 1000,
  max: isTest ? 1000 : 5,
  keyGenerator: (req) => {
    return `user_${req.user.userId}`;
  },
  handler: (req, res) => {
    const retryAfter = Math.ceil(
      (req.rateLimit.resetTime - Date.now()) / 1000
    );

    return res.status(429).json({
      success: false,
      data: {
        plan: null,
        fromCache: false,
        status: 'rate_limited',
        retryAfter: Math.max(retryAfter, 1),
      },
      error: {
        message: 'Weekly plan generation limit reached. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: Math.max(retryAfter, 1),
      },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const regenerateLimiter = rateLimit({
  windowMs: isTest ? 1000 : 30 * 60 * 1000,
  max: isTest ? 1000 : 3,
  keyGenerator: (req) => {
    return `user_${req.user.userId}`;
  },
  handler: (req, res) => {
    const retryAfter = Math.ceil(
      (req.rateLimit.resetTime - Date.now()) / 1000
    );

    return res.status(429).json({
      success: false,
      data: {
        plan: null,
        fromCache: false,
        status: 'rate_limited',
        retryAfter: Math.max(retryAfter, 1),
      },
      error: {
        message: 'Day regeneration limit reached. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter: Math.max(retryAfter, 1),
      },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export { weeklyPlanLimiter, regenerateLimiter };
export default weeklyPlanLimiter;
