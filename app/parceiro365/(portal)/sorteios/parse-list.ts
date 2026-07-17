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
