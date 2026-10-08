"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusControl } from "@/components/admin/ApplicationStatusControl";
import { ApplicationFileViewer } from "@/components/admin/ApplicationFileViewer";
import { ApplicationNotes } from "@/components/admin/ApplicationNotes";
import { DeleteApplicationDialog } from "@/components/admin/DeleteApplicationDialog";
import { formatPhone } from "@/lib/utils";
import { getApplication } from "@/lib/api/admin/applications";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("admin.applicationDetail");
  const tEnums = useTranslations("admin.enums");
  const tc = useTranslations("admin.common");

  const { data: app, isLoading, isError } = useQuery({
    queryKey: ["admin-application", id],
    queryFn: () => getApplication(id),
  });

  if (isLoading) {
    return <p className="text-sm text-muted">{tc("loading")}</p>;
  }
  if (isError || !app) {
    return <p className="text-sm text-red-600">{t("loadError")}</p>;
  }

  const headline =
    app.role === "player"
      ? app.player_details?.main_position
      : app.role === "referee"
        ? app.referee_details?.license_status
        : app.medic_details?.specialty;

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
          <DeleteApplicationDialog applicationId={app.id} applicationName={app.full_name} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold text-foreground">{app.full_name}</h1>
        {app.is_duplicate && <Badge variant="amber">{t("fields.duplicate")}</Badge>}
      </div>

      <Section title={t("sections.personal")}>
        <Field label={t("fields.role")}>{tEnums(`role.${app.role}`)}</Field>
        <Field label={t("fields.age")}>{app.age}</Field>
        <Field label={t("fields.phone")}>{formatPhone(app.phone)}</Field>
        {app.instagram_handle && (
          <Field label={t("fields.instagram")}>{app.instagram_handle}</Field>
        )}
        <Field label={t("fields.district")}>{tEnums(`district.${app.district}`)}</Field>
        <Field label={t("fields.createdAt")}>
          {format(new Date(app.created_at), "dd.MM.yyyy HH:mm")}
        </Field>
        <Field label={t("fields.updatedAt")}>
          {format(new Date(app.updated_at), "dd.MM.yyyy HH:mm")}
        </Field>
        {app.video_link_url && (
          <Field label={t("fields.videoLink")}>
            <a
              href={app.video_link_url}
              target="_blank"
              rel="noopener"
              className="text-brand-dark underline-offset-2 hover:underline"
            >
              {app.video_link_url}
            </a>
          </Field>
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
            {app.player_details.club_experience_text && (
              <Field label={t("fields.clubExperience")}>
                {app.player_details.club_experience_text}
              </Field>
            )}
            <Field label={t("fields.selfRating")}>{app.player_details.self_rating} / 5</Field>
          </>
        )}
        {app.role === "referee" && app.referee_details && (
          <>
            <Field label={t("fields.licenseStatus")}>
              {tEnums(`licenseStatus.${app.referee_details.license_status}`)}
            </Field>
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
              {tEnums(`specialty.${app.medic_details.specialty}`)}
            </Field>
            <Field label={t("fields.firstAidCert")}>
              {app.medic_details.first_aid_cert ? tc("yes") : tc("no")}
            </Field>
            <Field label={t("fields.workExperience")}>
              {tEnums(`duration.${app.medic_details.work_experience}`)}
            </Field>
            {app.medic_details.workplace && (
              <Field label={t("fields.workplace")}>{app.medic_details.workplace}</Field>
            )}
          </>
        )}
        {!headline && <p className="text-sm text-muted">—</p>}
      </Section>

      {app.availability && (
        <Section title={t("sections.availability")}>
          <Field label={t("fields.days")}>
            {app.availability.days.map((d) => tEnums(`weekday.${d}`)).join(", ")}
          </Field>
          <Field label={t("fields.hours")}>
            {app.availability.hours.map((h) => tEnums(`hourSlot.${h}`)).join(", ")}
          </Field>
          <Field label={t("fields.districts")}>
            {app.availability.districts.map((d) => tEnums(`district.${d}`)).join(", ")}
          </Field>
        </Section>
      )}

      <Section title={t("sections.files")}>
        {app.files.length === 0 ? (
          <p className="text-sm text-muted">{t("files.noFiles")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {app.files.map((file) => (
              <ApplicationFileViewer key={file.id} applicationId={app.id} file={file} />
            ))}
          </div>
        )}
      </Section>

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
        {app.status_history.length === 0 ? (
          <p className="text-sm text-muted">{t("statusHistory.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {[...app.status_history]
              .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
              .map((change, idx) => (
                <li key={idx} className="rounded-lg border border-brand-dark/10 p-3 text-sm">
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
                </li>
              ))}
          </ul>
        )}
      </Section>

      <Section title={t("sections.notes")}>
        <ApplicationNotes applicationId={app.id} notes={app.notes} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-brand-dark/10 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <Separator />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
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
