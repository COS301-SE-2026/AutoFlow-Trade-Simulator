'use client';

import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/context/AuthContext'

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return (context);
}