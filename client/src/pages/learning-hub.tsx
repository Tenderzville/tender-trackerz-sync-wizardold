import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BookOpen, FileText, GraduationCap, Trophy, Download, ExternalLink, CheckCircle, Clock, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const guides = [
  {
    id: 1,
    title: { en: "Complete Guide to AGPO Procurement", sw: "Mwongozo Kamili wa Ununuzi wa AGPO" },
    description: { en: "Understanding Access to Government Procurement Opportunities for Youth, Women & PWDs", sw: "Kuelewa Ufikiaji wa Fursa za Manunuzi ya Serikali kwa Vijana, Wanawake na Watu wenye Ulemavu" },
    category: "Beginner",
    readTime: "15 min",
    content: { en: "AGPO reserves 30% of government tenders for Youth, Women, and Persons with Disabilities. Requirements: Valid AGPO certificate from agpo.go.ke, KRA PIN, Business registration (CR12/Certificate of Registration), Valid Tax Compliance Certificate. Steps: 1) Register on agpo.go.ke 2) Get your AGPO certificate 3) Apply for reserved tenders on tenders.go.ke 4) Submit required documents.", sw: "AGPO inahifadhi 30% ya zabuni za serikali kwa Vijana, Wanawake, na Watu wenye Ulemavu. Mahitaji: Cheti halali cha AGPO kutoka agpo.go.ke, KRA PIN, Usajili wa biashara, Cheti halali cha Utiifu wa Kodi." },
  },
  {
    id: 2,
    title: { en: "How to Register on e-GP Kenya (IFMIS)", sw: "Jinsi ya Kusajiliwa kwenye e-GP Kenya (IFMIS)" },
    description: { en: "Step-by-step guide to registering as a supplier on Kenya's e-Government Procurement portal", sw: "Mwongozo wa hatua kwa hatua wa kusajiliwa kama msambazaji kwenye tovuti ya Manunuzi ya Serikali ya Kenya" },
    category: "Beginner",
    readTime: "10 min",
    content: { en: "Visit supplier.treasury.go.ke → Click 'New Supplier Registration' → Fill company details, upload KRA PIN, CR12, Tax Compliance → Submit → Await verification (3-5 business days) → Once approved, browse and bid on tenders.", sw: "Tembelea supplier.treasury.go.ke → Bofya 'Usajili Mpya wa Msambazaji' → Jaza maelezo ya kampuni → Wasilisha → Subiri uthibitisho." },
  },
  {
    id: 3,
    title: { en: "Writing a Winning Tender Response", sw: "Kuandika Jibu la Zabuni Linaloshinda" },
    description: { en: "Professional techniques for preparing competitive tender documents", sw: "Mbinu za kitaaluma za kuandaa nyaraka za zabuni zenye ushindani" },
    category: "Intermediate",
    readTime: "20 min",
    content: { en: "Key sections: Cover letter, Company profile, Technical proposal, Financial proposal, Required certifications. Tips: Follow the tender document structure exactly, address every requirement, provide evidence of past performance, price competitively but realistically.", sw: "Sehemu muhimu: Barua ya jalada, Wasifu wa kampuni, Pendekezo la kiufundi, Pendekezo la kifedha." },
  },
  {
    id: 4,
    title: { en: "Understanding Bid Security & Performance Bonds", sw: "Kuelewa Dhamana ya Zabuni na Dhamana ya Utendaji" },
    description: { en: "Everything about bid bonds, performance guarantees, and insurance requirements", sw: "Kila kitu kuhusu dhamana za zabuni, dhamana za utendaji, na mahitaji ya bima" },
    category: "Advanced",
    readTime: "12 min",
    content: { en: "Bid Security: 1-2% of tender value, usually a bank guarantee. Performance Bond: 10% of contract value upon award. Advance Payment Guarantee: Equal to advance payment amount. Insurance: Professional indemnity, public liability as specified.", sw: "Dhamana ya Zabuni: 1-2% ya thamani ya zabuni." },
  },
];

const templates = [
  { id: 1, title: { en: "Tender Response Cover Letter", sw: "Barua ya Jalada ya Jibu la Zabuni" }, format: "DOCX", category: "Essential" },
  { id: 2, title: { en: "Technical Proposal Template", sw: "Kiolezo cha Pendekezo la Kiufundi" }, format: "DOCX", category: "Essential" },
  { id: 3, title: { en: "Financial Proposal Spreadsheet", sw: "Jedwali la Pendekezo la Kifedha" }, format: "XLSX", category: "Essential" },
  { id: 4, title: { en: "Company Profile Template", sw: "Kiolezo cha Wasifu wa Kampuni" }, format: "DOCX", category: "Essential" },
  { id: 5, title: { en: "Bid Bond Application Letter", sw: "Barua ya Maombi ya Dhamana ya Zabuni" }, format: "PDF", category: "Financial" },
  { id: 6, title: { en: "Past Performance Reference Form", sw: "Fomu ya Rejea ya Utendaji wa Awali" }, format: "PDF", category: "Supporting" },
];

