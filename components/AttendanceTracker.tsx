"use client";
import { useEffect } from 'react';

export default function AttendanceTracker() {
  useEffect(() => {
    // Auto check-in on first load of the day
    const lastCheckin = localStorage.getItem('last_checkin_date');
    const today = new Date().toDateString();
    if (lastCheckin !== today) {
      fetch('/api/employee/attendance/checkin', { method: 'POST' })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            localStorage.setItem('last_checkin_date', today);
          }
        })
        .catch(() => {});
    }
  }, []);

  return null;
}
