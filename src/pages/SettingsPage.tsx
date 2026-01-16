import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, Plus, X, MapPin, Briefcase, Bell, DollarSign } from 'lucide-react';

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kiambu', 'Machakos',
  'Nyeri', 'Meru', 'Kakamega', 'Kilifi', 'Uasin Gishu', 'Bungoma', 'Kisii',
  'Trans Nzoia', 'Laikipia', 'Nandi', 'Kericho', 'Migori', 'Homa Bay'
];

const SECTORS = [
  'Construction', 'IT & Technology', 'Medical & Healthcare', 'Consultancy',
  'Supplies & Equipment', 'Transport & Logistics', 'Energy', 'Agriculture',
  'Security', 'Education', 'Environment', 'Water & Sanitation', 'Legal Services'
];

const ELIGIBILITY_TYPES = [
  'Open', 'Youth', 'Women', 'PWD', 'Reserved'
];

interface UserPreferences {
  sectors: string[];
  counties: string[];
  budget_min: number;
  budget_max: number | null;
  keywords: string[];
  eligibility_types: string[];
  notification_email: boolean;
  notification_push: boolean;
  notification_sms: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences>({
    sectors: [],
    counties: [],
    budget_min: 0,
    budget_max: null,
    keywords: [],
    eligibility_types: [],
    notification_email: true,
    notification_push: true,
    notification_sms: false,
  });

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setPreferences({
          sectors: data.sectors || [],
          counties: data.counties || [],
          budget_min: Number(data.budget_min) || 0,
          budget_max: data.budget_max ? Number(data.budget_max) : null,
          keywords: data.keywords || [],
          eligibility_types: data.eligibility_types || [],
          notification_email: data.notification_email ?? true,
          notification_push: data.notification_push ?? true,
          notification_sms: data.notification_sms ?? false,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          sectors: preferences.sectors,
          counties: preferences.counties,
          budget_min: preferences.budget_min,
          budget_max: preferences.budget_max,
          keywords: preferences.keywords,
          eligibility_types: preferences.eligibility_types,
          notification_email: preferences.notification_email,
          notification_push: preferences.notification_push,
          notification_sms: preferences.notification_sms,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({ title: 'Preferences saved successfully!' });
    } catch (error: any) {
      toast({ 
        title: 'Error saving preferences', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (key: 'sectors' | 'counties' | 'eligibility_types', item: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: prev[key].includes(item)
        ? prev[key].filter(i => i !== item)
        : [...prev[key], item]
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !preferences.keywords.includes(newKeyword.trim())) {
      setPreferences(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setPreferences(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
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
            <Settings className="w-7 h-7" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your tender preferences and notification settings
          </p>
        </div>
        <Button onClick={savePreferences} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Sectors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Preferred Sectors
          </CardTitle>
          <CardDescription>
            Select the sectors you're interested in for tender alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((sector) => (
              <Badge
                key={sector}
                variant={preferences.sectors.includes(sector) ? 'default' : 'outline'}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => toggleArrayItem('sectors', sector)}
              >
                {sector}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Counties */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Preferred Counties
          </CardTitle>
          <CardDescription>
            Select your preferred locations for tenders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {KENYAN_COUNTIES.map((county) => (
              <Badge
                key={county}
                variant={preferences.counties.includes(county) ? 'default' : 'outline'}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => toggleArrayItem('counties', county)}
              >
                {county}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget Range */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget Range
          </CardTitle>
          <CardDescription>
            Set your preferred budget range for tender opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum (KSh)</Label>
              <Input
                type="number"
                value={preferences.budget_min}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  budget_min: parseInt(e.target.value) || 0
                }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum (KSh)</Label>
              <Input
                type="number"
                value={preferences.budget_max || ''}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  budget_max: e.target.value ? parseInt(e.target.value) : null
                }))}
                placeholder="No limit"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Keywords</CardTitle>
          <CardDescription>
            Add keywords to receive alerts for matching tenders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              />
              <Button onClick={addKeyword} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eligibility Types */}
      <Card>
        <CardHeader>
          <CardTitle>Eligibility Categories</CardTitle>
          <CardDescription>
            Select eligibility categories that apply to your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ELIGIBILITY_TYPES.map((type) => (
              <Badge
                key={type}
                variant={preferences.eligibility_types.includes(type) ? 'default' : 'outline'}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => toggleArrayItem('eligibility_types', type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Choose how you want to receive tender alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive alerts via email</p>
            </div>
            <Switch
              checked={preferences.notification_email}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, notification_email: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Get browser notifications</p>
            </div>
            <Switch
              checked={preferences.notification_push}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, notification_push: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive SMS alerts (Premium)</p>
            </div>
            <Switch
              checked={preferences.notification_sms}
              onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, notification_sms: checked }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
