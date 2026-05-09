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
};

type DeletePayload = {
  action: "delete";
  userId: string;
};

type Payload = InvitePayload | UpdatePayload | DeletePayload;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireCoordinatorOrDirector(admin: ReturnType<typeof createClient>, token: string) {
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    throw new Error("Token invalido o expirado.");
  }

  const { data: profileData, error: profileError } = await admin
    .from("profiles")
    .select("active,role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message || "No se pudo validar estado del usuario.");

  let rawRole: string | null = (profileData as any)?.role ?? null;
  const roleRes = await admin
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userData.user.id)
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

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "Missing auth token" }, 401);

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    await requireCoordinatorOrDirector(admin, token);

    const payload = (await req.json()) as Payload;

    if (payload.action === "invite") {
      if (!payload.email || !payload.name || !payload.role) {
        return json({ error: "email, name y role son obligatorios" }, 400);
      }

      const tempPassword = crypto.randomUUID();
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email: payload.email,
        email_confirm: true,
        password: tempPassword,
      });

      if (createError || !createData.user) {
        return json({ error: createError?.message || "No se pudo crear usuario en auth" }, 400);
      }

      const { error: profileError } = await admin.from("profiles").upsert({
        id: createData.user.id,
        name: payload.name,
        last_name: "",
        email: payload.email,
        role: payload.role,
        active: true,
        course_id: payload.role === "student" ? payload.courseId ?? null : null,
      });

      if (profileError) return json({ error: profileError.message || "No se pudo crear profile" }, 400);

      await setUserRole(admin, createData.user.id, payload.role);
      if (payload.role === "teacher") {
        await upsertTeacherAssignment(admin, createData.user.id, payload.subjectId, payload.courseId);
      }

      return json({
        success: true,
        user: { id: createData.user.id, email: createData.user.email, name: payload.name, role: payload.role, active: true },
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
        if (profileError) return json({ error: profileError.message || "No se pudo actualizar perfil" }, 400);
      }

      if (payload.email) {
        const { error: authUpdateError } = await admin.auth.admin.updateUserById(payload.userId, { email: payload.email });
        if (authUpdateError) return json({ error: authUpdateError.message || "No se pudo actualizar email en auth" }, 400);
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
      if (deleteError) return json({ error: deleteError.message || "No se pudo eliminar usuario" }, 400);

      return json({ success: true });
    }

    return json({ error: "Action invalida" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    return json({ error: message }, 500);
  }
});
