import { revokeOtherSessionsAction, revokeSessionAction } from "../../actions";
import { DeleteButton, Notice } from "@/components/admin/ActionForm";
import { Card } from "@/components/admin/fields";
import { LocalTime } from "@/components/admin/LocalTime";
import { listActiveSessions, requireAdmin } from "@/lib/auth";

/** Rough "Chrome on Windows" label from a user-agent string. */
function describe(ua: string | null) {
  if (!ua) return "Unknown browser";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

export default async function SecurityPage({ searchParams }: PageProps<"/admin/security">) {
  const me = await requireAdmin();
  const { revoked } = await searchParams;
  const sessions = await listActiveSessions();
  const others = sessions.filter((s) => s.id !== me.sid).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Security</h1>
      {revoked && <Notice>All other sessions were signed out.</Notice>}

      <Card title={`Signed-in sessions (${sessions.length})`}>
        <p className="mb-4 text-sm text-muted">
          Each login creates a session that lasts 12 hours. Logging out or revoking a session ends it on the server, so a copied cookie stops working too.
          If you don&apos;t recognise a session, revoke it and change <code className="text-text">ADMIN_PASSWORD</code>.
        </p>
        <ul className="divide-y divide-line text-sm">
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {describe(s.userAgent)}
                  {s.id === me.sid && <span className="ml-2 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-xs font-bold text-emerald-300">This device</span>}
                </p>
                <p className="text-xs text-muted">
                  IP {s.ip ?? "unknown"} · signed in <LocalTime date={s.createdAt} /> · last active <LocalTime date={s.lastSeenAt} />
                </p>
              </div>
              <DeleteButton
                action={revokeSessionAction}
                id={s.id}
                label={s.id === me.sid ? "Log out" : "Revoke"}
                confirmText={s.id === me.sid ? null : "Sign this session out?"}
                tone="neutral"
              />
            </li>
          ))}
        </ul>
        {others > 0 && (
          <div className="mt-4 border-t border-line pt-4">
            <DeleteButton
              action={revokeOtherSessionsAction}
              id=""
              label={`Sign out ${others} other session${others === 1 ? "" : "s"}`}
              confirmText="Sign out every session except this one?"
            />
          </div>
        )}
      </Card>

      <Card title="Password">
        <p className="text-sm text-muted">
          The admin password is the <code className="text-text">ADMIN_PASSWORD</code> setting on the server. To change it, update it there and restart the
          site, then use “Sign out other sessions” above. In production, login stays disabled while the password is shorter than 12 characters or looks like a
          placeholder.
        </p>
      </Card>
    </div>
  );
}
