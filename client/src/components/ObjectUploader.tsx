import { useState, useRef } from "react";
import type { ReactNode, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: (file: File, purpose?: string) => Promise<{
    method: "PUT";
    url: string;
    objectPath: string;
  }>;
  onComplete?: (result: { successful: Array<{ name: string; uploadURL: string; objectPath: string }> }) => void;
  buttonClassName?: string;
  children: ReactNode;
  acceptedFileTypes?: string;
  purpose?: string;
}

/**
 * A simple file upload component that renders as a button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  acceptedFileTypes = "image/*",
  purpose,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > maxFileSize) {
      toast({
        title: "Error",
        description: `El archivo es muy grande. Máximo: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Get upload URL
      const uploadParams = await onGetUploadParameters(file, purpose);

      // Upload file
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 204) {
          const result = {
            successful: [{
              name: file.name,
              uploadURL: uploadParams.url,
              objectPath: uploadParams.objectPath
            }]
          };
          onComplete?.(result);
          toast({
            title: "Éxito",
            description: "Archivo subido correctamente",
          });
        } else {
          throw new Error(`Upload failed with status: ${xhr.status}`);
        }
        setIsUploading(false);
        setUploadProgress(0);
      });

      xhr.addEventListener('error', () => {
        toast({
          title: "Error",
          description: "Error al subir el archivo",
          variant: "destructive",
        });
        setIsUploading(false);
        setUploadProgress(0);
      });

      xhr.open(uploadParams.method, uploadParams.url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Error al obtener URL de subida",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Clear the input
    event.target.value = '';
  };

  return (
    <div className="space-y-2">
      <Input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleFileChange}
        className="hidden"
        data-testid="input-file-hidden"
      />
      
      <Button 
        type="button"
        onClick={handleFileSelect} 
        className={buttonClassName}
        disabled={isUploading}
        data-testid="button-upload-trigger"
      >
        {children}
      </Button>

      {isUploading && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Subiendo... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}
    </div>
  );
}