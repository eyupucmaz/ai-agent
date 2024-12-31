import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import { useIndexedFiles } from '../context/useVector';

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
  const {
    indexedRepos,
    loading: indexedFilesLoading,
    error: indexedFilesError,
  } = useIndexedFiles();
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Loglama için useEffect
  useEffect(() => {
    console.log('Chat bileşeni render edildi');
    console.log('İndekslenen repolar:', indexedRepos);
    console.log('Yükleniyor:', indexedFilesLoading);
    console.log('Hata:', indexedFilesError);
    console.log('Render durumu:', {
      loading: indexedFilesLoading,
      error: indexedFilesError,
      reposLength: indexedRepos?.length,
      isArray: Array.isArray(indexedRepos),
    });
  }, [indexedRepos, indexedFilesLoading, indexedFilesError]);

  // URL'den gelen repo bilgisini kullan
  useEffect(() => {
    if (owner && repo) {
      const fullRepoName = `${owner}/${repo}`;
      setSelectedRepo(fullRepoName);
      // Socket bağlantısı varsa, yeni repo için chat odasına katıl
      if (socket) {
        socket.emit('chat:join', { repoId: fullRepoName });
      }
    }
  }, [owner, repo, socket]);

  // Socket.IO bağlantısını kur
  useEffect(() => {
    if (!token) return;

    const newSocket = io(`${import.meta.env.VITE_API_URL}/chat`, {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket bağlantısı kuruldu');
      if (selectedRepo) {
        newSocket.emit('chat:join', { repoId: selectedRepo });
      }
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('Bağlantı hatası:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, selectedRepo]);

  // Socket event dinleyicileri
  useEffect(() => {
    if (!socket) return;

    const messageHandler = (message: Message) => {
      if (message.type === 'ai') {
        setIsWaitingResponse(false);
      }
      setMessages((prevMessages) => [...prevMessages, message]);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const historyHandler = (history: Message[]) => {
      setMessages(history);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const typingHandler = ({ username }: { username: string }) => {
      setTypingUsers((prevUsers) => {
        const now = Date.now();
        return [
          ...prevUsers.filter((u) => u.username !== username),
          { username, timestamp: now },
        ];
      });
    };

    const errorHandler = (error: ChatError) => {
      console.error('Socket hatası:', error);
      setIsWaitingResponse(false);
    };

    socket.on('chat:message', messageHandler);
    socket.on('chat:history', historyHandler);
    socket.on('chat:typing', typingHandler);
    socket.on('chat:error', errorHandler);

    return () => {
      socket.off('chat:message', messageHandler);
      socket.off('chat:history', historyHandler);
      socket.off('chat:typing', typingHandler);
      socket.off('chat:error', errorHandler);
    };
  }, [socket]);

  // Typing users cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prevUsers) => {
        const now = Date.now();
        return prevUsers.filter((user) => now - user.timestamp < 3000);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !newMessage.trim()) return;

    const message: Omit<Message, 'id' | 'timestamp'> = {
      userId: user?.id || '',
      username: user?.username || '',
      text: newMessage.trim(),
      type: 'user',
    };

    socket.emit('chat:message', {
      ...message,
      repoId: selectedRepo || '',
    });

    setNewMessage('');
    setIsWaitingResponse(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = () => {
    if (!socket) return;

    socket.emit('chat:typing', {
      username: user?.username,
      repoId: selectedRepo,
    });
  };

  // Debug için log ekleyelim
  useEffect(() => {
    console.log('Seçili repo:', selectedRepo);
    console.log('Bekleme durumu:', isWaitingResponse);
  }, [selectedRepo, isWaitingResponse]);

  // Render
  if (indexedFilesLoading) {
    return <div className="p-4">Yükleniyor...</div>;
  }

  if (indexedFilesError) {
    return <div className="p-4 text-red-500">Hata: {indexedFilesError}</div>;
  }

  const currentRepo = indexedRepos.find((r) => r.repo === selectedRepo);
  const isRepoIndexing = currentRepo?.status === 'indexing';
  const indexingProgress = currentRepo?.progress;
  const indexingError = currentRepo?.error;

  return (
    <div className="flex h-screen">
      {/* Ana sohbet alanı */}
      <div className="flex-1 flex flex-col">
        {/* Repo durumu */}
        {selectedRepo && (
          <div className="p-4 bg-gray-100">
            <h2 className="text-lg font-semibold">{selectedRepo}</h2>
            {isRepoIndexing && indexingProgress && (
              <div className="text-sm text-gray-600">
                İndeksleniyor: {indexingProgress.current} /{' '}
                {indexingProgress.total}{' '}
                {indexingProgress.failed > 0 &&
                  `(${indexingProgress.failed} hatalı)`}
              </div>
            )}
            {indexingError && (
              <div className="text-sm text-red-500">Hata: {indexingError}</div>
            )}
          </div>
        )}

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 ${
                message.type === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200'
                }`}
              >
                <div className="text-sm font-semibold">{message.username}</div>
                <div>{message.text}</div>
              </div>
            </div>
          ))}
          {isWaitingResponse && (
            <div className="flex items-center space-x-1 text-gray-500 mb-4">
              <div
                className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing göstergesi */}
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

        {/* Mesaj formu */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Bir mesaj yazın..."
              className="flex-1 p-2 border rounded"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={!newMessage.trim() || isWaitingResponse}
            >
              {isWaitingResponse ? 'Yanıt Bekleniyor...' : 'Gönder'}
            </button>
          </div>
        </form>
      </div>

      {/* Sağ sidebar - İndekslenen Repolar */}
      <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">İndekslenen Repolar</h2>
        {indexedRepos.length === 0 ? (
          <p className="text-gray-500">Henüz indekslenen repo bulunmuyor.</p>
        ) : (
          <ul className="space-y-2">
            {indexedRepos.map((repo) => (
              <li
                key={repo.repo}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  selectedRepo === repo.repo
                    ? 'bg-blue-100 border-blue-300'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedRepo(repo.repo)}
              >
                <div className="font-medium">{repo.repo}</div>
                <div className="text-sm text-gray-600">
                  {repo.status === 'indexing' ? (
                    <span className="text-yellow-600">İndeksleniyor...</span>
                  ) : repo.status === 'completed' ? (
                    <span className="text-green-600">Tamamlandı</span>
                  ) : (
                    <span className="text-red-600">Hata</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Chat;
