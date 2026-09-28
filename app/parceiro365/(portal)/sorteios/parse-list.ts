// Leitura de listas (CSV/XML) no cliente para importar nomes ao sorteio.

export type ParsedList = { fields: string[]; records: Record<string, string>[] }

function detectDelim(headerLine: string): string {
  const cands = [",", ";", "\t", "|"]
  let best = ",",
    bestN = -1
  for (const d of cands) {
    const n = headerLine.split(d).length - 1
    if (n > bestN) {
      bestN = n
      best = d
    }
  }
  return best
}

function parseCsvLine(line: string, delim: string): string[] {
  const out: string[] = []
  let cur = "",
    q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else q = false
      } else cur += c
    } else {
      if (c === '"') q = true
      else if (c === delim) {
        out.push(cur)
        cur = ""
      } else cur += c
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

export function parseCSV(text: string): ParsedList {
  const clean = text.replace(/^﻿/, "")
  const lines = clean.split(/\r\n|\n|\r/).filter((l) => l.trim() !== "")
  if (!lines.length) return { fields: [], records: [] }
  const delim = detectDelim(lines[0])
  const rows = lines.map((l) => parseCsvLine(l, delim))
  const header = rows[0]
  // É cabeçalho se houver alguma célula não-numérica na primeira linha.
  const looksHeader = header.some((c) => c && Number.isNaN(Number(c)))
  let fields: string[]
  let dataRows: string[][]
  if (looksHeader) {
    fields = header.map((h, i) => h.trim() || `Coluna ${i + 1}`)
    dataRows = rows.slice(1)
  } else {
    const cols = Math.max(...rows.map((r) => r.length))
    fields = Array.from({ length: cols }, (_, i) => `Coluna ${i + 1}`)
    dataRows = rows
  }
  const records = dataRows.map((r) => {
    const o: Record<string, string> = {}
    fields.forEach((f, i) => {
      o[f] = (r[i] ?? "").trim()
    })
    return o
  })
  return { fields, records }
}

export function parseXML(text: string): ParsedList {
  if (typeof DOMParser === "undefined") return { fields: [], records: [] }
  const doc = new DOMParser().parseFromString(text, "application/xml")
  if (doc.getElementsByTagName("parsererror").length) return { fields: [], records: [] }

  // O maior grupo de elementos-irmãos com a mesma tag é a lista de registros.
  let best: Element[] = []
  const visit = (parent: Element | Document) => {
    const children = Array.from((parent as Element).children || [])
    const byTag = new Map<string, Element[]>()
    for (const c of children) {
      const g = byTag.get(c.tagName) || []
      g.push(c)
      byTag.set(c.tagName, g)
    }
    for (const g of byTag.values()) {
      if (g.length > best.length) best = g
      g.forEach((c) => visit(c))
    }
  }
  visit(doc)
  if (!best.length) return { fields: [], records: [] }

  const fieldOrder: string[] = []
  const seen = new Set<string>()
  const addField = (f: string) => {
    if (!seen.has(f)) {
      seen.add(f)
      fieldOrder.push(f)
    }
  }
  const records = best.map((el) => {
    const o: Record<string, string> = {}
    for (const a of Array.from(el.attributes)) {
      const k = `@${a.name}`
      o[k] = a.value
      addField(k)
    }
    const kids = Array.from(el.children)
    if (!kids.length) {
      const t = (el.textContent || "").trim()
      if (t) {
        o["valor"] = t
        addField("valor")
      }
    } else {
      for (const k of kids) {
        if (!k.children.length) {
          o[k.tagName] = (k.textContent || "").trim()
          addField(k.tagName)
        }
      }
    }
    return o
  })
  return { fields: fieldOrder, records }
}

export function parseListFile(name: string, text: string): ParsedList {
  const lower = (name || "").toLowerCase()
  const looksXml = lower.endsWith(".xml") || /^\s*<\?xml|^\s*</.test(text)
  return looksXml ? parseXML(text) : parseCSV(text)
}

// ---- Leitura de planilhas .xlsx (Excel) sem dependências ----------------
// Um .xlsx é um ZIP de XML. Descompactamos com DecompressionStream (nativo do
// navegador/Node) e lemos a primeira planilha + as strings compartilhadas.

function xmlDecode(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
}

function colIndex(letters: string): number {
  let n = 0
  for (const ch of letters) {
    const c = ch.charCodeAt(0)
    if (c < 65 || c > 90) break
    n = n * 26 + (c - 64)
  }
  return n - 1
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Response(data as unknown as BodyInit).body!.pipeThrough(new DecompressionStream("deflate-raw"))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

// Lê o ZIP via diretório central (offsets/tamanhos confiáveis).
async function unzip(buf: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const u8 = new Uint8Array(buf)
  const dv = new DataView(buf)
  let eocd = -1
  for (let i = u8.length - 22; i >= 0 && i >= u8.length - 22 - 65535; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error("ZIP inválido (EOCD ausente)")
  const count = dv.getUint16(eocd + 10, true)
  let p = dv.getUint32(eocd + 16, true)
  const out = new Map<string, Uint8Array>()
  const dec = new TextDecoder()
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break
    const method = dv.getUint16(p + 10, true)
    const compSize = dv.getUint32(p + 20, true)
    const nameLen = dv.getUint16(p + 28, true)
    const extraLen = dv.getUint16(p + 30, true)
    const commentLen = dv.getUint16(p + 32, true)
    const localOff = dv.getUint32(p + 42, true)
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nameLen))
    const lNameLen = dv.getUint16(localOff + 26, true)
    const lExtraLen = dv.getUint16(localOff + 28, true)
    const dataStart = localOff + 30 + lNameLen + lExtraLen
    const comp = u8.subarray(dataStart, dataStart + compSize)
    if (method === 0) out.set(name, comp)
    else if (method === 8) out.set(name, await inflateRaw(comp))
    p += 46 + nameLen + extraLen + commentLen
  }
  return out
}

