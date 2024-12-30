import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
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
  const { token } = useAuth();
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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

    // Mesaj geçmişini al
    socket.on('chat:history', (history: Message[]) => {
      setMessages(
        history.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
      );
    });

    // Yeni mesaj geldiğinde
    socket.on('chat:message', (message: Message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          timestamp: new Date(message.timestamp),
        },
      ]);
    });

    // Yazıyor durumu
    socket.on('chat:typing', ({ username }: { username: string }) => {
      setTypingUsers((prev) => {
        const now = Date.now();
        // Eski yazıyor durumlarını temizle
        const filtered = prev.filter(
          (user) => user.username !== username && now - user.timestamp < 3000
        );
        return [...filtered, { username, timestamp: now }];
      });
    });

    // Hata durumları
    socket.on('chat:error', (error: ChatError) => {
      console.error('Chat hatası:', error.message);
      // TODO: Kullanıcıya hata mesajını göster
    });

    return () => {
      socket.off('chat:history');
      socket.off('chat:message');
      socket.off('chat:typing');
      socket.off('chat:error');
    };
  }, [socket]);

  // Yazıyor durumunu temizle
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        return prev.filter((user) => now - user.timestamp < 3000);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Mesaj gönder
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !newMessage.trim()) return;

    socket.emit('chat:message', { text: newMessage.trim() });
    setNewMessage('');
  };

  // Yazıyor durumunu gönder
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

  // Otomatik scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Chat</h2>
        <p className="text-sm text-gray-500">
          Mesajlar 7 gün sonra otomatik silinir
        </p>
      </div>

      {/* Mesaj Listesi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${
              message.userId === socket?.id ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium">{message.username}</span>
              <span className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.userId === socket?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
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
          {typingUsers.map((user) => user.username).join(', ')} yazıyor...
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
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gönder
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
