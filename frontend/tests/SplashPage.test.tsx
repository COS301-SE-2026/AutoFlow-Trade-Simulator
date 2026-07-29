import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SplashPage from '@/app/splash/page';

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        return <img {...props} alt={props.alt} />;
    }
}))

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ href, children, ...props }: any) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));