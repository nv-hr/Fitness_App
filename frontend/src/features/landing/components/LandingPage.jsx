import { Link } from 'react-router-dom';
import './LandingPage.css';
import {
  Activity,
  Target,
  Heart,
  Zap,
  TrendingUp,
  Calendar,
  Award,
} from 'lucide-react';

/**
 * Feature card data used in the "Everything You Need" section.
 * Centralised here so we can add/remove features without touching JSX.
 */
const FEATURES = [
  {
    id: 'goal-tracking',
    icon: Target,
    title: 'Goal Tracking',
    desc: 'Set and achieve your fitness goals with our comprehensive tracking system',
  },
  {
    id: 'nutrition',
    icon: Heart,
    title: 'Nutrition Monitoring',
    desc: 'Track calories and macros with our extensive food database',
  },
  {
    id: 'workout-plans',
    icon: Zap,
    title: 'Workout Plans',
    desc: 'Get personalized workout recommendations based on your goals',
  },
  {
    id: 'progress',
    icon: TrendingUp,
    title: 'Progress Analytics',
    desc: 'Visualize your journey with detailed charts and statistics',
  },
  {
    id: 'schedule',
    icon: Calendar,
    title: 'Schedule & Reminders',
    desc: 'Never miss a workout with our smart scheduling system',
  },
  {
    id: 'achievements',
    icon: Award,
    title: 'Achievements',
    desc: 'Earn badges and celebrate your fitness milestones',
  },
];

/**
 * Testimonial data for the "Success Stories" section.
 * Kept separate so this can be fetched from an API later without refactoring JSX.
 */
const TESTIMONIALS = [
  {
    id: 'sarah',
    quote:
      '"FitLife completely transformed my approach to fitness. The tracking features are incredible!"',
    name: 'Sarah Johnson',
    role: 'Fitness Enthusiast',
  },
  {
    id: 'michael',
    quote:
      '"The best fitness app I\'ve ever used. The analytics help me optimize every aspect of training."',
    name: 'Michael Chen',
    role: 'Personal Trainer',
  },
  {
    id: 'emma',
    quote:
      '"Love the elegant design and how easy it is to stay on track with my goals."',
    name: 'Emma Davis',
    role: 'Fitness Influencer',
  },
];

/**
 * LandingPage
 *
 * Shown to any visitor who is NOT authenticated.
 * Why a dedicated component: separating public marketing content from the
 * authenticated shell keeps routing logic simple and avoids leaking sidebar
 * or header chrome into the unauthenticated experience.
 */
export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="landing-header">
        <div className="landing-header__inner">
          {/* Logo */}
          <Link to="/" className="landing-logo">
            <Activity className="landing-logo__icon" />
            <span className="landing-logo__text">
              Fit<span className="landing-logo__accent">Life</span>
            </span>
          </Link>

          {/* Auth CTA */}
          <nav className="landing-header__nav">
            <Link to="/login" className="landing-btn landing-btn--ghost">
              Login
            </Link>
            <Link to="/register" className="landing-btn landing-btn--primary">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-container landing-hero__content">
          <h1 className="landing-hero__heading">
            Transform Your Body,{' '}
            <span className="landing-hero__accent">Elevate Your Life</span>
          </h1>
          <p className="landing-hero__sub">
            Join thousands of users who have achieved their fitness goals with
            FitLife's premium tracking and analytics platform.
          </p>
          <div className="landing-hero__actions">
            <Link to="/register" className="landing-btn landing-btn--primary landing-btn--lg">
              Start Now
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-section__title">Everything You Need to Succeed</h2>
          <div className="landing-features-grid">
            {FEATURES.map(({ id, icon: Icon, title, desc }) => (
              <div key={id} className="landing-feature-card">
                <div className="landing-feature-card__icon-wrap">
                  <Icon className="landing-feature-card__icon" />
                </div>
                <h3 className="landing-feature-card__title">{title}</h3>
                <p className="landing-feature-card__desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ───────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-section__title">Success Stories</h2>
          <div className="landing-testimonials-grid">
            {TESTIMONIALS.map(({ id, quote, name, role }) => (
              <div key={id} className="landing-testimonial-card">
                <p className="landing-testimonial-card__quote">{quote}</p>
                <p className="landing-testimonial-card__name">{name}</p>
                <p className="landing-testimonial-card__role">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─────────────────────────────────────── */}
      <section className="landing-cta-banner">
        <div className="landing-container landing-cta-banner__inner">
          <h2 className="landing-cta-banner__heading">Ready to Start Your Journey?</h2>
          <p className="landing-cta-banner__sub">
            Join FitLife today and take the first step towards a healthier, stronger you.
          </p>
          <Link to="/register" className="landing-btn landing-btn--primary landing-btn--lg">
            Start Now
          </Link>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} FitLife. All rights reserved.</p>
      </footer>
    </div>
  );
}
