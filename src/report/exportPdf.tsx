import { buildReportData } from './reportData'
import type { ReportInput } from './reportData'

/**
 * Build the report and trigger a browser download. The PDF engine is large, so it is loaded only on first use
 * and never adds to the app's initial bundle.
 */
export async function downloadReport(input: ReportInput): Promise<void> {
  const [{ pdf }, { default: ReportDocument }] = await Promise.all([import('@react-pdf/renderer'), import('./ReportDocument')])
  const data = buildReportData(input)
  const blob = await pdf(<ReportDocument data={data} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = data.fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
