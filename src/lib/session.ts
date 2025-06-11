import axios from 'axios';
import { cookies } from 'next/headers';

export const getSession = async () => {
  const cookieStore =await cookies();
  const session = cookieStore.get('refresh_token')?.value || null;

  if (session) {
    const refreshUrl = `${process.env.NEXT_PUBLIC_API_HOST}/api/v1/admin/refresh?refresh_token=${session}`;
    try {
      // Make an API call to verify the session
      const response = await axios.get(refreshUrl);

      // If verification is successful, return the session
      if (response.status === 200 && response.data.data.status === "Complete") {
        return session;
      }
    } catch (error) {
      console.error('Session verification failed', error);
    }

    return null;
  }
  return null;
};

export const getUserSession = async () => {
  const cookieStore =await cookies();
  const session = cookieStore.get('refresh_token')?.value || null;

  if (session) {
    const refreshUrl = `${process.env.NEXT_PUBLIC_API_HOST}/api/v1/refresh?access_token=${session}`;
    try {
      // Make an API call to verify the session
      const response = await axios.get(refreshUrl);

      // If verification is successful, return the session
      if (response.status === 200 && response.data.data.status === "Complete") {
        return session;
      }
    } catch (error) {
      console.error('Session verification failed', error);
    }

    return null;
  }
  return null;
};

export const getOrganizationSession = async () => {
  const cookieStore =await cookies();
  const session = cookieStore.get('refresh_token')?.value || null;

  if (session) {
    const refreshUrl = `${process.env.NEXT_PUBLIC_API_HOST}/api/v1/organization/refresh?refresh_token=${session}`;
    try {
      // Make an API call to verify the session
      const response = await axios.get(refreshUrl);

      // If verification is successful, return the session
      if (response.status === 200 && response.data.data.status === "Complete") {
        return session;
      }
    } catch (error) {
      console.error('Session verification failed', error);
    }

    return null;
  }
  return null;
};