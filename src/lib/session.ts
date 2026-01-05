// Generate or retrieve a unique session token for anonymous participants
export const getSessionToken = (): string => {
  const storageKey = 'silentvoice_session_token';
  let token = localStorage.getItem(storageKey);
  
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(storageKey, token);
  }
  
  return token;
};

// Generate a 6-digit meeting code
export const generateMeetingCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
