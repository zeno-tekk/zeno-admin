"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KeyRound, User, Shield, CheckCircle2, ShieldCheck, Pencil, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function decodeToken(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const [user, setUser] = useState<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    twostepv?: boolean;
  } | null>(null);

  // Change account password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Admin site password
  const [adminCurrentPw, setAdminCurrentPw] = useState("");
  const [adminSitePw, setAdminSitePw] = useState("");
  const [adminSitePwConfirm, setAdminSitePwConfirm] = useState("");
  const [settingAdminPw, setSettingAdminPw] = useState(false);
  const [showNotifyConfirm, setShowNotifyConfirm] = useState(false);
  const [notifyAgreed, setNotifyAgreed] = useState(false);

  // Profile edit
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Invite member
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  // 2FA toggle
  const [togglingTwoFa, setTogglingTwoFa] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setUser(decoded);
        setProfileFirstName(decoded.firstName ?? "");
        setProfileLastName(decoded.lastName ?? "");
        setProfileEmail(decoded.email ?? "");
      }
    }
  }, []);

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "A";

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setChangingPw(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/change-password/${user?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password changed successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setChangingPw(false);
    }
  };

  const handleSetAdminSitePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminSitePw !== adminSitePwConfirm) { toast.error("Passwords do not match"); return; }
    if (adminSitePw.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    setNotifyAgreed(false);
    setShowNotifyConfirm(true);
  };

  const doSetAdminPassword = async () => {
    setSettingAdminPw(true);
    setShowNotifyConfirm(false);
    try {
      const token = localStorage.getItem("token");
      const statusRes = await fetch(`${API_URL}/auth/admin-password/status`);
      const statusData = await statusRes.json();
      const isFirstTime = !statusData.configured;

      const res = await fetch(`${API_URL}/auth/admin-password/set`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword: adminCurrentPw, password: adminSitePw, isFirstTime }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Admin site password updated — all users have been notified");
        setAdminCurrentPw("");
        setAdminSitePw("");
        setAdminSitePwConfirm("");
      } else {
        toast.error(data.message || "Failed to update admin site password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSettingAdminPw(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileFirstName.trim() || !profileLastName.trim() || !profileEmail.trim()) {
      toast.error("All fields are required");
      return;
    }
    setSavingProfile(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/update/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          firstName: profileFirstName,
          lastName: profileLastName,
          email: profileEmail,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        setUser((prev) => prev ? { ...prev, firstName: profileFirstName, lastName: profileLastName, email: profileEmail } : prev);
        setEditingProfile(false);
        toast.success("Profile updated successfully");
        router.refresh();
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSendingInvite(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
      } else {
        toast.error(data.message || "Failed to send invitation");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleToggleTwoFa = async () => {
    if (!user) return;
    setTogglingTwoFa(true);
    try {
      const token = localStorage.getItem("token");
      const next = !user.twostepv;
      const res = await fetch(`${API_URL}/auth/${user.id}/twostepv`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ twostepv: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev) => prev ? { ...prev, twostepv: next } : prev);
        toast.success(next ? "Two-factor authentication enabled" : "Two-factor authentication disabled");
      } else {
        toast.error(data.message || "Failed to update 2FA");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setTogglingTwoFa(false);
    }
  };

  return (
    <>
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Info */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Profile</h2>
          </div>
          {!editingProfile && (
            <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
              <Pencil className="w-3.5 h-3.5 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {editingProfile ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={profileFirstName}
                  onChange={(e) => setProfileFirstName(e.target.value)}
                  placeholder="First name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={profileLastName}
                  onChange={(e) => setProfileLastName(e.target.value)}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="Email address"
                required
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving..." : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Save Changes</>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingProfile(false);
                  setProfileFirstName(user?.firstName ?? "");
                  setProfileLastName(user?.lastName ?? "");
                  setProfileEmail(user?.email ?? "");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              {user?.profilePicture && (
                <AvatarImage src={user.profilePicture} alt={user.firstName} />
              )}
              <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">
                {user ? `${user.firstName} ${user.lastName}` : "—"}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Invite Member */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-2">
          <UserPlus className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Invite Member</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Send an invitation email with a registration link. The recipient will be prompted for the
          admin site password share it with them separately.
        </p>
        <form onSubmit={handleInviteMember} className="flex gap-3">
          <Input
            type="email"
            placeholder="colleague@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={sendingInvite}>
            {sendingInvite ? "Sending..." : "Send Invite"}
          </Button>
        </form>
      </Card>

      {/* Change Account Password */}
      <Card className="p-6" id="password">
        <div className="flex items-center gap-4 mb-6">
          <KeyRound className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Password</label>
            <Input
              type="password"
              placeholder="Enter current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <Input
              type="password"
              placeholder="Enter new password (min. 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={changingPw} className="mt-2">
            {changingPw ? "Updating..." : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Update Password
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Admin Site Password */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Admin Site Password</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          This password gates access to the login and registration pages. Enter the current password
          (or the default one if none has been set yet) before updating.
        </p>
        <form onSubmit={handleSetAdminSitePassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Admin Site Password</label>
            <Input
              type="password"
              placeholder="Enter current admin site password"
              value={adminCurrentPw}
              onChange={(e) => setAdminCurrentPw(e.target.value)}
              required
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <label className="text-sm font-medium">New Admin Site Password</label>
            <Input
              type="password"
              placeholder="Enter new admin site password (min. 6 characters)"
              value={adminSitePw}
              onChange={(e) => setAdminSitePw(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <Input
              type="password"
              placeholder="Confirm new admin site password"
              value={adminSitePwConfirm}
              onChange={(e) => setAdminSitePwConfirm(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={settingAdminPw} className="mt-2">
            {settingAdminPw ? "Saving..." : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Set Admin Site Password
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                When enabled, a one-time code is sent to your email each time you log in.
              </p>
            </div>
          </div>
          <Button
            variant={user?.twostepv ? "destructive" : "default"}
            disabled={togglingTwoFa || !user}
            onClick={handleToggleTwoFa}
            className="ml-6 shrink-0"
          >
            {togglingTwoFa
              ? "Saving..."
              : user?.twostepv
              ? "Disable 2FA"
              : "Enable 2FA"}
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${user?.twostepv ? "bg-emerald-500" : "bg-muted-foreground"}`}
          />
          <span className="text-sm text-muted-foreground">
            Currently{" "}
            <span className={user?.twostepv ? "text-emerald-500 font-medium" : "font-medium"}>
              {user?.twostepv ? "enabled" : "disabled"}
            </span>
          </span>
        </div>
      </Card>
    </div>

    {/* Notify-users confirmation modal */}
    {showNotifyConfirm && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5">
          <h2 className="text-lg font-semibold">Confirm password change</h2>
          <p className="text-sm text-muted-foreground">
            Changing the admin site password will send an email notification to{" "}
            <strong className="text-foreground">all registered users</strong> informing them that
            the access password has been updated.
          </p>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={notifyAgreed}
              onChange={(e) => setNotifyAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary shrink-0"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              I understand that all users will be notified about this change.
            </span>
          </label>
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowNotifyConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!notifyAgreed || settingAdminPw}
              onClick={doSetAdminPassword}
            >
              {settingAdminPw ? "Updating..." : "Confirm & Update"}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
