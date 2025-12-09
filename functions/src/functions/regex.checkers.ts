export function verifyUsername(username: string): boolean {
    return new RegExp("^[A-Za-z][A-Za-z0-9_]{2,19}$").test(username);
}

export function verifyPassword(password: string): boolean {
    return new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{8,20}$").test(password);
}

export function verifyEmail(email: string): boolean {
    return new RegExp("^(?=.{6,60}$)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$").test(email);
}

export function verifyTitle(title: string): boolean {
    return title.length <= 100;
}

export function verifyDescription(description: string): boolean {
    return description.length <= 300;
}

export function verifyPostTitle(title: string): boolean {
    return title.length >= 1 && title.length <= 100;
}

export function verifyReplyContent(content: string): boolean {
    return content.length >= 1 && content.length <= 1000;
}
