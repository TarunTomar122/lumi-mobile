import { getBusySlots } from './calendar';
import notifee, {
  AndroidImportance,
  TimestampTrigger,
  TriggerType,
  AndroidColor,
} from '@notifee/react-native';
import { db } from './database';
import type { Task } from './database';

const clientToolsSchema = [
  {
    type: 'function',
    name: 'getAllTasks',
    description: 'Gets all tasks from the local database.',
  },
  {
    type: 'function',
    name: 'addTask',
    description: 'Adds a task to the local database.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the task' },
        description: { type: 'string', description: 'Optional description of the task' },
        category: { type: 'string', description: 'Category of the task' },
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'done'],
          description: 'Status of the task',
        },
        due_date: { type: 'string', description: 'Due date in ISO format' },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Priority of the task',
        },
        reminder_time: { 
          type: 'string', 
          description: 'Optional reminder time in ISO format' 
        },
      },
      required: ['title', 'category', 'status', 'due_date', 'priority'],
    },
  },
  {
    type: 'function',
    name: 'deleteTask',
    description: 'Deletes a task from the local database.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'ID of the task to delete' },
      },
      required: ['id'],
    },
  },
  {
    type: 'function',
    name: 'updateTask',
    description: 'Updates a task in the local database.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'ID of the task to update' },
        title: { type: 'string', description: 'Title of the task' },
        description: { type: 'string', description: 'Optional description of the task' },
        category: { type: 'string', description: 'Category of the task' },
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'done'],
          description: 'Status of the task',
        },
        due_date: { type: 'string', description: 'Due date in ISO format' },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Priority of the task',
        },
        reminder_time: { 
          type: 'string', 
          description: 'Optional reminder time in ISO format' 
        },
      },
      required: ['id'],
    },
  },
];

const clientTools = {
  getAllTasks: async () => {
    try {
      const tasks = await db.getAllTasks();
      return { success: true, tasks };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return { success: false, error: 'Failed to fetch tasks.' };
    }
  },

  addTask: async (taskData: Omit<Task, 'id' | 'created_at'>) => {
    try {
      let notificationId = null;
      if (taskData.reminder_time) {
        notificationId = await scheduleNotification(
          taskData.title,
          taskData.description || null,
          new Date(taskData.reminder_time)
        );
      }

      const task = await db.addTask({
        ...taskData,
        notification_id: notificationId,
      });

      return { success: true, task };
    } catch (error) {
      console.error('Error adding task:', error);
      return { success: false, error: 'Failed to add task.' };
    }
  },

  deleteTask: async ({ id }: { id: number }) => {
    try {
      // Get the task to check if it has a notification
      const tasks = await db.getAllTasks();
      const task = tasks.find(t => t.id === id);
      
      if (task?.notification_id) {
        // Cancel the notification if it exists
        await notifee.cancelTriggerNotification(task.notification_id);
      }

      await db.deleteTask(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: 'Failed to delete task.' };
    }
  },

  updateTask: async ({
    id,
    ...updates
  }: { id: number } & Partial<Omit<Task, 'id' | 'created_at'>>) => {
    try {
      // Get the current task to check for notification changes
      const tasks = await db.getAllTasks();
      const task = tasks.find(t => t.id === id);

      // Handle notification updates
      if (updates.reminder_time !== undefined) {
        // Cancel existing notification if there is one
        if (task?.notification_id) {
          await notifee.cancelTriggerNotification(task.notification_id);
        }

        // Schedule new notification if reminder_time is provided
        if (updates.reminder_time) {
          const notificationId = await scheduleNotification(
            updates.title || task?.title || '',
            updates.description || task?.description || null,
            new Date(updates.reminder_time)
          );
          updates.notification_id = notificationId;
        } else {
          updates.notification_id = null;
        }
      }

      await db.updateTask(id, updates);
      const updatedTasks = await db.getAllTasks();
      const updatedTask = updatedTasks.find(t => t.id === id);
      return { success: true, task: updatedTask };
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error: 'Failed to update task.' };
    }
  },
};

export { clientTools, clientToolsSchema };

