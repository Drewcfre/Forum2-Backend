// region User Input Verification Functions (Click to Expand)
/**
 * Verifies that a username is valid. A valid username is between 3 and 20
 * characters long, and contains only alphanumeric characters and underscores.
 * @param {string} username The username to verify.
 * @return {boolean} True if the username is valid, false otherwise.
 */
export function verifyUsername(username: string): boolean {
  return new RegExp("^[A-Za-z][A-Za-z0-9_]{2,19}$").test(username);
}

/**
 * Verifies that a password is valid. A valid password is between 8 and 20
 * characters long, and contains at least one uppercase letter, one lowercase
 * letter, one number, and one special character.
 * @param {string} password The password to verify.
 * @return {boolean} True if the password is valid, false otherwise.
 */
export function verifyPassword(password: string): boolean {
  return new RegExp(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{8,20}$"
  ).test(password);
}

/**
 * Verifies that an email is valid. A valid email is between 6 and 60 characters
 * long, and follows the standard email format.
 * @param {string} email The email to verify.
 * @return {boolean} True if the email is valid, false otherwise.
 */
export function verifyEmail(email: string): boolean {
  return new RegExp(
    "^(?=.{6, 60}$)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$\\n"
  ).test(email);
}

/**
 * Verifies that a title is valid. A valid title is between 0 and 100 characters
 * long. A title can contain any character and is pretty lenient overall.
 * @param {string} title The title to verify.
 * @return {boolean} True if the title is valid, false otherwise.
 */
export function verifyTitle(title: string): boolean {
  return title.length <= 100;
}

/**
 * Verifies that a description is valid. A valid description is between 0 and
 * 300 characters long. A description can contain any character and is pretty
 * lenient overall.
 * @param {string} description The description to verify.
 * @return {boolean} True if the description is valid, false otherwise.
 */
export function verifyDescription(description: string): boolean {
  return description.length <= 300;
}
// endregion

// region Post/Reply Verification (Click to Expand)
/**
 * Verifies that the title of a post is valid. A valid title is between
 * 1 and 100 characters long.
 * @param {string} title The title to verify.
 * @return {boolean} True if the title is valid, false otherwise.
 */
export function verifyPostTitle(title: string): boolean {
  return title.length >= 1 && title.length <= 100;
}

/**
 * Verifies that the content of a post is valid. Valid content is between
 * 1 and 1000 characters long.
 * @param {string} content The content to verify.
 * @return {boolean} True if the content is valid, false otherwise.
 */
export function verifyReplyContent(content: string): boolean {
  return content.length >= 1 && content.length <= 1000;
}
// endregion
