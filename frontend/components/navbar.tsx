'use client';

import { Button} from './ui/button';
import { Card } from './ui/card'
import Link  from 'next/link';
import {AccountProvider} from "@/lib/hooks/accountContext";
import {AccountSelector} from "@/components/ui/intAccSwitcher";

export function Navbar() {

    return (
        <nav style={{
            backgroundColor: 'var(--panel)',
            background: 'rgba(20, 20, 32, 0.6)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(12px'
            }}
            className='flex flex-row justify-evenly p-7'>
            <Button className='button secondary' variant="secondary" style={{ margin: '0px 5px'}}>
                <Link href='/dashboard'>
                    Dashboard
                </Link>
            </Button>
            <Button className='button secondary' variant="secondary" style={{ margin: '0px 5px'}}>
                <Link href='/#'>
                    Portfolio
                </Link>
            </Button>
            <Button className='button secondary' style={{ margin: '0px 5px'}}>
                <Link href='/#'>
                    Markets
                </Link>
            </Button>
            <Button className='button secondary' style={{ margin: '0px 5px'}}>
                <Link href='/#'>
                    Learderboard
                </Link>
            </Button>
            <Button className='button secondary' style={{ margin: '0px 5px'}}>
                <Link href='/#'>
                    AI Trading Assistant
                </Link>
            </Button>
            <AccountProvider>
                <AccountSelector/>
            </AccountProvider>
        </nav>
    )
}