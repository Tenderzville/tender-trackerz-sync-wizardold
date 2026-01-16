import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Building2, Phone, MapPin, Save, Shield, Crown, Calendar } from 'lucide-react';

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company: string | null;
  phone_number: string | null;
  location: string | null;
  business_type: string | null;
  subscription_type: string | null;
  subscription_status: string | null;
  subscription_end_date: string | null;
  is_founding_member: boolean | null;
  founding_member_expires_at: string | null;
  company_verified: boolean | null;
  loyalty_points: number | null;
}

const BUSINESS_TYPES = [
  { value: 'buyer', label: 'Buyer / Procuring Entity', description: 'I want to post RFQs and find suppliers' },
  { value: 'supplier', label: 'Supplier / Contractor', description: 'I want to bid on tenders and RFQs' },
];

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kiambu', 'Machakos',
  'Nyeri', 'Meru', 'Kakamega', 'Kilifi', 'Uasin Gishu', 'Bungoma', 'Kisii',
  'Trans Nzoia', 'Laikipia', 'Nandi', 'Kericho', 'Migori', 'Homa Bay',
  'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Tana River', 'Lamu',
  'Taita Taveta', 'Kwale', 'Makueni', 'Nyandarua', 'Muranga', 'Kirinyaga',
  'Embu', 'Tharaka Nithi', 'Kitui', 'Turkana', 'West Pokot', 'Samburu',
  'Elgeyo Marakwet', 'Baringo', 'Bomet', 'Narok', 'Kajiado', 'Vihiga', 'Siaya'
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    phone_number: '',
    location: '',
    business_type: null,
    subscription_type: 'free',
    subscription_status: 'active',
    subscription_end_date: null,
    is_founding_member: false,
    founding_member_expires_at: null,
    company_verified: false,
    loyalty_points: 0,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || user.email || '',
          company: data.company || '',
          phone_number: data.phone_number || '',
          location: data.location || '',
          business_type: data.business_type || null,
          subscription_type: data.subscription_type || 'free',
          subscription_status: data.subscription_status || 'active',
          subscription_end_date: data.subscription_end_date || null,
          is_founding_member: data.is_founding_member || false,
          founding_member_expires_at: data.founding_member_expires_at || null,
          company_verified: data.company_verified || false,
          loyalty_points: data.loyalty_points || 0,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          company: profile.company,
          phone_number: profile.phone_number,
          location: profile.location,
          business_type: profile.business_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: 'Profile updated successfully!' });
    } catch (error: any) {
      toast({ 
        title: 'Error updating profile', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <User className="w-7 h-7" />
            My Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information and company details
          </p>
        </div>
        <Button onClick={saveProfile} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Account Status Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Subscription Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                profile.subscription_type === 'pro' ? 'bg-primary/20' : 'bg-muted'
              }`}>
                <Crown className={`w-5 h-5 ${
                  profile.subscription_type === 'pro' ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscription</p>
                <p className="font-semibold capitalize">{profile.subscription_type || 'Free'}</p>
              </div>
            </div>
            {profile.subscription_end_date && (
              <p className="text-xs text-muted-foreground mt-2">
                Expires: {formatDate(profile.subscription_end_date)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Founding Member Status */}
        {profile.is_founding_member && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold text-primary">Founding Member</p>
                </div>
              </div>
              {profile.founding_member_expires_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Until: {formatDate(profile.founding_member_expires_at)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loyalty Points */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loyalty Points</p>
                <p className="font-semibold">{profile.loyalty_points || 0} pts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Your basic contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={profile.first_name || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={profile.last_name || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone_number || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="+254 7XX XXX XXX"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Details
          </CardTitle>
          <CardDescription>
            Information about your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <div className="relative">
                <Input
                  id="company"
                  value={profile.company || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Your company name"
                />
                {profile.company_verified && (
                  <Badge variant="default" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                    Verified
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={profile.location || ''}
                onValueChange={(value) => setProfile(prev => ({ ...prev, location: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your county" />
                </SelectTrigger>
                <SelectContent>
                  {KENYAN_COUNTIES.map((county) => (
                    <SelectItem key={county} value={county}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Type */}
      <Card>
        <CardHeader>
          <CardTitle>Account Type</CardTitle>
          <CardDescription>
            Choose how you'll use TenderKenya - this affects your dashboard and available features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {BUSINESS_TYPES.map((type) => (
              <div
                key={type.value}
                onClick={() => setProfile(prev => ({ ...prev, business_type: type.value }))}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  profile.business_type === type.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    profile.business_type === type.value ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {profile.business_type === type.value && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone - Future */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            Delete Account (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
