import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';

interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

interface TypingUser {
  username: string;
  timestamp: number;
}

interface ChatError {
  message: string;
}

const Chat: React.FC = () => {
  const { token, user } = useAuth();
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // URL'den gelen repo bilgisini kullan
  useEffect(() => {
    if (owner && repo) {
      setSelectedRepo(`${owner}/${repo}`);
    }
  }, [owner, repo]);

  // Socket.IO bağlantısını kur
  useEffect(() => {
    if (!token) return;

    const newSocket = io(`${import.meta.env.VITE_API_URL}/chat`, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Chat sunucusuna bağlanıldı');
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('Bağlantı hatası:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  // Socket event dinleyicileri
  useEffect(() => {
    if (!socket) return;

    socket.on('chat:history', (history: Message[]) => {
      setMessages(
        history.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
      );
    });

    socket.on('chat:message', (message: Message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          timestamp: new Date(message.timestamp),
        },
      ]);
    });

    socket.on('chat:typing', ({ username }: { username: string }) => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const filtered = prev.filter(
          (user) => user.username !== username && now - user.timestamp < 3000
        );
        return [...filtered, { username, timestamp: now }];
      });
    });

    socket.on('chat:error', (error: ChatError) => {
      console.error('Chat hatası:', error.message);
      // TODO: Toast ile hata mesajını göster
    });

    return () => {
      socket.off('chat:history');
      socket.off('chat:message');
      socket.off('chat:typing');
      socket.off('chat:error');
    };
  }, [socket]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        return prev.filter((user) => now - user.timestamp < 3000);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form gönderme tetiklendi');
    console.log('Socket durumu:', socket?.connected);
    console.log('Mesaj:', newMessage.trim());

    if (!socket) {
      console.error('Socket bağlantısı yok');
      return;
    }

    if (!socket.connected) {
      console.error('Socket bağlantısı kopuk');
      return;
    }

    if (!newMessage.trim()) {
      console.log('Mesaj boş');
      return;
    }

    const messageData = {
      text: newMessage.trim(),
      ...(selectedRepo && searchQuery
        ? {
            repoId: selectedRepo,
            searchQuery,
          }
        : {}),
    };

    console.log('Gönderilecek mesaj:', messageData);
    socket.emit('chat:message', messageData);
    setNewMessage('');
    setSearchQuery('');
  };

  const handleTyping = () => {
    if (!socket) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit('chat:typing');
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = undefined;
    }, 3000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              {selectedRepo ? `Chat - ${selectedRepo}` : 'Chat'}
            </h2>
            <p className="text-sm text-gray-500">
              AI ile sohbet edin ve repo dosyalarınız hakkında sorular sorun
            </p>
          </div>

          {/* Mesaj Listesi */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={`${message.id}-${message.timestamp}`}
                className={`flex flex-col ${
                  message.type === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium">
                    {message.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-emerald-100'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Yazıyor Göstergesi */}
          {typingUsers.length > 0 && (
            <div className="px-4 py-2 text-sm text-gray-500">
              {typingUsers.map((user, index) => (
                <span key={`${user.username}-${user.timestamp}`}>
                  {index > 0 && ', '}
                  {user.username}
                </span>
              ))}{' '}
              yazıyor...
            </div>
          )}

          {/* Repo Arama - URL'den gelen repo varsa gizle */}
          {!owner &&
            !repo &&
            user?.indexedRepos &&
            user.indexedRepos.length > 0 && (
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Repo seçin (opsiyonel)</option>
                    {user.indexedRepos.map((repo) => (
                      <option
                        key={`${repo.owner}/${repo.name}`}
                        value={`${repo.owner}/${repo.name}`}
                      >
                        {repo.owner}/{repo.name}
                      </option>
                    ))}
                  </select>
                  {selectedRepo && (
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Dosya arama sorgusu..."
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            )}

          {/* Mesaj Gönderme Formu */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Mesajınızı yazın..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !socket?.connected}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => console.log('Gönder butonuna tıklandı')}
              >
                {socket?.connected ? 'Gönder' : 'Bağlanıyor...'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
