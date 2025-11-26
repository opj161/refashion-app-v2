'use client';

import { useState, useTransition, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Beaker, Loader2, UploadCloud, AlertCircle, ScanEye } from 'lucide-react';
import { testStudioPrompt } from '@/actions/adminActions';
import Image from 'next/image';

interface StudioPromptTesterProps {
  currentTemplate: string;
}

export function StudioPromptTester({ currentTemplate }: StudioPromptTesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fit, setFit] = useState<string>('regular');
  const [model, setModel] = useState<string>('gemini-flash-lite-latest');
  const [compareAll, setCompareAll] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Result State
  const [result, setResult] = useState<{ 
    classification?: string; 
    prompt?: string;
    comparisons?: Record<string, string>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setResult(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const droppedFile = files[0];
      if (droppedFile.type.startsWith('image/')) {
        handleFileSelect(droppedFile);
      } else {
        setError("Please drop an image file.");
      }
    }
  };

  const handleRunTest = () => {
    if (!file) {
      setError("Please select an image to test.");
      return;
    }
    if (!currentTemplate.trim()) {
      setError("The prompt template is empty. Please enter a template in the settings form.");
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('fit', fit);
      formData.append('model', model);
      formData.append('template', currentTemplate);
      formData.append('compareAll', compareAll.toString());

      const response = await testStudioPrompt(formData);

      if (response.success) {
        setResult({
          classification: response.classification,
          prompt: response.prompt,
          comparisons: response.comparisons
        });
      } else {
        setError(response.error || "An unknown error occurred.");
      }
    });
  };

  const resetState = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setFit('regular');
    setModel('gemini-flash-lite-latest');
    setCompareAll(false);
    setIsDragging(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5">
          <Beaker className="h-4 w-4" />
          Test Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5 text-primary" />
            Studio Prompt Simulator
          </DialogTitle>
          <DialogDescription>
            Test how your template handles real images using Gemini Vision classification. 
            This runs the full prompt construction logic without generating an image.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left Column: Inputs */}
          <div className="space-y-6">
            
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Test Image</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all relative min-h-[200px] flex flex-col items-center justify-center ${
                  isDragging 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : 'border-muted-foreground/20 hover:bg-muted/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <div className="relative w-full h-48">
                    <Image 
                      src={previewUrl} 
                      alt="Preview" 
                      fill 
                      className="object-contain rounded-md" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                       <span className="text-white font-medium flex items-center gap-2">
                         <UploadCloud className="h-4 w-4" /> Change Image
                       </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UploadCloud className={`h-10 w-10 mb-2 transition-all ${isDragging ? 'opacity-100 scale-110' : 'opacity-50'}`} />
                    <span className="text-sm font-medium">
                      {isDragging ? 'Drop image here' : 'Click or drag to upload'}
                    </span>
                    <span className="text-xs opacity-70">JPG, PNG, WEBP</span>
                  </div>
                )}
                <Input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </div>
            </div>

            {/* Fit Selection */}
            <div className="space-y-2">
              <Label>Fit Setting</Label>
              <Select value={fit} onValueChange={setFit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slim">Slim Fit</SelectItem>
                  <SelectItem value="regular">Regular Fit</SelectItem>
                  <SelectItem value="relaxed">Relaxed Fit</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This determines the <code>{'{fitDescription}'}</code> injected into the prompt.
              </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label className={compareAll ? "opacity-50" : ""}>Gemini Model</Label>
              <Select value={model} onValueChange={setModel} disabled={compareAll}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-flash-lite-latest">Gemini Flash Lite (Fastest)</SelectItem>
                  <SelectItem value="gemini-flash-latest">Gemini Flash (Balanced)</SelectItem>
                  <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Best Quality)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the vision model used for clothing classification.
              </p>
            </div>

            <Button 
              className="w-full" 
              onClick={handleRunTest} 
              disabled={isPending || !file}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {compareAll ? "Running Comparison..." : "Analyzing..."}
                </>
              ) : (
                compareAll ? "Run Comparison" : "Run Analysis"
              )}
            </Button>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6 flex flex-col">
            {/* Compare All Toggle */}
            <div className="flex items-center space-x-2 p-3 rounded-md bg-muted/20">
              <Switch id="compare-mode" checked={compareAll} onCheckedChange={setCompareAll} />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="compare-mode" className="cursor-pointer font-medium">Compare All Models</Label>
                <p className="text-xs text-muted-foreground">
                  Run all models simultaneously to compare classification results.
                </p>
              </div>
            </div>

             <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Gemini Vision Classification</span>
                  {result && <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">Success</Badge>}
                </Label>
                
                {result?.comparisons ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Model</th>
                          <th className="px-3 py-2 text-left font-medium">Classification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {Object.entries(result.comparisons).map(([modelName, description]) => (
                          <tr key={modelName}>
                            <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{modelName}</td>
                            <td className="px-3 py-2">{description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 rounded-md bg-muted/30 border min-h-[3rem] flex items-center">
                    {result ? (
                       <div className="flex items-start gap-3">
                         <ScanEye className="h-5 w-5 text-primary mt-0.5" />
                         <div>
                           <span className="font-medium text-foreground">&quot;clothing item&quot;</span>
                           <span className="text-muted-foreground mx-2">replaced with</span>
                           <span className="font-bold text-primary">&quot;{result.classification}&quot;</span>
                         </div>
                       </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Waiting for analysis...
                      </span>
                    )}
                  </div>
                )}
             </div>

             {!compareAll && (
               <div className="space-y-2 flex-1 flex flex-col">
                  <Label>Final Constructed Prompt</Label>
                  <Textarea 
                    readOnly 
                    className="flex-1 font-mono text-sm bg-muted/20 min-h-[250px] resize-none"
                    value={result?.prompt || ""}
                    placeholder="The final prompt sent to the image generator will appear here..."
                  />
               </div>
             )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
