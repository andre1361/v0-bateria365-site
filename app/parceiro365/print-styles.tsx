// CSS de impressão do certificado (A4 paisagem). Montado apenas nas telas que
// imprimem certificado, para não afetar a impressão de outras páginas.
export function PrintStyles() {
  return (
    <style>{`
      @media print {
        @page { size: A4 landscape; margin: 0; }
        body * { visibility: hidden !important; }
        #cert-print-area, #cert-print-area * { visibility: visible !important; }
        #cert-print-area {
          position: absolute !important; left: 0 !important; top: 0 !important;
          width: 297mm !important; margin: 0 !important;
        }
        #cert-print-area .cert-page {
          width: 297mm !important; height: 210mm !important;
          page-break-after: always; break-after: page; overflow: hidden !important;
        }
        #cert-print-area .cert-page:last-child { page-break-after: auto; break-after: auto; }
      }
    `}</style>
  )
}
