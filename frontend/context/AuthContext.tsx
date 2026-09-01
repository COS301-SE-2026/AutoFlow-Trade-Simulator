'use client';

import {
    useState,
    useEffect,
    useMemo,
    createContext,
} from 'react';
import {login as apiLogin, loginWithGoogle as apiLoginWithGoogle, register as apiRegister} from "@/lib/api/accounts"
import {RegisterLoginResponse} from "@/lib/types/accounts";

export interface AuthContextType {
    token: string | null;
    login: (email: string, password:string) => void;
    loginWithGoogle: (idToken: string) => void;
    logout: () => void;
    register: (fullName:string, email: string, password:string) => void;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode })
{
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = sessionStorage.getItem('token');
        if (storedToken)
        {
            setToken(storedToken);
        }
        else
        {
            console.log("No token in session storage.");
        }
        setIsLoading(false); 
    }, []);
    
    const login = async (email: string, password:string) => {
        const data:RegisterLoginResponse = await apiLogin(email, password);
        setToken(data.access_token);
        sessionStorage.setItem('token', data.access_token);
    }
    
    const loginWithGoogle = async (idToken: string) => {
        const data:RegisterLoginResponse = await apiLoginWithGoogle(idToken);
        setToken(data.access_token);
        sessionStorage.setItem('token', data.access_token);
    }

    const logout = () => {
        setToken(null);
        sessionStorage.removeItem('token');
    }

    const register = async (fullName:string, email:string, password:string) => {
        const data:RegisterLoginResponse = await apiRegister(fullName, email, password);
        setToken(data.access_token);
        sessionStorage.setItem('token', data.access_token);
    }

    const memoizedValue = useMemo(() => ({
        token,
        login,
        loginWithGoogle,
        logout,
        register,
        isLoading
    }), [token, isLoading]);

    return (<AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>);
}