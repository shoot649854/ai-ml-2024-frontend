"use client";
import React from 'react';
import { useState, ChangeEvent } from "react";
import { Box, TextField, Typography, IconButton } from '@mui/material';
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { TMessage } from "@/global/types";
import AWS from 'aws-sdk';

export default function Home() {
  const [input, setInput] = React.useState("");
  const fileInputRef = React.useRef(null);
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const uploadFile = async (file: File) => {
    const S3_BUCKET = process.env.NEXT_PUBLIC_AWS_Bucket || "";
    const REGION = process.env.NEXT_PUBLIC_AWS_DEFAULT_REGION || "";
    console.log(S3_BUCKET);

    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    });
    const s3 = new AWS.S3({
      params: { Bucket: S3_BUCKET },
      region: REGION,
    });

    const params = {
      Bucket: S3_BUCKET,
      Key: file.name,
      Body: file,
    };

    var upload = s3
      .putObject(params)
      .on("httpUploadProgress", (evt) => {
        console.log(`Uploading ${((evt.loaded * 100) / evt.total).toString()}%`);
      })
      .promise();

    await upload.then((err) => {
      console.log(err);
      alert("File uploaded successfully.");
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) {
      console.error("No file selected.");
      return;
    }

    if (file.type !== "application/pdf") {
      console.error("Unsupported file type. Only PDF files are accepted.");
      return;
    }

    const maxFileSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxFileSize) {
      console.error("File is too large. Maximum allowed size is 5 MB.");
      return;
    }

    console.log("Here is output")

    setFile(file);
  };

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

  const sendMessage = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);

    if (file) {
      await uploadFile(file);
    }

    if (input !== "" || file) {
      const formData = new FormData();
      formData.append("prompt", input);
      if (file) {
          formData.append("file", file);
      }
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',  // equivalent to 'h-screen' in TailwindCSS
        bgcolor: 'grey.50'  // 'bg-gray-50' equivalent in MUI theme colors
      }}
    >
      <Box 
        sx={{
          display: 'flex', 
          flexDirection: 'row', 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: '#3B82F6', 
          padding: '16px', 
          // borderTopLeftRadius: '16px',
          // borderTopRightRadius: '16px'
        }}
      >
        <Typography sx={{ color: 'white', fontSize: '1.25rem' }}>Bedrock PDF Search</Typography>
      </Box>
      <Box className="flex flex-col flex-grow overflow-y-scroll bg-white">
        {messages.map((message, index) => (
          <Box
            key={index}
            className={`flex flex-row ${
              message.userId === 0 ? "justify-end" : "justify-start"
            } items-end p-4`}
          >
            <Typography 
              className={`max-w-xs ${
                message.userId === 0 ? "bg-green-100" : "bg-gray-300"
              } rounded-lg p-2 mb-2`}
              color="black">
              {message.text}
            </Typography>
          </Box>
        ))}
        {isSending ? (
          <Box className={`flex flex-row justify-start items-end p-4`}>
            <Box className="h-2 w-2 bg-gray-500 rounded-full animate-pulse m-4"></Box>
            <Box className="h-2 w-2 bg-gray-500 rounded-full animate-pulse m-4"></Box>
            <Box className="h-2 w-2 bg-gray-500 rounded-full animate-pulse m-4"></Box>
          </Box>
        ) : undefined}
      </Box>
      
      {/* <Form /> */}

      <form
          onSubmit={sendMessage}
          className="flex flex-row items-center p-4 bg-gray-200"
        >
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
            variant="outlined"
            size="small"
            sx={{ mr: 2, backgroundColor: 'white', borderRadius: '999px' }}
          />
          
          <IconButton
            color="primary"
            component="label"
            sx={{ mr: 2 }}
          >
            <AttachFileIcon />
            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handleFileInput}
              accept="application/pdf"
            />
          </IconButton>
          
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
            className="bg-green-500 text-white rounded-full p-2"
          >
            Send
          </button>
        </form>

    </Box>
  );
}
