import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  currentUrl: string | null;
  bucket: string;
  path: string;
  label: string;
  hint: string;
  accept: string;
  maxSizeMB: number;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
  previewClassName?: string;
}

export function FileUpload({
  currentUrl,
  bucket,
  path,
  label,
  hint,
  accept,
  maxSizeMB,
  onUploaded,
  onRemoved,
  previewClassName = "h-16 max-w-[200px]",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${path}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Add cache-buster to force refresh
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      onUploaded(publicUrl);
      toast.success("Arquivo enviado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar arquivo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    // Just clear the URL, don't worry about deleting from storage
    onRemoved();
    toast.success("Imagem removida");
  };

  return (
    <div className="space-y-3">
      {currentUrl ? (
        <div className="flex items-center gap-4">
          <div className="border rounded-lg p-2 bg-muted/30">
            <img
              src={currentUrl}
              alt={label}
              className={`${previewClassName} object-contain`}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
              Trocar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleRemove}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />Remover
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" />
          ) : (
            <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
