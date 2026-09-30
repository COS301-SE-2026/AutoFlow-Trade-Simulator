export function getUserIdFromToken(token: string | null): number | null {
    if (!token) {
        return null;
    }
    const payload = token.split('.')[1];
    if (!payload) {
        return null;
    }

    try {
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + (c.codePointAt(0) ?? 0).toString(16).padStart(2, '0'))
                .join('')
        );
        const claims = JSON.parse(json) as { sub?: string };
        if (!claims.sub) {
            return null;
        }
        const id = Number(claims.sub);
        return Number.isFinite(id) ? id : null;
    }
    catch {
        return null;
    }
}