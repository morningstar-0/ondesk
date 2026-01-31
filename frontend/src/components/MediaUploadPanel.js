import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { X, Upload, Image, Video, FileImage, Clipboard, Sparkles, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

const MediaUploadPanel = ({ 
  isOpen, 
  onClose, 
  onUploadComplete, 
  entityType = 'asset',
  entityId = '',
  api,
  allowMultiple = true,
  showAiAnalysis = true
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [aiResults, setAiResults] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const validTypes = [...validImageTypes, ...validVideoTypes];

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFiles = useCallback((fileList) => {
    const newFiles = Array.from(fileList).filter(file => {
      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}`);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File too large: ${file.name} (max 50MB)`);
        return false;
      }
      return true;
    }).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      type: validVideoTypes.includes(file.type) ? 'video' : 'image',
      status: 'pending'
    }));

    if (!allowMultiple && newFiles.length > 0) {
      setFiles([newFiles[0]]);
    } else {
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, [allowMultiple]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
    if (imageItems.length > 0) {
      const files = imageItems.map(item => item.getAsFile()).filter(Boolean);
      processFiles(files);
      toast.success(`Pasted ${files.length} image(s)`);
    }
  }, [processFiles]);

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  }, [isOpen, handlePaste]);

  const removeFile = (id) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
    setUploadProgress(prev => { const next = {...prev}; delete next[id]; return next; });
    setAiResults(prev => { const next = {...prev}; delete next[id]; return next; });
  };

  const uploadSingleFile = async (fileItem, analyzeWithAI = false) => {
    const formData = new FormData();
    formData.append('file', fileItem.file);
    
    if (analyzeWithAI && showAiAnalysis) {
      formData.append('entity_type', entityType);
      
      try {
        setUploadProgress(prev => ({...prev, [fileItem.id]: 10}));
        
        const response = await api.post('/upload/image-analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 60) / progressEvent.total) + 10;
            setUploadProgress(prev => ({...prev, [fileItem.id]: Math.min(progress, 70)}));
          }
        });
        
        setUploadProgress(prev => ({...prev, [fileItem.id]: 100}));
        setAiResults(prev => ({...prev, [fileItem.id]: response.data}));
        setFiles(prev => prev.map(f => f.id === fileItem.id ? {...f, status: 'success'} : f));
        
        return response.data;
      } catch (error) {
        setFiles(prev => prev.map(f => f.id === fileItem.id ? {...f, status: 'error'} : f));
        throw error;
      }
    } else {
      formData.append('entity_type', entityType);
      if (entityId) formData.append('entity_id', entityId);
      
      try {
        setUploadProgress(prev => ({...prev, [fileItem.id]: 10}));
        
        const response = await api.post('/upload/media', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 90) / progressEvent.total) + 10;
            setUploadProgress(prev => ({...prev, [fileItem.id]: progress}));
          }
        });
        
        setUploadProgress(prev => ({...prev, [fileItem.id]: 100}));
        setFiles(prev => prev.map(f => f.id === fileItem.id ? {...f, status: 'success'} : f));
        
        return response.data;
      } catch (error) {
        setFiles(prev => prev.map(f => f.id === fileItem.id ? {...f, status: 'error'} : f));
        throw error;
      }
    }
  };

  const handleUploadAll = async (withAI = false) => {
    if (files.length === 0) {
      toast.error('No files to upload');
      return;
    }

    setUploading(true);
    const results = [];

    for (const fileItem of files.filter(f => f.status === 'pending')) {
      try {
        const result = await uploadSingleFile(fileItem, withAI && fileItem.type === 'image');
        results.push(result);
      } catch (error) {
        toast.error(`Failed to upload ${fileItem.file.name}`);
      }
    }

    setUploading(false);

    if (results.length > 0) {
      toast.success(`Uploaded ${results.length} file(s) successfully`);
      onUploadComplete?.(results);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-card border-l shadow-2xl z-50 flex flex-col animate-slide-up" data-testid="media-upload-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold font-['Public_Sans']">Upload Media</h2>
          <p className="text-sm text-muted-foreground">Add images and videos to your {entityType}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Upload Area */}
      <div className="p-4 space-y-4">
        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onClick={() => fileInputRef.current?.click()}
          data-testid="drop-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
            multiple={allowMultiple}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Drop files here or click to browse</p>
          <p className="text-sm text-muted-foreground mt-1">
            Supports JPEG, PNG, WEBP, GIF, MP4, WebM
          </p>
        </div>

        {/* Alternative Upload Methods */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileImage className="mr-2 h-4 w-4" />
            Browse
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => toast.info('Paste an image from clipboard (Ctrl+V / Cmd+V)')}
          >
            <Clipboard className="mr-2 h-4 w-4" />
            Paste
          </Button>
        </div>
      </div>

      <Separator />

      {/* File List */}
      <ScrollArea className="flex-1 p-4">
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No files selected</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                  fileItem.status === 'success' && "border-green-500/50 bg-green-500/5",
                  fileItem.status === 'error' && "border-red-500/50 bg-red-500/5"
                )}
              >
                {/* Preview */}
                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {fileItem.type === 'video' ? (
                    <video src={fileItem.preview} className="w-full h-full object-cover" />
                  ) : (
                    <img src={fileItem.preview} alt={fileItem.file.name} className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{fileItem.file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {fileItem.type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <Image className="h-3 w-3 mr-1" />}
                      {fileItem.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>

                  {/* Progress */}
                  {uploadProgress[fileItem.id] !== undefined && uploadProgress[fileItem.id] < 100 && (
                    <Progress value={uploadProgress[fileItem.id]} className="h-1 mt-2" />
                  )}

                  {/* Status */}
                  {fileItem.status === 'success' && (
                    <div className="flex items-center gap-1 text-green-600 text-xs mt-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Uploaded
                    </div>
                  )}

                  {/* AI Results */}
                  {aiResults[fileItem.id] && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                      <div className="flex items-center gap-1 text-primary mb-1">
                        <Sparkles className="h-3 w-3" />
                        AI Analysis
                      </div>
                      <p className="font-medium">{aiResults[fileItem.id].ai_analysis?.name}</p>
                      <p className="text-muted-foreground truncate">{aiResults[fileItem.id].ai_analysis?.description?.substring(0, 80)}...</p>
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => removeFile(fileItem.id)}
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        {showAiAnalysis && files.some(f => f.type === 'image' && f.status === 'pending') && (
          <Button
            className="w-full"
            onClick={() => handleUploadAll(true)}
            disabled={uploading || files.filter(f => f.status === 'pending').length === 0}
            data-testid="upload-with-ai-btn"
          >
            {uploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Upload & Analyze with AI</>
            )}
          </Button>
        )}
        <Button
          variant={showAiAnalysis ? "outline" : "default"}
          className="w-full"
          onClick={() => handleUploadAll(false)}
          disabled={uploading || files.filter(f => f.status === 'pending').length === 0}
          data-testid="upload-btn"
        >
          {uploading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>
          ) : (
            <><Upload className="mr-2 h-4 w-4" />Upload {files.filter(f => f.status === 'pending').length} File(s)</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MediaUploadPanel;
