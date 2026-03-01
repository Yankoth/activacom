import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RefreshCw } from 'lucide-react';
import type { PhotoSource } from '@activacom/shared/types';
import { MAX_PHOTO_SIZE } from '@activacom/shared/constants';

interface PhotoCaptureProps {
  photoSource: PhotoSource;
  required: boolean;
  disabled: boolean;
  error: string | null;
  file: File | null;
  onPhotoChange: (file: File | null) => void;
  onError: (msg: string | null) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoCapture({
  photoSource,
  required,
  disabled,
  error,
  file,
  onPhotoChange,
  onError,
}: PhotoCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    onError(null);

    if (!selected) {
      onPhotoChange(null);
      return;
    }

    if (!selected.type.startsWith('image/')) {
      onError('El archivo debe ser una imagen');
      e.target.value = '';
      return;
    }

    if (selected.size > MAX_PHOTO_SIZE) {
      onError('La imagen no debe superar 5MB');
      e.target.value = '';
      return;
    }

    onPhotoChange(selected);
  };

  const handleClear = () => {
    onPhotoChange(null);
    onError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        Foto{' '}
        {required ? (
          <span className="ml-0.5 text-red-500">*</span>
        ) : (
          <span className="text-gray-400">(opcional)</span>
        )}
      </label>

      {file && previewUrl ? (
        <Preview
          src={previewUrl}
          fileName={file.name}
          fileSize={file.size}
          disabled={disabled}
          onClear={handleClear}
        />
      ) : photoSource === 'both' ? (
        <BothModeSelector
          disabled={disabled}
          cameraInputRef={cameraInputRef}
          galleryInputRef={galleryInputRef}
          onFileChange={handleFileChange}
        />
      ) : (
        <SingleModeSelector
          mode={photoSource}
          disabled={disabled}
          inputRef={photoSource === 'camera' ? cameraInputRef : galleryInputRef}
          onFileChange={handleFileChange}
        />
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Preview({
  src,
  fileName,
  fileSize,
  disabled,
  onClear,
}: {
  src: string;
  fileName: string;
  fileSize: number;
  disabled: boolean;
  onClear: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
      <img
        src={src}
        alt="Vista previa"
        className="h-48 w-full object-cover"
      />
      <div className="flex items-center justify-between px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-gray-700">{fileName}</p>
          <p className="text-xs text-gray-400">{formatFileSize(fileSize)}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="ml-2 flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Cambiar
        </button>
      </div>
    </div>
  );
}

function SingleModeSelector({
  mode,
  disabled,
  inputRef,
  onFileChange,
}: {
  mode: 'camera' | 'gallery';
  disabled: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const isCamera = mode === 'camera';

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={disabled}
      className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 transition-colors hover:border-blue-400 hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isCamera ? (
        <Camera className="h-8 w-8 text-gray-400" />
      ) : (
        <ImagePlus className="h-8 w-8 text-gray-400" />
      )}
      <span className="text-sm text-gray-500">
        {isCamera ? 'Toca para tomar una foto' : 'Toca para elegir una foto'}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={isCamera ? 'environment' : undefined}
        className="hidden"
        onChange={onFileChange}
        disabled={disabled}
      />
    </button>
  );
}

function BothModeSelector({
  disabled,
  cameraInputRef,
  galleryInputRef,
  onFileChange,
}: {
  disabled: boolean;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        disabled={disabled}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-5 transition-colors hover:border-blue-400 hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Camera className="h-7 w-7 text-gray-400" />
        <span className="text-sm text-gray-500">Tomar foto</span>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
          disabled={disabled}
        />
      </button>

      <button
        type="button"
        onClick={() => galleryInputRef.current?.click()}
        disabled={disabled}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-5 transition-colors hover:border-blue-400 hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ImagePlus className="h-7 w-7 text-gray-400" />
        <span className="text-sm text-gray-500">Galeria</span>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
          disabled={disabled}
        />
      </button>
    </div>
  );
}
