import { useState, useEffect } from "react";
import { KeyRound, Loader2, UserPlus, Shield, Users, Mail, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditorUser {
  id: string;
  user_id: string;
  role: string;
  full_name: string | null;
  email?: string;
}

const AccountSecurity = () => {
  const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });
  const [changing, setChanging] = useState(false);
  const [editors, setEditors] = useState<EditorUser[]>([]);
  const [loadingEditors, setLoadingEditors] = useState(true);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "user" });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchEditors();
  }, []);

  const fetchEditors = async () => {
    setLoadingEditors(true);
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role");
      if (error) throw error;

      const userIds = roles?.map((r: any) => r.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const merged = (roles || []).map((r: any) => {
        const profile = profiles?.find((p: any) => p.id === r.user_id);
        return {
          id: r.id,
          user_id: r.user_id,
          role: r.role,
          full_name: profile?.full_name || "—",
        };
      });
      setEditors(merged);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingEditors(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (passwordForm.password !== passwordForm.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setChanging(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
    setChanging(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated successfully!");
      setPasswordForm({ password: "", confirm: "" });
    }
  };

  const handleInviteEditor = async () => {
    if (!inviteForm.email.trim()) {
      toast.error("Email is required");
      return;
    }
    setInviting(true);
    try {
      toast.info(
        `To add "${inviteForm.email}" as ${inviteForm.role}, the user must first register on the site. Then provide their email here and we'll assign the role.`
      );
      // In a real flow, you'd look up the user by email in profiles or use an edge function.
      // For now, we show an informative message.
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveRole = async (roleId: string, userName: string) => {
    if (!confirm(`Remove role for ${userName}?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) toast.error(error.message);
    else {
      toast.success("Role removed");
      fetchEditors();
    }
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Account & Security
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          Manage your team members, roles, and account security settings.
        </p>
      </div>

      {/* ─── Team Management ─── */}
      <section className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="p-8 sm:p-10 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
              <p className="text-sm text-muted-foreground">View and manage editors and admins.</p>
            </div>
          </div>
        </div>

        {/* Editors Table */}
        <div className="p-8 sm:p-10">
          {loadingEditors ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : editors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No team members found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left py-4 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="text-left py-4 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-right py-4 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {editors.map((editor) => (
                    <tr key={editor.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-2">
                        <span className="text-sm font-medium text-foreground">
                          {editor.full_name}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          {editor.user_id.slice(0, 8)}…
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            editor.role === "admin"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {editor.role === "admin" ? (
                            <Shield className="w-3 h-3 mr-1.5" />
                          ) : null}
                          {editor.role.charAt(0).toUpperCase() + editor.role.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button
                          onClick={() => handleRemoveRole(editor.id, editor.full_name || "User")}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          title="Remove role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invite Section */}
        <div className="p-8 sm:p-10 border-t border-border bg-muted/20 rounded-b-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-accent/50 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Add New Team Member</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <input
                type="text"
                value={inviteForm.name}
                onChange={(e) => setInviteForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="editor@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Role</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all appearance-none"
              >
                <option value="user">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleInviteEditor}
              disabled={inviting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {inviting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Add Member
            </button>
          </div>
        </div>
      </section>

      {/* ─── Password Change ─── */}
      <section className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="p-8 sm:p-10 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
              <p className="text-sm text-muted-foreground">
                Update your admin account password. Use a strong, unique password.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <input
                type="password"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handlePasswordChange}
              disabled={changing}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {changing && <Loader2 className="w-4 h-4 animate-spin" />}
              <KeyRound className="w-4 h-4" />
              Update Password
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AccountSecurity;
