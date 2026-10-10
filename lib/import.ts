import "server-only";
import { parseSpreadsheet, type ParseResult } from "./parse";

export const MAX_FILE_BYTES = 4 * 1024 * 1024;

export async function readUpload(req: Request): Promise<{ fileName: string; parsed: ParseResult }> {
  const form = await req.formData();
  const file = form.get("arquivo");
  if (!(file instanceof File) || file.size === 0) throw new Error("Selecione um arquivo.");
  if (file.size > MAX_FILE_BYTES) throw new Error("O arquivo passa de 4 MB. Divida em arquivos menores.");
  const fileName = file.name.slice(0, 200);
  const parsed = await parseSpreadsheet(fileName, await file.arrayBuffer());
  return { fileName, parsed };
}
