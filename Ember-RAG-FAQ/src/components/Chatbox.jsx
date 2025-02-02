import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaMicrophone, FaSyncAlt, FaTimes, FaHeart } from "react-icons/fa";
import axios from 'axios';

const Chatbox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [defaultMessageVisible, setDefaultMessageVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatBodyRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };
  const sendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage = input;
    setMessages((prevMessages) => [...prevMessages, { text: userMessage, sender: "user" }]);
    setInput("");
    setDefaultMessageVisible(false);
    setLoading(true);


    // endpoint created to communicate with the backend

    try {
      setTimeout(async () => {
        const response = await axios.post("http://localhost:5000/api/message", { message: userMessage });
        const botResponse = response.data.response;
        
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: botResponse, sender: "bot" },
        ]);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error fetching bot response:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Sorry, there was an error processing your request.", sender: "bot" },
      ]);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const refreshChat = () => {
    setMessages([]);
    setInput("");
    setDefaultMessageVisible(true);
  };

  return (
    <>
      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <div className="title">
              <img src="./src/assets/nasa.jpeg" alt="User avatar" className="avatar" />
              NASA STYLE GUIDE
            </div>
            <div className="header-actions">
              <button className="refresh-btn" onClick={refreshChat}><FaSyncAlt /></button>
              <button className="close-btn" onClick={() => setIsOpen(false)}><FaTimes /></button>
            </div>
          </div>

          <div className="chat-body" ref={chatBodyRef}>
            {defaultMessageVisible && (
              <div className="chat-message bot">
                <img src="./src/assets/nasa.jpeg" alt="Bot" className="message-avatar" />
                <div className="message">Ask me anything</div>
              </div>
            )}
            
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.sender}`}>
                {msg.sender === "bot" ? (
                  <>
                    <img src="./src/assets/nasa.jpeg" alt="Bot" className="message-avatar" />
                    <div className="message">{msg.text}</div>
                  </>
                ) : (
                  <div className="message">{msg.text}</div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-message bot">
                <img src="./src/assets/Nasa.png" alt="Bot" className="message-avatar" />
                <div className="message typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          <div className="chat-footer">
            <div className="input-container">
              <input
                type="text"
                placeholder="Ask me anything"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button className="send-btn" onClick={sendMessage}>
                <FaPaperPlane />
              </button>
            </div>
            <button className={`mic-btn ${isListening ? "active" : ""}`} onClick={startListening}>
              <FaMicrophone />
            </button>
          </div>

          <div className="footer-note">
            Made with <FaHeart className="icon" /> by <a href="#">Copianto</a>
          </div>
        </div>
      )}

      <div className="floating-button" onClick={() => setIsOpen(!isOpen)}>
        <img src="src/assets/nasa.jpeg" alt="Chatbot" />
        <p className="inscription"><span className="footer-text">NASA</span><br />Ask just about anything</p>
      </div>
    </>
  );
};

export default Chatbox;
