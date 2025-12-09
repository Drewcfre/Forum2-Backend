import {FastifyReply} from "fastify";

export function createCookie(name: string, value: string, age: number, res: FastifyReply): void {
    res.setCookie(name, value, {
        path: "/",
        signed: false,
        secure: true,
        httpOnly: false,
        maxAge: age,
        sameSite: "none"
    });
}

export function readCookie(name: string, req: any): string {
    return req.cookies[name] || "";
}

export function deleteCookie(name: string, age: number, res: FastifyReply): void {
    res.clearCookie(name, {
        path: "/",
        signed: false,
        secure: true,
        httpOnly: false,
        maxAge: age,
        sameSite: "none"
    });
}

export function updateCookie(name: string, value: string, age: number, res: FastifyReply): void {
    deleteCookie(name, age, res);
    createCookie(name, value, age, res);
}
