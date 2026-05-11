import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type RoleName = "director" | "coordinator" | "teacher" | "student";

type InvitePayload = {
  action: "invite";
  email: string;
  name: string;
  role: RoleName;
  courseId?: string;
  subjectId?: string;
  accessToken?: string;
};

type UpdatePayload = {
  action: "update";
  userId: string;
  name?: string;
  email?: string;
  role?: RoleName;
  active?: boolean;
  courseId?: string | null;
  subjectId?: string | null;
  accessToken?: string;
};

type DeletePayload = {
  action: "delete";
  userId: string;
  accessToken?: string;
};

type Payload = InvitePayload | UpdatePayload | DeletePayload;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getAppUrl() {
  const raw =
    Deno.env.get("APP_URL") ??
    Deno.env.get("FRONTEND_URL") ??
    "http://localhost:5173";
  return raw.replace(/\/+$/, "");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toErrorMessage(value: unknown, fallback: string) {
  if (value instanceof Error && value.message) return value.message;
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const maybeMessage = (value as any).message ?? (value as any).error_description ?? (value as any).error;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    try {
      const raw = JSON.stringify(value);
      if (raw && raw !== "{}") return raw;
    } catch {
      // ignore
    }
  }
  return fallback;
}

async function requireCoordinatorOrDirector(admin: ReturnType<typeof createClient>, token: string) {
  let userId: string | null = null;
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (!userError && userData.user?.id) {
    userId = userData.user.id;
  } else {
    try {
      const [, payloadPart] = token.split(".");
      if (!payloadPart) throw new Error("Malformed token");
      const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
      const decoded = JSON.parse(atob(padded));
      userId = typeof decoded?.sub === "string" ? decoded.sub : null;
    } catch {
      userId = null;
    }
  }
  if (!userId) throw new Error("Token invalido o expirado.");

  const { data: profileData, error: profileError } = await admin
    .from("profiles")
    .select("active,role")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message || "No se pudo validar estado del usuario.");

  let rawRole: string | null = (profileData as any)?.role ?? null;
  const roleRes = await admin
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId)
    .maybeSingle();
  if (!roleRes.error && roleRes.data) {
    const fromUserRoles = Array.isArray((roleRes.data as any)?.roles)
      ? (roleRes.data as any)?.roles?.[0]?.name
      : (roleRes.data as any)?.roles?.name;
    rawRole = fromUserRoles ?? rawRole;
  }

  const active = (profileData as any)?.active;

  if ((rawRole !== "coordinator" && rawRole !== "director") || active === false) {
    throw new Error("No autorizado.");
  }
}

async function setUserRole(admin: ReturnType<typeof createClient>, userId: string, role: RoleName) {
  const roleRowRes = await admin
    .from("roles")
    .select("id")
    .eq("name", role)
    .maybeSingle();
  if (!roleRowRes.error && roleRowRes.data?.id) {
    await admin.from("user_roles").delete().eq("user_id", userId);
    const { error } = await admin.from("user_roles").insert({ user_id: userId, role_id: roleRowRes.data.id });
    if (error) throw new Error(error.message || "No se pudo asignar rol.");
  }

  await admin.from("profiles").update({ role }).eq("id", userId);
}

async function upsertTeacherAssignment(
  admin: ReturnType<typeof createClient>,
  userId: string,
  subjectId: string | null | undefined,
  courseId: string | null | undefined,
) {
  if (!subjectId || !courseId) return;
  const { data: current, error: currentError } = await admin
    .from("profesor_materia_curso")
    .select("id")
    .eq("profesor_id", userId)
    .limit(1)
    .maybeSingle();
  if (currentError) throw new Error(currentError.message || "No se pudo consultar asignacion docente.");

  if (current?.id) {
    const first = await admin
      .from("profesor_materia_curso")
      .update({ subject_id: subjectId, course_id: courseId } as any)
      .eq("id", current.id);
    if (!first.error) return;
    const second = await admin
      .from("profesor_materia_curso")
      .update({ materia_id: subjectId, curso_id: courseId } as any)
      .eq("id", current.id);
    if (second.error) throw new Error(second.error.message || first.error.message || "No se pudo actualizar asignacion docente.");
    return;
  }

  const first = await admin.from("profesor_materia_curso").insert({
    profesor_id: userId,
    subject_id: subjectId,
    course_id: courseId,
  } as any);
  if (!first.error) return;
  const second = await admin.from("profesor_materia_curso").insert({
    profesor_id: userId,
    materia_id: subjectId,
    curso_id: courseId,
  } as any);
  if (second.error) throw new Error(second.error.message || first.error.message || "No se pudo crear asignacion docente.");
}

