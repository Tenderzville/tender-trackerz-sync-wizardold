import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useSubmitGuide, useSubmitTemplate, useSubmitCourse } from "@/hooks/use-learning-hub";

type ContentType = "guide" | "template" | "course";

export function SubmitContentDialog() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ContentType>("guide");

  // Guide fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Beginner");
  const [readTime, setReadTime] = useState("10 min");

  // Template fields
  const [format, setFormat] = useState("PDF");
  const [fileUrl, setFileUrl] = useState("");

  // Course fields
  const [level, setLevel] = useState("Beginner");
  const [modules, setModules] = useState(1);
  const [duration, setDuration] = useState("1 hour");
  const [topics, setTopics] = useState("");
  const [courseUrl, setCourseUrl] = useState("");

  const submitGuide = useSubmitGuide();
  const submitTemplate = useSubmitTemplate();
  const submitCourse = useSubmitCourse();

  const isLoading = submitGuide.isPending || submitTemplate.isPending || submitCourse.isPending;

  const resetForm = () => {
    setTitle(""); setDescription(""); setContent(""); setCategory("Beginner");
    setReadTime("10 min"); setFormat("PDF"); setFileUrl(""); setLevel("Beginner");
    setModules(1); setDuration("1 hour"); setTopics(""); setCourseUrl("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    if (type === "guide") {
      await submitGuide.mutateAsync({ title, description, content, category, read_time: readTime });
    } else if (type === "template") {
      if (!fileUrl.trim()) return;
      await submitTemplate.mutateAsync({ title, description, format, category, file_url: fileUrl });
    } else {
      await submitCourse.mutateAsync({
        title, description, level, modules, duration,
        topics: topics.split(",").map(t => t.trim()).filter(Boolean),
        course_url: courseUrl || undefined,
      });
    }
    resetForm();
    setOpen(false);
  };

  const pricing: Record<ContentType, string> = {
    guide: "KSh 500",
    template: "KSh 300",
    course: "KSh 1,000",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Submit Content
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Learning Content</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Content Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ContentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="guide">Guide — {pricing.guide}</SelectItem>
                <SelectItem value="template">Template — {pricing.template}</SelectItem>
                <SelectItem value="course">Course — {pricing.course}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Listing fee: <Badge variant="secondary">{pricing[type]}</Badge> — payable after admin approval
            </p>
          </div>

          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" maxLength={200} />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" maxLength={500} rows={2} />
          </div>

          {type === "guide" && (
            <>
              <div>
                <Label>Full Content *</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your guide content..." rows={6} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Read Time</Label>
                  <Input value={readTime} onChange={(e) => setReadTime(e.target.value)} placeholder="e.g. 15 min" />
                </div>
              </div>
            </>
          )}

          {type === "template" && (
            <>
              <div>
                <Label>File URL *</Label>
                <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://drive.google.com/..." type="url" />
                <p className="text-xs text-muted-foreground mt-1">Upload to Google Drive, Dropbox, or any file host and paste the link</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="DOCX">DOCX</SelectItem>
                      <SelectItem value="XLSX">XLSX</SelectItem>
                      <SelectItem value="PPTX">PPTX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Essential">Essential</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Supporting">Supporting</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {type === "course" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Level</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Number of Modules</Label>
                  <Input type="number" min={1} max={50} value={modules} onChange={(e) => setModules(Number(e.target.value))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Duration</Label>
                  <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 2 hours" />
                </div>
                <div>
                  <Label>Course URL</Label>
                  <Input value={courseUrl} onChange={(e) => setCourseUrl(e.target.value)} placeholder="https://..." type="url" />
                </div>
              </div>
              <div>
                <Label>Topics (comma-separated)</Label>
                <Input value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Registration, Bidding, Compliance" />
              </div>
            </>
          )}

          <Button onClick={handleSubmit} disabled={isLoading || !title.trim()} className="w-full">
            {isLoading ? "Submitting..." : "Submit for Review"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Content is reviewed by our team before publishing. Payment is processed after approval.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
