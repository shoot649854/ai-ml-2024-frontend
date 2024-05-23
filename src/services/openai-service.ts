import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

export class OpenaiService {
  private static clientInstance: OpenAIClient | undefined;
  private static endpoint = process.env["ENDPOINT"] || "<endpoint>";
  private static azureApiKey = process.env["AZURE_API_KEY"] || "<api key>";

  private static get client(): OpenAIClient {
    if (!this.clientInstance) {
      this.clientInstance = new OpenAIClient(this.endpoint, new AzureKeyCredential(this.azureApiKey));
    }
    return this.clientInstance;
  }

  static async postChat(prompt: string): Promise<string | undefined> {
    try {
      const deploymentId = "gpt-4";
      const result = await this.client.getChatCompletions(deploymentId, [
        { role: "user", content: prompt }
      ]);

      return result.choices[0].message?.content;
    } catch (e) {
      console.error("Error in OpenaiService.postChat:", e);
    }
  }
}
