import assert from "node:assert/strict";
import test from "node:test";
import { bulkDownloadReceipt, downloadReceipt } from "../src/downloads.ts";

test("confirms the exact file downloaded from Export", () => {
  assert.deepEqual(downloadReceipt("lab1.lst"), {
    fileName: "lab1.lst",
    message: "Downloaded lab1.lst",
  });
});

test("counts a multi-file export instead of naming one of them", () => {
  assert.equal(bulkDownloadReceipt(4).message, "Downloaded 4 files");
});
