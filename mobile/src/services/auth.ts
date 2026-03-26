export async function login(username: string, password: string) {
  return Promise.resolve({ username, token: 'demo-mobile-token', role: 'PICKUP_AGENT' });
}
