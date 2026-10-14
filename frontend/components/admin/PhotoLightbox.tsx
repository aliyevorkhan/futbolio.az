"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface LightboxPhoto {
  id: string;
  url: string;
  name: string;
}

export function PhotoLightbox({
  photos,
  openIndex,
  onClose,
  onNavigate,
}: {
  photos: LightboxPhoto[];
  openIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const open = openIndex !== null;
  const photo = openIndex !== null ? photos[openIndex] : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-w-4xl items-center justify-center border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{photo?.name}</DialogTitle>
        {photo && (
          <div className="relative flex w-full items-center justify-center">
            {photos.length > 1 && openIndex !== null && (
              <button
                type="button"
                onClick={() => onNavigate((openIndex - 1 + photos.length) % photos.length)}
                className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- signed URL, not an optimizable local asset */}
            <img
              src={photo.url}
              alt={photo.name}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
            {photos.length > 1 && openIndex !== null && (
              <button
                type="button"
                onClick={() => onNavigate((openIndex + 1) % photos.length)}
                className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg hover:bg-white"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
