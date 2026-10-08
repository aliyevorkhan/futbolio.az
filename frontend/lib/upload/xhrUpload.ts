/**
 * Low-level XHR PUT helpers. We use `XMLHttpRequest` instead of `fetch`
 * specifically for `xhr.upload.onprogress` — `fetch` has no
 * upload-progress API, and the Step 4 progress bars need real
 * byte-level progress, not just a spinner.
 */

export interface XhrPutResult {
  /** ETag response header, quotes stripped (S3 wraps it in quotes). */
  etag: string | null;
}

export function xhrPut(
  url: string,
  body: Blob,
  onProgress: (percent: number) => void,
  contentType?: string,
  registerXhr?: (xhr: XMLHttpRequest) => void,
): Promise<XhrPutResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (contentType) {
      xhr.setRequestHeader("Content-Type", contentType);
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const raw = xhr.getResponseHeader("ETag");
        resolve({ etag: raw ? raw.replace(/"/g, "") : null });
      } else {
        reject(new Error(`upload_failed_${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("upload_network_error"));
    xhr.onabort = () => reject(new Error("upload_aborted"));
    registerXhr?.(xhr);
    xhr.send(body);
  });
}

async function withRetry<T>(fn: () => Promise<T>, retries: number, backoffMs: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function uploadSingle(
  file: File,
  url: string,
  contentType: string,
  onProgress: (percent: number) => void,
  registerXhr?: (xhr: XMLHttpRequest) => void,
): Promise<void> {
  await xhrPut(url, file, onProgress, contentType, registerXhr);
}

export interface CompletedPart {
  part_number: number;
  etag: string;
}

/**
 * Slices `file` into `partUrls.length` chunks of `partSize` bytes (the
 * last one may be smaller) and PUTs them with limited concurrency,
 * retrying each failed part individually before giving up.
 */
export async function uploadMultipart(
  file: File,
  partSize: number,
  partUrls: string[],
  onProgress: (percent: number) => void,
  registerXhr?: (xhr: XMLHttpRequest) => void,
  concurrency = 3,
): Promise<CompletedPart[]> {
  const totalParts = partUrls.length;
  const partProgress = new Array(totalParts).fill(0);
  const results: CompletedPart[] = new Array(totalParts);

  const reportProgress = () => {
    const sum = partProgress.reduce((acc, value) => acc + value, 0);
    onProgress(Math.round(sum / totalParts));
  };

  let nextIndex = 0;
  async function worker() {
    for (;;) {
      const i = nextIndex;
      nextIndex += 1;
      if (i >= totalParts) return;

      const start = i * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);

      const { etag } = await withRetry(
        () =>
          xhrPut(
            partUrls[i],
            chunk,
            (percent) => {
              partProgress[i] = percent;
              reportProgress();
            },
            undefined,
            registerXhr,
          ),
        2,
        500,
      );

      results[i] = { part_number: i + 1, etag: etag ?? "" };
      partProgress[i] = 100;
      reportProgress();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, totalParts) }, () => worker());
  await Promise.all(workers);
  return results;
}
