import { Defuddle } from "defuddle/node";

export type ConvertResult = {
  title: string | null;
  author: string | null;
  markdown: string;
};

export class ConvertError extends Error {}

function normalizeUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ConvertError("올바른 URL 형식이 아닙니다.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ConvertError("http(s) URL만 지원합니다.");
  }
  return url;
}

export async function convertUrlToMarkdown(
  rawUrl: string
): Promise<ConvertResult> {
  const url = normalizeUrl(rawUrl);

  let html: string;
  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
      redirect: "follow",
    });
    if (!response.ok) {
      throw new ConvertError(
        `페이지를 가져오지 못했습니다 (${response.status}).`
      );
    }
    html = await response.text();
  } catch (error) {
    if (error instanceof ConvertError) throw error;
    throw new ConvertError("페이지에 접근할 수 없습니다.");
  }

  const result = await Defuddle(html, url.toString(), { markdown: true });
  const markdown = result.contentMarkdown ?? result.content;

  if (!markdown || !markdown.trim()) {
    throw new ConvertError("본문을 추출하지 못했습니다.");
  }

  return {
    title: result.title?.trim() || null,
    author: result.author?.trim() || null,
    markdown,
  };
}
