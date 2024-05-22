import { OpenaiService } from '@/services/openai-service';
import { NextResponse } from 'next/server';
export async function POST(request: Request) {
  const { prompt } = await request.json();
  const result = await OpenaiService.postChat({ prompt });
  if (result == undefined) {
    throw new Error();
  }
  return NextResponse.json({ result });
}
