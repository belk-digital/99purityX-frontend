"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Shield,
  Stethoscope,
  CheckCircle2,
  XCircle,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authApi, type AdminUser } from "@/lib/api/auth";
import { providersApi } from "@/lib/api/providers";
import { CreateProviderDialog } from "@/components/admin/CreateProviderDialog";

const AVAILABLE_ROLES = ["PATIENT", "DOCTOR", "NUTRITIONIST", "CARE_COORDINATOR", "ADMIN"];

const roleBadgeColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 border-red-200",
  DOCTOR: "bg-violet-100 text-violet-700 border-violet-200",
  NUTRITIONIST: "bg-teal-100 text-teal-700 border-teal-200",
  CARE_COORDINATOR: "bg-blue-100 text-blue-700 border-blue-200",
  PATIENT: "bg-slate-100 text-slate-600 border-slate-200",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function UserCard({
  user,
  providerIds,
  onChangeRole,
  onCreateProvider,
  changingRole,
}: {
  user: AdminUser;
  providerIds: Set<string>;
  onChangeRole: (userId: string, role: string) => void;
  onCreateProvider: (user: AdminUser) => void;
  changingRole: boolean;
}) {
  const isDoctor = user.role === "DOCTOR" || user.role === "NUTRITIONIST" || user.role === "CARE_COORDINATOR";
  const hasProviderProfile = providerIds.has(user.id);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
              {user.role === "ADMIN" ? (
                <Shield className="h-5 w-5 text-red-500" />
              ) : isDoctor ? (
                <Stethoscope className="h-5 w-5 text-violet-500" />
              ) : (
                <UserCircle className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
              <div className="mt-0.5 flex items-center gap-2 text-xs">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${roleBadgeColors[user.role ?? ""] ?? roleBadgeColors.PATIENT}`}>
                  {user.role ?? "—"}
                </span>
                {user.is_verified ? (
                  <span className="flex items-center gap-0.5 text-green-600">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-amber-600">
                    <XCircle className="h-3 w-3" /> Unverified
                  </span>
                )}
                <span className="text-slate-400">Joined {formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Role changer */}
            <select
              value={user.role ?? ""}
              onChange={(e) => onChangeRole(user.id, e.target.value)}
              disabled={changingRole}
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50"
            >
              {AVAILABLE_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {/* Create provider profile button */}
            {isDoctor && !hasProviderProfile && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCreateProvider(user)}
                className="text-violet-600 border-violet-200 hover:bg-violet-50"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                Add Profile
              </Button>
            )}
            {isDoctor && hasProviderProfile && (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
                Has profile
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}><CardContent className="p-4"><div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div>
          <Skeleton className="h-8 w-24" />
        </div></CardContent></Card>
      ))}
    </div>
  );
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [providerTarget, setProviderTarget] = useState<AdminUser | null>(null);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => authApi.getUsers({ limit: 200 }),
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: providersApi.getAll,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      authApi.changeUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role updated");
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err?.response?.data?.detail ?? "Failed to change role");
    },
  });

  const users = usersData?.users ?? [];
  const total = usersData?.total ?? 0;

  // Map provider user_ids - providers API doesn't return user_id in list, so we track by checking
  // We don't have user_id in ProviderListResponseSchema, so we can't match directly.
  // We'll just show the button for all doctors without checking.
  const providerUserIds = new Set<string>();

  const admins = users.filter((u) => u.role === "ADMIN");
  const doctors = users.filter((u) => u.role === "DOCTOR" || u.role === "NUTRITIONIST" || u.role === "CARE_COORDINATOR");
  const patients = users.filter((u) => u.role === "PATIENT");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          {usersLoading ? "Loading..." : `${total} users registered on the platform`}
        </p>
      </div>

      {/* Stats */}
      {!usersLoading && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-700">{total}</p>
            <p className="mt-0.5 text-xs text-slate-500">Total Users</p>
          </div>
          <div className="rounded-xl bg-violet-50 p-4">
            <p className="text-2xl font-bold text-violet-700">{doctors.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">Doctors / Providers</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-2xl font-bold text-blue-700">{patients.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">Patients</p>
          </div>
          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-2xl font-bold text-red-700">{admins.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">Admins</p>
          </div>
        </div>
      )}

      {/* User list */}
      {usersLoading ? (
        <ListSkeleton />
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Users className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              providerIds={providerUserIds}
              onChangeRole={(userId, role) => roleMutation.mutate({ userId, role })}
              onCreateProvider={setProviderTarget}
              changingRole={roleMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Create provider dialog */}
      {providerTarget && (
        <CreateProviderDialog
          open={!!providerTarget}
          onOpenChange={(open) => { if (!open) setProviderTarget(null); }}
          userId={providerTarget.id}
          userEmail={providerTarget.email}
        />
      )}
    </div>
  );
}
