import { OpenaiService } from '@/services/openai-service';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const result = await OpenaiService.postChat(prompt); // Adjusted to pass prompt directly, assuming updated service method signature.
    if (!result) {
      throw new Error('No result from OpenAI Service');
    }
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error handling request:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 });
  }
}