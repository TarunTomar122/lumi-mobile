import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DAD9DE',
    paddingTop: 60,
  },
  headerContainer: {
    padding: 32,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    width: '100%',
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 28,
    fontFamily: 'MonaSans-SemiBold',
  },
  listContainer: {
    padding: 28,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priorityBar: {
    width: 4,
    backgroundColor: '#4CAF50',
  },
  taskContent: {
    flex: 1,
    padding: 16,
  },
  taskMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'MonaSans-Medium',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPill: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'MonaSans-Regular',
  },
  reminderText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'MonaSans-Regular',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
  },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    marginHorizontal: 28,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    flex: 1,
    marginRight: 8,
    fontFamily: 'MonaSans-Regular',
  },
  errorDismiss: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'MonaSans-Medium',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    fontFamily: 'MonaSans-Regular',
  },
});
