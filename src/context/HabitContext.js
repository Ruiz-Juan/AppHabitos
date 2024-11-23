// src/context/HabitContext.js
import React, { createContext, useState } from 'react';

export const HabitContext = createContext();

export const HabitProvider = ({ children }) => {
  const [habitData, setHabitData] = useState({
    habitName: '',
    description: '',
    reminderTime: null,
    frequency: '',
    selectedDays: [],
    selectedDates: [],
  });

  return (
    <HabitContext.Provider value={{ habitData, setHabitData }}>
      {children}
    </HabitContext.Provider>
  );
};

