import React from 'react';
import { useParams } from 'react-router-dom';
import Chat from './Chat';
import '../styles/ChatPage.css';

const ChatPage = () => {
    const { sessionId } = useParams();

    return (
        <div className="chat-page-container">
            {sessionId ? (
                <Chat sessionId={sessionId} />
            ) : (
                <div className="select-chat-message">
                    <h2>Select a conversation</h2>
                    <p>Choose a skill exchange session from the list to start chatting</p>
                </div>
            )}
        </div>
    );
};

export default ChatPage;