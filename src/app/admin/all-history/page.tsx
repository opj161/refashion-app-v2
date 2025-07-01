'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAllUsersHistoryForAdmin } from '@/actions/historyActions';
import type { HistoryItem, ModelAttributes } from '@/lib/types';

export default function AllHistoryPage() {
  const [allHistory, setAllHistory] = useState<{ [username: string]: HistoryItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getAllUsersHistoryForAdmin();
        setAllHistory(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">All Users History (Admin)</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">All Users History (Admin)</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  const usernames = Object.keys(allHistory);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">All Users History (Admin)</h1>
      
      {usernames.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No user history found.
        </div>
      ) : (
        <div className="space-y-8">
          {usernames.map((username) => {
            const userHistory = allHistory[username];
            const totalImages = userHistory.length;
            
            return (
              <div key={username} className="bg-white shadow-lg rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    User: {username}
                  </h2>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {totalImages} image{totalImages !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {userHistory.length === 0 ? (
                  <p className="text-gray-500 italic">No images generated yet.</p>
                ) : (                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userHistory.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {item.editedImageUrls.map((imageUrl, index) => (
                            imageUrl && (
                              <div key={index} className="aspect-square relative">
                                <Image
                                  src={imageUrl}
                                  alt={`Generated image ${index + 1}`}
                                  layout="fill"
                                  objectFit="cover"
                                  className="rounded-lg"
                                />
                              </div>
                            )
                          ))}
                        </div>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          <strong>Prompt:</strong> {item.constructedPrompt}
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          <strong>Attributes:</strong> {[
                            item.attributes.gender !== 'default' ? item.attributes.gender : '',
                            item.attributes.bodyType !== 'default' ? item.attributes.bodyType : '',
                            item.attributes.ethnicity !== 'default' ? item.attributes.ethnicity : ''
                          ].filter(Boolean).join(', ') || 'Default'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleDateString()} at{' '}
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-8 text-center">
        <Link
          href="/" 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
