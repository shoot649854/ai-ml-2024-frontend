"use client";
import { useEffect, useState } from "react";

type Message = {
  userId: number;
  text: string;
};
export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const startRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setInput(transcript);
      setIsRecording(false);
    };

    recognition.start();
  };

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (input !== "") {
      messages.push({ userId: 0, text: input });
      setMessages([...messages]);
      setIsSending(true);

      fetch(`/api/gpt`, {
        method: "POST",
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify({
          prompt: input,
        }),
      }).then(async (data) => {
        const result = await data.json();
        messages.push({
          userId: 1,
          text: result.result || "sorry not response gpt",
        });
        setMessages([...messages]);
        setIsSending(false);
      });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex flex-row justify-center items-center bg-green-500 p-4">
        <h1 className="text-white text-2xl">AI Chat Flow</h1>
      </div>
      <div className="flex flex-col flex-grow overflow-y-scroll bg-white">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex flex-row ${
              message.userId === 0 ? "justify-end" : "justify-start"
            } items-end p-4`}
          >
            <p
              className={`max-w-xs ${
                message.userId === 0 ? "bg-green-100" : "bg-gray-300"
              } rounded-lg p-2 mb-2`}
            >
              {message.text}
            </p>
          </div>
        ))}
        {isSending ? (
          <div className={`flex flex-row justify-start items-end p-4`}>
            <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse m-4"></div>
            <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse m-4"></div>
            <div className="h-2 w-2 bg-gray-500 rounded-full animate-pulse m-4"></div>
          </div>
        ) : undefined}
      </div>
      <form
        onSubmit={sendMessage}
        className="flex flex-row items-center p-4 bg-gray-200"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
          className="flex-grow rounded-full p-2 mr-4 bg-white"
        />{" "}
        <button
          type="button"
          onClick={startRecognition}
          className={`bg-blue-500 text-white rounded-full p-2 mr-4 ${
            isRecording ? "animate-pulse" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`h-6 w-6 ${isRecording ? "text-red-500" : "text-white"}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
            />
          </svg>
        </button>
        <button
          type="submit"
          className={`bg-green-500 text-white rounded-full p-2 `}
        >
          Send
        </button>
      </form>
    </div>
  );
}
