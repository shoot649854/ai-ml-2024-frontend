import { Configuration, OpenAIApi } from 'openai';

export class OpenaiService {
  private static instance: OpenAIApi | undefined;
  private static get OpenAIApiInstance(): OpenAIApi {
    if (this.instance) {
      return this.instance;
    }
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.instance = new OpenAIApi(configuration);
    return this.instance;
  }

  static async postChat(prop: { prompt: string }): Promise<string | undefined> {
    try {
      const response = await this.OpenAIApiInstance.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prop.prompt }],
      });
      if (response.status !== 200) {
        console.log(`status = ${response.status} : `, response.statusText);
      }

      return response.data.choices[0].message?.content;
    } catch (e) {
      console.log(e);
    }
  }
}
