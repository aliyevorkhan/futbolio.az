/**
 * Mirrors backend/applications/views.py's EXPORT_COLUMN_REGISTRY exactly
 * (key + Azerbaijani label) — grouped into sections purely for this
 * picker's own readability, the backend has no concept of groups.
 */
export interface ExportColumnGroup {
  title: string;
  columns: { key: string; label: string }[];
}

export const EXPORT_COLUMN_GROUPS: ExportColumnGroup[] = [
  {
    title: "Əsas məlumatlar",
    columns: [
      { key: "full_name", label: "Ad soyad" },
      { key: "role", label: "Rol" },
      { key: "phone", label: "Telefon" },
      { key: "date_of_birth", label: "Doğum tarixi" },
      { key: "age", label: "Yaş" },
      { key: "district", label: "Rayon" },
      { key: "created_at", label: "Qeydiyyat tarixi" },
    ],
  },
  {
    title: "Futbolçu məlumatları",
    columns: [
      { key: "main_position", label: "Əsas mövqe" },
      { key: "extra_positions", label: "Oynaya bildiyi zonalar" },
      { key: "level_self", label: "Səviyyə (özü)" },
      { key: "level_admin", label: "Səviyyə (admin)" },
      { key: "price_per_game", label: "1 oyun üçün qiymət (AZN)" },
      { key: "is_student", label: "Tələbə" },
      { key: "university", label: "Universitet" },
      { key: "course_year", label: "Kurs" },
      { key: "professional_periods", label: "Peşəkar dövrlər" },
      { key: "about_text", label: "Özün haqqında" },
    ],
  },
  {
    title: "Sənəd və video",
    columns: [
      { key: "certificate_status", label: "Sertifikat/Diplom" },
      { key: "certificate_link", label: "Sertifikat/Diplom linki" },
      { key: "video_links", label: "Video linkləri" },
      { key: "photo_link", label: "Şəkil linki" },
    ],
  },
  {
    title: "Status və admin",
    columns: [
      { key: "status", label: "Status" },
      { key: "admin_rating", label: "Admin reytinqi" },
      { key: "admin_note", label: "Admin qeydi" },
    ],
  },
];

export const ALL_EXPORT_COLUMN_KEYS = EXPORT_COLUMN_GROUPS.flatMap((g) =>
  g.columns.map((c) => c.key),
);
