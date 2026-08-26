export type LexwarePdfResponse = {
  data: ArrayBuffer
  contentType: "application/pdf"
  filename: string | null
  headers: Headers
}
