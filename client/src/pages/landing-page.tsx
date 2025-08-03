import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { 
  Bell, 
  Users, 
  Brain, 
  Shield, 
  Smartphone, 
  TrendingUp,
  Star,
  CheckCircle,
  ArrowRight
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">TenderAlert</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Professional Edition</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button asChild>
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            🇰🇪 Made for Kenyan Suppliers
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Kenya's Premier Tender Notification Platform
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            Never miss a tender opportunity again. Get AI-powered insights, form winning consortiums, 
            and access professional services to boost your success rate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8" asChild>
              <a href="/api/login">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white dark:bg-slate-800">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Win Tenders</h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Comprehensive tools and insights designed specifically for Kenyan suppliers and contractors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-time Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Get instant notifications for new tenders matching your criteria from MyGov, Tenders.go.ke, and other sources.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>AI-Powered Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Get winning bid estimates and probability scores based on historical contract data and market intelligence.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Consortium Formation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Connect with other suppliers to form winning consortiums for large-scale government projects.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Service Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Access professional services including legal advice, technical writing, and quantity surveying.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Mobile Optimized</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Full PWA capabilities with offline access, push notifications, and seamless mobile experience.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Track your bid success rate, analyze market trends, and optimize your tender strategy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">5,000+</h3>
              <p className="text-slate-600 dark:text-slate-300">Active Tenders</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">1,200+</h3>
              <p className="text-slate-600 dark:text-slate-300">Registered Suppliers</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">78%</h3>
              <p className="text-slate-600 dark:text-slate-300">Average Win Rate</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">24/7</h3>
              <p className="text-slate-600 dark:text-slate-300">Monitoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white dark:bg-slate-800">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Trusted by Leading Suppliers</h2>
            <p className="text-slate-600 dark:text-slate-300">
              See what our users say about TenderAlert Pro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  "TenderAlert has revolutionized how we track opportunities. The AI insights help us bid more strategically."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <span className="font-semibold text-primary">JM</span>
                  </div>
                  <div>
                    <p className="font-semibold">John Mbugua</p>
                    <p className="text-sm text-slate-500">CEO, Acme Construction</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  "The consortium feature helped us win a KSh 200M contract. Game changer for small businesses."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <span className="font-semibold text-primary">SW</span>
                  </div>
                  <div>
                    <p className="font-semibold">Sarah Wanjiku</p>
                    <p className="text-sm text-slate-500">Director, TechSol Kenya</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  "Professional service providers on the platform helped us improve our proposal quality significantly."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <span className="font-semibold text-primary">MO</span>
                  </div>
                  <div>
                    <p className="font-semibold">Michael Odhiambo</p>
                    <p className="text-sm text-slate-500">MD, Green Energy Solutions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-12">
            Start free, upgrade when you need advanced features
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <p className="text-slate-600 dark:text-slate-300">Perfect for getting started</p>
                <div className="text-3xl font-bold">KSh 0<span className="text-lg font-normal">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Up to 10 saved tenders
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Basic tender alerts
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Browse all tenders
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline" asChild>
                  <a href="/api/login">Start Free</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">Pro</CardTitle>
                    <p className="text-slate-600 dark:text-slate-300">For serious contractors</p>
                  </div>
                  <Badge className="bg-primary text-white">Most Popular</Badge>
                </div>
                <div className="text-3xl font-bold">KSh 500<span className="text-lg font-normal">/month</span></div>
                <div className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                  First 100 users get Year 1 FREE!
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Unlimited saved tenders
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    AI-powered analysis
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Consortium features
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Social media integration
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Service provider marketplace
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Priority support
                  </li>
                </ul>
                <Button className="w-full mt-6" asChild>
                  <a href="/api/login">Start Free Trial</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Win More Tenders?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of suppliers already using TenderAlert Pro
          </p>
          <Button size="lg" variant="secondary" className="px-8" asChild>
            <a href="/api/login">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900 text-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">TenderAlert</span>
              </div>
              <p className="text-slate-400">
                Kenya's premier tender notification and management platform for suppliers and contractors.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 TenderAlert Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
