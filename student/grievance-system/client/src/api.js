export const CATEGORIES = ['Hostel', 'Academics', 'Library', 'Canteen', 'Transport', 'Infrastructure', 'Other'];

export const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem('session'));
  } catch {
    return null;
  }
};
export const setSession = (s) =>
  s ? localStorage.setItem('session', JSON.stringify(s)) : localStorage.removeItem('session');

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const session = getSession();
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  let payload;
  if (form) payload = form;
  else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`/api${path}`, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
