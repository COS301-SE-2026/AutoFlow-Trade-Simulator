import { useState, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api';

export interface GreekValues {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
}

export interface CalculateGreeksParams {
    current_price: number;
    strike_price: number;
    time_to_expire: number;
    interest_rate: number;
    sigma: number;
    option_type: 'call' | 'put';
}

export function useGreeks() {
    const [greeks, setGreeks] = useState<GreekValues | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const calculateGreeks = useCallback(async (params: CalculateGreeksParams) => {

        if(params.current_price <= 0 || params.strike_price <= 0 || params.time_to_expire <= 0){
            return;
        }

        setLoading(true);
        setError(null);

        try{
            const res = await apiClient('/greeks/calculate', {
                method: 'POST',
                body: params,
            }) as GreekValues;
            setGreeks(res);
            return res;
        } catch (err: any) {
            if (err instanceof ApiError && err.status === 401) 
            {
                setGreeks(null);
            } 
            else 
            {
                setError(err.message);
            }
        }

    }, []);

    return { greeks, calculateGreeks, loading, error };
}