import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Navbar from "../components/Navbar";
import { 
  Building2, UtensilsCrossed, Camera, Video, 
  Flower2, Music, ArrowRight, CheckCircle2, Sparkles 
} from "lucide-react";

const categories = [
  { id: "venue", name: "Venues", icon: Building2, color: "bg-[#800020]" },
  { id: "catering", name: "Catering", icon: UtensilsCrossed, color: "bg-[#0F4C5C]" },
  { id: "photographer", name: "Photography", icon: Camera, color: "bg-[#C5A059]" },
  { id: "videographer", name: "Videography", icon: Video, color: "bg-[#800020]" },
  { id: "decorations", name: "Decorations", icon: Flower2, color: "bg-[#0F4C5C]" },
  { id: "musicians", name: "Musicians", icon: Music, color: "bg-[#C5A059]" },
];

const steps = [
  {
    number: "01",
    title: "Share Your Vision",
    description: "Tell us about your dream Arangetram - the date, guest count, budget, and any special requirements.",
  },
  {
    number: "02",
    title: "Get AI Recommendations",
    description: "Our AI assistant curates the perfect vendors based on your needs, style preferences, and budget.",
  },
  {
    number: "03",
    title: "Customize & Book",
    description: "Review recommendations, swap vendors as needed, and send booking requests all in one place.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F9F8F4] noise-bg">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="tetris-grid items-center">
            {/* Text Content */}
            <div className="md:col-span-5 lg:col-span-5 space-y-6 animate-fade-in-up">
              <p className="text-[#C5A059] font-medium tracking-wide uppercase text-sm">
                Bay Area's Premier Arangetram Planning
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A1A1A] leading-tight">
                Your Dance Debut,{" "}
                <span className="text-[#800020]">Perfectly Planned</span>
              </h1>
              <p className="text-lg text-[#4A4A4A] max-w-lg">
                From venue to musicians, catering to decorations — let our AI-powered platform 
                help you create an unforgettable Arangetram experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={() => navigate("/events/create")}
                  className="btn-primary text-base"
                  data-testid="start-planning-btn"
                >
                  Start Planning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  onClick={() => navigate("/vendors")}
                  className="btn-secondary text-base"
                  data-testid="browse-vendors-btn"
                >
                  Browse Vendors
                </Button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="md:col-span-7 lg:col-span-7 relative animate-fade-in-up animation-delay-200">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#C5A059]/20 rounded-3xl transform rotate-3"></div>
                <img
                  src="https://images.pexels.com/photos/34717625/pexels-photo-34717625.jpeg"
                  alt="Classical Bharatanatyam dancer"
                  className="relative rounded-2xl shadow-2xl w-full h-[400px] lg:h-[500px] object-cover"
                  onError={(e) => {
                    e.target.src = "https://images.pexels.com/photos/2167395/pexels-photo-2167395.jpeg";
                  }}
                />
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#0F4C5C] flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">AI-Powered</p>
                    <p className="text-sm text-[#888888]">Smart Recommendations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-4">
              Everything You Need
            </h2>
            <p className="text-[#4A4A4A] max-w-2xl mx-auto">
              Browse our curated selection of Bay Area vendors specializing in traditional Indian events
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, idx) => (
              <Link
                key={cat.id}
                to={`/vendors?category=${cat.id}`}
                className="category-icon card-feature flex flex-col items-center gap-4 p-6 text-center animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
                data-testid={`category-${cat.id}`}
              >
                <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center shadow-md`}>
                  <cat.icon className="w-7 h-7 text-white" />
                </div>
                <span className="font-medium text-[#1A1A1A]">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#F9F8F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="font-accent text-xl text-[#C5A059] mb-2">The Journey</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A1A]">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div
                key={step.number}
                className="relative animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                <div className="card-feature h-full">
                  <span className="text-6xl font-bold text-[#C5A059]/20">{step.number}</span>
                  <h3 className="text-xl font-semibold text-[#1A1A1A] mt-2 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[#4A4A4A]">{step.description}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-[#C5A059]/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="tetris-grid items-center">
            <div className="md:col-span-6 space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A1A]">
                Why Families Choose Us
              </h2>
              
              <div className="space-y-6">
                {[
                  "AI-powered recommendations tailored to your style and budget",
                  "Curated Bay Area vendors specializing in classical dance events",
                  "One platform to manage all your event vendors",
                  "Compare prices, reviews, and portfolios easily",
                  "Send booking requests directly to vendors",
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <CheckCircle2 className="w-6 h-6 text-[#0F4C5C] shrink-0 mt-0.5" />
                    <span className="text-[#4A4A4A]">{feature}</span>
                  </div>
                ))}
              </div>

              <Button onClick={() => navigate("/events/create")} className="btn-primary">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="md:col-span-6 grid grid-cols-2 gap-4">
              <img
                src="https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg"
                alt="Event venue"
                className="rounded-xl shadow-lg h-48 object-cover w-full"
              />
              <img
                src="https://images.pexels.com/photos/9198596/pexels-photo-9198596.jpeg"
                alt="Catering"
                className="rounded-xl shadow-lg h-48 object-cover w-full mt-8"
              />
              <img
                src="https://images.pexels.com/photos/33753145/pexels-photo-33753145.jpeg"
                alt="Musicians"
                className="rounded-xl shadow-lg h-48 object-cover w-full"
              />
              <img
                src="https://images.pexels.com/photos/34717625/pexels-photo-34717625.jpeg"
                alt="Dance performance"
                className="rounded-xl shadow-lg h-48 object-cover w-full mt-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#800020]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Plan Your Arangetram?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Join hundreds of families who have planned their perfect dance debut with our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/events/create")}
              className="bg-white text-[#800020] hover:bg-[#F9F8F4] rounded-full px-8 py-3 font-medium shadow-lg"
            >
              Start Planning Now
            </Button>
            <Button
              onClick={() => navigate("/vendor/signup")}
              className="border-2 border-white text-white hover:bg-white/10 rounded-full px-8 py-3 font-medium"
              variant="outline"
            >
              Register as Vendor
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#1A1A1A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#800020] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Arangetram
                </span>
              </div>
              <p className="text-white/60 text-sm">
                Your trusted partner for planning the perfect classical dance debut in the Bay Area.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Families</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link to="/events/create" className="hover:text-white">Plan Event</Link></li>
                <li><Link to="/vendors" className="hover:text-white">Browse Vendors</Link></li>
                <li><Link to="/dashboard" className="hover:text-white">My Events</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Vendors</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link to="/vendor/signup" className="hover:text-white">Join as Vendor</Link></li>
                <li><Link to="/vendor/dashboard" className="hover:text-white">Vendor Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Vendor Categories</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                {categories.slice(0, 4).map((cat) => (
                  <li key={cat.id}>
                    <Link to={`/vendors?category=${cat.id}`} className="hover:text-white">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/40 text-sm">
            <p>© 2024 Arangetram Planning. Made with love for the Bay Area dance community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
