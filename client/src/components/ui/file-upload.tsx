import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  Download,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  bucket: string;
  path?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  onUploadComplete?: (urls: string[]) => void;
  onFilesChange?: (files: UploadedFile[]) => void;
  className?: string;
  multiple?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadProgress?: number;
  status: 'uploading' | 'completed' | 'error';
}

export function FileUpload({
  bucket,
  path = '',
  maxFiles = 5,
  maxSize = 10, // 10MB default
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  onUploadComplete,
  onFilesChange,
  className,
  multiple = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    if (acceptedTypes.length > 0) {
      const isValidType = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.includes('/*')) {
          return file.type.startsWith(type.replace('/*', ''));
        }
        return file.type === type;
      });

      if (!isValidType) {
        return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
      }
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<string> => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error('User not authenticated');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.data.user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleFileUpload = async (filesToUpload: File[]) => {
    if (!multiple && filesToUpload.length > 1) {
      toast({
        title: "Multiple files not allowed",
        description: "Please select only one file",
        variant: "destructive",
      });
      return;
    }

    if (files.length + filesToUpload.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    for (const file of filesToUpload) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: "Invalid file",
          description: `${file.name}: ${error}`,
          variant: "destructive",
        });
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: generateFileId(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: '',
      uploadProgress: 0,
      status: 'uploading' as const,
    }));

    setFiles(prev => [...prev, ...newFiles]);
    const allFiles = [...files, ...newFiles];
    onFilesChange?.(allFiles);

    const uploadPromises = validFiles.map(async (file, index) => {
      const fileId = newFiles[index].id;
      
      try {
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setFiles(prev => 
            prev.map(f => 
              f.id === fileId 
                ? { ...f, uploadProgress: Math.min((f.uploadProgress || 0) + 10, 90) }
                : f
            )
          );
        }, 200);

        const url = await uploadFile(file);
        
        clearInterval(progressInterval);
        
        setFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, url, uploadProgress: 100, status: 'completed' }
              : f
          )
        );

        return url;
      } catch (error: any) {
        setFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'error' }
              : f
          )
        );
        
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}: ${error.message}`,
          variant: "destructive",
        });
        
        throw error;
      }
    });

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      const successfulUrls = uploadedUrls.filter(url => url);
      onUploadComplete?.(successfulUrls);
      
      toast({
        title: "Upload successful",
        description: `${successfulUrls.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      // Error handling is done in individual upload promises
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileUpload(droppedFiles);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      handleFileUpload(selectedFiles);
    }
    e.target.value = '';
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      onFilesChange?.(updated);
      return updated;
    });
  };

  const downloadFile = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver ? "border-primary bg-primary/5" : "border-slate-300 dark:border-slate-600",
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {isDragOver ? "Drop files here" : "Upload Files"}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Drag and drop files here, or click to select
          </p>
          <div className="text-sm text-slate-400 space-y-1">
            <p>Maximum {maxFiles} files, up to {maxSize}MB each</p>
            <p>Supported: {acceptedTypes.join(', ')}</p>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Files ({files.length})</h4>
          {files.map((file) => (
            <Card key={file.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {file.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : file.status === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <File className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {file.status === 'uploading' && (
                      <Progress 
                        value={file.uploadProgress || 0} 
                        className="h-2 mt-2"
                      />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      file.status === 'completed' ? 'default' :
                      file.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {file.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 ml-4">
                  {file.status === 'completed' && file.url && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.url, '_blank');
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file.url, file.name);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}