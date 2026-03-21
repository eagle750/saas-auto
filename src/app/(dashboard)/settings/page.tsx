"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  Shield,
  Trash2,
  Loader2,
  Key,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: session?.user?.name ?? "" },
  });

  const onSaveProfile = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      await update({ name: data.name });
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "delete my account") return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/user/profile", { method: "DELETE" });
      if (!res.ok) throw new Error();
      await signOut({ callbackUrl: "/" });
    } catch {
      toast.error("Failed to delete account. Please contact support.");
      setIsDeleting(false);
    }
  };

  const handleCopyApiKey = async () => {
    const demoKey = "sk-demo-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    await navigator.clipboard.writeText(demoKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
    toast.success("API key copied to clipboard");
  };

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#F8FAFC]">Settings</h1>
        <p className="text-slate-400 mt-1">
          Manage your account profile and preferences.
        </p>
      </div>

      {/* Profile Section */}
      <Card className="bg-white/[0.03] border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
            <User className="h-5 w-5 text-[#3B82F6]" />
            Profile
          </CardTitle>
          <CardDescription className="text-slate-400">
            Update your public display name and view account details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={session?.user?.image ?? undefined} />
                <AvatarFallback className="bg-[#3B82F6]/20 text-[#3B82F6] text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-[#F8FAFC]">
                  {session?.user?.name ?? "User"}
                </p>
                <p className="text-xs text-slate-500">
                  Avatar synced from OAuth provider
                </p>
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 block">
                Display Name
              </label>
              <Input
                {...register("name")}
                className="bg-white/5 border-white/10 text-[#F8FAFC] placeholder:text-slate-600 focus:border-[#3B82F6]"
                placeholder="Your full name"
              />
              {errors.name && (
                <p className="text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 block">
                Email Address
              </label>
              <Input
                value={session?.user?.email ?? ""}
                disabled
                className="bg-white/[0.02] border-white/10 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-600">
                Email is managed by your OAuth provider and cannot be changed
                here.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSaving || !isDirty}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card className="bg-white/[0.03] border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
            <Shield className="h-5 w-5 text-emerald-400" />
            Security
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your account security settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-white/[0.02] border border-white/10 p-4">
            <p className="text-sm font-medium text-[#F8FAFC] mb-1">
              Authentication Method
            </p>
            <p className="text-sm text-slate-400">
              Your account uses{" "}
              <span className="text-[#F8FAFC] font-medium">
                OAuth (GitHub / Google)
              </span>
              . Passwords are managed by your OAuth provider.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Two-factor authentication and password management coming soon.
          </p>
        </CardContent>
      </Card>

      {/* API Keys Section */}
      <Card className="bg-white/[0.03] border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
            <Key className="h-5 w-5 text-amber-400" />
            API Keys
          </CardTitle>
          <CardDescription className="text-slate-400">
            Use API keys to programmatically trigger project generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-white/[0.02] border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-[#F8FAFC]">
                  Personal API Key
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generated on account creation
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-[#F8FAFC] h-7 w-7"
                  onClick={() => setApiKeyVisible((v) => !v)}
                >
                  {apiKeyVisible ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-[#F8FAFC] h-7 w-7"
                  onClick={handleCopyApiKey}
                >
                  {apiKeyCopied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <code className="block text-xs font-mono text-slate-400 bg-black/20 rounded px-3 py-2 border border-white/10">
              {apiKeyVisible
                ? "sk-demo-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                : "sk-demo-••••••••••••••••••••••••••••••••"}
            </code>
          </div>
          <p className="text-xs text-slate-600">
            API key management and rotation will be available in a future
            release.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-white/[0.03] border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-slate-400">
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-red-500/20 bg-red-500/[0.04] p-4">
            <p className="text-sm font-medium text-[#F8FAFC] mb-1">
              Delete Account
            </p>
            <p className="text-sm text-slate-400 mb-4">
              Permanently delete your account, all projects, and associated
              data. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="bg-red-600/80 hover:bg-red-600 border-red-500/30"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete My Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#111827] border-white/10 text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This will permanently delete your account and all associated
              projects, generation history, and data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-300">
              Type{" "}
              <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-red-300">
                delete my account
              </code>{" "}
              to confirm:
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="delete my account"
              className="bg-white/5 border-white/10 text-[#F8FAFC] placeholder:text-slate-600"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirm("");
              }}
              className="text-slate-400 hover:text-[#F8FAFC]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={
                deleteConfirm !== "delete my account" || isDeleting
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting…
                </>
              ) : (
                "Permanently Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
