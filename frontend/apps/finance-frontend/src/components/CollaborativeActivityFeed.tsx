import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserCircleIcon,
  PaperAirplaneIcon,
  HeartIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useAuthStore } from '../store/authStore';
import { useActivityStore } from '../store/activityStore';

interface Activity {
  id: string;
  type: 'approval' | 'rejection' | 'comment' | 'status_change' | 'escalation';
  actor: {
    name: string;
    role: string;
    avatar?: string;
  };
  action: string;
  target: string;
  timestamp: string;
  details?: string;
  comments?: Comment[];
  likes?: string[];
  metadata?: {
    amount?: number;
    impactScore?: number;
    tags?: string[];
  };
}

interface Comment {
  id: string;
  author: {
    name: string;
    role: string;
  };
  content: string;
  timestamp: string;
}

const CollaborativeActivityFeed: React.FC = () => {
  const { user } = useAuthStore();
  const { activities, addComment, toggleLike } = useActivityStore();
  
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [expandedActivities, setExpandedActivities] = useState<string[]>([]);

  // Auto-expand first 2 activities
  useEffect(() => {
    if (activities.length > 0 && expandedActivities.length === 0) {
      setExpandedActivities(activities.slice(0, 2).map((a) => a.id));
    }
  }, [activities]);

  const handleAddComment = (activityId: string) => {
    const commentText = newComment[activityId];
    if (!commentText || commentText.trim() === '' || !user) return;

    addComment(activityId, {
      author: {
        name: user.full_name,
        role: user.role === 'CEO' ? 'Chief Executive Officer' : 'Finance Department',
      },
      content: commentText,
    });

    setNewComment((prev) => ({ ...prev, [activityId]: '' }));
  };

  const handleLike = (activityId: string) => {
    if (!user) return;
    toggleLike(activityId, user.full_name);
  };

  const toggleExpand = (activityId: string) => {
    setExpandedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      case 'rejection':
        return <XCircleIcon className="h-6 w-6 text-red-600" />;
      case 'comment':
        return <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />;
      case 'status_change':
        return <ArrowPathIcon className="h-6 w-6 text-purple-600" />;
      case 'escalation':
        return <ClockIcon className="h-6 w-6 text-orange-600" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <h2 className="text-2xl font-bold flex items-center">
          <ChatBubbleLeftRightIcon className="h-8 w-8 mr-3" />
          Collaborative Activity Feed
        </h2>
        <p className="mt-2 text-purple-100">
          Real-time collaboration between CEO and Finance team
        </p>
      </div>

      {/* Activity Timeline */}
      <div className="p-6">
        <div className="space-y-6">
          {activities.map((activity, idx) => {
            const isExpanded = expandedActivities.includes(activity.id);
            const hasComments = activity.comments && activity.comments.length > 0;
            const likesCount = activity.likes?.length || 0;
            const hasLiked = activity.likes?.includes('Current User');

            return (
              <div key={activity.id} className="relative">
                {/* Timeline Line */}
                {idx < activities.length - 1 && (
                  <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200" />
                )}

                {/* Activity Card */}
                <div className="relative bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                  {/* Main Activity */}
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 bg-white rounded-full p-2 shadow">
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Actor & Action */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm">
                            <span className="font-bold text-gray-900">
                              {activity.actor.name}
                            </span>{' '}
                            <span className="text-gray-600">{activity.action}</span>{' '}
                            <span className="font-semibold text-blue-600">
                              {activity.target}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      {activity.details && (
                        <p className="text-sm text-gray-700 mb-3 bg-white rounded-lg p-3 border border-gray-200">
                          {activity.details}
                        </p>
                      )}

                      {/* Metadata */}
                      {activity.metadata && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {activity.metadata.amount && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                              {formatCurrency(activity.metadata.amount)}
                            </span>
                          )}
                          {activity.metadata.impactScore && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                              Impact: {activity.metadata.impactScore}/10
                            </span>
                          )}
                          {activity.metadata.tags?.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Interaction Bar */}
                      <div className="flex items-center space-x-4 text-sm">
                        <button
                          onClick={() => handleLike(activity.id)}
                          className={`flex items-center space-x-1 ${
                            hasLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                          } transition-colors`}
                        >
                          {hasLiked ? (
                            <HeartIconSolid className="h-5 w-5" />
                          ) : (
                            <HeartIcon className="h-5 w-5" />
                          )}
                          <span className="font-medium">{likesCount}</span>
                        </button>

                        <button
                          onClick={() => toggleExpand(activity.id)}
                          className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <ChatBubbleLeftRightIcon className="h-5 w-5" />
                          <span className="font-medium">
                            {activity.comments?.length || 0} Comments
                          </span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3">
                          {/* Existing Comments */}
                          {hasComments && (
                            <div className="space-y-2">
                              {activity.comments!.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="bg-white rounded-lg p-3 border border-gray-200"
                                >
                                  <div className="flex items-start space-x-2">
                                    <UserCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-sm font-semibold text-gray-900">
                                          {comment.author.name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          • {comment.timestamp}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700">{comment.content}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Comment */}
                          <div className="flex items-start space-x-2">
                            <UserCircleIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 flex space-x-2">
                              <input
                                type="text"
                                value={newComment[activity.id] || ''}
                                onChange={(e) =>
                                  setNewComment((prev) => ({
                                    ...prev,
                                    [activity.id]: e.target.value,
                                  }))
                                }
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddComment(activity.id);
                                  }
                                }}
                                placeholder="Add a comment..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => handleAddComment(activity.id)}
                                className="px-4 py-2 rounded-lg transition-colors"
                                style={{ backgroundColor: '#3B82F6', color: '#ffffff' }}
                              >
                                <PaperAirplaneIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CollaborativeActivityFeed;
