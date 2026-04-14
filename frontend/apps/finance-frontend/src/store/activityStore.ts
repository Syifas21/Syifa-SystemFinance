import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Activity {
  id: string;
  type: 'approval' | 'rejection' | 'comment' | 'status_change' | 'escalation';
  actor: {
    name: string;
    role: string;
  };
  action: string;
  target: string;
  timestamp: string;
  details?: string;
  comments?: Comment[];
  likes?: string[];
  metadata?: any;
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

interface ActivityState {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  addComment: (activityId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  toggleLike: (activityId: string, userName: string) => void;
  getActivities: () => Activity[];
}

// Broadcast Channel for cross-tab communication
const activityChannel = typeof window !== 'undefined'
  ? new BroadcastChannel('activities')
  : null;

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: [],

      addActivity: (activity) => {
        const newActivity: Activity = {
          ...activity,
          id: `activity_${Date.now()}_${Math.random()}`,
          timestamp: new Date().toISOString(),
          comments: [],
          likes: [],
        };

        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 100),
        }));

        // Broadcast to other tabs
        if (activityChannel) {
          activityChannel.postMessage({
            type: 'NEW_ACTIVITY',
            activity: newActivity,
          });
        }
      },

      addComment: (activityId, comment) => {
        const newComment: Comment = {
          ...comment,
          id: `comment_${Date.now()}_${Math.random()}`,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === activityId
              ? {
                  ...activity,
                  comments: [...(activity.comments || []), newComment],
                }
              : activity
          ),
        }));

        // Broadcast to other tabs
        if (activityChannel) {
          activityChannel.postMessage({
            type: 'NEW_COMMENT',
            activityId,
            comment: newComment,
          });
        }

        // Create notification for the other user
        const activity = get().activities.find((a) => a.id === activityId);
        if (activity) {
          // Import will be done at runtime to avoid circular dependency
          import('./notificationStore').then(({ useNotificationStore }) => {
            useNotificationStore.getState().addNotification({
              type: 'comment',
              priority: 'medium',
              title: `New Comment on ${activity.target}`,
              message: `${comment.author.name} commented: "${comment.content}"`,
              from: comment.author,
              actionUrl: '/approvals/margin',
              recipientRole: comment.author.role === 'CEO' ? 'FINANCE_ADMIN' : 'CEO',
              isRead: false,
            });
          });
        }
      },

      toggleLike: (activityId, userName) => {
        set((state) => ({
          activities: state.activities.map((activity) => {
            if (activity.id === activityId) {
              const likes = activity.likes || [];
              const hasLiked = likes.includes(userName);
              return {
                ...activity,
                likes: hasLiked
                  ? likes.filter((name) => name !== userName)
                  : [...likes, userName],
              };
            }
            return activity;
          }),
        }));

        // Broadcast to other tabs
        if (activityChannel) {
          activityChannel.postMessage({
            type: 'TOGGLE_LIKE',
            activityId,
            userName,
          });
        }
      },

      getActivities: () => get().activities,
    }),
    {
      name: 'activity-storage',
    }
  )
);

// Listen to broadcast messages from other tabs
if (activityChannel) {
  activityChannel.onmessage = (event) => {
    const { type, activity, activityId, comment, userName } = event.data;

    if (type === 'NEW_ACTIVITY') {
      useActivityStore.setState((state) => ({
        activities: [activity, ...state.activities].slice(0, 100),
      }));
    } else if (type === 'NEW_COMMENT') {
      useActivityStore.setState((state) => ({
        activities: state.activities.map((a) =>
          a.id === activityId
            ? {
                ...a,
                comments: [...(a.comments || []), comment],
              }
            : a
        ),
      }));
    } else if (type === 'TOGGLE_LIKE') {
      useActivityStore.setState((state) => ({
        activities: state.activities.map((a) => {
          if (a.id === activityId) {
            const likes = a.likes || [];
            const hasLiked = likes.includes(userName);
            return {
              ...a,
              likes: hasLiked
                ? likes.filter((name) => name !== userName)
                : [...likes, userName],
            };
          }
          return a;
        }),
      }));
    }
  };
}
