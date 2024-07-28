import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Function to send a message or file
  const sendMessageOrFile = async () => {
    if (selectedFile) {
      // Handle file sending
      const messageType = determineFileType(selectedFile);
      const reader = new FileReader();

      reader.onload = async (e) => {
        const messageData = {
          room: room,
          author: username,
          message: e.target.result,
          type: messageType, // New field for content type
          filename: selectedFile.name,
          time:
            new Date(Date.now()).getHours() +
            ":" +
            new Date(Date.now()).getMinutes(),
        };

        console.log("Sending file:", messageData); // Debugging log
        await socket.emit("send_message", messageData);
        setMessageList((list) => [...list, messageData]);
        setSelectedFile(null);
      };

      reader.readAsDataURL(selectedFile); // Convert file to base64 string
    } else if (currentMessage !== "") {
      // Handle text message sending
      const messageType = determineMessageType(currentMessage);
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        type: messageType, // New field for content type
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
      };

      console.log("Sending message:", messageData); // Debugging log
      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  // Function to handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("Selected file:", file); // Debugging log
      setSelectedFile(file);
    }
  };

  // Function to determine file type
  const determineFileType = (file) => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "file";
  };

  // Function to determine message type
  const determineMessageType = (message) => {
    if (isImageUrl(message)) return "image";
    if (isVideoUrl(message)) return "video";
    if (isValidUrl(message)) return "link";
    return "text";
  };

  // Helpers for checking message type
  const isImageUrl = (url) => /\.(jpg|jpeg|png|gif)$/i.test(url);
  const isVideoUrl = (url) => /\.(mp4|webm|ogg)$/i.test(url);
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      console.log("Received message:", data); // Debugging log
      setMessageList((list) => [...list, data]);
    });
  }, [socket]);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <p>Live Chat</p>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container">
          {messageList.map((messageContent, index) => {
            return (
              <div
                key={index}
                className="message"
                id={username === messageContent.author ? "you" : "other"}
              >
                <div>
                  <div className="message-content">
                    {renderMessageContent(messageContent)}
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">{messageContent.author}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollToBottom>
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Hey..."
          onChange={(event) => {
            setCurrentMessage(event.target.value);
          }}
          onKeyPress={(event) => {
            if (event.key === "Enter") sendMessageOrFile();
          }}
        />
        <input
          type="file"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="file-input"
        />
        <button onClick={() => document.getElementById("file-input").click()}>
          📎
        </button>
        <button onClick={sendMessageOrFile}>&#9658;</button>
      </div>
    </div>
  );
}

const renderMessageContent = (messageContent) => {
  switch (messageContent.type) {
    case "image":
      return <img src={messageContent.message} alt="Image" className="chat-image" />;
    case "video":
      return (
        <video controls className="chat-video">
          <source src={messageContent.message} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    case "file":
      return (
        <a href={messageContent.message} download={messageContent.filename}>
          {messageContent.filename}
        </a>
      );
    case "link":
      return (
        <a href={messageContent.message} target="_blank" rel="noopener noreferrer">
          {messageContent.message}
        </a>
      );
    default:
      return <p>{messageContent.message}</p>;
  }
};

export default Chat;
