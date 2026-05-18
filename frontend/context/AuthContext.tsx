'use client';

import {
    useState,
    useEffect,
    useMemo,
    createContext,
    useContext,
    type ReactNode
} from 'react';

export interface User {
    id: number;
    email: string;
    password_hash: string;
    full_name: string;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode })
{
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = sessionStorage.getItem('token');
        const storedUser = sessionStorage.getItem('user');
        if (storedToken && storedUser)
        {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            console.log("Token found:", storedToken);
        }
        else
        {
            console.log("No token in session storage.");
        }
        setIsLoading(false); 
    }, []);
    
    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        sessionStorage.setItem('token', newToken);
        sessionStorage.setItem('user', JSON.stringify(newUser));
    }
    
    const logout = () => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    }

    const memoizedValue = useMemo(() => ({
        user,
        token,
        login,
        logout,
        isLoading
    }), [user, token, isLoading]);

    return (<AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>);
}