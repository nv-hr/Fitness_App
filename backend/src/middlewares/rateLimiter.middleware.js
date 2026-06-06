import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

/**
 * Rate limiter helper to reduce boilerplate (IN-01)
 * @param {object} options
 * @returns {Function} Express rate limit middleware
 */
export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 1 * 60 * 1000,
    max = 7,
    message = 'Too many requests',
    testMax = 1000,
    testWindowMs = 1000,
  } = options;
  return rateLimit({
    windowMs: isTest ? testWindowMs : windowMs,
    max: isTest ? testMax : max,
    message: { success: false, error: { message, code: 'RATE_LIMITED' } },
    validate: { xForwardedForHeader: false, trustProxy: false, default: true },
  });
};

// 1. Weekly Plan Limiter
export const weeklyPlanLimiter = rateLimit({
  windowMs: isTest ? 1000 : 1 * 60 * 1000,
  max: isTest ? 1000 : 50,
  validate: { xForwardedForHeader: false, trustProxy: false, default: true },
  keyGenerator: (req) => `user_${req.user.userId}`,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      data: { plan: null, fromCache: false, status: 'rate_limited', retryAfter: Math.max(retryAfter, 1) },
      error: { message: 'Weekly plan generation limit reached. Please try again later.', code: 'RATE_LIMITED', retryAfter: Math.max(retryAfter, 1) },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Weekly Plan - Regenerate Limiter
export const regenerateLimiter = rateLimit({
  windowMs: isTest ? 1000 : 1 * 60 * 1000,
  max: isTest ? 1000 : 30,
  validate: { xForwardedForHeader: false, trustProxy: false, default: true },
  keyGenerator: (req) => `user_${req.user.userId}`,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      data: { plan: null, fromCache: false, status: 'rate_limited', retryAfter: Math.max(retryAfter, 1) },
      error: { message: 'Day regeneration limit reached. Please try again later.', code: 'RATE_LIMITED', retryAfter: Math.max(retryAfter, 1) },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Weekly Plan - Swap Limiter
export const swapLimiter = rateLimit({
  windowMs: isTest ? 1000 : 1 * 60 * 1000,
  max: isTest ? 1000 : 10,
  validate: { xForwardedForHeader: false, trustProxy: false, default: true },
  keyGenerator: (req) => `user_${req.user.userId}`,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      data: { plan: null, fromCache: false, status: 'rate_limited', retryAfter: Math.max(retryAfter, 1) },
      error: { message: 'Activity swap limit reached. Please try again later.', code: 'RATE_LIMITED', retryAfter: Math.max(retryAfter, 1) },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Weekly Plan - Toggle Complete Limiter
export const toggleCompleteLimiter = rateLimit({
  windowMs: isTest ? 1000 : 1 * 60 * 1000,
  max: isTest ? 1000 : 60,
  validate: { xForwardedForHeader: false, trustProxy: false, default: true },
  keyGenerator: (req) => `user_${req.user.userId}`,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      data: { plan: null, fromCache: false, status: 'rate_limited', retryAfter: Math.max(retryAfter, 1) },
      error: { message: 'Too many completion toggle requests. Please wait before toggling more activities.', code: 'RATE_LIMITED', retryAfter: Math.max(retryAfter, 1) },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. Activity Plan Limiter
export const activityPlanLimiter = rateLimit({
  windowMs: isTest ? 1000 : 15 * 60 * 1000,
  max: isTest ? 1000 : 50,
  keyGenerator: (req) => `user_${req.user.userId}`,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      data: { plan: null, fromCache: false, status: 'rate_limited', retryAfter: Math.max(retryAfter, 1) },
      error: { message: 'Activity plan generation limit reached. Please try again later.', code: 'RATE_LIMITED', retryAfter: Math.max(retryAfter, 1) },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 6. Daily Meal Plan Limiter
export const dailyMealPlanLimiter = rateLimit({
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
