import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Plus, X, Bell, Mail, MessageSquare, Target, MapPin, Coins, Search } from "lucide-react";

const KENYAN_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", "Kitale",
  "Garissa", "Nyeri", "Machakos", "Meru", "Lamu", "Isiolo", "Marsabit", "Mandera",
  "Wajir", "Tana River", "Kilifi", "Kwale", "Taita Taveta", "Makueni", "Nyandarua",
  "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia",
  "Uasin Gishu", "Elgeyo Marakwet", "Nandi", "Baringo", "Laikipia", "Narok", "Kajiado",
  "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", "Kisii",
  "Nyamira", "Migori", "Homa Bay"
];

const SECTORS = [
  "Construction", "ICT & Technology", "Healthcare", "Education", "Agriculture",
  "Transport & Logistics", "Energy & Power", "Water & Sanitation", "Security Services",
  "Consultancy", "Supplies & Equipment", "Financial Services", "Legal Services",
  "Environmental Services", "Mining & Extraction", "Manufacturing", "Tourism & Hospitality"
];

const ELIGIBILITY_TYPES = [
  "Open", "Youth", "Women", "PWD (Persons with Disabilities)", "AGPO Reserved",
  "Citizen Contractors", "Joint Ventures", "International"
];

interface UserPreferences {
  id?: string;
  user_id: string;
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    user_id: "",
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
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLocation("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPreferences({
          ...data,
          sectors: data.sectors || [],
          counties: data.counties || [],
          keywords: data.keywords || [],
          eligibility_types: data.eligibility_types || [],
          budget_min: data.budget_min || 0,
          budget_max: data.budget_max,
        });
      } else {
        setPreferences(prev => ({ ...prev, user_id: user.id }));
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast({ title: "Error", description: "Failed to load preferences", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_preferences")
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
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast({ title: "Success", description: "Preferences saved successfully" });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({ title: "Error", description: "Failed to save preferences", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (field: "sectors" | "counties" | "eligibility_types", item: string) => {
    setPreferences(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !preferences.keywords.includes(newKeyword.trim())) {
      setPreferences(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword("");
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Tender Preferences</h1>
            <p className="text-muted-foreground">Configure your tender matching criteria and notifications</p>
          </div>
          <Button onClick={savePreferences} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Sectors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Sectors of Interest
            </CardTitle>
            <CardDescription>Select the sectors you want to receive tender alerts for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map(sector => (
                <Badge
                  key={sector}
                  variant={preferences.sectors.includes(sector) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => toggleArrayItem("sectors", sector)}
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
              <MapPin className="h-5 w-5 text-primary" />
              Counties
            </CardTitle>
            <CardDescription>Select counties where you can execute tenders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {KENYAN_COUNTIES.map(county => (
                <Badge
                  key={county}
                  variant={preferences.counties.includes(county) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => toggleArrayItem("counties", county)}
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
              <Coins className="h-5 w-5 text-primary" />
              Budget Range (KES)
            </CardTitle>
            <CardDescription>Set your preferred tender budget range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_min">Minimum Budget</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={preferences.budget_min}
                  onChange={e => setPreferences(prev => ({ ...prev, budget_min: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_max">Maximum Budget</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={preferences.budget_max || ""}
                  onChange={e => setPreferences(prev => ({ 
                    ...prev, 
                    budget_max: e.target.value ? Number(e.target.value) : null 
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
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Keywords
            </CardTitle>
            <CardDescription>Add keywords to match tenders (e.g., "road construction", "IT equipment")</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                placeholder="Enter a keyword..."
                onKeyDown={e => e.key === "Enter" && addKeyword()}
              />
              <Button onClick={addKeyword} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.keywords.map(keyword => (
                <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeKeyword(keyword)} 
                  />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Eligibility Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Eligibility Types
            </CardTitle>
            <CardDescription>Select tender eligibility categories that apply to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ELIGIBILITY_TYPES.map(type => (
                <Badge
                  key={type}
                  variant={preferences.eligibility_types.includes(type) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => toggleArrayItem("eligibility_types", type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose how you want to receive tender alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive daily digest of matching tenders</p>
                </div>
              </div>
              <Switch
                checked={preferences.notification_email}
                onCheckedChange={checked => setPreferences(prev => ({ ...prev, notification_email: checked }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Instant alerts for high-match tenders</p>
                </div>
              </div>
              <Switch
                checked={preferences.notification_push}
                onCheckedChange={checked => setPreferences(prev => ({ ...prev, notification_push: checked }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Urgent alerts via SMS (premium feature)</p>
                </div>
              </div>
              <Switch
                checked={preferences.notification_sms}
                onCheckedChange={checked => setPreferences(prev => ({ ...prev, notification_sms: checked }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
