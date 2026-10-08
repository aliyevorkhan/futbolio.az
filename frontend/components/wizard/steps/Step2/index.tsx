"use client";

import { useTranslations } from "next-intl";
import { StepHeader } from "@/components/wizard/StepHeader";
import type { Role } from "@/lib/validation/wizard/step1.schema";
import type {
  PlayerDetails as PlayerDetailsData,
  RefereeDetails as RefereeDetailsData,
  MedicDetails as MedicDetailsData,
} from "@/lib/validation/wizard/step2.schema";
import { PlayerDetails } from "./PlayerDetails";
import { RefereeDetails } from "./RefereeDetails";
import { MedicDetails } from "./MedicDetails";

interface Step2Props {
  role: Role;
  playerDefaults: Partial<PlayerDetailsData>;
  refereeDefaults: Partial<RefereeDetailsData>;
  medicDefaults: Partial<MedicDetailsData>;
  onValidPlayer: (data: PlayerDetailsData) => void;
  onValidReferee: (data: RefereeDetailsData) => void;
  onValidMedic: (data: MedicDetailsData) => void;
  onChangePlayer: (values: Partial<PlayerDetailsData>) => void;
  onChangeReferee: (values: Partial<RefereeDetailsData>) => void;
  onChangeMedic: (values: Partial<MedicDetailsData>) => void;
  onBack: () => void;
}

/** Dispatches Step 2 to the role-specific details form chosen in Step 1. */
export function Step2({
  role,
  playerDefaults,
  refereeDefaults,
  medicDefaults,
  onValidPlayer,
  onValidReferee,
  onValidMedic,
  onChangePlayer,
  onChangeReferee,
  onChangeMedic,
  onBack,
}: Step2Props) {
  const t = useTranslations(`wizard.step2.${role}`);

  return (
    <div>
      <StepHeader title={t("title")} onBack={onBack} />
      {role === "player" ? (
        <PlayerDetails defaultValues={playerDefaults} onValid={onValidPlayer} onChange={onChangePlayer} onBack={onBack} />
      ) : role === "referee" ? (
        <RefereeDetails defaultValues={refereeDefaults} onValid={onValidReferee} onChange={onChangeReferee} onBack={onBack} />
      ) : (
        <MedicDetails defaultValues={medicDefaults} onValid={onValidMedic} onChange={onChangeMedic} onBack={onBack} />
      )}
    </div>
  );
}
