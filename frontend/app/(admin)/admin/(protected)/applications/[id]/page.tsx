"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { ArrowLeft, Instagram, Phone, MessageCircle, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusControl } from "@/components/admin/ApplicationStatusControl";
import { MediaSection } from "@/components/admin/ApplicationFileViewer";
import { VideoLinkEmbed } from "@/components/admin/VideoLinkEmbed";
import { ApplicationNotes } from "@/components/admin/ApplicationNotes";
import { DeleteApplicationDialog } from "@/components/admin/DeleteApplicationDialog";
import { EditPhoneDialog } from "@/components/admin/EditPhoneDialog";
import { formatPhone, buildWhatsAppUrl } from "@/lib/utils";
import { ageFromDateOfBirth } from "@/lib/admin/age";
import { getApplication, getApplicationFileUrl } from "@/lib/api/admin/applications";
import { listAuditLogForApplication } from "@/lib/api/admin/auditLog";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("admin.applicationDetail");
  const tEnums = useTranslations("admin.enums");
  const tc = useTranslations("admin.common");

  const { data: app, isLoading, isError } = useQuery({
    queryKey: ["admin-application", id],
    queryFn: () => getApplication(id),
  });

  const firstPhoto = app?.files.find((f) => f.kind === "photo" && f.scan_status === "clean");
  const { data: photoUrl } = useQuery({
    queryKey: ["admin-application-file-url", id, firstPhoto?.id],
    queryFn: () => getApplicationFileUrl(id, firstPhoto!.id),
    enabled: !!firstPhoto,
    staleTime: 10 * 60 * 1000,
  });

  const { data: auditLog } = useQuery({
    queryKey: ["admin-application-audit-log", id],
    queryFn: () => listAuditLogForApplication(id),
  });

  if (isLoading) {
    return <p className="text-sm text-muted">{tc("loading")}</p>;
  }
  if (isError || !app) {
    return <p className="text-sm text-red-600">{t("loadError")}</p>;
  }

  const age = ageFromDateOfBirth(app.date_of_birth);
  const whatsappUrl = buildWhatsAppUrl(app.phone);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/applications"
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("back")}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <ApplicationStatusControl applicationId={app.id} status={app.status} />
          <EditPhoneDialog applicationId={app.id} currentPhone={app.phone} />
          <DeleteApplicationDialog applicationId={app.id} applicationName={app.full_name} />
        </div>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-brand-dark/10 bg-white p-4 sm:flex-row sm:items-center sm:p-6">
        {photoUrl ? (
          <a href={photoUrl.url} target="_blank" rel="noopener" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed URL, not an optimizable local asset */}
            <img
              src={photoUrl.url}
              alt={app.full_name}
              className="h-24 w-24 rounded-full border border-brand-dark/10 object-cover sm:h-28 sm:w-28"
            />
          </a>
        ) : (
          <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-surface text-muted sm:h-28 sm:w-28">
            <User className="h-9 w-9" aria-hidden="true" />
          </span>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{app.full_name}</h1>
            <Badge>{tEnums(`role.${app.role}`)}</Badge>
            {app.is_duplicate && <Badge variant="amber">{t("fields.duplicate")}</Badge>}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a
              href={`tel:${app.phone}`}
              className="flex items-center gap-1.5 font-medium text-foreground hover:underline"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {formatPhone(app.phone)}
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 rounded-full bg-brand-green px-3 py-1 font-semibold text-brand-dark"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t("whatsappAction")}
            </a>
            {app.instagram_handle && (
              <a
                href={`https://instagram.com/${app.instagram_handle}`}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-1.5 text-muted hover:text-foreground hover:underline"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />@{app.instagram_handle}
              </a>
            )}
          </div>
        </div>
      </section>

      <Section title={t("sections.personal")}>
        <Field label={t("fields.dateOfBirth")}>
          {format(new Date(app.date_of_birth), "dd.MM.yyyy")}
        </Field>
        <Field label={t("fields.age")}>{age}</Field>
        <Field label={t("fields.district")}>{tEnums(`district.${app.district}`)}</Field>
        <Field label={t("fields.createdAt")}>
          {format(new Date(app.created_at), "dd.MM.yyyy HH:mm")}
        </Field>
        <Field label={t("fields.updatedAt")}>
          {format(new Date(app.updated_at), "dd.MM.yyyy HH:mm")}
        </Field>
        {app.role === "player" && app.player_details && (
          <>
            <Field label={t("fields.isUniversityStudent")}>
              {app.player_details.is_university_student ? tc("yes") : tc("no")}
            </Field>
            {app.player_details.is_university_student && (
              <>
                <Field label={t("fields.universityName")}>
                  {app.player_details.university_name || tc("noValue")}
                </Field>
                <Field label={t("fields.courseYear")}>
                  {app.player_details.course_year ?? tc("noValue")}
                </Field>
              </>
            )}
          </>
        )}
      </Section>

      <Section title={t("sections.roleDetails")}>
        {app.role === "player" && app.player_details && (
          <>
            <Field label={t("fields.mainPosition")}>
              {tEnums(`mainPosition.${app.player_details.main_position}`)}
            </Field>
            {app.player_details.extra_positions.length > 0 && (
              <Field label={t("fields.extraPositions")}>
                {app.player_details.extra_positions
                  .map((p) => tEnums(`mainPosition.${p}`))
                  .join(", ")}
              </Field>
            )}
            <Field label={t("fields.preferredFoot")}>
              {tEnums(`preferredFoot.${app.player_details.preferred_foot}`)}
            </Field>
            <Field label={t("fields.yearsPlaying")}>
              {tEnums(`duration.${app.player_details.years_playing}`)}
            </Field>
            <Field label={t("fields.experienceLevel")}>
              {tEnums(`experienceLevel.${app.player_details.experience_level}`)}
            </Field>
            <Field label={t("fields.hourlyRate")}>{app.player_details.hourly_rate_azn} AZN</Field>
            <Field label={t("fields.hasProExperience")}>
              {app.player_details.has_pro_experience ? tc("yes") : tc("no")}
            </Field>
            {app.player_details.club_experience_text && (
              <Field label={t("fields.clubExperience")}>
                {app.player_details.club_experience_text}
              </Field>
            )}
          </>
        )}
        {app.role === "referee" && app.referee_details && (
          <>
            <Field label={t("fields.hasOfficialCertification")}>
              {app.referee_details.has_official_certification ? tc("yes") : tc("no")}
            </Field>
            {app.referee_details.has_official_certification && (
              <Field label={t("fields.certificationName")}>
                {app.referee_details.certification_name || tc("noValue")}
              </Field>
            )}
            {app.referee_details.certification_link && (
              <Field label={t("fields.certificationLink")}>
                <a
                  href={app.referee_details.certification_link}
                  target="_blank"
                  rel="noopener"
                  className="text-brand-dark underline-offset-2 hover:underline"
                >
                  {app.referee_details.certification_link}
                </a>
              </Field>
            )}
            <Field label={t("fields.yearsRefereeing")}>
              {tEnums(`duration.${app.referee_details.years_refereeing}`)}
            </Field>
            <Field label={t("fields.gameTypes")}>
              {app.referee_details.game_types.map((g) => tEnums(`gameType.${g}`)).join(", ")}
            </Field>
            {app.referee_details.experience_text && (
              <Field label={t("fields.refereeExperience")}>
                {app.referee_details.experience_text}
              </Field>
            )}
          </>
        )}
        {app.role === "medic" && app.medic_details && (
          <>
            <Field label={t("fields.specialty")}>
              {app.medic_details.specialty.map((s) => tEnums(`specialty.${s}`)).join(", ")}
            </Field>
            <Field label={t("fields.equipmentStatus")}>
              {tEnums(`equipmentStatus.${app.medic_details.equipment_status}`)}
            </Field>
            {app.medic_details.equipment_status === "partial" && (
              <Field label={t("fields.equipmentMissingText")}>
                {app.medic_details.equipment_missing_text || tc("noValue")}
              </Field>
            )}
            <Field label={t("fields.workExperience")}>
              {tEnums(`duration.${app.medic_details.work_experience}`)}
            </Field>
            {app.medic_details.workplace && (
              <Field label={t("fields.workplace")}>{app.medic_details.workplace}</Field>
            )}
          </>
        )}
      </Section>

      {app.role === "player" &&
        app.player_details?.has_pro_experience && (
          <Section title={t("sections.professionalPeriods")} columns={1}>
            {app.player_details.professional_periods.length === 0 ? (
              <p className="text-sm text-muted">{t("fields.noPeriods")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {app.player_details.professional_periods.map((period, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-brand-dark/10 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {period.start_year}-{period.end_year}
                    </span>
                    {period.club && <span className="text-muted">{period.club}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

      {app.availability && (
        <Section title={t("sections.availability")}>
          <Field label={t("fields.timeSlots")}>
            {app.availability.time_slots
              .map((slot) => {
                const [day, hour] = slot.split(":");
                return `${tEnums(`weekday.${day}`)} ${tEnums(`hourSlot.${hour}`)}`;
              })
              .join(", ")}
          </Field>
          <Field label={t("fields.districts")}>
            {app.availability.districts.map((d) => tEnums(`district.${d}`)).join(", ")}
          </Field>
        </Section>
      )}

      <section className="flex flex-col gap-4 rounded-xl border border-brand-dark/10 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">{t("sections.files")}</h2>
        <Separator />
        <MediaSection applicationId={app.id} files={app.files} />
        {app.video_link_url && (
          <div className="flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-2">
              {t("fields.videoLink")}
            </h3>
            <VideoLinkEmbed url={app.video_link_url} />
          </div>
        )}
      </section>

      <Section title={t("sections.consents")}>
        <div className="flex flex-col gap-2">
          {app.consents.map((consent) => (
            <div key={consent.type} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{tEnums(`consentType.${consent.type}`)}</span>
              <span className="flex items-center gap-2 text-muted">
                <Badge variant={consent.accepted ? "green" : "red"}>
                  {consent.accepted ? t("consents.accepted") : t("consents.declined")}
                </Badge>
                {format(new Date(consent.accepted_at), "dd.MM.yyyy HH:mm")}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("sections.statusHistory")}>
        {(() => {
          const statusEvents = app.status_history.map((change) => ({
            timestamp: change.changed_at,
            node: (
              <>
                <p className="font-medium text-foreground">
                  {t("statusHistory.entry", {
                    from: tEnums(`status.${change.from_status}`),
                    to: tEnums(`status.${change.to_status}`),
                  })}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t("statusHistory.by", {
                    email: change.changed_by_email ?? t("statusHistory.systemActor"),
                  })}{" "}
                  · {format(new Date(change.changed_at), "dd.MM.yyyy HH:mm")}
                </p>
                {change.reason && (
                  <p className="mt-1 text-xs text-muted">
                    {t("statusHistory.reason")}: {change.reason}
                  </p>
                )}
              </>
            ),
          }));
          // Every other audit event type for this application (phone
          // edits, etc.) — "viewed" is excluded as pure noise, and
          // "status_changed" is excluded since status_history above
          // already covers it, so the timeline never shows a status
          // change twice.
          const auditEvents = (auditLog?.results ?? [])
            .filter(
              (entry) =>
                entry.action !== "admin.application.viewed" &&
                entry.action !== "admin.application.status_changed",
            )
            .map((entry) => ({
              timestamp: entry.created_at,
              node: (
                <>
                  <p className="font-medium text-foreground">
                    {entry.action === "admin.application.phone_updated"
                      ? t("statusHistory.phoneUpdated", {
                          from: String(entry.metadata.from ?? ""),
                          to: String(entry.metadata.to ?? ""),
                        })
                      : entry.action}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {t("statusHistory.by", {
                      email: entry.actor_email ?? t("statusHistory.systemActor"),
                    })}{" "}
                    · {format(new Date(entry.created_at), "dd.MM.yyyy HH:mm")}
                  </p>
                </>
              ),
            }));
          const timeline = [...statusEvents, ...auditEvents].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );

          if (timeline.length === 0) {
            return <p className="text-sm text-muted">{t("statusHistory.empty")}</p>;
          }
          return (
            <ul className="flex flex-col gap-2">
              {timeline.map((event, idx) => (
                <li key={idx} className="rounded-lg border border-brand-dark/10 p-3 text-sm">
                  {event.node}
                </li>
              ))}
            </ul>
          );
        })()}
      </Section>

      <Section title={t("sections.notes")}>
        <ApplicationNotes applicationId={app.id} notes={app.notes} />
      </Section>
    </div>
  );
}

function Section({
  title,
  columns = 2,
  children,
}: {
  title: string;
  columns?: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-brand-dark/10 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <Separator />
      <div className={columns === 1 ? "flex flex-col gap-3" : "grid grid-cols-1 gap-3 sm:grid-cols-2"}>
        {children}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase tracking-wide text-muted-2">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}
