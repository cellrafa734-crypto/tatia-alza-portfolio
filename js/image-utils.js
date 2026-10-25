/* Utility gambar tanpa library eksternal. Mengoptimalkan foto untuk thumbnail. */
(function () {
  async function loadImage(file) {
    if ("createImageBitmap" in window) {
      try { return await createImageBitmap(file); } catch (_) { /* gunakan Image */ }
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Gambar tidak dapat dibaca.")); };
      img.src = url;
    });
  }

  async function compressImage(file, maxCharacters = 34000) {
    if (!file || !file.type || !file.type.startsWith("image/")) {
      throw new Error("Pilih file gambar JPG, PNG, atau WebP.");
    }
    const image = await loadImage(file);
    const originalWidth = image.width || image.naturalWidth;
    const originalHeight = image.height || image.naturalHeight;
    if (!originalWidth || !originalHeight) throw new Error("Ukuran gambar tidak terbaca.");

    const sizes = [900, 760, 640, 540, 440, 360, 300];
    const qualities = [0.72, 0.62, 0.52, 0.44, 0.36, 0.29];
    let best = "";
    for (const maxSide of sizes) {
      const scale = Math.min(1, maxSide / Math.max(originalWidth, originalHeight));
      const width = Math.max(1, Math.round(originalWidth * scale));
      const height = Math.max(1, Math.round(originalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Browser tidak dapat memproses gambar.");
      context.fillStyle = "#fffaf5";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      for (const quality of qualities) {
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) dataUrl = canvas.toDataURL("image/jpeg", quality);
        best = dataUrl;
        if (dataUrl.length <= maxCharacters) {
          if (typeof image.close === "function") image.close();
          return dataUrl;
        }
      }
    }
    if (typeof image.close === "function") image.close();
    if (best && best.length <= maxCharacters + 4000) return best;
    throw new Error("Ukuran foto masih terlalu besar. Coba pilih foto lain yang lebih kecil.");
  }

  window.TiaPortfolioImageUtils = { compressImage };
})();
