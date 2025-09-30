import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Star, Crown, Zap } from 'lucide-react';

const OnboardingApp = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSkip, setShowSkip] = useState(true);

  const onboardingSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Sporzo',
      subtitle: 'The Future of Football Booking',
      icon: '🏟️',
      description: 'Experience premium football turf booking with AI-powered intelligence',
      features: [
        'AI Weather Intelligence',
        'Real-time Availability',
        'Premium Facilities',
        'Instant Booking'
      ],
      color: 'from-emerald-500 to-cyan-500'
    },
    {
      id: 'weather',
      title: 'AI Weather Intelligence',
      subtitle: 'Never Play in Bad Weather Again',
      icon: '🤖',
      description: 'Our advanced AI analyzes weather conditions 24/7 to give you perfect playing recommendations',
      features: [
        '24-Hour Weather Forecasting',
        'AI-Powered Playing Scores (0-100)',
        'Real-time Weather Updates',
        'Smart Recommendations',
        'Temperature, Rain, Wind Analysis',
        'Humidity & Visibility Tracking'
      ],
      color: 'from-blue-500 to-purple-500',
      demo: {
        weatherScore: 95,
        temperature: '24°C',
        rain: '5%',
        wind: '8 km/h',
        condition: 'Perfect Playing Conditions'
      }
    },
    {
      id: 'booking',
      title: 'Smart Booking System',
      subtitle: 'Book Your Perfect Slot in Seconds',
      icon: '📅',
      description: 'Intelligent booking with real-time availability and dynamic pricing',
      features: [
        'Real-time Slot Availability',
        'Instant Booking Confirmation',
        'Group Booking Management',
        'Recurring Bookings',
        'Auto-reminders & Notifications',
        'QR Code Entry System'
      ],
      color: 'from-green-500 to-emerald-500',
      demo: {
        slots: ['06:00', '07:00', '08:00', '18:00', '19:00', '20:00'],
        available: 4,
        filling: 2,
        booked: 0
      }
    },
    {
      id: 'premium',
      title: 'Premium Turf Experience',
      subtitle: 'Elite Facilities for Serious Players',
      icon: '👑',
      description: 'Access world-class facilities with professional-grade amenities',
      features: [
        'FIFA-Standard Pitches',
        'Professional Floodlighting',
        'Climate-Controlled Changing Rooms',
        'Live Match Recording',
        'VIP Spectator Areas',
        'Premium Equipment Rental'
      ],
      color: 'from-yellow-500 to-orange-500',
      demo: {
        rating: 4.9,
        facilities: ['FIFA Standard', 'HD Recording', 'VIP Lounge'],
        certification: 'FIFA Certified'
      }
    },
    {
      id: 'ready',
      title: "You're All Set!",
      subtitle: 'Start Your Elite Football Journey',
      icon: '🚀',
      description: 'Ready to experience the future of football turf booking? Let\'s get started!',
      features: [
        'Download our mobile app',
        'Create your player profile',
        'Invite friends to join',
        'Book your first session'
      ],
      color: 'from-emerald-500 to-cyan-500',
      isLast: true
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => setCurrentStep(currentStep + 1), 200);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => setCurrentStep(currentStep - 1), 200);
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem("onboarded", "true");
    navigate("/");
  };

  const step = onboardingSteps[currentStep];

  const WeatherDemo = ({ demo }) => (
    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-emerald-400/30 mt-6">
      <div className="text-center mb-4">
        <div className="text-6xl mb-2">☀️</div>
        <div className={`text-3xl font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
          {demo.weatherScore}/100
        </div>
        <div className="text-sm text-emerald-400 font-semibold">{demo.condition}</div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <span>{demo.temperature}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span>{demo.rain} rain</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span>{demo.wind}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span>Perfect!</span>
        </div>
      </div>
    </div>
  );

  const PremiumDemo = ({ demo }) => (
    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30 mt-6">
      <div className="text-center mb-4">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Crown className="w-6 h-6 text-yellow-400" />
          <span className="text-lg font-bold text-yellow-400">{demo.certification}</span>
        </div>
        <div className="flex justify-center items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
          ))}
          <span className="ml-2 text-sm text-gray-400">{demo.rating}</span>
        </div>
      </div>
      <div className="space-y-2">
        {demo.facilities.map((facility, index) => (
          <div key={facility} className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">{facility}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white relative overflow-hidden">
      {/* Skip Button */}
      {showSkip && !step.isLast && (
        <button
          onClick={skipOnboarding}
          className="absolute top-6 right-6 z-50 text-gray-400 hover:text-white transition-colors"
        >
          Skip
        </button>
      )}

      {/* Progress Indicator */}
      <div className="absolute top-6 left-6 right-6 z-40">
        <div className="flex justify-center">
          <div className="flex gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-500 ${
                  index <= currentStep 
                    ? `bg-gradient-to-r ${step.color} w-8` 
                    : 'bg-gray-600 w-4'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="text-center mt-2 text-sm text-gray-400">
          {currentStep + 1} of {onboardingSteps.length}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className={`max-w-md w-full text-center transition-all duration-500 ${
          isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
        }`}>
          <div className="text-8xl mb-6 animate-bounce">{step.icon}</div>
          <h1 className={`text-4xl font-bold mb-4 bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>{step.title}</h1>
          <h2 className="text-xl text-gray-300 mb-6">{step.subtitle}</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">{step.description}</p>

          <div className="space-y-3 mb-8">
            {step.features.map((feature) => (
              <div key={feature} className="flex items-center justify-start gap-3 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:border-emerald-400/30">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-black text-xs font-bold`}>
                  ✓
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Interactive Demo */}
          {step.demo && step.id === 'weather' && <WeatherDemo demo={step.demo} />}
          {step.demo && step.id === 'premium' && <PremiumDemo demo={step.demo} />}

          {/* Last Step CTA */}
          {step.isLast && (
            <div className="mt-8 space-y-4">
              <button
                className={`w-full bg-gradient-to-r ${step.color} py-4 rounded-xl text-lg font-bold hover:scale-105 transition-transform shadow-lg`}
                onClick={() => {
                  localStorage.setItem("onboarded", "true");
                  navigate("/");
                }}
              >
                Start Booking Now! 🚀
              </button>
              <div className="flex gap-4">
                <button className="flex-1 border border-emerald-500 py-3 rounded-xl font-semibold hover:bg-emerald-500/10 transition-all">
                  📱 Download App
                </button>
                <button className="flex-1 border border-cyan-500 py-3 rounded-xl font-semibold hover:bg-cyan-500/10 transition-all">
                  🌐 Use Web
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      {!step.isLast && (
        <div className="absolute bottom-8 left-6 right-6 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              currentStep === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-white hover:bg-white/10 hover:scale-105'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={nextStep}
            className={`flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r ${step.color} font-semibold hover:scale-105 transition-transform shadow-lg`}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingApp;