const courses = [
  {
    id: 1,
    title: { en: "Tendering 101: From Registration to Award", sw: "Zabuni 101: Kutoka Usajili hadi Tuzo" },
    modules: 5,
    duration: { en: "2 hours", sw: "Saa 2" },
    level: "Beginner",
    topics: ["Registration", "Finding Tenders", "Document Preparation", "Submission", "Post-Award"],
  },
  {
    id: 2,
    title: { en: "PPRA Regulations & Compliance", sw: "Kanuni za PPRA na Utiifu" },
    modules: 4,
    duration: { en: "1.5 hours", sw: "Saa 1.5" },
    level: "Intermediate",
    topics: ["PPDA 2015", "Procurement Methods", "Appeals Process", "Debarment Rules"],
  },
  {
    id: 3,
    title: { en: "Financial Proposal Mastery", sw: "Ustadi wa Pendekezo la Kifedha" },
    modules: 3,
    duration: { en: "1 hour", sw: "Saa 1" },
    level: "Advanced",
    topics: ["Cost Estimation", "Pricing Strategy", "BOQ Preparation"],
  },
];

const achievements = [
  { id: 1, title: { en: "First Steps", sw: "Hatua za Kwanza" }, description: { en: "Complete your first guide", sw: "Kamilisha mwongozo wako wa kwanza" }, icon: "🎯", unlocked: false },
  { id: 2, title: { en: "Template Master", sw: "Bwana wa Violezo" }, description: { en: "Download 3 templates", sw: "Pakua violezo 3" }, icon: "📋", unlocked: false },
  { id: 3, title: { en: "Knowledge Seeker", sw: "Mtafutaji wa Maarifa" }, description: { en: "Complete a course", sw: "Kamilisha kozi" }, icon: "🎓", unlocked: false },
  { id: 4, title: { en: "Tender Pro", sw: "Mtaalamu wa Zabuni" }, description: { en: "Complete all beginner guides", sw: "Kamilisha miongozo yote ya mwanzo" }, icon: "🏆", unlocked: false },
  { id: 5, title: { en: "Bid Champion", sw: "Bingwa wa Zabuni" }, description: { en: "Complete all courses", sw: "Kamilisha kozi zote" }, icon: "👑", unlocked: false },
];

export default function LearningHub() {
  const { language, t } = useI18n();
  const [activeTab, setActiveTab] = useState("guides");
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Intermediate": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Advanced": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <h1 className="text-2xl lg:text-3xl font-bold">{t('learn.title')}</h1>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{t('learn.free')}</Badge>
          </div>
          <p className="text-muted-foreground">{t('learn.subtitle')}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="guides" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">{t('learn.guides')}</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t('learn.templates')}</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">{t('learn.courses')}</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">{t('learn.achievements')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Guides */}
          <TabsContent value="guides">
            <div className="grid gap-4">
              {guides.map((guide) => (
                <Card key={guide.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={getLevelColor(guide.category)}>{guide.category}</Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {guide.readTime}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg">{guide.title[language]}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{guide.description[language]}</p>
                      </div>
                      <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 ml-4" />
                    </div>
                    {expandedGuide === guide.id && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm whitespace-pre-line">{guide.content[language]}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <Badge variant="outline">{template.format}</Badge>
                    </div>
                    <h3 className="font-semibold mb-1">{template.title[language]}</h3>
                    <Badge variant="secondary" className="text-xs mb-4">{template.category}</Badge>
                    <Button variant="outline" className="w-full mt-2" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t('learn.download')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Courses */}
          <TabsContent value="courses">
            <div className="grid gap-6">
              {courses.map((course) => (
                <Card key={course.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
                          <span className="text-sm text-muted-foreground">{course.modules} modules • {course.duration[language]}</span>
                        </div>
                        <h3 className="font-semibold text-lg">{course.title[language]}</h3>
                      </div>
                      <GraduationCap className="h-6 w-6 text-primary shrink-0" />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.topics.map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
                      ))}
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{t('learn.progress')}</span>
                        <span>0%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                    <Button className="w-full mt-3">{t('learn.start')}</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements */}
          <TabsContent value="achievements">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={achievement.unlocked ? "border-primary" : "opacity-60"}>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{achievement.icon}</div>
                    <h3 className="font-semibold">{achievement.title[language]}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{achievement.description[language]}</p>
                    {achievement.unlocked ? (
                      <Badge className="mt-3 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> {t('learn.completed')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-3">🔒 Locked</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
