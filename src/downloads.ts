export interface DownloadReceipt {
  fileName: string;
  message: string;
}

export const downloadReceipt = (fileName: string): DownloadReceipt => ({
  fileName,
  message: `Downloaded ${fileName}`,
});

/** Receipt for a multi-file export, where naming one file would be misleading. */
export const bulkDownloadReceipt = (count: number): DownloadReceipt => ({
  fileName: "",
  message: `Downloaded ${count} files`,
});
