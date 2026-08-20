/**
 * Acesso à webcam. Fica separado do classificador porque a entrada ao vivo é
 * uma preocupação diferente de "o que o modelo acha da imagem".
 */
export async function startWebcam(video: HTMLVideoElement): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "Este navegador não expõe a webcam. Use Chrome/Edge/Firefox em http://localhost."
    );
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  });

  video.srcObject = stream;
  await video.play();

  // O modelo precisa de um quadro com dimensões já resolvidas.
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await new Promise<void>((resolve) =>
      video.addEventListener("loadeddata", () => resolve(), { once: true })
    );
  }
}

export function stopWebcam(video: HTMLVideoElement): void {
  const stream = video.srcObject as MediaStream | null;
  stream?.getTracks().forEach((track) => track.stop());
  video.srcObject = null;
}
