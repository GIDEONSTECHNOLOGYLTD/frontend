import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import TaskDetail from '../components/tasks/TaskDetail';
import PrivateRoute from '../components/routing/PrivateRoute';

const TaskRoutes = () => {
  return (
    <Routes>
      <Route 
        index 
        element={
          <PrivateRoute>
            <TaskList />
          </PrivateRoute>
        } 
      />
      <Route 
        path="new" 
        element={
          <PrivateRoute>
            <TaskForm />
          </PrivateRoute>
        } 
      />
      <Route 
        path=":id" 
        element={
          <PrivateRoute>
            <TaskDetail />
          </PrivateRoute>
        } 
      />
      <Route 
        path=":id/edit" 
        element={
          <PrivateRoute>
            <TaskForm />
          </PrivateRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  );
};

export default TaskRoutes;
