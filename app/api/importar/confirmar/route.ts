import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { REAL_DATA_FLAG } from "@/lib/data";
import { supabaseConfigured } from "@/lib/env";
import { readUpload } from "@/lib/import";
import { db, setSetting } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: "O banco de dados ainda não está configurado, então a importação não pode ser gravada." },
      { status: 503 },
    );
  }
  let importId: string | null = null;
  const client = await db();
  try {
    const { fileName, parsed } = await readUpload(req);
    if (parsed.rows.length === 0) throw new Error("Nenhum lançamento válido encontrado no arquivo.");

    const { data: imp, error: impErr } = await client
      .from("imports")
      .insert({ file_name: fileName, row_count: parsed.rows.length })
      .select("id")
      .single();
    if (impErr) throw impErr;
    importId = imp.id as string;

    const chunk = 1000;
    for (let i = 0; i < parsed.rows.length; i += chunk) {
      const batch = parsed.rows.slice(i, i + chunk).map((r) => ({ ...r, import_id: importId }));
      const { error } = await client.from("transactions").insert(batch);
      if (error) throw error;
    }

    // A partir daqui os dados fictícios ficam desativados para sempre.
    await setSetting(REAL_DATA_FLAG, "true");
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, count: parsed.rows.length });
  } catch (e) {
    if (importId) await client.from("imports").delete().eq("id", importId);
    const message = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String(e.message) : "Falha ao importar.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
