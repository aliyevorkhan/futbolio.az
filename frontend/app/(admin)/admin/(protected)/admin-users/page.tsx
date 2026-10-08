"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useSession } from "@/lib/auth/useSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMIN_ROLES } from "@/lib/admin/enums";
import {
  listAdminUsers,
  createAdminUser,
  disableAdminUser,
  resetAdminUserPassword,
  type AdminUserCreatePayload,
} from "@/lib/api/admin/adminUsers";
import { format } from "date-fns";

const EMPTY_FORM: AdminUserCreatePayload = {
  email: "",
  full_name: "",
  role: "admin",
  can_view_sensitive_files: false,
};

export default function AdminUsersPage() {
  const t = useTranslations("admin.adminUsers");
  const tEnums = useTranslations("admin.enums");
  const tc = useTranslations("admin.common");
  const { data: me } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-admin-users"],
    queryFn: listAdminUsers,
    enabled: me?.role === "super_admin",
  });

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<AdminUserCreatePayload>(EMPTY_FORM);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-admin-users"] });

  const createMutation = useMutation({
    mutationFn: () => createAdminUser(form),
    onSuccess: () => {
      invalidate();
      toast.success(t("createSuccess"));
      setCreating(false);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error(t("createError")),
  });

  const disableMutation = useMutation({
    mutationFn: (id: string) => disableAdminUser(id),
    onSuccess: () => {
      invalidate();
      toast.success(t("disableSuccess"));
    },
    onError: () => toast.error(t("disableError")),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => resetAdminUserPassword(id),
    onSuccess: () => toast.success(t("resetPasswordSuccess")),
    onError: () => toast.error(t("resetPasswordError")),
  });

  if (me && me.role !== "super_admin") {
    return <p className="text-sm text-red-600">{t("forbidden")}</p>;
  }

  const users = data?.results ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>

        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button type="button" size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("addTitle")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addTitle")}</DialogTitle>
            </DialogHeader>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
            >
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                {t("email")}
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                {t("fullName")}
                <Input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                {t("role")}
                <Select
                  value={form.role}
                  onValueChange={(value) =>
                    setForm({ ...form, role: value as AdminUserCreatePayload["role"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {tEnums(`adminRole.${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Checkbox
                  checked={form.can_view_sensitive_files}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, can_view_sensitive_files: checked === true })
                  }
                />
                {t("canViewSensitiveFiles")}
              </label>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    {tc("cancel")}
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={createMutation.isPending}>
                  {t("create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-muted">{tc("loading")}</p>}
      {!isLoading && users.length === 0 && <p className="text-sm text-muted">{t("empty")}</p>}

      {users.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-brand-dark/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("fullName")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("lastLogin")}</TableHead>
                <TableHead>{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{tEnums(`adminRole.${user.role}`)}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "green" : "gray"}>
                      {user.is_active ? tc("active") : tc("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_login
                      ? format(new Date(user.last_login), "dd.MM.yyyy HH:mm")
                      : t("never")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <ConfirmActionButton
                        label={t("resetPassword")}
                        confirmTitle={t("resetPasswordConfirmTitle")}
                        onConfirm={() => resetMutation.mutate(user.id)}
                      />
                      {user.is_active && (
                        <ConfirmActionButton
                          label={t("disable")}
                          confirmTitle={t("disableConfirmTitle")}
                          destructive
                          onConfirm={() => disableMutation.mutate(user.id)}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ConfirmActionButton({
  label,
  confirmTitle,
  destructive,
  onConfirm,
}: {
  label: string;
  confirmTitle: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  const tc = useTranslations("admin.common");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={destructive ? "text-red-600 hover:bg-red-50" : undefined}
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{confirmTitle}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {tc("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {tc("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
