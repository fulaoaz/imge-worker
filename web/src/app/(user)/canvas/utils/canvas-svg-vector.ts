"use client";

export function svgToDataUrl(svg: string) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function svgToBlob(svg: string) {
    return new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
}

export function dataUrlToSvgText(dataUrl: string) {
    const match = dataUrl.match(/^data:image\/svg\+xml(?:;charset=[^;,]+)?(;base64)?,(.*)$/i);
    if (!match) return "";
    if (match[1]) {
        const binary = atob(match[2] || "");
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        return new TextDecoder().decode(bytes);
    }
    return decodeURIComponent(match[2] || "");
}

export function sanitizeEditableSvg(svg: string) {
    const parser = new DOMParser();
    const document = parser.parseFromString(svg, "image/svg+xml");
    if (document.querySelector("parsererror")) throw new Error("SVG 格式不正确，请检查标签是否闭合");
    const root = document.documentElement;
    if (!root || root.tagName.toLowerCase() !== "svg") throw new Error("请输入完整的 <svg> 内容");

    document.querySelectorAll("script,foreignObject,iframe,object,embed,link,meta").forEach((element) => element.remove());
    document.querySelectorAll("*").forEach((element) => {
        for (const attribute of Array.from(element.attributes)) {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim().toLowerCase();
            if (name.startsWith("on") || value.startsWith("javascript:") || value.includes("url(javascript:")) element.removeAttribute(attribute.name);
        }
    });
    root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(root);
}

export function semanticSvgFallback({ width, height, title }: { width: number; height: number; title: string }) {
    const safeWidth = Math.max(320, Math.round(width || 1024));
    const safeHeight = Math.max(220, Math.round(height || 768));
    const safeTitle = escapeXml(title || "Editable image");
    return sanitizeEditableSvg(`
<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}" role="img" aria-label="${safeTitle}">
  <title>${safeTitle}</title>
  <desc>Image Worker semantic editable SVG placeholder. The original image could not be reconstructed by the selected model.</desc>
  <rect x="0" y="0" width="${safeWidth}" height="${safeHeight}" rx="24" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <text x="${safeWidth / 2}" y="${safeHeight / 2 - 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">语义 SVG 重建失败</text>
  <text x="${safeWidth / 2}" y="${safeHeight / 2 + 26}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#475569">请换用支持视觉理解/OCR 的模型后重试</text>
</svg>`);
}

function escapeXml(value: string) {
    return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char] || char);
}
