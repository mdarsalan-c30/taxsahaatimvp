"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Upload, Activity, CheckCircle, AlertTriangle, PlayCircle } from "lucide-react";
import Link from "next/link";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function BlogEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [status, setStatus] = useState("draft");
  
  // Real-time metrics
  const [wordCount, setWordCount] = useState(0);
  const [seoScore, setSeoScore] = useState(0);
  const [aiScore, setAiScore] = useState<number | null>(null);

  // Analyze SEO on change
  useEffect(() => {
    // Word Count
    const words = content.replace(/(<([^>]+)>)/gi, "").split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);

    // Calculate SEO Score
    let score = 0;
    if (words > 800) score += 40;
    else if (words > 300) score += 20;

    if (focusKeyword) {
      if (title.toLowerCase().includes(focusKeyword.toLowerCase())) score += 15;
      if (seoDescription.toLowerCase().includes(focusKeyword.toLowerCase())) score += 15;
      if (content.toLowerCase().includes(focusKeyword.toLowerCase())) score += 10;
    }

    if (seoDescription.length >= 120 && seoDescription.length <= 160) score += 20;
    
    // Max 100
    setSeoScore(Math.min(100, score));

  }, [title, content, focusKeyword, seoDescription]);

  // Load existing if not new
  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/blogs?id=${params.id}`)
        .then(res => res.json())
        .then(data => {
          setTitle(data.title || "");
          setSlug(data.slug || "");
          setContent(data.content || "");
          setFocusKeyword(data.focusKeyword || "");
          setSeoTitle(data.seoTitle || "");
          setSeoDescription(data.seoDescription || "");
          setStatus(data.status || "draft");
          setSeoScore(data.seoScore || 0);
        });
    }
  }, [params.id, isNew]);

  const handleSave = async (saveStatus: string) => {
    const payload = { title, slug, content, focusKeyword, seoTitle, seoDescription, status: saveStatus, seoScore };
    const method = isNew ? "POST" : "PUT";
    const url = isNew ? `/api/admin/blogs` : `/api/admin/blogs/${params.id}`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin/blogs");
    } else {
      alert("Error saving blog");
    }
  };

  const handleAiScan = async () => {
    // Call the actual ZeroGPT API route
    setAiScore(null);
    try {
      const res = await fetch('/api/ai/zerogpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content.replace(/(<([^>]+)>)/gi, "") })
      });
      if (res.ok) {
        const data = await res.json();
        setAiScore(Math.round(data.aiScore || 0));
      } else {
        alert("ZeroGPT scan failed. Please check the API key.");
      }
    } catch (error) {
      console.error(error);
      alert("Error contacting the AI scanner.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[85vh] gap-6">
      
      {/* Left Pane - Writer */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/blogs">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold">{isNew ? "Draft New Blog" : "Edit Blog"}</h1>
        </div>

        <div className="bg-card border rounded-lg p-6 flex flex-col gap-4">
          <div>
            <Label>Blog Title</Label>
            <Input 
              placeholder="Enter a compelling title..." 
              value={title} 
              onChange={e => {
                setTitle(e.target.value);
                if (isNew) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
              }} 
              className="text-lg font-medium mt-1"
            />
          </div>

          <div>
            <Label>Slug URL Handle</Label>
            <Input 
              value={slug} 
              onChange={e => setSlug(e.target.value)} 
              className="mt-1 font-mono text-sm"
            />
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
            <Upload className="h-8 w-8 mb-2 opacity-50" />
            <p>Header Cover Image</p>
            <Button variant="secondary" size="sm" className="mt-4">Choose Image</Button>
          </div>

          <div className="flex-1 min-h-[500px] mt-4" data-color-mode="light">
            <Label className="mb-2 block">Content Body (Markdown Supported)</Label>
            <div className="border rounded-md overflow-hidden bg-background">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || "")}
                height={500}
                className="w-full"
                preview="live"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - SEO & Actions */}
      <div className="w-full lg:w-[350px] flex flex-col gap-6">
        
        {/* Actions */}
        <div className="bg-card border rounded-lg p-6 flex flex-col gap-3">
          <Button onClick={() => handleSave("published")} className="w-full bg-green-600 hover:bg-green-700">
            <Save className="mr-2 h-4 w-4" /> Publish Article
          </Button>
          <Button onClick={() => handleSave("draft")} variant="outline" className="w-full">
            Save as Draft
          </Button>
        </div>

        {/* SEO Metadata */}
        <div className="bg-card border rounded-lg p-6 flex flex-col gap-4">
          <h3 className="font-semibold flex items-center gap-2"><Activity className="h-4 w-4" /> SEO Metadata</h3>
          
          <div>
            <Label>Focus Keyword</Label>
            <Input 
              placeholder="e.g. tax filing 2026" 
              value={focusKeyword} 
              onChange={e => setFocusKeyword(e.target.value)} 
              className="mt-1"
            />
          </div>

          <div>
            <Label>SEO Custom Title</Label>
            <Input 
              placeholder="Title tag for search results" 
              value={seoTitle} 
              onChange={e => setSeoTitle(e.target.value)} 
              className="mt-1"
            />
          </div>

          <div>
            <Label>SEO Custom Description</Label>
            <Textarea 
              placeholder="Meta snippet summary..." 
              value={seoDescription} 
              onChange={(e: any) => setSeoDescription(e.target.value)} 
              className="mt-1 resize-none"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {seoDescription.length} chars
            </p>
          </div>
        </div>

        {/* SEO Quality Live Audit */}
        <div className="bg-card border rounded-lg p-6 flex flex-col gap-4">
          <h3 className="font-semibold flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Real-Time SEO Audit</h3>
          
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <span className="font-medium">SEO Score</span>
            <span className={`text-xl font-bold ${seoScore > 80 ? 'text-green-600' : seoScore > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {seoScore}/100
            </span>
          </div>

          <div className="text-sm flex flex-col gap-2 mt-2">
            <div className="flex items-start gap-2">
              {wordCount >= 800 ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
              <span>Word count: {wordCount} words <br/><span className="text-muted-foreground text-xs">(Target: 800+ words)</span></span>
            </div>
            
            <div className="flex items-start gap-2">
              {focusKeyword ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
              <span>{focusKeyword ? `Focus Keyword set: "${focusKeyword}"` : "Enter a Focus Keyword to trigger deep density scans"}</span>
            </div>

            <div className="flex items-start gap-2">
              {(seoDescription.length >= 120 && seoDescription.length <= 160) ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
              <span>Meta Description: {seoDescription.length} chars <br/><span className="text-muted-foreground text-xs">(Target: 120-160)</span></span>
            </div>
          </div>
        </div>

        {/* Arsalan AI Detector */}
        <div className="bg-card border rounded-lg p-6 flex flex-col gap-4">
          <h3 className="font-semibold flex items-center gap-2 text-indigo-600">
            <PlayCircle className="h-4 w-4" /> Arsalan AI Scan
          </h3>
          <p className="text-xs text-muted-foreground">Verify originality before publishing. Scans the text body for AI-generated patterns.</p>
          
          {aiScore !== null && (
            <div className="flex flex-col items-center justify-center p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-md border border-indigo-100 dark:border-indigo-900 mt-2">
              <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">AI Probability Score</span>
              <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{aiScore}%</span>
              <span className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">
                {aiScore < 20 ? "Highly likely Human" : aiScore < 60 ? "Mixed / Heavily Edited" : "Likely AI Generated"}
              </span>
            </div>
          )}

          <Button onClick={handleAiScan} variant="secondary" className="w-full mt-2">
            Scan for AI Content
          </Button>
        </div>

      </div>
    </div>
  );
}