async function deleteTeacherAssignments(admin: ReturnType<typeof createClient>, userId: string) {
  const { error } = await admin.from("profesor_materia_curso").delete().eq("profesor_id", userId);
  if (error) throw new Error(error.message || "No se pudieron eliminar las asignaciones docentes.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole =
      Deno.env.get("SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRole) {
      return json({ error: "Missing SUPABASE_URL or SERVICE_ROLE_KEY" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
    const body = (await req.json()) as Payload;
    const bodyToken = (body as any)?.accessToken;
    const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, "").trim();
    const token = (typeof bodyToken === "string" && bodyToken.trim()) ? bodyToken.trim() : tokenFromHeader;
    if (!token) return json({ error: "Missing auth token" }, 401);

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    await requireCoordinatorOrDirector(admin, token);

    const payload = body;

    if (payload.action === "invite") {
      if (!payload.email || !payload.name || !payload.role) {
        return json({ error: "email, name y role son obligatorios" }, 400);
      }

      let createdUser: { id: string; email?: string | null } | null = null;
      let fallbackUsed = false;

      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(payload.email, {
        redirectTo: `${getAppUrl()}/auth/set-password`,
      });
      if (!inviteError && inviteData.user) {
        createdUser = { id: inviteData.user.id, email: inviteData.user.email };
      } else {
        const inviteStatus = (inviteError as any)?.status;
        const inviteCode = (inviteError as any)?.code;
        const isTimeout = inviteStatus === 504 || inviteCode === "gateway_timeout";

        if (!isTimeout) {
          return json(
            {
              error: toErrorMessage(inviteError, "No se pudo invitar usuario"),
              details: inviteError ? { code: (inviteError as any).code, status: (inviteError as any).status } : null,
            },
            400,
          );
        }

        const tempPassword = crypto.randomUUID();
        const { data: createData, error: createError } = await admin.auth.admin.createUser({
          email: payload.email,
          email_confirm: true,
          password: tempPassword,
        });

        if (createError || !createData.user) {
          return json(
            {
              error: `Fallo la invitacion por timeout y tambien la creacion directa: ${toErrorMessage(createError, "No se pudo crear usuario")}`,
              details: createError ? { code: (createError as any).code, status: (createError as any).status } : null,
            },
            400,
          );
        }

        createdUser = { id: createData.user.id, email: createData.user.email };
        fallbackUsed = true;
      }

      const { error: profileError } = await admin.from("profiles").upsert({
        id: createdUser.id,
        name: payload.name,
        last_name: "",
        email: payload.email,
        role: payload.role,
        active: true,
        course_id: payload.role === "student" ? payload.courseId ?? null : null,
      });

      if (profileError) return json({ error: toErrorMessage(profileError, "No se pudo crear profile") }, 400);

      await setUserRole(admin, createdUser.id, payload.role);
      if (payload.role === "teacher") {
        await upsertTeacherAssignment(admin, createdUser.id, payload.subjectId, payload.courseId);
      }

      return json({
        success: true,
        warning: fallbackUsed ? "Usuario creado, pero no se pudo enviar el correo de invitacion (SMTP timeout)." : null,
        user: { id: createdUser.id, email: createdUser.email, name: payload.name, role: payload.role, active: true },
      });
    }

    if (payload.action === "update") {
      if (!payload.userId) return json({ error: "userId es obligatorio" }, 400);

      const profileUpdate: Record<string, unknown> = {};
      if (typeof payload.name === "string") profileUpdate.name = payload.name;
      if (typeof payload.email === "string") profileUpdate.email = payload.email;
      if (typeof payload.active === "boolean") profileUpdate.active = payload.active;
      if (payload.courseId !== undefined) profileUpdate.course_id = payload.courseId;

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileError } = await admin.from("profiles").update(profileUpdate).eq("id", payload.userId);
        if (profileError) return json({ error: toErrorMessage(profileError, "No se pudo actualizar perfil") }, 400);
      }

      if (payload.email) {
        const { error: authUpdateError } = await admin.auth.admin.updateUserById(payload.userId, { email: payload.email });
        if (authUpdateError) return json({ error: toErrorMessage(authUpdateError, "No se pudo actualizar email en auth") }, 400);
      }

      if (payload.role) {
        await setUserRole(admin, payload.userId, payload.role);
      }
      if (payload.role && payload.role !== "teacher") {
        await deleteTeacherAssignments(admin, payload.userId);
      } else if (payload.role === "teacher" || payload.subjectId !== undefined || payload.courseId !== undefined) {
        await upsertTeacherAssignment(admin, payload.userId, payload.subjectId ?? null, payload.courseId ?? null);
      }

      return json({ success: true });
    }

    if (payload.action === "delete") {
      if (!payload.userId) return json({ error: "userId es obligatorio" }, 400);

      await admin.from("profiles").delete().eq("id", payload.userId);

      const { error: deleteError } = await admin.auth.admin.deleteUser(payload.userId);
      if (deleteError) return json({ error: toErrorMessage(deleteError, "No se pudo eliminar usuario") }, 400);

      return json({ success: true });
    }

    return json({ error: "Action invalida" }, 400);
  } catch (error) {
    const message = toErrorMessage(error, "Error inesperado");
    if (
      message.toLowerCase().includes("token invalido") ||
      message.toLowerCase().includes("token expirado") ||
      message.toLowerCase().includes("no autorizado") ||
      message.toLowerCase().includes("missing auth token")
    ) {
      return json({ error: message }, 401);
    }
    return json({ error: message }, 500);
  }
});
