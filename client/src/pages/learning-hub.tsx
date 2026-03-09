import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BookOpen, FileText, GraduationCap, Trophy, Download, ExternalLink, CheckCircle, Clock, Star, Mail, PenLine } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useLearningGuides, useLearningTemplates, useLearningCourses } from "@/hooks/use-learning-hub";
import { SubmitContentDialog } from "@/components/learning/SubmitContentDialog";
import { Skeleton } from "@/components/ui/skeleton";

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

  const { data: guides = [], isLoading: guidesLoading } = useLearningGuides();
  const { data: templates = [], isLoading: templatesLoading } = useLearningTemplates();
  const { data: courses = [], isLoading: coursesLoading } = useLearningCourses();

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Intermediate": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Advanced": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Anti-spam email display
  const emailUser = "info";
  const emailDomain = "tenderzville-portal.co.ke";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-7 w-7 text-primary" />
              <h1 className="text-2xl lg:text-3xl font-bold">{t('learn.title')}</h1>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{t('learn.free')}</Badge>
            </div>
            <SubmitContentDialog />
          </div>
          <p className="text-muted-foreground">{t('learn.subtitle')}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
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
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              <span className="hidden sm:inline">Guest Blog</span>
            </TabsTrigger>
          </TabsList>

          {/* Guides */}
          <TabsContent value="guides">
            {guidesLoading ? (
              <div className="grid gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
            ) : guides.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No guides published yet</p>
                <p className="text-sm mt-1">Be the first to share your procurement knowledge! Click "Submit Content" above.</p>
              </CardContent></Card>
            ) : (
              <div className="grid gap-4">
                {guides.map((guide) => (
                  <Card key={guide.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge className={getLevelColor(guide.category)}>{guide.category}</Badge>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {guide.read_time}
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg">{language === 'sw' && guide.title_sw ? guide.title_sw : guide.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{language === 'sw' && guide.description_sw ? guide.description_sw : guide.description}</p>
                        </div>
                        <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 ml-4" />
                      </div>
                      {expandedGuide === guide.id && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm whitespace-pre-line">{language === 'sw' && guide.content_sw ? guide.content_sw : guide.content}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates">
            {templatesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
            ) : templates.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No templates available yet</p>
                <p className="text-sm mt-1">Share your tender document templates with the community.</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <Badge variant="outline">{template.format}</Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{language === 'sw' && template.title_sw ? template.title_sw : template.title}</h3>
                      {template.description && (
                        <p className="text-xs text-muted-foreground mb-2">{language === 'sw' && template.description_sw ? template.description_sw : template.description}</p>
                      )}
                      <Badge variant="secondary" className="text-xs mb-4">{template.category}</Badge>
                      <Button variant="outline" className="w-full mt-2" size="sm" asChild>
                        <a href={template.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          {t('learn.download')}
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Courses */}
          <TabsContent value="courses">
            {coursesLoading ? (
              <div className="grid gap-6">{[1,2].map(i => <Skeleton key={i} className="h-48 w-full" />)}</div>
            ) : courses.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No courses available yet</p>
                <p className="text-sm mt-1">Are you a trainer? Submit your course to reach thousands of procurement professionals.</p>
              </CardContent></Card>
            ) : (
              <div className="grid gap-6">
                {courses.map((course) => (
                  <Card key={course.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {course.modules} modules • {language === 'sw' && course.duration_sw ? course.duration_sw : course.duration}
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg">{language === 'sw' && course.title_sw ? course.title_sw : course.title}</h3>
                          {course.description && (
                            <p className="text-sm text-muted-foreground mt-1">{language === 'sw' && course.description_sw ? course.description_sw : course.description}</p>
                          )}
                        </div>
                        <GraduationCap className="h-6 w-6 text-primary shrink-0" />
                      </div>
                      {course.topics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {course.topics.map((topic) => (
                            <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
                          ))}
                        </div>
                      )}
                      {course.enrollment_count > 0 && (
                        <p className="text-xs text-muted-foreground mb-2">{course.enrollment_count} enrolled</p>
                      )}
                      {course.course_url ? (
                        <Button className="w-full mt-3" asChild>
                          <a href={course.course_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t('learn.start')}
                          </a>
                        </Button>
                      ) : (
                        <Button className="w-full mt-3" disabled>{t('learn.start')}</Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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

          {/* Guest Blog */}
          <TabsContent value="blog">
            <Card>
              <CardContent className="p-8">
                <div className="max-w-2xl mx-auto text-center">
                  <PenLine className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h2 className="text-xl font-bold mb-3">Guest Blog Submissions</h2>
                  <p className="text-muted-foreground mb-6">
                    Share your expertise in procurement, tendering, and business growth with the Tenderzville community.
                    We welcome articles on AGPO, e-GP, bid writing, compliance, success stories, and industry insights.
                  </p>
                  <div className="bg-muted rounded-lg p-6 mb-6 text-left space-y-3">
                    <h3 className="font-semibold">Submission Guidelines:</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Articles should be 800–2,000 words</li>
                      <li>Original content only — no plagiarism</li>
                      <li>Include practical tips or actionable advice</li>
                      <li>You may include up to 2 relevant links</li>
                      <li>Our editorial team reviews within 5 business days</li>
                    </ul>
                  </div>
                  <div className="bg-card border rounded-lg p-6">
                    <Mail className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground mb-2">Send your article to:</p>
                    <p className="font-mono text-lg font-semibold text-foreground">
                      {/* Anti-bot: rendered as separate spans */}
                      <span>{emailUser}</span>
                      <span aria-hidden="true"> [at] </span>
                      <span>{emailDomain}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Include "Guest Blog Submission" in the subject line
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
