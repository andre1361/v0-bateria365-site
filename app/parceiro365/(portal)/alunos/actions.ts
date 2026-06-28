"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { students } from "@/db/schema"
import { requireUser } from "../../guard"

export type StudentState = { error?: string; ok?: string }

type Row = { nome: string; email: string; telefone: string; empresa: string }

const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g")

function parseTabela(texto: string): Row[] {
  const linhas = texto
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim() !== "")
  if (!linhas.length) return []

  const delim =
    (linhas[0].match(/;/g) || []).length > (linhas[0].match(/,/g) || []).length
      ? ";"
      : linhas[0].includes("\t")
        ? "\t"
        : ","

  const split = (l: string) => {
    const out: string[] = []
    let cur = ""
    let q = false
    for (let i = 0; i < l.length; i++) {
      const c = l[i]
      if (c === '"') {
        if (q && l[i + 1] === '"') {
          cur += '"'
          i++
        } else q = !q
      } else if (c === delim && !q) {
        out.push(cur)
        cur = ""
      } else cur += c
    }
    out.push(cur)
    return out.map((x) => x.trim())
  }

  const norm = (x: string) => (x || "").toLowerCase().normalize("NFD").replace(DIACRITICS, "")
  const header = split(linhas[0]).map(norm)
  const iNome = header.findIndex((h) => /nome|aluno|name/.test(h))
  const iEmail = header.findIndex((h) => /e?-?mail/.test(h))
  const iTel = header.findIndex((h) => /tel|fone|phone|celular|whats/.test(h))
  const iEmp = header.findIndex((h) => /empresa|company|loja|firma/.test(h))
  const hasHeader = iNome >= 0 || iEmail >= 0 || iEmp >= 0
  const corpo = hasHeader ? linhas.slice(1) : linhas
  const cNome = hasHeader && iNome >= 0 ? iNome : 0
  const cEmail = hasHeader ? iEmail : 1
  const cTel = hasHeader ? iTel : 2
  const cEmp = hasHeader ? iEmp : 3

  const rows: Row[] = []
  for (const l of corpo) {
    const cols = split(l)
    const nome = (cols[cNome] || "").trim()
    if (!nome) continue
    rows.push({
      nome,
      email: cEmail >= 0 ? (cols[cEmail] || "").trim() : "",
      telefone: cTel >= 0 ? (cols[cTel] || "").trim() : "",
      empresa: cEmp >= 0 ? (cols[cEmp] || "").trim() : "",
    })
  }
  return rows
}

export async function createStudent(_prev: StudentState, formData: FormData): Promise<StudentState> {
  const u = await requireUser()
  const nome = String(formData.get("nome") || "").trim()
  if (!nome) return { error: "Informe o nome do aluno." }
  await db.insert(students).values({
    distributorId: u.id,
    nome,
    email: String(formData.get("email") || "").trim(),
    telefone: String(formData.get("telefone") || "").trim(),
    empresa: String(formData.get("empresa") || "").trim(),
  })
  revalidatePath("/parceiro365/alunos")
  return { ok: "Aluno cadastrado." }
}

export async function importStudents(_prev: StudentState, formData: FormData): Promise<StudentState> {
  const u = await requireUser()
  const rows = parseTabela(String(formData.get("lista") || ""))
  if (!rows.length) return { error: "Nenhum nome válido encontrado na lista." }
  await db.insert(students).values(rows.map((r) => ({ distributorId: u.id, ...r })))
  revalidatePath("/parceiro365/alunos")
  return { ok: `${rows.length} aluno(s) importado(s).` }
}

export async function deleteStudent(formData: FormData): Promise<void> {
  const u = await requireUser()
  const id = String(formData.get("id") || "")
  if (!id) return
  await db.delete(students).where(and(eq(students.id, id), eq(students.distributorId, u.id)))
  revalidatePath("/parceiro365/alunos")
}
