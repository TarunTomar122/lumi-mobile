import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  RefreshControl,
} from 'react-native';
import { clientTools } from '@/utils/tools';
import { Task } from '@/utils/database';
import { Ionicons } from '@expo/vector-icons';
import TaskEditModal from '../components/TaskEditModal';
import { styles } from './styles/taskStyles';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const result = await clientTools.getAllTasks();
      if (result.success && result.tasks) {
        setTasks(result.tasks);
      } else {
        setError('Failed to load tasks');
      }
    } catch (err) {
      setError('Error loading tasks');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadTasks();
  }, []);

  const validateReminderTime = (reminderTime: string | null | undefined): boolean => {
    if (!reminderTime) return true;
    const now = new Date();
    const reminderDate = new Date(reminderTime);
    return reminderDate > now;
  };

  const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      // Validate reminder time if present
      if (updates.reminder_time && !validateReminderTime(updates.reminder_time)) {
        setError('Reminder time must be in the future');
        return;
      }

      const result = await clientTools.updateTask({ id: taskId, ...updates });
      if (result.success) {
        await loadTasks();
        setError(null); // Clear any existing errors
      } else {
        setError('Failed to update task');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      if (err instanceof Error && err.message.includes('must be in the future')) {
        setError('Reminder time must be in the future');
      } else {
        setError('Error updating task');
      }
    }
  };

  const handleToggleStatus = async (task: Task) => {
    if (task.id === undefined) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await handleUpdateTask(task.id, { status: newStatus });
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#4CAF50';
      default:
        return '#FFA726';
    }
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const taskDate = new Date(date);
    const diffHours = Math.round((taskDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours < 24) {
      return `in ${diffHours} hours`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `in ${diffDays} days`;
    }
  };

  const handleAddTask = async (taskData: Partial<Task>) => {
    try {
      console.log('Adding task with data:', taskData);
      
      // Validate reminder time if present
      if (taskData.reminder_time && !validateReminderTime(taskData.reminder_time)) {
        setError('Reminder time must be in the future');
        return;
      }

      const result = await clientTools.addTask({
        title: taskData.title || '',
        description: taskData.description || null,
        category: taskData.category || 'Personal',
        status: taskData.status || 'todo',
        due_date: taskData.due_date || new Date().toISOString(),
        priority: taskData.priority || 'medium',
        reminder_time: taskData.reminder_time || null,
      });

      if (result.success) {
        console.log('Task added successfully:', result.task);
        await loadTasks();
      } else {
        setError('Failed to add task');
      }
    } catch (err) {
      console.error('Error adding task:', err);
      if (err instanceof Error && err.message.includes('must be in the future')) {
        setError('Reminder time must be in the future');
      } else {
        setError('Error adding task');
      }
    }
  };

  const createNewTask = (): Task => ({
    id: -1, // Temporary ID for new task
    title: '',
    description: null,
    category: 'Personal',
    status: 'todo',
    created_at: new Date().toISOString(),
    due_date: new Date().toISOString(),
    priority: 'medium',
  });

  const renderTask = ({ item }: { item: Task }) => {
    if (!item.id) return null;
    return (
      <Pressable style={styles.taskItem} onPress={() => setEditingTask(item)}>
        <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(item.priority) }]} />
        <View style={styles.taskContent}>
          <View style={styles.taskMain}>
            <View>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <View style={styles.taskMeta}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <Text style={styles.dueText}>Due {getRelativeTime(item.due_date)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.checkbox, item.status === 'done' && styles.checkboxChecked]}
              onPress={() => handleToggleStatus(item)}>
              {item.status === 'done' && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerText}>Tasks</Text>
        </View>
        <Ionicons name="calendar-outline" size={30} color="#333" />
      </View>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => (item.id || Date.now()).toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No tasks yet</Text>}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#333"
            colors={['#333']}
          />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => setEditingTask(createNewTask())}>
        <Ionicons name="add-outline" size={40} color="#333" />
      </TouchableOpacity>
      {editingTask && ( 
        <TaskEditModal
          visible={true}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={updates => {
            if (editingTask.id === -1) {
              handleAddTask(updates);
            } else if (editingTask.id !== undefined) {
              handleUpdateTask(editingTask.id, updates);
            }
            setEditingTask(null);
          }}
          onDelete={async (taskId) => {
            try {
              const result = await clientTools.deleteTask({ id: taskId });
              if (result.success) {
                await loadTasks();
              } else {
                setError('Failed to delete task');
              }
            } catch (err) {
              setError('Error deleting task');
              console.error(err);
            }
          }}
        />
      )}
    </View>
  );
}
