import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Building2, Phone, MapPin, Save, Shield, Crown, Calendar, Camera, Upload, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';

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
  profile_image_url: string | null;
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
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const verifyDocInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyingCompany, setVerifyingCompany] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState('');
  
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
    profile_image_url: null,
  });

  // Fetch verification request status
  const { data: verificationRequest } = useQuery({
    queryKey: ['verification-request', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
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
          profile_image_url: data.profile_image_url || null,
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a JPEG, PNG, WebP, or GIF image', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB', variant: 'destructive' });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, profile_image_url: publicUrl }));
      toast({ title: 'Profile image updated!' });
    } catch (error: any) {
      toast({ title: 'Error uploading image', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVerificationSubmit = async () => {
    const file = verifyDocInputRef.current?.files?.[0];
    if (!file || !user || !profile.company) return;

    // Validate file
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a PDF, JPEG, or PNG file', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 10MB', variant: 'destructive' });
      return;
    }

    setVerifyingCompany(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload document
      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get URL (private bucket, so we store the path)
      const documentPath = `${user.id}/${Date.now()}.${fileExt}`;

      // Create verification request
      const { error: requestError } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          company_name: profile.company,
          registration_number: registrationNumber || null,
          document_url: fileName,
          document_type: 'business_registration',
          status: 'pending',
        });

      if (requestError) throw requestError;

      queryClient.invalidateQueries({ queryKey: ['verification-request'] });
      toast({ title: 'Verification request submitted!', description: 'Our team will review your documents within 48 hours.' });
      setVerifyDialogOpen(false);
      setRegistrationNumber('');
    } catch (error: any) {
      toast({ title: 'Error submitting verification', description: error.message, variant: 'destructive' });
    } finally {
      setVerifyingCompany(false);
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

  const getVerificationStatus = () => {
    if (profile.company_verified) {
      return { icon: CheckCircle, color: 'text-green-500', text: 'Verified', badge: 'default' as const };
    }
    if (verificationRequest?.status === 'pending') {
      return { icon: Clock, color: 'text-yellow-500', text: 'Pending Review', badge: 'secondary' as const };
    }
    if (verificationRequest?.status === 'rejected') {
      return { icon: XCircle, color: 'text-red-500', text: 'Rejected', badge: 'destructive' as const };
    }
    return null;
  };

  const verificationStatus = getVerificationStatus();

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

      {/* Profile Image Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {profile.profile_image_url ? (
                  <img 
                    src={profile.profile_image_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full w-8 h-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {profile.first_name || profile.last_name 
                  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                  : 'Your Name'}
              </h3>
              <p className="text-muted-foreground">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {profile.business_type && (
                  <Badge variant="outline" className="capitalize">{profile.business_type}</Badge>
                )}
                {profile.is_founding_member && (
                  <Badge variant="default" className="bg-primary">
                    <Shield className="w-3 h-3 mr-1" />
                    Founding Member
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status Cards */}
      <div className="grid md:grid-cols-3 gap-4">
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-500" />
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
          <CardDescription>Your basic contact information</CardDescription>
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

      {/* Company Details with Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Details
          </CardTitle>
          <CardDescription>Information about your business</CardDescription>
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
                  className={verificationStatus ? 'pr-24' : ''}
                />
                {verificationStatus && (
                  <Badge variant={verificationStatus.badge} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                    {verificationStatus.text}
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
                    <SelectItem key={county} value={county}>{county}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Verification Section */}
          {!profile.company_verified && profile.company && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Company Verification
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {verificationRequest?.status === 'pending' 
                      ? 'Your verification is being reviewed. We\'ll notify you once complete.'
                      : verificationRequest?.status === 'rejected'
                      ? `Rejected: ${verificationRequest.rejection_reason || 'Please submit valid documents'}`
                      : 'Verify your company to build trust with other users and access premium features.'}
                  </p>
                </div>
                {verificationRequest?.status !== 'pending' && (
                  <Button variant="outline" size="sm" onClick={() => setVerifyDialogOpen(true)}>
                    <Upload className="w-4 h-4 mr-1" />
                    {verificationRequest?.status === 'rejected' ? 'Re-submit' : 'Verify'}
                  </Button>
                )}
              </div>
            </div>
          )}
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

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            Delete Account (Coming Soon)
          </Button>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Your Company</DialogTitle>
            <DialogDescription>
              Upload your business registration certificate or equivalent document
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={profile.company || ''} disabled className="bg-muted" />
            </div>
            
            <div className="space-y-2">
              <Label>Business Registration Number (Optional)</Label>
              <Input 
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g., PVT-XXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Document *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  ref={verifyDocInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  className="hidden"
                  id="verify-doc"
                />
                <label htmlFor="verify-doc" className="cursor-pointer">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPEG, or PNG (max 10MB)
                  </p>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleVerificationSubmit} disabled={verifyingCompany}>
              {verifyingCompany ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
