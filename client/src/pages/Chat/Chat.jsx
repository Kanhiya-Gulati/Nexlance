import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import * as chatService from '../../services/chatService';
import { formatRelativeTime, getInitials } from '../../utils/helpers';
import Spinner from '../../components/Spinner/Spinner';
import './Chat.css';

/**
 * Chat - Real-time messaging page.
 * Left panel: conversation list.
 * Right panel: active message thread.
 */
const Chat = () => {
  const { conversationId: paramConvId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(paramConvId || null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helper to make URLs in text messages clickable links
  const renderTextWithLinks = (text) => {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1dbf73', textDecoration: 'underline', fontWeight: '600' }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Helper to render message content with link parsing and file attachment previews
  const renderMessageContent = (msg) => {
    if (msg.fileUrl) {
      if (msg.fileType === 'image') {
        return (
          <div className="chat-msg__attachment chat-msg__attachment--image" style={{ marginTop: '4px' }}>
            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
              <img
                src={msg.fileUrl}
                alt={msg.fileName || 'Attachment'}
                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', cursor: 'zoom-in', display: 'block' }}
              />
            </a>
            {msg.content && msg.content !== `Sent an attachment: ${msg.fileName}` && (
              <p className="chat-msg__text" style={{ marginTop: '8px', wordBreak: 'break-word' }}>
                {renderTextWithLinks(msg.content)}
              </p>
            )}
          </div>
        );
      } else {
        return (
          <div className="chat-msg__attachment chat-msg__attachment--file" style={{ marginTop: '4px' }}>
            <a
              href={msg.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="attachment-link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.05)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '0.85rem'
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{msg.fileType === 'pdf' ? '📄' : '📁'}</span>
              <span style={{ textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                {msg.fileName || 'Download File'}
              </span>
              <span style={{ opacity: 0.6, fontSize: '0.75rem', marginLeft: 'auto' }}>Download</span>
            </a>
            {msg.content && msg.content !== `Sent an attachment: ${msg.fileName}` && (
              <p className="chat-msg__text" style={{ marginTop: '8px', wordBreak: 'break-word' }}>
                {renderTextWithLinks(msg.content)}
              </p>
            )}
          </div>
        );
      }
    }
    return <p className="chat-msg__text">{renderTextWithLinks(msg.content)}</p>;
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size cannot exceed 10MB', 'warning');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('file', file);

    setUploadingFile(true);
    showToast('Uploading file...', 'info');

    try {
      const data = await chatService.uploadFile(formDataToSend);
      if (data.success) {
        const activeConv = conversations.find(c => c._id === activeConvId);
        const other = getOtherUser(activeConv);
        const recipientId = other?._id || other;

        socket?.emit('sendMessage', {
          conversationId: activeConvId,
          senderId: user._id,
          recipientId,
          content: `Sent an attachment: ${file.name}`,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileType: data.fileType
        });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'File upload failed.', 'error');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  // Fetch all conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      // Reset unread count locally for the active conversation
      setConversations(prev =>
        prev.map(conv =>
          conv._id === activeConvId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
      navigate(`/chat/${activeConvId}`, { replace: true });
    }
  }, [activeConvId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('receiveMessage', (message) => {
      setMessages(prev => [...prev, message]);
      // Update conversation last message or fetch list if it's a new conversation
      setConversations(prev => {
        const exists = prev.some(conv => conv._id === message.conversation);
        if (exists) {
          return prev.map(conv =>
            conv._id === message.conversation
              ? {
                  ...conv,
                  lastMessage: message,
                  // Increment unreadCount if the incoming message is not for the currently active conversation
                  unreadCount: conv._id === activeConvId ? 0 : (conv.unreadCount || 0) + 1
                }
              : conv
          );
        } else {
          // If conversation is new, reload the conversation list to show it
          fetchConversations();
          return prev;
        }
      });
    });

    socket.on('userTyping', ({ userId, conversationId }) => {
      if (conversationId === activeConvId) {
        setTypingUsers(prev => ({ ...prev, [userId]: true }));
      }
    });

    socket.on('userStopTyping', ({ userId }) => {
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('userTyping');
      socket.off('userStopTyping');
    };
  }, [socket, activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoadingConvs(true);
      // Backend returns { success, conversations: [...] }
      const data = await chatService.getConversations();
      const convs = data.conversations || [];
      setConversations(convs);
      if (!activeConvId && convs.length > 0) {
        setActiveConvId(convs[0]._id);
      }
    } catch (err) {
      showToast('Failed to load conversations.', 'error');
    } finally {
      setLoadingConvs(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      setLoadingMsgs(true);
      setMessages([]);
      // Backend returns { success, messages: [...] }
      const data = await chatService.getMessages(convId);
      setMessages(data.messages || []);
    } catch (err) {
      showToast('Failed to load messages.', 'error');
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text || !activeConvId || sending) return;

    setSending(true);
    setMessageText('');

    // Get the recipient robustly
    const activeConv = conversations.find(c => c._id === activeConvId);
    const other = getOtherUser(activeConv);
    const recipientId = other?._id || other;

    try {
      socket?.emit('sendMessage', {
        conversationId: activeConvId,
        senderId: user._id,
        recipientId,
        content: text,
      });
    } catch (err) {
      showToast('Failed to send message.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);

    const activeConv = conversations.find(c => c._id === activeConvId);
    const recipientId = activeConv?.participants?.find(p => p._id !== user._id)?._id;

    if (socket && recipientId) {
      socket.emit('typing', { recipientId, conversationId: activeConvId });
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socket.emit('stopTyping', { recipientId, conversationId: activeConvId });
      }, 1500);
    }
  };

  const getOtherUser = (conv) => {
    if (!conv || !conv.participants || !user) return null;
    const userIdStr = user._id?.toString();
    return conv.participants.find(p => {
      const pIdStr = (p._id || p).toString();
      return pIdStr !== userIdStr;
    });
  };

  const isOnline = (userId) => {
    return Array.isArray(onlineUsers) && onlineUsers.includes(userId);
  };

  const activeConv = conversations.find(c => c._id === activeConvId);
  const otherUser = activeConv ? getOtherUser(activeConv) : null;
  const isOtherTyping = Object.keys(typingUsers).length > 0;

  return (
    <div className="page-container chat-page">
      <div className="chat-layout">
        {/* Sidebar - Conversation List */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2 className="chat-sidebar-title">Messages</h2>
            {conversations.length > 0 && (
              <span className="chat-sidebar-count">{conversations.length}</span>
            )}
          </div>

          {loadingConvs ? (
            <div className="chat-sidebar__loading"><Spinner size="md" /></div>
          ) : conversations.length === 0 ? (
            <div className="chat-sidebar__empty">
              <p>💬</p>
              <p>No conversations yet.</p>
            </div>
          ) : (
            <ul className="conversations-list">
              {conversations.map((conv) => {
                const other = getOtherUser(conv);
                const isActive = conv._id === activeConvId;
                const online = isOnline(other?._id);

                return (
                  <li key={conv._id}>
                    <button
                      className={`conversation-item ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveConvId(conv._id)}
                    >
                      <div className="conv-avatar">
                        {other?.avatar ? (
                          <img src={other.avatar} alt={other.name} />
                        ) : (
                          <div className="chat-conv-item__initials">
                            {getInitials(other?.name || '?')}
                          </div>
                        )}
                        {online && <span className="conv-online-dot" />}
                      </div>
                      <div className="conv-info">
                        <span className="conv-name">{other?.name || 'User'}</span>
                        <p className="conv-preview">
                          {conv.lastMessage?.content || 'Start the conversation...'}
                        </p>
                        <div className="conv-meta">
                          {conv.lastMessage && (
                            <span className="conv-time">
                              {formatRelativeTime(conv.lastMessage.createdAt)}
                            </span>
                          )}
                          {conv.unreadCount > 0 && (
                            <span className="conv-unread">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Main - Message Thread */}
        <main className="chat-main">
          {!activeConvId ? (
            <div className="chat-main__empty">
              <div className="chat-empty-icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the left to start messaging.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                {otherUser && (
                  <>
                    <Link to={`/profile/${otherUser._id}`} className="chat-header__user">
                      <div className="chat-header__avatar">
                        {otherUser.avatar ? (
                          <img src={otherUser.avatar} alt={otherUser.name} />
                        ) : (
                          <div className="chat-header__initials">
                            {getInitials(otherUser.name)}
                          </div>
                        )}
                        {isOnline(otherUser._id) && (
                          <span className="chat-header__online" />
                        )}
                      </div>
                      <div>
                        <p className="chat-header__name">{otherUser.name}</p>
                        <p className="chat-header__status">
                          {isOnline(otherUser._id) ? '● Online' : 'Offline'}
                        </p>
                      </div>
                    </Link>
                  </>
                )}
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {loadingMsgs ? (
                  <div className="chat-messages__loading"><Spinner size="md" /></div>
                ) : messages.length === 0 ? (
                  <div className="chat-messages__empty">
                    <p>No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isMine = msg.sender === user._id || msg.sender?._id === user._id;
                      return (
                        <div
                          key={msg._id}
                          className={`chat-msg ${isMine ? 'chat-msg--mine' : 'chat-msg--theirs'}`}
                        >
                          <div className="chat-msg__bubble">
                            {renderMessageContent(msg)}
                            <span className="chat-msg__time">
                              {formatRelativeTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {isOtherTyping && (
                      <div className="chat-msg chat-msg--theirs">
                        <div className="chat-msg__bubble chat-msg__typing">
                          <span /><span /><span />
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form className="chat-input-form" onSubmit={handleSend}>
                <input
                  type="file"
                  id="chat-file-upload"
                  name="chat-file-upload"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                />
                
                <button
                  type="button"
                  className="chat-attach-btn"
                  onClick={handleAttachClick}
                  disabled={uploadingFile || sending}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'var(--transition)'
                  }}
                  title="Attach file (Max 10MB)"
                >
                  📎
                </button>

                <input
                  type="text"
                  id="chat-message-input"
                  name="chat-message-input"
                  className="chat-input"
                  placeholder={uploadingFile ? "Uploading file..." : "Type a message..."}
                  value={messageText}
                  onChange={handleTyping}
                  autoComplete="off"
                  disabled={sending || uploadingFile}
                />
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!messageText.trim() || sending || uploadingFile}
                  aria-label="Send message"
                >
                  ➤
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;
