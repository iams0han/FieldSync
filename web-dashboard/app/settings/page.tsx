"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  ShieldCheck,
  User,
  FolderKanban,
  Bot,
  Mail,
  LockKeyhole,
  Check,
  Save,
  X,
  Settings as SettingsIcon,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [delayAlerts, setDelayAlerts] = useState(true);
  const [aiAlerts, setAiAlerts] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const Toggle = ({
    enabled,
    onClick,
  }: {
    enabled: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={enabled ? "Disable setting" : "Enable setting"}
      aria-pressed={enabled}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        enabled ? "bg-[#68364B]" : "bg-[#d7d2cf]"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  const SettingRow = ({
    icon: Icon,
    title,
    description,
    enabled,
    onClick,
  }: {
    icon: typeof Bell;
    title: string;
    description: string;
    enabled: boolean;
    onClick: () => void;
  }) => (
    <div className="flex items-center justify-between gap-3 border-b border-[#eee9e6] py-4 last:border-b-0 sm:gap-6 sm:py-5">
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7f1f3] text-[#68364B] sm:h-10 sm:w-10">
          <Icon size={17} strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-[#24302F] sm:text-sm">
            {title}
          </h3>

          <p className="mt-1 max-w-[620px] text-[11px] leading-4 text-[#71807D] sm:text-xs sm:leading-5">
            {description}
          </p>
        </div>
      </div>

      <Toggle enabled={enabled} onClick={onClick} />
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F4F2] px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1450px]">

        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:mb-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[9px] font-bold tracking-[1.2px] text-[#C47A44] sm:text-[10px] sm:tracking-[1.5px]">
              <SettingsIcon size={13} />
              SYSTEM CONFIGURATION
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#24302F] sm:text-3xl">
              Settings
            </h1>

            <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#71807D] sm:mt-2 sm:text-sm">
              Manage your FieldSync preferences and project settings
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ded8d4] bg-white px-4 py-2.5 text-sm font-semibold text-[#24302F] shadow-sm transition hover:border-[#68364B] hover:text-[#68364B] sm:w-fit"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </header>

        {/* Profile */}
        <section className="mb-5 rounded-2xl border border-[#e8e2de] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.04)] sm:mb-6 sm:p-6">
          <div className="mb-5 flex items-start gap-3 sm:mb-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7f1f3] text-[#68364B] sm:h-10 sm:w-10">
              <User size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#24302F]">
                Profile Information
              </h2>

              <p className="mt-1 text-xs text-[#71807D]">
                Manage your account information
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-[#eee9e6] bg-[#fcfbfa] p-4 sm:mb-7 sm:flex-row sm:items-center sm:p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#68364B] text-base font-bold text-white shadow-md sm:h-16 sm:w-16 sm:text-lg">
              PM
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-[#24302F]">
                Sohan Das
              </h3>

              <p className="mt-1 text-sm text-[#71807D]">
                Sohan Das
              </p>

              <span className="mt-1 block break-words text-xs text-[#9a9f9d]">
                FieldSync Infrastructure Management
              </span>
            </div>

            <button className="w-full rounded-xl border border-[#dcd5d1] bg-white px-4 py-2.5 text-xs font-semibold text-[#24302F] transition hover:border-[#68364B] hover:text-[#68364B] sm:w-fit">
              Edit Profile
            </button>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            <FormField
              label="Full Name"
              defaultValue="Sohan Das"
            />

            <FormField
              label="Email Address"
              defaultValue="manager@fieldsync.com"
              type="email"
            />

            <FormField
              label="Role"
              defaultValue="Sohan Das"
              disabled
            />

            <FormField
              label="Project"
              defaultValue="Oil India — EPC Infrastructure Project"
              disabled
            />
          </div>
        </section>

        {/* Notifications */}
        <section className="mb-5 rounded-2xl border border-[#e8e2de] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.04)] sm:mb-6 sm:p-6">
          <div className="mb-2 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7f1f3] text-[#68364B] sm:h-10 sm:w-10">
              <Bell size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#24302F]">
                Notifications
              </h2>

              <p className="mt-1 text-xs text-[#71807D]">
                Choose which alerts you want to receive
              </p>
            </div>
          </div>

          <div className="mt-2">
            <SettingRow
              icon={Bell}
              title="Push Notifications"
              description="Receive important project updates and alerts"
              enabled={notifications}
              onClick={() =>
                setNotifications(!notifications)
              }
            />

            <SettingRow
              icon={ShieldCheck}
              title="Delay Alerts"
              description="Get notified when activities fall behind schedule"
              enabled={delayAlerts}
              onClick={() =>
                setDelayAlerts(!delayAlerts)
              }
            />

            <SettingRow
              icon={Bot}
              title="AI Review Alerts"
              description="Receive notifications when AI review requires attention"
              enabled={aiAlerts}
              onClick={() =>
                setAiAlerts(!aiAlerts)
              }
            />

            <SettingRow
              icon={Mail}
              title="Email Updates"
              description="Receive periodic project reports through email"
              enabled={emailUpdates}
              onClick={() =>
                setEmailUpdates(!emailUpdates)
              }
            />
          </div>
        </section>

        {/* Project Preferences */}
        <section className="mb-5 rounded-2xl border border-[#e8e2de] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.04)] sm:mb-6 sm:p-6">
          <div className="mb-5 flex items-start gap-3 sm:mb-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7f1f3] text-[#68364B] sm:h-10 sm:w-10">
              <FolderKanban size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#24302F]">
                Project Preferences
              </h2>

              <p className="mt-1 text-xs text-[#71807D]">
                Configure project monitoring preferences
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            <SelectField
              label="Default Project"
              defaultValue="oil-india"
              options={[
                {
                  value: "oil-india",
                  label:
                    "Oil India — EPC Infrastructure Project",
                },
                {
                  value: "project-2",
                  label:
                    "Infrastructure Project — Phase 2",
                },
              ]}
            />

            <SelectField
              label="Progress Update Frequency"
              defaultValue="daily"
              options={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
              ]}
            />

            <SelectField
              label="Delay Threshold"
              defaultValue="5"
              options={[
                { value: "3", label: "3 Days" },
                { value: "5", label: "5 Days" },
                { value: "7", label: "7 Days" },
                { value: "10", label: "10 Days" },
              ]}
            />

            <SelectField
              label="Dashboard View"
              defaultValue="overview"
              options={[
                {
                  value: "overview",
                  label: "Project Overview",
                },
                {
                  value: "analytics",
                  label: "Analytics Focused",
                },
                {
                  value: "activities",
                  label: "Activity Focused",
                },
              ]}
            />
          </div>
        </section>

        {/* Security */}
        <section className="mb-5 rounded-2xl border border-[#e8e2de] bg-white p-4 shadow-[0_8px_30px_rgba(36,48,47,0.04)] sm:mb-6 sm:p-6">
          <div className="mb-2 flex items-start gap-3 sm:mb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7f1f3] text-[#68364B] sm:h-10 sm:w-10">
              <LockKeyhole size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#24302F]">
                Security
              </h2>

              <p className="mt-1 text-xs text-[#71807D]">
                Manage your account security
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#eee9e6]">
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-5">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#24302F]">
                  Password
                </h3>

                <p className="mt-1 text-xs text-[#71807D]">
                  Last changed 30 days ago
                </p>
              </div>

              <button className="w-full rounded-xl border border-[#dcd5d1] bg-white px-4 py-2.5 text-xs font-semibold text-[#24302F] transition hover:border-[#68364B] hover:text-[#68364B] sm:w-fit">
                Change Password
              </button>
            </div>

            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-5">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#24302F]">
                  Two-Factor Authentication
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#71807D]">
                  Add an additional layer of account security
                </p>
              </div>

              <div className="flex w-fit items-center gap-2 rounded-full bg-[#edf7f0] px-3 py-1.5 text-xs font-semibold text-[#2f7d4a]">
                <Check size={13} />
                Enabled
              </div>
            </div>
          </div>
        </section>

        {/* Save Bar */}
        <div className="sticky bottom-3 z-20 mb-6 flex flex-col gap-2 rounded-2xl border border-[#e3ddd9] bg-white/95 p-3 shadow-[0_12px_35px_rgba(36,48,47,0.12)] backdrop-blur sm:bottom-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:p-4">

          {saved && (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#edf7f0] px-3 py-2.5 text-xs font-semibold text-[#2f7d4a] sm:mr-auto sm:w-fit sm:px-4">
              <Check size={15} />
              Settings saved successfully
            </div>
          )}

          <button
            onClick={() => router.push("/dashboard")}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#dcd5d1] bg-white px-5 text-sm font-semibold text-[#4d5957] transition hover:bg-[#f8f5f3] sm:w-auto"
          >
            <X size={15} />
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#68364B] px-5 text-sm font-semibold text-white shadow-md shadow-[#68364B]/20 transition hover:bg-[#592d40] sm:w-auto"
          >
            <Save size={15} />
            Save Changes
          </button>
        </div>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-[#e5dfdb] py-5 text-center text-[10px] text-[#8a9390] sm:py-6 sm:text-[11px]">
          <span className="font-semibold text-[#68364B]">
            FieldSync
          </span>

          <span>•</span>

          <span>
            Infrastructure Progress Tracking Platform
          </span>

          <span>•</span>

          <span>v1.0</span>
        </footer>
      </div>
    </div>
  );
}

/* ---------- Reusable Components ---------- */

function FormField({
  label,
  defaultValue,
  type = "text",
  disabled = false,
}: {
  label: string;
  defaultValue: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-xs font-semibold text-[#4c5957]">
        {label}
      </label>

      <input
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
          disabled
            ? "cursor-not-allowed border-[#e5e0dc] bg-[#f7f5f3] text-[#8a9390]"
            : "border-[#ddd7d3] bg-white text-[#24302F] focus:border-[#68364B] focus:ring-2 focus:ring-[#68364B]/10"
        }`}
      />
    </div>
  );
}

function SelectField({
  label,
  defaultValue,
  options,
}: {
  label: string;
  defaultValue: string;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-xs font-semibold text-[#4c5957]">
        {label}
      </label>

      <select
        defaultValue={defaultValue}
        className="w-full min-w-0 rounded-xl border border-[#ddd7d3] bg-white px-3 py-3 text-xs text-[#24302F] outline-none focus:border-[#68364B] focus:ring-2 focus:ring-[#68364B]/10 sm:px-4 sm:text-sm"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}