function parseSharedStrings(xml: string): string[] {
  const ss: string[] = []
  for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const parts = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => xmlDecode(x[1]))
    ss.push(parts.join(""))
  }
  return ss
}

function sheetToMatrix(xml: string, ss: string[]): string[][] {
  const rows: string[][] = []
  for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = []
    for (const cm of rm[1].matchAll(/<c([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1]
      const inner = cm[2] || ""
      const refM = attrs.match(/r="([A-Z]+)\d+"/)
      const idx = refM ? colIndex(refM[1]) : cells.length
      const t = (attrs.match(/t="([^"]+)"/) || [])[1] || ""
      const vM = inner.match(/<v>([\s\S]*?)<\/v>/)
      const isM = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/)
      let val = ""
      if (t === "s" && vM) val = ss[Number(vM[1])] ?? ""
      else if (t === "inlineStr" && isM) val = xmlDecode(isM[1])
      else if (vM) val = xmlDecode(vM[1])
      while (cells.length < idx) cells.push("")
      cells[idx] = val
    }
    rows.push(cells)
  }
  return rows
}

function matrixToList(rows: string[][]): ParsedList {
  const nonEmpty = rows.filter((r) => r.some((c) => (c || "").trim() !== ""))
  if (!nonEmpty.length) return { fields: [], records: [] }
  const width = Math.max(...nonEmpty.map((r) => r.length))
  const header = nonEmpty[0]
  const looksHeader = header.some((c) => c && Number.isNaN(Number(c)))
  const fields = looksHeader
    ? Array.from({ length: width }, (_, i) => (header[i] || "").trim() || `Coluna ${i + 1}`)
    : Array.from({ length: width }, (_, i) => `Coluna ${i + 1}`)
  const dataRows = looksHeader ? nonEmpty.slice(1) : nonEmpty
  const records = dataRows.map((r) => {
    const o: Record<string, string> = {}
    fields.forEach((f, i) => {
      o[f] = (r[i] ?? "").trim()
    })
    return o
  })
  return { fields, records }
}

export async function parseXlsx(buf: ArrayBuffer): Promise<ParsedList> {
  const files = await unzip(buf)
  const dec = new TextDecoder()
  const ssBytes = files.get("xl/sharedStrings.xml")
  const ss = ssBytes ? parseSharedStrings(dec.decode(ssBytes)) : []
  const sheetKey = [...files.keys()].filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort()[0]
  if (!sheetKey) return { fields: [], records: [] }
  return matrixToList(sheetToMatrix(dec.decode(files.get(sheetKey)!), ss))
}
