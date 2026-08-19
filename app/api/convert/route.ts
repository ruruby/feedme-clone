import { NextResponse } from "next/server";
import { ConvertError, convertUrlToMarkdown } from "@/lib/convert";

export async function POST(request: Request) {
  let url: unknown;
  try {
    const body = await request.json();
    url = body?.url;
  } catch {
    return NextResponse.json(
      { error: "요청 본문이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "URL을 입력해주세요." }, { status: 400 });
  }

  try {
    const result = await convertUrlToMarkdown(url.trim());
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ConvertError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: "변환 중 알 수 없는 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
