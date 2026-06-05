import { useState, useCallback } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadBoxProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
}

export function UploadBox({ onFilesSelected, accept, multiple = true, maxSize = 10, className }: UploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
    onFilesSelected(dropped);
  }, [onFilesSelected]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selected]);
      onFilesSelected(selected);
    }
  }, [onFilesSelected]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        )}
      >
        <input type="file" accept={accept} multiple={multiple} onChange={handleSelect} className="hidden" id="upload-input" />
        <label htmlFor="upload-input" className="cursor-pointer">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Arraste arquivos ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground mt-1">Máx. {maxSize}MB por arquivo</p>
        </label>
      </div>
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                {file.type.startsWith('image/') ? <Image className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                <span className="truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeFile(i)} className="h-6 w-6 p-0 flex-shrink-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
