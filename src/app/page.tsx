"use client";
import React from 'react';
import { useEffect, useState } from "react";
import { Box, TextField, Typography, Button, IconButton, inputLabelClasses } from '@mui/material';
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { TMessage } from "@/global/types";
import AWS from 'aws-sdk';

// import Form from "@/component/Form";

export default function Home() {
  const [input, setInput] = React.useState("");
  const fileInputRef = React.useRef(null);
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [file, setFile] = useState(null);

  // Function to upload file to s3
  const uploadFile = async () => {
    // S3 Bucket Name
    const S3_BUCKET = "bucket-name";

    // S3 Region
    const REGION = "region";

    // S3 Credentials
    AWS.config.update({
      accessKeyId: "youraccesskeyhere",
      secretAccessKey: "yoursecretaccesskeyhere",
    });
    const s3 = new AWS.S3({
      params: { Bucket: S3_BUCKET },
      region: REGION,
    });

    // Files Parameters

    const params = {
      Bucket: S3_BUCKET,
      Key: file.name,
      Body: file,
    };

    // Uploading file to s3

    var upload = s3
      .putObject(params)
      .on("httpUploadProgress", (evt) => {
        // File uploading progress
        console.log(
          "Uploading " + parseInt((evt.loaded * 100) / evt.total) + "%"
        );
      })
      .promise();

    await upload.then((err, data) => {
      console.log(err);
      // Fille successfully uploaded
      alert("File uploaded successfully.");
    });
  };
  // Function to handle file and store it to file state
  const handleFileChange = (e) => {
    // Uploaded file
    const file = e.target.files[0];
    // Changing file state
    setFile(file);
  };

  const uploadFile = async (file: File) => {
    const S3_BUCKET = "bucket-name";
    const REGION = "region";

    AWS.config.update({
      accessKeyId: "youraccesskeyhere",
      secretAccessKey: "yoursecretaccesskeyhere",
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
    const file = e.target.files && e.target.files[0];
    if (!file) {
      console.error("No file selected.");
      return;
    }

    if (file.type !== "application/pdf") {
      console.error("Unsupported file type. Only PDF files are accepted.");
      return;
    }

    const maxFileSize = 5 * 1024 * 1024;
    if (file.size > maxFileSize) {
      console.error("File is too large. Maximum allowed size is 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      // const fileContent = loadEvent.target.result;
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };

    reader.readAsDataURL(file);
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

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
    <Box className="flex flex-col h-screen bg-gray-100">
      <Box className="flex flex-row justify-center items-center bg-green-500 p-4">
        <Typography className="text-white text-2xl">Bedrock PDF Search</Typography>
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
