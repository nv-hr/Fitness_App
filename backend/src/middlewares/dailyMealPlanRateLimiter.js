import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

const dailyMealPlanLimiter = rateLimit({
  windowMs: isTest ? 1000 : 1 * 60 * 1000,
  max: isTest ? 1000 : 20,
  keyGenerator: (req) => `user_${req.user.userId}`,
  validate: { xForwardedForHeader: false, trustProxy: false, default: true },
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      data: { plan: null, fromCache: false, status: 'rate_limited', retryAfter: Math.max(retryAfter, 1) },
      error: { message: 'Daily meal plan generation limit reached. Please try again later.', code: 'RATE_LIMITED', retryAfter: Math.max(retryAfter, 1) },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default dailyMealPlanLimiter;
