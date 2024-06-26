"use client";
import React from 'react';
import { useState, ChangeEvent } from "react";
import { Box, TextField, Typography, IconButton, InputAdornment } from '@mui/material';
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
// import { AttachFileIcon, PictureAsPdfIcon } from '@mui/icons-material';
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
          text: result.result || "Decision trees are a type of machine learning model that offer a straightforward and interpretable means of decision-making, based on a series of binary choices—hence their name. Each node in the tree represents a decision point, and this leads to one of two branches that split off based on the answer to the decision point question. This process repeats at each node until a final decision is reached at what are called the leaves of the tree. This structure makes decision trees fully interpretable, as you can trace the path from root to leaf to understand exactly why a decision was made. The appeal of decision trees lies in their simplicity and transparency, making them an excellent tool for tasks requiring understandable models. However, a significant challenge with decision trees, especially those trained solely for accuracy, is that they can inadvertently learn and perpetuate biases present in the training data. This bias can lead to discriminatory outcomes when the model is applied in real-world scenarios. Your proposal for selective fair retraining of decision trees addresses this issue directly. By identifying and modifying specific nodes or subtrees that contribute to biased decisions, your method aims to maintain high accuracy while removing unfair biases. This is achieved by retraining only the problematic portions of the tree, rather than rebuilding the tree from scratch. This approach not only targets fairness but also efficiency, as it potentially reduces the computational cost associated with full model retraining. Your experimental results suggesting that modified trees can achieve higher accuracy than those trained from scratch is significant. It implies that focusing on critical areas for intervention can enhance overall model performance, not just its fairness. This could lead to wider adoption of decision trees in applications where both accuracy and fairness are crucial. Overall, your work contributes to the ongoing discussion in machine learning about achieving a balance between model performance and ethical considerations, making decision trees a more viable option in sensitive and impactful areas like healthcare, finance, and law enforcement.",
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
        height: '100vh', 
        bgcolor: 'grey.50' 
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
            InputProps={{
              endAdornment: (
                file && file.type === 'application/pdf' ? (
                  <InputAdornment position="end">
                    <PictureAsPdfIcon color="error" /> {/* Show PDF icon if a PDF is loaded */}
                  </InputAdornment>
                ) : null
              ),
            }}
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
