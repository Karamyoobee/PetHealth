import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { api, ApiError } from "../../api/client";
import type { Pet } from "../../types";

function checkResponse(status: number) {
  if (status >= 200 && status < 300) return;
  if (status === 401) throw new ApiError("Your session has expired. Please sign in again.", status);
  if (status === 404) throw new ApiError("This pet is no longer available. Reopen Reports to refresh your pets.", status);
  throw new ApiError("Could not create the PDF report. Please try again.", status);
}

export async function exportPetReport(pet: Pet) {
  const request = api.getReportRequest(pet.id);
  const name = pet.name.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 60) || "pet";
  const filename = `${name}-health-report.pdf`;

  if (Platform.OS === "web") {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(request.url, { headers: request.headers, signal: controller.signal });
      checkResponse(response.status);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      clearTimeout(timeout);
    }
    return;
  }

  if (!FileSystem.cacheDirectory || !await Sharing.isAvailableAsync()) {
    throw new Error("PDF sharing is not available on this device.");
  }
  const directory = `${FileSystem.cacheDirectory}report-${Date.now()}/`;
  try {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const download = FileSystem.createDownloadResumable(request.url, `${directory}${filename}`, { headers: request.headers });
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      download.cancelAsync().catch(() => undefined);
    }, 60000);
    let result;
    try {
      result = await download.downloadAsync();
    } finally {
      clearTimeout(timeout);
    }
    if (!result || timedOut) throw new Error("The report download timed out. Please try again.");
    checkResponse(result.status);
    await Sharing.shareAsync(result.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: "Export Health Report" });
  } finally {
    await FileSystem.deleteAsync(directory, { idempotent: true }).catch(() => undefined);
  }
}
