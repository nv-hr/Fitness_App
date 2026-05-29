import rateLimit from 'express-rate-limit';

const weeklyPlanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    return `user_${req.user?.userId || 'anonymous'}`;
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

const isTest = process.env.NODE_ENV === 'test';
if (isTest) {
  weeklyPlanLimiter.max = 1000;
  weeklyPlanLimiter.windowMs = 1000;
}

export default weeklyPlanLimiter;
