/**
 * Turns a video entry from front matter into embed HTML.
 *
 * A video entry looks like:
 *   - url: https://www.youtube.com/watch?v=VIDEO_ID     (required)
 *     title: "Optional title"
 *     poster: /assets/images/...                          (only for video files)
 *
 * Supported: YouTube (videos, Shorts, youtu.be links), TikTok, Instagram (posts/reels),
 * Facebook (videos/reels) and self-hosted .mp4/.webm/.mov files.
 * Anything else is shown as a simple link card.
 */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const PLATFORMS = {
  youtube: { label: "YouTube", icon: "fab fa-youtube" },
  tiktok: { label: "TikTok", icon: "fab fa-tiktok" },
  instagram: { label: "Instagram", icon: "fab fa-instagram" },
  facebook: { label: "Facebook", icon: "fab fa-facebook-f" },
  x: { label: "X", icon: "fab fa-x-twitter" },
  linkedin: { label: "LinkedIn", icon: "fab fa-linkedin-in" },
  file: { label: "Video", icon: "fas fa-film" },
  link: { label: "Link", icon: "fas fa-link" },
};

export function detect(url = "") {
  const u = String(url).trim();
  if (/youtube\.com|youtu\.be/i.test(u)) return "youtube";
  if (/tiktok\.com/i.test(u)) return "tiktok";
  if (/instagram\.com/i.test(u)) return "instagram";
  if (/facebook\.com|fb\.watch/i.test(u)) return "facebook";
  if (/(^|\/\/)(www\.)?(x|twitter)\.com/i.test(u)) return "x";
  if (/linkedin\.com/i.test(u)) return "linkedin";
  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(u)) return "file";
  return "link";
}

/** Platform info for icons/labels: {{ url | platform }} */
export function videoPlatform(url) {
  const key = detect(url);
  return { key, ...PLATFORMS[key] };
}

function youtubeId(url) {
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function linkCard(url, title, platform) {
  const p = PLATFORMS[platform] || PLATFORMS.link;
  return `<a class="video-card video-card--link" href="${esc(url)}" target="_blank" rel="noopener">
  <span class="video-card__link-icon"><i class="${p.icon}" aria-hidden="true"></i></span>
  <span class="video-card__link-text"><strong>${esc(title || `Watch on ${p.label}`)}</strong><small>Opens ${esc(p.label)}</small></span>
  <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
</a>`;
}

function figure(inner, title, platform, ratio) {
  const p = PLATFORMS[platform];
  const caption = title
    ? `<figcaption><i class="${p.icon}" aria-hidden="true"></i> ${esc(title)}</figcaption>`
    : `<figcaption><i class="${p.icon}" aria-hidden="true"></i> ${esc(p.label)}</figcaption>`;
  return `<figure class="video-card video-card--${ratio}">
  <div class="video-card__frame">${inner}</div>
  ${caption}
</figure>`;
}

export function videoEmbed(video, fallbackTitle = "") {
  if (!video) return "";
  const v = typeof video === "string" ? { url: video } : video;
  const url = String(v.url || "").trim();
  if (!url) return "";
  const title = v.title || "";
  const label = title || fallbackTitle || "Video";
  const platform = detect(url);

  if (platform === "youtube") {
    const id = youtubeId(url);
    if (!id) return linkCard(url, title, platform);
    const vertical = /\/shorts\//.test(url);
    const thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    // Lightweight "click to play" facade: the YouTube player only loads when the visitor presses play.
    const inner = `<button type="button" class="yt-facade" data-yt="${id}" aria-label="Play video: ${esc(label)}">
      <img src="${thumb}" alt="" loading="lazy" decoding="async">
      <span class="yt-facade__play" aria-hidden="true"><i class="fas fa-play"></i></span>
    </button>`;
    return figure(inner, title, platform, vertical ? "vertical" : "wide");
  }

  if (platform === "tiktok") {
    const m = url.match(/\/video\/(\d+)/);
    if (!m) return linkCard(url, title, platform);
    const inner = `<iframe src="https://www.tiktok.com/embed/v2/${m[1]}" title="${esc(label)}" loading="lazy" allow="encrypted-media; fullscreen" allowfullscreen></iframe>`;
    return figure(inner, title, platform, "vertical");
  }

  if (platform === "instagram") {
    const m = url.match(/instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
    if (!m) return linkCard(url, title, platform);
    const kind = m[1] === "reels" ? "reel" : m[1];
    const inner = `<iframe src="https://www.instagram.com/${kind}/${m[2]}/embed" title="${esc(label)}" loading="lazy" allowtransparency="true" scrolling="no"></iframe>`;
    return figure(inner, title, platform, "instagram");
  }

  if (platform === "facebook") {
    const vertical = /\/reel\//.test(url);
    const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
    const inner = `<iframe src="${esc(src)}" title="${esc(label)}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen scrolling="no"></iframe>`;
    return figure(inner, title, platform, vertical ? "vertical" : "wide");
  }

  if (platform === "file") {
    const poster = v.poster ? ` poster="${esc(v.poster)}"` : "";
    const inner = `<video controls playsinline preload="none"${poster}><source src="${esc(url)}">Your browser cannot play this video.</video>`;
    return figure(inner, title, platform, v.vertical ? "vertical" : "wide");
  }

  return linkCard(url, title, platform);
}