// Notification setup function
export const setupNotifications = async () => {
  try {
    // Request permissions using Notifee (works for both iOS and Android)
    const settings = await notifee.requestPermission();

    if (settings.authorizationStatus) {
      console.log('✅ Notification permissions granted');

      // Create notification channel for Android with more explicit settings
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [300, 500, 300, 500],
        lights: true,
        lightColor: AndroidColor.YELLOW,
        // Add these to make notifications more prominent
        bypassDnd: true, // Allow notification to bypass do not disturb
        vibration: true,
      });

      console.log('✅ Notification channel created');

      // Set up background handler for trigger notifications
      notifee.onBackgroundEvent(async ({ type, detail }) => {
        const { notification, pressAction } = detail;

        console.log('🔔 Background event received:', type, detail);

        // Handle the trigger event
        if (type === 7) {
          // TriggerNotification
          // Re-display the notification if needed
          if (notification) {
            await notifee.displayNotification(notification);
          }
        }

        // Handle notification press
        if (type === 3 && pressAction) {
          // NotificationPress
          console.log('Notification pressed:', pressAction.id);
          // You can add specific handling for notification press here
        }
      });

      // Set up foreground handler
      notifee.onForegroundEvent(async ({ type, detail }) => {
        const { notification, pressAction } = detail;

        console.log('📱 Foreground event received:', type, detail);

        // Handle the trigger event
        if (type === 7) {
          // TriggerNotification
          if (notification) {
            await notifee.displayNotification(notification);
          }
        }

        // Handle notification press
        if (type === 3 && pressAction) {
          // NotificationPress
          console.log('Notification pressed:', pressAction.id);
          // You can add specific handling for notification press here
        }
      });

      return true;
    } else {
      console.error('❌ User denied notification permissions');
      return false;
    }
  } catch (error) {
    console.error('❌ Error setting up notifications:', error);
    return false;
  }
};

// Schedule a local notification using notifee
export const scheduleNotification = async (
  title: string,
  body: string | null,
  scheduledTime: Date
): Promise<string> => {
  try {
    console.log('📅 Scheduling notification for:', scheduledTime.toLocaleString());

    // Create a time-based trigger
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: scheduledTime.getTime(),
      alarmManager: {
        allowWhileIdle: true, // Allow notification even when device is in low-power idle modes
      },
    };

    // Create the notification
    const notificationId = await notifee.createTriggerNotification(
      {
        id: Date.now().toString(),
        title,
        body: body || undefined,
        android: {
          channelId: 'default',
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          sound: 'default',
          vibrationPattern: [300, 500, 300, 500],
          lights: [AndroidColor.YELLOW, 300, 500],
          smallIcon: 'ic_launcher',
          showTimestamp: true,
          ongoing: false,
          asForegroundService: true,
          autoCancel: false,
          timestamp: scheduledTime.getTime(),
          // Add these to make notifications more reliable
          fullScreenAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
          critical: true,
          foregroundPresentationOptions: {
            badge: true,
            sound: true,
            banner: true,
            list: true,
          },
          // Add these for iOS reliability
          interruptionLevel: 'timeSensitive',
          attachments: [],
        },
      },
      trigger
    );

    console.log('✅ Notification scheduled with ID:', notificationId);

    // Verify the trigger was created
    const triggers = await notifee.getTriggerNotifications();
    console.log('📋 Currently scheduled notifications:', triggers.length);

    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    throw error;
  }
};

// Test function to verify notifications
export const testNotification = async () => {
  console.log('🔔 Starting notification test...');

  try {
    // 1. Set up notifications
    const setupResult = await setupNotifications();
    if (!setupResult) {
      throw new Error('Failed to set up notifications');
    }

    // 2. Schedule a test notification for 5 seconds from now
    const testTime = new Date(Date.now() + 5 * 1000); // 5 seconds from now

    const notificationId = await scheduleNotification(
      'Test Notification',
      'This is a test notification! If you see this, notifications are working! 🎉',
      testTime
    );

    console.log('✅ Test notification scheduled for:', testTime.toLocaleString());
    console.log('📝 Notification ID:', notificationId);
    console.log('⏰ Please wait 5 seconds for the notification...');

    // 3. List all scheduled notifications
    const triggers = await notifee.getTriggerNotifications();
    console.log('📋 Currently scheduled notifications:', triggers.length);

    // 4. Add foreground handler to make sure we see the notification even if app is open
    notifee.onForegroundEvent(({ type, detail }) => {
      console.log('📱 Foreground event received:', type, detail);

      // Display the notification again in case it was missed
      if (type === 7 && detail.notification) {
        // TRIGGER and notification exists
        notifee.displayNotification(detail.notification);
      }
    });

    return true;
  } catch (error) {
    console.error('❌ Notification test failed:', error);
    return false;
  }
};
