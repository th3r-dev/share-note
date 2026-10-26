import { describe, it, expect, vi, afterEach } from 'vitest'
import { uploadMedia, UploadMediaDeps } from './upload-media'
import type API from '../api'
import type { FileUpload, UploadQueueItem } from '../api'
import type StatusMessage from '../StatusMessage'

describe('uploadMedia', () => {
  const status = { setStatus: vi.fn() } as unknown as StatusMessage

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uploads an <audio> embed from the vault and points it at the hosted URL', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(new Response('ID3', { status: 200 }))
    const doc = new DOMParser().parseFromString(
      '<div class="internal-embed media-embed"><audio controls src="app://obsidian.md/vault/Assets/Recording%2020261026.m4a?1712345"></audio></div>',
      'text/html')
    const queued: FileUpload[] = []
    const api = {
      queueUpload: vi.fn(async (item: UploadQueueItem) => {
        queued.push(item.data)
        item.callback(`https://files.example/${item.data.hash}.${item.data.filetype}`)
      }),
      processQueue: vi.fn(async () => ({ success: true, files: [] }))
    }
    const deps: UploadMediaDeps = { api: api as unknown as API, getExcalidrawSvg: vi.fn(async () => null) }

    await uploadMedia(doc, deps, status)

    expect(queued).toHaveLength(1)
    expect(queued[0].filetype).toBe('m4a')
    expect(doc.querySelector('audio')?.getAttribute('src')).toMatch(/^https:\/\/files\.example\/[0-9a-f]+\.m4a$/)
  })
})
